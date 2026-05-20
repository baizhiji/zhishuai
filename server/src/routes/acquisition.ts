import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 获取获客任务列表
router.get('/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = '1', pageSize = '10', status, channel } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { userId };
    if (status) where.status = status;
    if (channel) where.channel = channel;

    const [tasks, total] = await Promise.all([
      prisma.acquisitionTask.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { leads: true } },
        },
      }),
      prisma.acquisitionTask.count({ where }),
    ]);

    // 格式化数据
    const formattedTasks = tasks.map(task => ({
      ...task,
      actualCount: task._count.leads,
      _count: undefined,
    }));

    res.json({ tasks: formattedTasks, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    console.error('获取获客任务失败:', error);
    res.status(500).json({ error: '获取获客任务失败' });
  }
});

// 获取单个获客任务
router.get('/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const task = await prisma.acquisitionTask.findFirst({
      where: { id, userId },
      include: {
        _count: { select: { leads: true } },
      },
    });

    if (!task) {
      return res.status(404).json({ error: '获客任务不存在' });
    }

    res.json({
      ...task,
      actualCount: task._count.leads,
      _count: undefined,
    });
  } catch (error) {
    console.error('获取获客任务失败:', error);
    res.status(500).json({ error: '获取获客任务失败' });
  }
});

// 创建获客任务
router.post('/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, channel, targetCount } = req.body;

    if (!title || !channel) {
      return res.status(400).json({ error: '标题和渠道不能为空' });
    }

    const task = await prisma.acquisitionTask.create({
      data: {
        userId,
        title,
        channel,
        targetCount: Number(targetCount) || 100,
        status: 'pending',
        progress: 0,
        leadsCount: 0,
      },
    });

    res.json(task);
  } catch (error) {
    console.error('创建获客任务失败:', error);
    res.status(500).json({ error: '创建获客任务失败' });
  }
});

// 更新获客任务
router.put('/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { title, channel, targetCount, status } = req.body;

    const existing = await prisma.acquisitionTask.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: '获客任务不存在' });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (channel) updateData.channel = channel;
    if (targetCount) updateData.targetCount = Number(targetCount);
    if (status) {
      updateData.status = status;
      if (status === 'running' && !existing.startedAt) {
        updateData.startedAt = new Date();
      }
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }

    const task = await prisma.acquisitionTask.update({
      where: { id },
      data: updateData,
    });

    res.json(task);
  } catch (error) {
    console.error('更新获客任务失败:', error);
    res.status(500).json({ error: '更新获客任务失败' });
  }
});

// 启动获客任务
router.put('/tasks/:id/start', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const existing = await prisma.acquisitionTask.findFirst({
      where: { id, userId, status: { in: ['pending', 'paused'] } },
    });

    if (!existing) {
      return res.status(404).json({ error: '获客任务不存在或无法启动' });
    }

    const task = await prisma.acquisitionTask.update({
      where: { id },
      data: {
        status: 'running',
        startedAt: existing.startedAt || new Date(),
      },
    });

    res.json(task);
  } catch (error) {
    console.error('启动获客任务失败:', error);
    res.status(500).json({ error: '启动获客任务失败' });
  }
});

// 暂停获客任务
router.put('/tasks/:id/pause', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const existing = await prisma.acquisitionTask.findFirst({
      where: { id, userId, status: 'running' },
    });

    if (!existing) {
      return res.status(404).json({ error: '获客任务不存在或无法暂停' });
    }

    const task = await prisma.acquisitionTask.update({
      where: { id },
      data: { status: 'paused' },
    });

    res.json(task);
  } catch (error) {
    console.error('暂停获客任务失败:', error);
    res.status(500).json({ error: '暂停获客任务失败' });
  }
});

// 删除获客任务
router.delete('/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const existing = await prisma.acquisitionTask.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: '获客任务不存在' });
    }

    await prisma.acquisitionTask.delete({ where: { id } });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除获客任务失败:', error);
    res.status(500).json({ error: '删除获客任务失败' });
  }
});

// 获取潜客列表
router.get('/leads', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = '1', pageSize = '20', taskId, status, source, aiQuality } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { userId };
    if (taskId) where.taskId = taskId;
    if (status) where.status = status;
    if (source) where.source = source;
    if (aiQuality) where.aiQuality = aiQuality;

    const [leads, total] = await Promise.all([
      prisma.acquisitionLead.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          task: { select: { title: true } },
          _count: { select: { followups: true } },
        },
      }),
      prisma.acquisitionLead.count({ where }),
    ]);

    // 格式化数据
    const formattedLeads = leads.map(lead => ({
      ...lead,
      followupCount: lead._count.followups,
      _count: undefined,
    }));

    res.json({ leads: formattedLeads, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    console.error('获取潜客列表失败:', error);
    res.status(500).json({ error: '获取潜客列表失败' });
  }
});

// 获取单个潜客
router.get('/leads/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const lead = await prisma.acquisitionLead.findFirst({
      where: { id, userId },
      include: {
        task: { select: { title: true } },
        followups: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!lead) {
      return res.status(404).json({ error: '潜客不存在' });
    }

    res.json(lead);
  } catch (error) {
    console.error('获取潜客失败:', error);
    res.status(500).json({ error: '获取潜客失败' });
  }
});

// 创建潜客
router.post('/leads', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { taskId, name, phone, email, source } = req.body;

    if (!phone) {
      return res.status(400).json({ error: '手机号不能为空' });
    }

    // 如果有任务，更新任务计数
    if (taskId) {
      const task = await prisma.acquisitionTask.findFirst({
        where: { id: taskId, userId },
      });

      if (task) {
        await prisma.acquisitionTask.update({
          where: { id: taskId },
          data: { leadsCount: { increment: 1 } },
        });
      }
    }

    const lead = await prisma.acquisitionLead.create({
      data: {
        userId,
        taskId,
        name,
        phone,
        email,
        source: source || 'manual',
        status: 'new',
      },
    });

    res.json(lead);
  } catch (error) {
    console.error('创建潜客失败:', error);
    res.status(500).json({ error: '创建潜客失败' });
  }
});

// 更新潜客状态
router.put('/leads/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { status, notes, name, email, aiScore, aiQuality, aiInsights, aiFollowup } = req.body;

    const existing = await prisma.acquisitionLead.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: '潜客不存在' });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'converted') {
        updateData.convertedAt = new Date();
      }
    }
    if (notes !== undefined) updateData.notes = notes;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (aiScore !== undefined) updateData.aiScore = aiScore;
    if (aiQuality !== undefined) updateData.aiQuality = aiQuality;
    if (aiInsights !== undefined) updateData.aiInsights = typeof aiInsights === 'string' ? aiInsights : JSON.stringify(aiInsights);
    if (aiFollowup !== undefined) updateData.aiFollowup = aiFollowup;

    updateData.lastContact = new Date();

    const lead = await prisma.acquisitionLead.update({
      where: { id },
      data: updateData,
    });

    res.json(lead);
  } catch (error) {
    console.error('更新潜客失败:', error);
    res.status(500).json({ error: '更新潜客失败' });
  }
});

// 删除潜客
router.delete('/leads/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const existing = await prisma.acquisitionLead.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: '潜客不存在' });
    }

    // 如果有任务，减少任务计数
    if (existing.taskId) {
      await prisma.acquisitionTask.update({
        where: { id: existing.taskId },
        data: { leadsCount: { decrement: 1 } },
      }).catch(() => {});
    }

    await prisma.acquisitionLead.delete({ where: { id } });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除潜客失败:', error);
    res.status(500).json({ error: '删除潜客失败' });
  }
});

// 添加跟进记录
router.post('/leads/:id/followups', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { content, nextDate } = req.body;

    if (!content) {
      return res.status(400).json({ error: '跟进内容不能为空' });
    }

    const lead = await prisma.acquisitionLead.findFirst({
      where: { id, userId },
    });

    if (!lead) {
      return res.status(404).json({ error: '潜客不存在' });
    }

    const followup = await prisma.leadFollowup.create({
      data: {
        leadId: id,
        userId,
        type: 'note',
        content,
        nextDate: nextDate ? new Date(nextDate) : null,
      },
    });

    // 更新潜客最后联系时间
    await prisma.acquisitionLead.update({
      where: { id },
      data: { lastContact: new Date() },
    });

    res.json(followup);
  } catch (error) {
    console.error('添加跟进记录失败:', error);
    res.status(500).json({ error: '添加跟进记录失败' });
  }
});

// 获取获客统计
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const [tasks, leads, statusStats] = await Promise.all([
      prisma.acquisitionTask.count({ where: { userId } }),
      prisma.acquisitionLead.count({ where: { userId } }),
      prisma.acquisitionLead.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
    ]);

    const newCount = statusStats.find(s => s.status === 'new')?._count || 0;
    const contactedCount = statusStats.find(s => s.status === 'contacted')?._count || 0;
    const qualifiedCount = statusStats.find(s => s.status === 'qualified')?._count || 0;
    const convertedCount = statusStats.find(s => s.status === 'converted')?._count || 0;
    const invalidCount = statusStats.find(s => s.status === 'invalid')?._count || 0;

    res.json({
      totalTasks: tasks,
      totalLeads: leads,
      newLeads: newCount,
      contactedLeads: contactedCount,
      qualifiedLeads: qualifiedCount,
      convertedLeads: convertedCount,
      invalidLeads: invalidCount,
      conversionRate: leads > 0 ? Math.round((convertedCount / leads) * 100) : 0,
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

export default router;
