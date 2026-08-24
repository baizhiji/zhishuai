import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import recruitmentRoutes from './routes/recruitment';
import acquisitionRoutes from './routes/acquisition';
import dataAcquisitionRoutes from './routes/data-acquisition';
import shareRoutes, { shareShortRoutes } from './routes/share';
import materialsRoutes from './routes/materials';
import notificationsRoutes from './routes/notifications';
import statisticsRoutes from './routes/statistics';
import aiChatRoutes from './routes/ai-chat';
import adminAgentsRoutes from './routes/admin-agents';
import userFeaturesRoutes from './routes/user-features';
import adminApiProvidersRoutes, { adminApiProvidersAdminRouter } from './routes/admin-api-providers';
import oauthRoutes from './routes/oauth';
import socialAccountRoutes from './routes/social-account';
import commentDeliveryRoutes from './routes/comment-delivery';
import agentRoutes from './routes/agent';
import hotTopicsRoutes from './routes/hot-topics';
import versionRoutes from './routes/version';
import adminLogsRoutes from './routes/admin-logs';
import employeeRoutes from './routes/employee';
import announcementsRoutes, { adminAnnouncementRouter } from './routes/announcements';
import adminDashboardRouter from './routes/admin-dashboard';
import ticketRoutes from './routes/ticket';
import scriptRoutes from './routes/script';
import digitalHumanRoutes from './routes/digital-human';
import voiceCloneRoutes from './routes/voice-clone';
import videoVoiceRoutes from './routes/video-voice';
import videoEditRoutes from './routes/video-edit';
import dashboardStatsRoutes from './routes/dashboard-stats';
import referralRoutes from './routes/referral';
import aiConfigRoutes from './routes/ai-config';
import aiRoutes from './routes/ai';
import aiEnhancedRoutes from './routes/ai-enhanced';
import aiWorkflowRoutes from './routes/ai-workflow';
import tokenStatsRoutes from './routes/token-stats';
import exportRoutes from './routes/export';
import { setupMaterialCleanup } from './services/material-cleanup';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());

// CORS - 仅允许白名单域名（含桌面版 Tauri WebView）
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : [
      'http://localhost',
      'https://localhost',
      'http://localhost:3000',
      'https://localhost:3000',
      'http://localhost:1420',
      'https://localhost:1420',
      'http://127.0.0.1',
      'https://127.0.0.1',
      'http://127.0.0.1:3000',
      'https://127.0.0.1:3000',
      'http://127.0.0.1:1420',
      'https://127.0.0.1:1420',
      'http://localhost:3001',
      'https://localhost:3001',
      'https://baizhiji.net',
      'https://www.baizhiji.net',
      'http://baizhiji.net',
      'http://www.baizhiji.net',
      // 桌面版 Tauri WebView（Windows WebView2 / macOS WKWebView / Linux WebKitGTK）
      'tauri://localhost',
      'http://tauri.localhost',
      'https://tauri.localhost',
    ];
app.use(cors({
  origin: (origin, callback) => {
    // 允许没有 origin 的请求（如 curl 或移动端）
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));

// 全局速率限制
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
});
app.use(globalLimiter);

app.use(express.json({ limit: '10mb' }));

// 静态资源：上传产物（配音成片等，nginx 亦会代理 /api 至此）
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), { maxAge: '1d', immutable: false }));

// 将prisma添加到请求中
app.use((req, res, next) => {
  (req as any).prisma = prisma;
  next();
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/acquisition', acquisitionRoutes);
app.use('/api/data-acquisition', dataAcquisitionRoutes);
app.use('/api/share', shareRoutes);
// 分享码中转短链（扫码落地，{API_URL}/s/:codeId → 记录匿名扫码并 302 跳转平台视频）
app.use('/s', shareShortRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/referral', referralRoutes);

// 版本检测
app.use('/api/version', versionRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/digital-human', digitalHumanRoutes);
app.use('/api/voice-clone', voiceCloneRoutes);
app.use('/api/video-voice', videoVoiceRoutes);
app.use('/api/video-edit', videoEditRoutes);
app.use('/api/dashboard-stats', dashboardStatsRoutes);

app.use('/api/admin', adminAgentsRoutes);
// API 服务商：客户端可用列表 + Admin 管理
app.use('/api/api-providers', adminApiProvidersRoutes);
app.use('/api/admin/api-providers', adminApiProvidersAdminRouter);

// 系统公告（公共 + 管理员）
app.use('/api/announcements', announcementsRoutes);
app.use('/api/admin/announcements', adminAnnouncementRouter);

// Admin 数据总览统计
app.use('/api/admin/dashboard', adminDashboardRouter);

// 用户功能开关（Customer / APK 使用）
app.use('/api/features', userFeaturesRoutes);

// Agent 代理商客户管理
app.use('/api/agent', agentRoutes);

// 热点话题
app.use('/api/hot-topics', hotTopicsRoutes);

// 操作日志
app.use('/api/admin', adminLogsRoutes);

// 账号管理（修改密码、个人信息等）
import accountRoutes from './routes/account';
app.use('/api/account', accountRoutes);

// 员工管理
app.use('/api/employee', employeeRoutes);

// OAuth 授权
app.use('/api/oauth', oauthRoutes);

// 社交账号授权
app.use('/api/social', socialAccountRoutes);

// 智能获客跟评
app.use('/api/comment-delivery', commentDeliveryRoutes);

// 工单系统
app.use('/api/tickets', ticketRoutes);

// 数据导出
app.use('/api/export', exportRoutes);

// AI 能力配置 & 调用 & Token 统计
app.use('/api/ai-config', aiConfigRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-enhanced', aiEnhancedRoutes);
app.use('/api/ai-workflow', aiWorkflowRoutes);
app.use('/api/token-stats', tokenStatsRoutes);

// AI 反馈学习系统
import feedbackRoutes from './routes/feedback';
app.use('/api/ai-feedback', feedbackRoutes);

// 热点话题服务
import hotspotRoutes from './routes/hotspot';
app.use('/api/hotspot', hotspotRoutes);

// 多模态内容生成
import multimodalRoutes from './routes/multimodal';
app.use('/api/multimodal', multimodalRoutes);

// 视频增强路由
import enhancementRoutes from './routes/enhancement';
app.use('/api/enhancement', enhancementRoutes);

// 在线客服路由
import supportRoutes from './routes/support';
app.use('/api/support', supportRoutes);

// 商业助手
import businessAssistantRoutes from './routes/business-assistant';
app.use('/api/business', businessAssistantRoutes);

// 健康检查
// 健康检查与监控
import healthRoutes from './routes/health';
app.use('/', healthRoutes);

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 全局未捕获异常处理：避免静默崩溃，PM2 可据此自动重启恢复（P1 商用要求）
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  process.exit(1);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`智枢AI后端服务运行在 http://localhost:${PORT}`);
});

// 生成内容 10 天过期自动清理
setupMaterialCleanup(prisma);

export { prisma };
