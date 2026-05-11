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
app.use('/api/statistics', statisticsRoutes);
app.use('/api/ai-chat', aiChatRoutes);

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
