import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pino from 'pino';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// 结构化日志
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

// 核心路由
import authRoutes from './routes/auth';
import recruitmentRoutes from './routes/recruitment';
import acquisitionRoutes from './routes/acquisition';
import dataAcquisitionRoutes from './routes/data-acquisition';
import shareRoutes from './routes/share';
import materialsRoutes from './routes/materials';
import matrixRoutes from './routes/matrix';
import publishRoutes from './routes/publish';
import notificationsRoutes from './routes/notifications';
import crmRoutes from './routes/crm';
import crmAdvancedRoutes from './routes/crm-advanced';
import statisticsRoutes from './routes/statistics';
import aiChatRoutes from './routes/ai-chat';
import adminFeaturesRoutes from './routes/admin-features';
import adminAgentsRoutes from './routes/admin-agents';
import adminBrandingRoutes from './routes/admin-branding';
import userFeaturesRoutes from './routes/user-features';
import adminApiProvidersRoutes from './routes/admin-api-providers';
import oauthRoutes from './routes/oauth';
import socialAccountRoutes from './routes/social-account';
import contentPublishRoutes from './routes/content-publish';
import complianceRoutes from './routes/compliance';
import pipelineRoutes from './routes/pipeline';
import autoReplyRoutes from './routes/auto-reply';
import agentRoutes from './routes/agent';
import agentDashboardRoutes from './routes/agent-dashboard';
import hotTopicsRoutes from './routes/hot-topics';
import versionRoutes from './routes/version';
import { authMiddleware, adminMiddleware, agentMiddleware } from './middleware/auth';
import adminLogsRoutes from './routes/admin-logs';
import employeeRoutes from './routes/employee';
import ticketRoutes from './routes/ticket';
import scriptRoutes from './routes/script';
import digitalHumanRoutes from './routes/digital-human';
import voiceCloneRoutes from './routes/voice-clone';
import dashboardStatsRoutes from './routes/dashboard-stats';
import referralRoutes from './routes/referral';
import accountRoutes from './routes/account';
import subscriptionRoutes from './routes/subscription';
import settlementRoutes from './routes/settlement';
import smsRoutes from './routes/sms';
import announcementRoutes from './routes/announcement';
import ordersRoutes from './routes/orders';
import companyRoutes from './routes/company';
import reportRoutes from './routes/report';
import amapRoutes from './routes/amap';

// AI 增强路由
import aiConfigRoutes from './routes/ai-config';
import aiRoutes from './routes/ai';
import aiEnhancedRoutes from './routes/ai-enhanced';
import aiWorkflowRoutes from './routes/ai-workflow';
import tokenStatsRoutes from './routes/token-stats';
import mediaRoutes from './routes/media';
import exportRoutes from './routes/export';
import materialDedupRoutes from './routes/material-dedup';
import automationRoutes from './routes/automation';

// AI 反馈
import feedbackRoutes from './routes/feedback';
import hotspotRoutes from './routes/hotspot';
import multimodalRoutes from './routes/multimodal';
import enhancementRoutes from './routes/enhancement';
import codeAssistantRoutes from './routes/code-assistant';
import aiQuotaMiddleware from './middleware/ai-quota';

const app = express();
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' },
  ],
});
const PORT = process.env.PORT || 3001;

// 初始化Sentry错误监控
import('./services/sentry').then(({ initSentry }) => {
  initSentry();
}).catch(() => {});

// 安全 HTTP 头
app.use(helmet({
  contentSecurityPolicy: false, // API 服务不需要 CSP（前端由Nginx配置）
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000, // 1年
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xFrameOptions: { action: 'deny' },
  xContentTypeOptions: true,
  xXssProtection: true,
}));

// Cookie解析（支持HttpOnly Cookie认证）
app.use(cookieParser());

// 中间件
const allowedOrigins = [
  'https://baizhiji.net',
  'https://www.baizhiji.net',
  'https://app.baizhiji.net',
  process.env.FRONTEND_URL || 'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如服务端请求、APK 原生应用等）
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // 开发环境允许 localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }
    // 生产环境严格拦截未授权来源
    const msg = `CORS blocked: ${origin}`;
    logger.warn({ origin }, 'CORS origin blocked');
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 速率限制 - 全局
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 1000, // 每个 IP 最多 1000 请求
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
});

// 速率限制 - AI 接口（更严格）
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 20, // 每个 IP 每分钟 20 次 AI 请求
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI 请求过于频繁，请稍后再试' },
  keyGenerator: (req: any) => req.userId || req.ip,
});

app.use(globalLimiter);
app.use('/api/code-assistant', aiLimiter);
app.use('/api/ai-chat', aiLimiter);
app.use('/api/ai', aiLimiter);
app.use(express.json({ limit: '2mb' }));

// 请求追踪ID中间件
app.use((req, res, next) => {
  const traceId = req.headers['x-request-id'] as string || `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  (req as any).traceId = traceId;
  res.setHeader('X-Request-Id', traceId);
  next();
});

// 请求访问日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health') {
      logger.info({
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration,
        userId: (req as any).userId,
        ip: req.ip,
      }, 'request');
    }
  });
  next();
});

// 文件上传配置
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.mp3', '.wav', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${ext}`));
    }
  },
});

// 静态文件服务（上传文件访问）
app.use('/uploads', express.static(uploadDir, { maxAge: '7d' }));

// 文件上传路由
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, message: '请选择文件', data: null });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    code: 200,
    message: '上传成功',
    data: {
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

app.post('/api/upload/batch', authMiddleware, upload.array('files', 10), (req, res) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ code: 400, message: '请选择文件', data: null });
  }
  const files = (req.files as Express.Multer.File[]).map(f => ({
    url: `/uploads/${f.filename}`,
    filename: f.originalname,
    size: f.size,
    mimetype: f.mimetype,
  }));
  res.json({ code: 200, message: '上传成功', data: files });
});

// 将prisma添加到请求中
app.use((req, res, next) => {
  (req as any).prisma = prisma;
  next();
});

// ============ 路由注册 ============

// 认证
app.use('/api/auth', authRoutes);

// 招聘
app.use('/api/recruitment', recruitmentRoutes);

// 获客
app.use('/api/acquisition', acquisitionRoutes);
app.use('/api/data-acquisition', dataAcquisitionRoutes);

// 分享推荐
app.use('/api/share', shareRoutes);

// 素材库
app.use('/api/materials', materialsRoutes);

// 矩阵账号
app.use('/api/matrix', matrixRoutes);

// 内容发布
app.use('/api/publish', publishRoutes);
app.use('/api/content', contentPublishRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/pipeline', pipelineRoutes);

// 通知
app.use('/api/notifications', notificationsRoutes);

// CRM
app.use('/api/crm', crmRoutes);
app.use('/api/crm-advanced', crmAdvancedRoutes);

// 统计
app.use('/api/statistics', statisticsRoutes);
app.use('/api/referral', referralRoutes);

// 账号管理
app.use('/api/account', accountRoutes);

// 订阅与支付
app.use('/api/subscription', subscriptionRoutes);

// Agent分成结算
app.use('/api/settlement', settlementRoutes);

// 短信配置
app.use('/api/sms', smsRoutes);

// 系统公告
app.use('/api/announcement', announcementRoutes);

// 订单支付
app.use('/api/orders', ordersRoutes);

// 公司信息
app.use('/api/company', companyRoutes);
app.use('/api/report', reportRoutes);

// 版本检测
app.use('/api/version', versionRoutes);

// 高德地图服务
app.use('/api/amap', amapRoutes);

// AI 对话（先认证，再配额检查）
app.use('/api/ai-chat', authMiddleware, aiQuotaMiddleware, aiChatRoutes);

// 话术模板
app.use('/api/scripts', scriptRoutes);

// 数字人 & 声音克隆
app.use('/api/digital-human', digitalHumanRoutes);
app.use('/api/voice-clone', voiceCloneRoutes);

// 编程助手（带配额检查）
app.use('/api/code-assistant', authMiddleware, aiQuotaMiddleware, codeAssistantRoutes);

// Dashboard 统计
app.use('/api/dashboard-stats', dashboardStatsRoutes);

// Admin 功能开关管理（需要管理员认证）
app.use('/api/admin', authMiddleware, adminMiddleware, adminFeaturesRoutes);
app.use('/api/admin', authMiddleware, adminMiddleware, adminAgentsRoutes);
app.use('/api/admin', authMiddleware, adminMiddleware, adminBrandingRoutes);

// Agent 代理路由（需要代理认证）
app.use('/api/agent', authMiddleware, agentMiddleware, agentDashboardRoutes);

app.use('/api/admin/api-providers', authMiddleware, adminMiddleware, adminApiProvidersRoutes);

// 用户功能开关（Customer / APK 使用）
app.use('/api/features', userFeaturesRoutes);

// Agent 代理商客户管理
app.use('/api/agent', authMiddleware, agentMiddleware, agentRoutes);

// 热点话题
app.use('/api/hot-topics', hotTopicsRoutes);

// 操作日志（需要管理员认证）
app.use('/api/admin', authMiddleware, adminMiddleware, adminLogsRoutes);

// 员工管理
app.use('/api/employee', employeeRoutes);

// OAuth 授权
app.use('/api/oauth', oauthRoutes);

// 社交账号授权
app.use('/api/social', socialAccountRoutes);

// 素材去重
app.use('/api/material-dedup', materialDedupRoutes);

// 自动化任务（发布/采集）
app.use('/api/automation', automationRoutes);

// 工单系统
app.use('/api/tickets', ticketRoutes);

// 数据导出
app.use('/api/export', exportRoutes);

// AI 能力配置 & 调用 & Token 统计
app.use('/api/ai-config', aiConfigRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-enhanced', aiEnhancedRoutes);
app.use('/api/token-stats', tokenStatsRoutes);

// AI 反馈学习系统（需认证）
app.use('/api/ai-feedback', authMiddleware, feedbackRoutes);

// 热点话题服务（需认证）
app.use('/api/hotspot', authMiddleware, hotspotRoutes);

// 多模态内容生成（需认证）
app.use('/api/multimodal', authMiddleware, multimodalRoutes);

// 视频增强路由（需认证）
app.use('/api/enhancement', authMiddleware, enhancementRoutes);

// AI 工作流（需认证）
app.use('/api/ai-workflow', authMiddleware, aiWorkflowRoutes);

// 自动回复（需认证）
app.use('/api/auto-reply', authMiddleware, autoReplyRoutes);

// API文档（Swagger UI）
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { swaggerOptions } from './utils/swagger';
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 健康检查（含数据库连接检测 + 内存使用）
app.get('/api/health', async (req, res) => {
  const memUsage = process.memoryUsage();
  const healthInfo: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    healthInfo.database = 'connected';
  } catch {
    healthInfo.database = 'disconnected';
    healthInfo.status = 'degraded';
  }

  const statusCode = healthInfo.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthInfo);
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 全局错误处理
import { toErrorResponse } from './utils/errors';

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err, method: req.method, path: req.path }, 'Global error');

  // CORS 错误
  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ code: 4003, message: '跨域请求被拒绝', data: null });
  }

  // Multer 错误
  if (err.name === 'MulterError') {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: '文件大小超过限制（最大50MB）',
      LIMIT_FILE_COUNT: '文件数量超过限制',
      LIMIT_UNEXPECTED_FILE: '上传字段名不正确',
    };
    return res.status(400).json({ code: 400, message: messages[err.code] || err.message, data: null });
  }

  // 文件类型错误
  if (err.message && err.message.startsWith('不支持的文件类型')) {
    return res.status(400).json({ code: 400, message: err.message, data: null });
  }

  // JWT 错误
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ code: 2001, message: '认证失败，请重新登录' });
  }

  // 请求体过大
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ code: 1001, message: '请求体过大' });
  }

  // 使用统一错误响应
  const { status, body } = toErrorResponse(err);
  res.status(status).json(body);
});

// 启动服务器
const server = app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'Server started');

  // 启动定时任务引擎
  import('./services/scheduler').then(({ startScheduler }) => {
    startScheduler();
  }).catch(err => {
    logger.error({ err }, 'Failed to start scheduler');
  });
});

// Graceful Shutdown
const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed');
  });
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (e) {
    logger.error({ err: e }, 'Error disconnecting database');
  }
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { prisma };
