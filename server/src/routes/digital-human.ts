import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../utils/db';


import { authMiddleware } from '../middleware/auth';

const router = Router();

// 获取数字人列表
router.get('/humans', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = '1', pageSize = '10', status } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { userId };
    if (status) where.status = status;

    const [humans, total] = await Promise.all([
      prisma.digitalHuman.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.digitalHuman.count({ where }),
    ]);

    res.json({ humans, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    console.error('获取数字人列表失败:', error);
    res.status(500).json({ error: '获取数字人列表失败' });
  }
});

// 获取单个数字人
router.get('/humans/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const human = await prisma.digitalHuman.findFirst({
      where: { id, userId },
    });

    if (!human) {
      return res.status(404).json({ error: '数字人不存在' });
    }

    res.json(human);
  } catch (error) {
    console.error('获取数字人失败:', error);
    res.status(500).json({ error: '获取数字人失败' });
  }
});

// 创建数字人
router.post('/humans', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, gender, style, voice, description, avatar } = req.body;

    if (!name) {
      return res.status(400).json({ error: '名称不能为空' });
    }

    const human = await prisma.digitalHuman.create({
      data: {
        userId,
        name,
        gender: gender || 'female',
        style: style || 'professional',
        voice: voice || 'default',
        description,
        avatar,
      },
    });

    res.json(human);
  } catch (error) {
    console.error('创建数字人失败:', error);
    res.status(500).json({ error: '创建数字人失败' });
  }
});

// 更新数字人
router.put('/humans/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { name, gender, style, voice, description, avatar, status } = req.body;

    const existing = await prisma.digitalHuman.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: '数字人不存在' });
    }

    const human = await prisma.digitalHuman.update({
      where: { id },
      data: {
        name,
        gender,
        style,
        voice,
        description,
        avatar,
        status,
      },
    });

    res.json(human);
  } catch (error) {
    console.error('更新数字人失败:', error);
    res.status(500).json({ error: '更新数字人失败' });
  }
});

// 删除数字人
router.delete('/humans/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const existing = await prisma.digitalHuman.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: '数字人不存在' });
    }

    await prisma.digitalHuman.delete({ where: { id } });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除数字人失败:', error);
    res.status(500).json({ error: '删除数字人失败' });
  }
});

// 获取视频模板列表
router.get('/templates', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', style } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = {};
    if (style) where.style = style;

    const [templates, total] = await Promise.all([
      prisma.videoTemplate.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { usageCount: 'desc' },
      }),
      prisma.videoTemplate.count({ where }),
    ]);

    res.json({ templates, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    console.error('获取视频模板失败:', error);
    res.status(500).json({ error: '获取视频模板失败' });
  }
});

// 获取视频任务列表
router.get('/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = '1', pageSize = '10', status } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { userId };
    if (status) where.status = status;

    const [tasks, total] = await Promise.all([
      prisma.videoTask.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.videoTask.count({ where }),
    ]);

    res.json({ tasks, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    console.error('获取视频任务失败:', error);
    res.status(500).json({ error: '获取视频任务失败' });
  }
});

// 创建视频任务
router.post('/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { humanId, templateId, title, script, backgroundMusic } = req.body;

    if (!title || !script) {
      return res.status(400).json({ error: '标题和脚本不能为空' });
    }

    const task = await prisma.videoTask.create({
      data: {
        userId,
        humanId,
        templateId,
        title,
        script,
        backgroundMusic,
        status: 'pending',
        progress: 0,
      },
    });

    // 更新数字人使用次数
    if (humanId) {
      await prisma.digitalHuman.update({
        where: { id: humanId },
        data: { usageCount: { increment: 1 } },
      });
    }

    // 更新模板使用次数
    if (templateId) {
      await prisma.videoTemplate.update({
        where: { id: templateId },
        data: { usageCount: { increment: 1 } },
      });
    }

    res.json(task);
  } catch (error) {
    console.error('创建视频任务失败:', error);
    res.status(500).json({ error: '创建视频任务失败' });
  }
});

// 获取单个视频任务
router.get('/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const task = await prisma.videoTask.findFirst({
      where: { id, userId },
    });

    if (!task) {
      return res.status(404).json({ error: '视频任务不存在' });
    }

    res.json(task);
  } catch (error) {
    console.error('获取视频任务失败:', error);
    res.status(500).json({ error: '获取视频任务失败' });
  }
});

// 更新视频任务
router.put('/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { status, progress, videoUrl, thumbnailUrl, errorMessage } = req.body;

    const existing = await prisma.videoTask.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: '视频任务不存在' });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    if (videoUrl) updateData.videoUrl = videoUrl;
    if (thumbnailUrl) updateData.thumbnailUrl = thumbnailUrl;
    if (errorMessage) updateData.errorMessage = errorMessage;
    if (status === 'completed') updateData.completedAt = new Date();
    if (status === 'processing' && !existing.startedAt) updateData.startedAt = new Date();

    const task = await prisma.videoTask.update({
      where: { id },
      data: updateData,
    });

    res.json(task);
  } catch (error) {
    console.error('更新视频任务失败:', error);
    res.status(500).json({ error: '更新视频任务失败' });
  }
});

// 取消视频任务
router.put('/tasks/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const existing = await prisma.videoTask.findFirst({
      where: { id, userId, status: { in: ['pending', 'processing'] } },
    });

    if (!existing) {
      return res.status(404).json({ error: '视频任务不存在或无法取消' });
    }

    const task = await prisma.videoTask.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.json(task);
  } catch (error) {
    console.error('取消视频任务失败:', error);
    res.status(500).json({ error: '取消视频任务失败' });
  }
});

// 删除视频任务
router.delete('/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const existing = await prisma.videoTask.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: '视频任务不存在' });
    }

    await prisma.videoTask.delete({ where: { id } });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除视频任务失败:', error);
    res.status(500).json({ error: '删除视频任务失败' });
  }
});

// 获取数字人统计
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const [humans, tasks] = await Promise.all([
      prisma.digitalHuman.count({ where: { userId } }),
      prisma.videoTask.findMany({
        where: { userId },
        select: { status: true },
      }),
    ]);

    const pendingCount = tasks.filter(t => t.status === 'pending').length;
    const processingCount = tasks.filter(t => t.status === 'processing').length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;

    res.json({
      totalHumans: humans,
      pendingTasks: pendingCount,
      processingTasks: processingCount,
      completedTasks: completedCount,
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

export default router;
