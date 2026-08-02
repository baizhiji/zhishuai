import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import recruitmentRoutes from './routes/recruitment';
import acquisitionRoutes from './routes/acquisition';
import dataAcquisitionRoutes from './routes/data-acquisition';
import shareRoutes from './routes/share';
import materialsRoutes from './routes/materials';
// 以下路由已废弃 — 矩阵账号、发布、CRM、内容发布、自动回复功能已删除
// import matrixRoutes from './routes/matrix';
// import publishRoutes from './routes/publish';
import notificationsRoutes from './routes/notifications';
// import crmRoutes from './routes/crm';
// import crmAdvancedRoutes from './routes/crm-advanced';
import statisticsRoutes from './routes/statistics';
import aiChatRoutes from './routes/ai-chat';
import adminAgentsRoutes from './routes/admin-agents';
import userFeaturesRoutes from './routes/user-features';
import adminApiProvidersRoutes, { adminApiProvidersAdminRouter } from './routes/admin-api-providers';
// import smsRoutes from './routes/sms';
import oauthRoutes from './routes/oauth';
import socialAccountRoutes from './routes/social-account';
// import contentPublishRoutes from './routes/content-publish';
// import autoReplyRoutes from './routes/auto-reply';
import agentRoutes from './routes/agent';
import hotTopicsRoutes from './routes/hot-topics';
// import versionRoutes from './routes/version';
import versionRoutes from './routes/version';
import adminLogsRoutes from './routes/admin-logs';
import employeeRoutes from './routes/employee';
import announcementsRoutes, { adminAnnouncementRouter } from './routes/announcements';
import adminDashboardRouter from './routes/admin-dashboard';
import ticketRoutes from './routes/ticket';
import scriptRoutes from './routes/script';
import digitalHumanRoutes from './routes/digital-human';
import voiceCloneRoutes from './routes/voice-clone';
import dashboardStatsRoutes from './routes/dashboard-stats';
import referralRoutes from './routes/referral';
import aiConfigRoutes from './routes/ai-config';
import aiRoutes from './routes/ai';
import aiEnhancedRoutes from './routes/ai-enhanced';
import aiWorkflowRoutes from './routes/ai-workflow';
import tokenStatsRoutes from './routes/token-stats';
import mediaRoutes from './routes/media';
import exportRoutes from './routes/export';
// import settlementRoutes from './routes/settlement';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());

// CORS - 仅允许白名单域名
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://baizhiji.net',
      'https://www.baizhiji.net',
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
app.use('/api/materials', materialsRoutes);
// 矩阵账号 / 发布 / CRM 路由已废弃
// app.use('/api/matrix', matrixRoutes);
// app.use('/api/publish', publishRoutes);
app.use('/api/notifications', notificationsRoutes);
// app.use('/api/crm', crmRoutes);
// app.use('/api/crm-advanced', crmAdvancedRoutes);
// app.use('/api/statistics', statisticsRoutes); // temporarily disabled
app.use('/api/statistics', statisticsRoutes);
app.use('/api/referral', referralRoutes);

// 版本检测
app.use('/api/version', versionRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/digital-human', digitalHumanRoutes);
app.use('/api/voice-clone', voiceCloneRoutes);
app.use('/api/dashboard-stats', dashboardStatsRoutes);

// Admin 功能开关管理（功能开关已并入客户管理）
// app.use('/api/admin', adminFeaturesRoutes); // 暂时停用
app.use('/api/admin', adminAgentsRoutes);
// 贴牌配置已删除
// app.use('/api/admin', adminBrandingRoutes);
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

// 版本管理 & 系统公告
// app.use('/api/version', versionRoutes); // temporarily disabled

// 操作日志
app.use('/api/admin', adminLogsRoutes);

// 账号管理（修改密码、个人信息等）
import accountRoutes from './routes/account';
app.use('/api/account', accountRoutes);

// 员工管理
app.use('/api/employee', employeeRoutes);

// 短信服务
// app.use('/api/sms', smsRoutes); // temporarily disabled

// OAuth 授权
app.use('/api/oauth', oauthRoutes);

// 社交账号授权
app.use('/api/social', socialAccountRoutes);

// 内容发布 / 自动回复路由已废弃
// app.use('/api/content', contentPublishRoutes);
// app.use('/api/auto-reply', autoReplyRoutes);

// 数据报表导出
// app.use('/api/report', reportRoutes); // temporarily disabled

// 工单系统
app.use('/api/tickets', ticketRoutes);

// 数据导出
app.use('/api/export', exportRoutes);

// AI 能力配置 & 调用 & Token 统计
app.use('/api/ai-config', aiConfigRoutes);
app.use('/api/media', mediaRoutes);
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

// 代理分成结算
// app.use('/api/settlement', settlementRoutes); // temporarily disabled

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`智枢AI后端服务运行在 http://localhost:${PORT}`);
});

export { prisma };
