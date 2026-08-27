/**
 * 自动跟评任务路由（智能获客-自动引流闭环）
 *
 *  - GET    /api/auto-comment/tasks             任务列表
 *  - POST   /api/auto-comment/tasks             创建任务
 *  - PUT    /api/auto-comment/tasks/:id         更新任务（含启停 active）
 *  - DELETE /api/auto-comment/tasks/:id         删除任务
 *  - POST   /api/auto-comment/tasks/:id/run     立即执行一轮
 *  - GET    /api/auto-comment/tasks/:id/records 执行记录
 */
import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../utils/db';
import { authMiddleware } from '../middleware/auth';
import { runAutoCommentTask } from '../services/auto-comment.service';

const router = Router();

const SUPPORTED_PLATFORMS = ['douyin', 'kuaishou', 'xiaohongshu', 'weibo'];

// 任务列表
router.get('/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const tasks = await prisma.autoCommentTask.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ code: 200, message: 'success', data: { tasks } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 创建任务
router.post('/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, platform, targetUrls, intervalMinutes, dailyLimit, active } = req.body;

    if (!name || !platform || !SUPPORTED_PLATFORMS.includes(platform)) {
      return res.status(400).json({ code: 400, message: '请提供任务名称与支持的平台（douyin/kuaishou/xiaohongshu/weibo）', data: null });
    }
    if (!Array.isArray(targetUrls) || targetUrls.length === 0) {
      return res.status(400).json({ code: 400, message: '请配置至少一个目标内容 URL', data: null });
    }

    const task = await prisma.autoCommentTask.create({
      data: {
        id: randomUUID(),
        userId,
        name,
        platform,
        targetUrls,
        intervalMinutes: intervalMinutes || 60,
        dailyLimit: dailyLimit || 20,
        active: active ?? true,
        updatedAt: new Date(),
      },
    });
    res.json({ code: 200, message: 'success', data: task });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 更新任务（含启停）
router.put('/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const task = await prisma.autoCommentTask.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!task) return res.status(404).json({ code: 404, message: '任务不存在', data: null });

    const { name, platform, targetUrls, intervalMinutes, dailyLimit, active } = req.body;
    const updated = await prisma.autoCommentTask.update({
      where: { id: task.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(platform !== undefined ? { platform } : {}),
        ...(targetUrls !== undefined ? { targetUrls } : {}),
        ...(intervalMinutes !== undefined ? { intervalMinutes } : {}),
        ...(dailyLimit !== undefined ? { dailyLimit } : {}),
        ...(active !== undefined ? { active } : {}),
        updatedAt: new Date(),
      },
    });
    res.json({ code: 200, message: 'success', data: updated });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 删除任务
router.delete('/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await prisma.autoCommentTask.deleteMany({ where: { id: req.params.id, userId } });
    res.json({ code: 200, message: 'success', data: { deleted: true } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 立即执行一轮
router.post('/tasks/:id/run', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const task = await prisma.autoCommentTask.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!task) return res.status(404).json({ code: 404, message: '任务不存在', data: null });

    const result = await runAutoCommentTask(task.id);
    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 执行记录
router.get('/tasks/:id/records', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const task = await prisma.autoCommentTask.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!task) return res.status(404).json({ code: 404, message: '任务不存在', data: null });

    const records = await prisma.autoCommentRecord.findMany({
      where: { taskId: task.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ code: 200, message: 'success', data: { records } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

export default router;
