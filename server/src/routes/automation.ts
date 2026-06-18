/**
 * 自动化任务 API 路由
 * 创建/执行/取消自动发布和评论采集任务
 */
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { executePublishTask, executeCommentCollectTask, cancelTask, PublishTaskConfig, CommentCollectConfig } from '../services/automation/task-executor';
import { getSupportedPlatforms } from '../services/automation/platform-publisher';
import { prisma } from '../utils/db';


const router = Router();
// 获取支持自动发布的平台列表
router.get('/platforms', async (req: Request, res: Response) => {
  const platforms = getSupportedPlatforms();
  res.json({ success: true, data: platforms });
});

// 获取用户的自动化任务列表
router.get('/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { type, status } = req.query;

    const where: any = { userId };
    if (type) where.type = type as string;
    if (status) where.status = status as string;

    const tasks = await prisma.automationTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { executions: true } } },
    });

    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建自动发布任务
router.post('/publish', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform, accountId, materialId, title, content, mediaUrls, tags, scheduledAt } = req.body;

    if (!platform || !accountId) {
      return res.status(400).json({ success: false, error: '平台和账号不能为空' });
    }

    // 创建任务
    const task = await prisma.automationTask.create({
      data: {
        userId,
        name: `发布到${platform}`,
        type: 'publish',
        platform,
        accountId,
        config: { materialId, title, content, mediaUrls, tags, scheduledAt } as any,
        status: 'idle',
        enabled: true,
        nextRunAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      },
    });

    // 如果没有定时，立即执行
    if (!scheduledAt) {
      executePublishTask(userId, task.id, {
        platform, accountId, materialId, title, content, mediaUrls, tags,
      }).catch(err => console.error('自动发布任务执行失败:', err));
    }

    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建评论采集任务
router.post('/collect-comments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform, accountId, targetUrl, maxComments = 100 } = req.body;

    if (!platform || !accountId || !targetUrl) {
      return res.status(400).json({ success: false, error: '平台、账号和目标URL不能为空' });
    }

    const task = await prisma.automationTask.create({
      data: {
        userId,
        name: `采集${platform}评论`,
        type: 'collect_comments',
        platform,
        accountId,
        config: { targetUrl, maxComments } as any,
        status: 'idle',
        enabled: true,
        nextRunAt: new Date(),
      },
    });

    // 立即执行
    executeCommentCollectTask(userId, task.id, {
      platform, accountId, targetUrl, maxComments,
    }).catch(err => console.error('评论采集任务执行失败:', err));

    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 取消任务
router.post('/tasks/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const task = await prisma.automationTask.findUnique({ where: { id } });
    if (!task || task.userId !== userId) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }

    await cancelTask(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取任务执行记录
router.get('/tasks/:id/executions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { limit = 20 } = req.query;

    const executions = await prisma.taskExecution.findMany({
      where: { taskId: id, userId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    res.json({ success: true, data: executions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除任务
router.delete('/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const task = await prisma.automationTask.findUnique({ where: { id } });
    if (!task || task.userId !== userId) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }

    await prisma.taskExecution.deleteMany({ where: { taskId: id } });
    await prisma.automationTask.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
