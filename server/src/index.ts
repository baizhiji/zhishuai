import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import recruitmentRoutes from './routes/recruitment';
import acquisitionRoutes from './routes/acquisition';
import shareRoutes from './routes/share';
import materialsRoutes from './routes/materials';
import matrixRoutes from './routes/matrix';
import publishRoutes from './routes/publish';
import notificationsRoutes from './routes/notifications';
import crmRoutes from './routes/crm';
import statisticsRoutes from './routes/statistics';
import aiChatRoutes from './routes/ai-chat';
import adminFeaturesRoutes from './routes/admin-features';
import adminAgentsRoutes from './routes/admin-agents';
import adminBrandingRoutes from './routes/admin-branding';
import userFeaturesRoutes from './routes/user-features';
import adminApiProvidersRoutes from './routes/admin-api-providers';
// import smsRoutes from './routes/sms';
import oauthRoutes from './routes/oauth';
import socialAccountRoutes from './routes/social-account';
import contentPublishRoutes from './routes/content-publish';
import autoReplyRoutes from './routes/auto-reply';
import agentRoutes from './routes/agent';
import hotTopicsRoutes from './routes/hot-topics';
// import versionRoutes from './routes/version';
import versionRoutes from './routes/version';
import adminLogsRoutes from './routes/admin-logs';
import employeeRoutes from './routes/employee';
// import reportRoutes from './routes/report';
import ticketRoutes from './routes/ticket';
import scriptRoutes from './routes/script';
import digitalHumanRoutes from './routes/digital-human';
import dashboardStatsRoutes from './routes/dashboard-stats';
import referralRoutes from './routes/referral';
import aiConfigRoutes from './routes/ai-config';
import aiRoutes from './routes/ai';
import aiEnhancedRoutes from './routes/ai-enhanced';
import tokenStatsRoutes from './routes/token-stats';
// import settlementRoutes from './routes/settlement';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 将prisma添加到请求中
app.use((req, res, next) => {
  (req as any).prisma = prisma;
  next();
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/acquisition', acquisitionRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/matrix', matrixRoutes);
app.use('/api/publish', publishRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/crm', crmRoutes);
// app.use('/api/statistics', statisticsRoutes); // temporarily disabled
app.use('/api/statistics', statisticsRoutes);
app.use('/api/referral', referralRoutes);

// 版本检测
app.use('/api/version', versionRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/digital-human', digitalHumanRoutes);
app.use('/api/dashboard-stats', dashboardStatsRoutes);

// Admin 功能开关管理
app.use('/api/admin', adminFeaturesRoutes);
app.use('/api/admin', adminAgentsRoutes);
app.use('/api/admin', adminBrandingRoutes);
app.use('/api/admin/api-providers', adminApiProvidersRoutes);

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

// 员工管理
app.use('/api/employee', employeeRoutes);

// 短信服务
// app.use('/api/sms', smsRoutes); // temporarily disabled

// OAuth 授权
app.use('/api/oauth', oauthRoutes);

// 社交账号授权
app.use('/api/social', socialAccountRoutes);

// 内容发布
app.use('/api/content', contentPublishRoutes);

// 自动回复
app.use('/api/auto-reply', autoReplyRoutes);

// 数据报表导出
// app.use('/api/report', reportRoutes); // temporarily disabled

// 工单系统
app.use('/api/tickets', ticketRoutes);

// AI 能力配置 & 调用 & Token 统计
app.use('/api/ai-config', aiConfigRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-enhanced', aiEnhancedRoutes);
app.use('/api/token-stats', tokenStatsRoutes);

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
