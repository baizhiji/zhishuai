/**
 * 内容发布管理路由 - 合并版本
 */
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../utils/db';


const router = Router();
// ============ 发布任务管理 ============

// 获取发布任务列表
router.get('/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status, page = '1', pageSize = '20' } = req.query;

    const where: any = { userId };
    if (status) where.status = status;

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      prisma.material.count({ where })
    ]);

    const tasksWithPublish = await Promise.all(
      materials.map(async (material) => {
        const publishRecords = await prisma.publishRecord.findMany({
          where: { materialId: material.id },
          include: {
            socialAccount: {
              select: { platform: true, accountName: true, avatar: true }
            }
          }
        });

        return {
          ...material,
          platforms: publishRecords.map(r => ({
            platform: r.socialAccount?.platform || '',
            accountId: r.accountId,
            accountName: r.socialAccount?.accountName || '',
            status: r.status,
            publishedUrl: r.publishedUrl,
          })),
          results: publishRecords.map(r => ({
            platform: r.socialAccount?.platform || '',
            accountId: r.accountId,
            accountName: r.socialAccount?.accountName || '',
            status: r.status === 'success' ? 'success' : 'failed',
            publishedUrl: r.publishedUrl,
            publishedAt: r.publishedAt,
          })),
        };
      })
    );

    res.json({
      success: true,
      data: {
        list: tasksWithPublish,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      }
    });
  } catch (error: any) {
    console.error('获取发布任务失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建发布任务
router.post('/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, content, type, platforms, scheduledAt, thumbnail } = req.body;

    if (!title && !content) {
      return res.status(400).json({ success: false, error: '标题或内容不能为空' });
    }

    const material = await prisma.material.create({
      data: {
        userId,
        title: title || content?.substring(0, 50) || '无标题',
        content,
        type: type || 'copywriter',
        thumbnail,
        status: scheduledAt ? 'scheduled' : 'pending',
      }
    });

    if (platforms && Object.keys(platforms).length > 0) {
      for (const [platform, accountIds] of Object.entries(platforms)) {
        for (const accountId of (accountIds as string[])) {
          const publishRecord = await prisma.publishRecord.create({
            data: {
              materialId: material.id,
              userId,
              accountId,
              platform,
              status: scheduledAt ? 'scheduled' : 'pending',
              scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            }
          });

          // 如果是定时发布，同时创建 ScheduledTask 记录供调度引擎执行
          if (scheduledAt) {
            await prisma.scheduledTask.create({
              data: {
                userId,
                platform,
                materialId: material.id,
                publishRecordId: publishRecord.id,
                title: material.title,
                content: material.content,
                status: 'pending',
                scheduledTime: new Date(scheduledAt),
              }
            });
          }
        }
      }
    }

    res.json({
      success: true,
      data: { id: material.id, status: scheduledAt ? 'scheduled' : 'publishing' },
      message: scheduledAt ? '定时发布任务已创建' : '发布任务已创建'
    });
  } catch (error: any) {
    console.error('创建发布任务失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取发布任务详情
router.get('/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({ where: { id } });
    if (!material) {
      return res.status(404).json({ success: false, error: '发布任务不存在' });
    }

    const publishRecords = await prisma.publishRecord.findMany({
      where: { materialId: id },
      include: {
        socialAccount: {
          select: { platform: true, accountName: true, avatar: true }
        }
      }
    });

    res.json({
      success: true,
      data: {
        ...material,
        platforms: publishRecords.map(r => ({
          platform: r.socialAccount?.platform || '',
          accountId: r.accountId,
          accountName: r.socialAccount?.accountName || '',
          status: r.status,
          publishedUrl: r.publishedUrl,
        })),
      }
    });
  } catch (error: any) {
    console.error('获取发布任务详情失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 重试失败的任务
router.post('/tasks/:id/retry', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const failedRecords = await prisma.publishRecord.findMany({
      where: { materialId: id, status: 'failed' }
    });

    if (failedRecords.length === 0) {
      return res.status(400).json({ success: false, error: '没有可重试的失败任务' });
    }

    await prisma.publishRecord.updateMany({
      where: { materialId: id, status: 'failed' },
      data: { status: 'pending', error: null }
    });

    res.json({
      success: true,
      message: `已重试 ${failedRecords.length} 个任务`
    });
  } catch (error: any) {
    console.error('重试发布任务失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除发布任务
router.delete('/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.publishRecord.deleteMany({ where: { materialId: id } });
    await prisma.material.delete({ where: { id } });

    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    console.error('删除发布任务失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取发布统计
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    const [total, published, failed, scheduled, todayPublished] = await Promise.all([
      prisma.material.count({ where: { userId } }),
      prisma.material.count({ where: { userId, status: 'published' } }),
      prisma.material.count({ where: { userId, status: 'failed' } }),
      prisma.material.count({ where: { userId, status: 'scheduled' } }),
      prisma.material.count({
        where: { userId, status: 'published', updatedAt: { gte: todayStart } }
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalTasks: total,
        published,
        failed,
        scheduled,
        todayPublished,
      }
    });
  } catch (error: any) {
    console.error('获取发布统计失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
