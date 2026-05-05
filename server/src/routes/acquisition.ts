import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取获客任务列表
router.get('/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status, page = 1, pageSize = 10 } = req.query;

    const where: any = { userId };
    if (status) where.status = status;

    const tasks = await prisma.acquisitionTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.acquisitionTask.count({ where });

    res.json({
      success: true,
      data: { list: tasks, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建获客任务
router.post('/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, platform, targetCount, content } = req.body;

    const task = await prisma.acquisitionTask.create({
      data: {
        userId,
        name,
        platform,
        targetCount: Number(targetCount) || 100,
        content,
        currentCount: 0,
        status: 'pending',
      },
    });

    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新任务状态
router.put('/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { status, currentCount } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (currentCount !== undefined) data.currentCount = currentCount;

    const task = await prisma.acquisitionTask.update({
      where: { id, userId },
      data,
    });

    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取线索列表
router.get('/leads', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status, page = 1, pageSize = 10 } = req.query;

    const where: any = { userId };
    if (status) where.status = status;

    const leads = await prisma.acquisitionLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.acquisitionLead.count({ where });

    res.json({
      success: true,
      data: { list: leads, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建线索
router.post('/leads', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, phone, source, notes } = req.body;

    const lead = await prisma.acquisitionLead.create({
      data: { userId, name, phone, source, notes, status: 'new' },
    });

    res.json({ success: true, data: lead });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新线索状态
router.put('/leads/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { status, notes } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (notes) data.notes = notes;

    const lead = await prisma.acquisitionLead.update({
      where: { id, userId },
      data,
    });

    res.json({ success: true, data: lead });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取统计数据
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const taskCount = await prisma.acquisitionTask.count({ where: { userId } });
    const activeTaskCount = await prisma.acquisitionTask.count({ where: { userId, status: 'running' } });
    const leadCount = await prisma.acquisitionLead.count({ where: { userId } });
    const newLeadCount = await prisma.acquisitionLead.count({
      where: { userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });

    res.json({
      success: true,
      data: {
        totalTasks: taskCount,
        activeTasks: activeTaskCount,
        totalLeads: leadCount,
        newLeads: newLeadCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
