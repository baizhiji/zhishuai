/**
 * 定时发布 API
 * 
 * 管理定时发布任务
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// 获取定时任务列表
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = '1', pageSize = '20', status = '' } = req.query;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [tasks, total] = await Promise.all([
      prisma.scheduledTask.findMany({
        where,
        include: {
          // 可以加入账号信息
        },
        orderBy: { scheduledTime: 'asc' },
        skip,
        take: Number(pageSize),
      }),
      prisma.scheduledTask.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        list: tasks,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error: any) {
    console.error('获取定时任务失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取单个定时任务
router.get('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const task = await prisma.scheduledTask.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('获取定时任务失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 创建定时任务
router.post(
  '/tasks',
  [
    body('title').notEmpty().withMessage('请输入标题'),
    body('content').notEmpty().withMessage('请输入内容'),
    body('platform').isIn(['douyin', 'kuaishou', 'xiaohongshu']).withMessage('无效的平台'),
    body('accountId').notEmpty().withMessage('请选择发布账号'),
    body('scheduledTime').isISO8601().withMessage('请输入正确的定时时间'),
  ],
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { title, content, images, platform, accountId, scheduledTime } = req.body;

      // 验证账号属于该用户
      const account = await prisma.matrixAccount.findFirst({
        where: { id: accountId, userId },
      });

      if (!account) {
        return res.status(400).json({ success: false, message: '账号不存在或无权使用' });
      }

      // 验证定时时间
      const scheduledDate = new Date(scheduledTime);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({ success: false, message: '定时时间必须晚于当前时间' });
      }

      const task = await prisma.scheduledTask.create({
        data: {
          userId,
          title,
          content,
          images: images || [],
          platform,
          accountId,
          scheduledTime: scheduledDate,
        },
      });

      res.json({
        success: true,
        message: '定时任务创建成功',
        data: task,
      });
    } catch (error: any) {
      console.error('创建定时任务失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

// 更新定时任务
router.put('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, content, images, scheduledTime } = req.body;

    // 验证任务属于该用户且未执行
    const existing = await prisma.scheduledTask.findFirst({
      where: { id: req.params.id, userId, status: 'pending' },
    });

    if (!existing) {
      return res.status(400).json({ success: false, message: '任务不存在或已开始执行' });
    }

    // 验证定时时间
    if (scheduledTime) {
      const scheduledDate = new Date(scheduledTime);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({ success: false, message: '定时时间必须晚于当前时间' });
      }
    }

    const task = await prisma.scheduledTask.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(images && { images }),
        ...(scheduledTime && { scheduledTime: new Date(scheduledTime) }),
      },
    });

    res.json({
      success: true,
      message: '任务已更新',
      data: task,
    });
  } catch (error: any) {
    console.error('更新定时任务失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 取消定时任务
router.post('/tasks/:id/cancel', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const existing = await prisma.scheduledTask.findFirst({
      where: { id: req.params.id, userId, status: 'pending' },
    });

    if (!existing) {
      return res.status(400).json({ success: false, message: '任务不存在或已开始执行' });
    }

    await prisma.scheduledTask.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
    });

    res.json({
      success: true,
      message: '任务已取消',
    });
  } catch (error: any) {
    console.error('取消定时任务失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除定时任务
router.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const existing = await prisma.scheduledTask.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    // 只能删除未执行或已完成的任务
    if (existing.status === 'running') {
      return res.status(400).json({ success: false, message: '任务正在执行中，无法删除' });
    }

    await prisma.scheduledTask.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: '任务已删除',
    });
  } catch (error: any) {
    console.error('删除定时任务失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 批量创建定时任务（用于批量发布）
router.post('/tasks/batch', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ success: false, message: '请提供任务列表' });
    }

    // 验证所有账号
    const accountIds = tasks.map((t: any) => t.accountId);
    const accounts = await prisma.matrixAccount.findMany({
      where: { id: { in: accountIds }, userId },
    });

    if (accounts.length !== accountIds.length) {
      return res.status(400).json({ success: false, message: '部分账号不存在或无权使用' });
    }

    // 创建任务
    const createdTasks = await Promise.all(
      tasks.map(async (task: any) => {
        return prisma.scheduledTask.create({
          data: {
            userId,
            title: task.title,
            content: task.content,
            images: task.images || [],
            platform: task.platform,
            accountId: task.accountId,
            scheduledTime: new Date(task.scheduledTime),
          },
        });
      })
    );

    res.json({
      success: true,
      message: `成功创建 ${createdTasks.length} 个定时任务`,
      data: createdTasks,
    });
  } catch (error: any) {
    console.error('批量创建定时任务失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取待执行的任务（供定时任务调度器使用）
router.get('/scheduler/pending', async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const tasks = await prisma.scheduledTask.findMany({
      where: {
        status: 'pending',
        scheduledTime: { lte: now },
      },
      take: 10,
      orderBy: { scheduledTime: 'asc' },
    });

    res.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error('获取待执行任务失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新任务状态
router.post('/tasks/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, result, publishedAt } = req.body;

    const task = await prisma.scheduledTask.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(result && { result }),
        ...(publishedAt && { publishedAt: new Date(publishedAt) }),
      },
    });

    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('更新任务状态失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
