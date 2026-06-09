/**
 * 内容发布管理路由
 * 处理内容发布到各社交平台
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const prisma = new PrismaClient();

/**
 * 获取发布任务列表
 */
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.query.userId || 'default';
    const { status, page = 1, pageSize = 20 } = req.query;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [tasks, total] = await Promise.all([
      prisma.material.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        include: {
          user: {
            select: { name: true, phone: true }
          }
        }
      }),
      prisma.material.count({ where })
    ]);

    // 获取每个素材的发布记录
    const tasksWithPublish = await Promise.all(
      tasks.map(async (task) => {
        const publishRecords = await prisma.publishRecord.findMany({
          where: { materialId: task.id },
          include: {
            socialAccount: {
              select: { 
                platform: true, 
                accountName: true, 
                avatar: true 
              }
            }
          }
        });

        return {
          ...task,
          platforms: publishRecords.map(r => ({
            platform: r.socialAccount?.platform || '',
            accountId: r.accountId,
            accountName: r.socialAccount?.accountName || '',
            status: r.status,
            publishedUrl: r.publishedUrl,
            publishedId: r.publishedId,
            error: r.error,
          })),
          results: publishRecords.map(r => ({
            platform: r.socialAccount?.platform || '',
            accountId: r.accountId,
            accountName: r.socialAccount?.accountName || '',
            status: r.status === 'success' ? 'success' : 'failed',
            publishedUrl: r.publishedUrl,
            publishedId: r.publishedId,
            error: r.error,
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

/**
 * 创建发布任务
 */
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.body.userId || 'default';
    const { title, content, type, platforms, scheduledAt, thumbnail } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, error: '标题和内容不能为空' });
    }

    // 创建素材记录
    const material = await prisma.material.create({
      data: {
        userId,
        title,
        content,
        type: type || 'text',
        thumbnail,
        status: scheduledAt ? 'scheduled' : 'pending',
      }
    });

    // 创建发布记录
    if (platforms && Object.keys(platforms).length > 0) {
      const publishRecords = [];
      
      for (const [platform, accountIds] of Object.entries(platforms)) {
        for (const accountId of (accountIds as string[])) {
          const record = await prisma.publishRecord.create({
            data: {
              materialId: material.id,
              userId,
              accountId,
              platform,
              status: scheduledAt ? 'scheduled' : 'pending',
              scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            }
          });
          publishRecords.push(record);
        }
      }

      // 如果是立即发布，启动发布流程
      if (!scheduledAt) {
        processPublish(material.id, publishRecords.map(r => r.id));
      }
    }

    res.json({
      success: true,
      data: {
        id: material.id,
        status: scheduledAt ? 'scheduled' : 'publishing',
      },
      message: scheduledAt ? '定时发布任务已创建' : '发布任务已创建'
    });
  } catch (error: any) {
    console.error('创建发布任务失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取发布任务详情
 */
router.get('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, phone: true }
        }
      }
    });

    if (!material) {
      return res.status(404).json({ success: false, error: '发布任务不存在' });
    }

    const publishRecords = await prisma.publishRecord.findMany({
      where: { materialId: id },
      include: {
        socialAccount: {
          select: { 
            platform: true, 
            accountName: true, 
            avatar: true 
          }
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
          publishedId: r.publishedId,
          error: r.error,
        })),
      }
    });
  } catch (error: any) {
    console.error('获取发布任务详情失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 重试失败的任务
 */
router.post('/tasks/:id/retry', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 获取失败的发布记录
    const failedRecords = await prisma.publishRecord.findMany({
      where: { 
        materialId: id,
        status: 'failed'
      }
    });

    if (failedRecords.length === 0) {
      return res.status(400).json({ success: false, error: '没有可重试的失败任务' });
    }

    // 重置状态
    await prisma.publishRecord.updateMany({
      where: { materialId: id, status: 'failed' },
      data: { status: 'pending', error: null }
    });

    // 重新处理发布
    processPublish(id, failedRecords.map(r => r.id));

    res.json({
      success: true,
      message: `已重试 ${failedRecords.length} 个任务`
    });
  } catch (error: any) {
    console.error('重试发布任务失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 删除发布任务
 */
router.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 删除发布记录
    await prisma.publishRecord.deleteMany({
      where: { materialId: id }
    });

    // 删除素材
    await prisma.material.delete({
      where: { id }
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    console.error('删除发布任务失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取发布统计
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.query.userId || 'default';

    const [total, published, failed, scheduled, todayStart] = await Promise.all([
      prisma.material.count({ where: { userId } }),
      prisma.material.count({ where: { userId, status: 'published' } }),
      prisma.material.count({ where: { userId, status: 'failed' } }),
      prisma.material.count({ where: { userId, status: 'scheduled' } }),
      new Date(new Date().setHours(0, 0, 0, 0)),
    ]);

    const todayPublished = await prisma.material.count({
      where: {
        userId,
        status: 'published',
        updatedAt: { gte: todayStart }
      }
    });

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

/**
 * 处理发布逻辑
 */
async function processPublish(materialId: string, recordIds: string[]) {
  // 更新素材状态为发布中
  await prisma.material.update({
    where: { id: materialId },
    data: { status: 'publishing' }
  });

  // 处理每个发布记录
  for (const recordId of recordIds) {
    try {
      const record = await prisma.publishRecord.findUnique({
        where: { id: recordId },
        include: { socialAccount: true }
      });

      if (!record || !record.socialAccount) continue;

      await prisma.publishRecord.update({
        where: { id: recordId },
        data: { status: 'publishing' }
      });

      // 根据平台调用对应的发布API
      const publishResult = await publishToPlatform(record);

      if (publishResult.success) {
        await prisma.publishRecord.update({
          where: { id: recordId },
          data: {
            status: 'success',
            publishedUrl: publishResult.url,
            publishedId: publishResult.id,
            publishedAt: new Date(),
          }
        });
      } else {
        await prisma.publishRecord.update({
          where: { id: recordId },
          data: {
            status: 'failed',
            error: publishResult.error,
          }
        });
      }
    } catch (error: any) {
      await prisma.publishRecord.update({
        where: { id: recordId },
        data: {
          status: 'failed',
          error: error.message,
        }
      });
    }
  }

  // 检查所有发布记录状态，更新素材状态
  const records = await prisma.publishRecord.findMany({
    where: { materialId }
  });

  const allSuccess = records.every(r => r.status === 'success');
  const anyFailed = records.some(r => r.status === 'failed');

  await prisma.material.update({
    where: { id: materialId },
    data: {
      status: allSuccess ? 'published' : anyFailed ? 'partially_failed' : 'publishing',
      publishedAt: allSuccess ? new Date() : undefined,
    }
  });
}

/**
 * 发布到各平台
 */
async function publishToPlatform(record: any): Promise<{
  success: boolean;
  url?: string;
  id?: string;
  error?: string;
}> {
  const { platform, accountId, socialAccount } = record;

  if (!socialAccount?.cookies) {
    return { success: false, error: '账号未授权或授权已过期' };
  }

  // TODO: 实现真实的平台发布API
  // 当前为模拟实现
  try {
    // 获取素材内容
    const material = await prisma.material.findUnique({
      where: { id: record.materialId }
    });

    if (!material) {
      return { success: false, error: '素材不存在' };
    }

    // 根据平台调用不同的发布接口
    switch (platform) {
      case 'douyin':
        // TODO: 实现抖音发布API
        return simulatePublish(platform, material);
      
      case 'kuaishou':
        // TODO: 实现快手发布API
        return simulatePublish(platform, material);
      
      case 'xiaohongshu':
        // TODO: 实现小红书发布API
        return simulatePublish(platform, material);
      
      case 'weibo':
        // TODO: 实现微博发布API
        return simulatePublish(platform, material);
      
      default:
        return { success: false, error: `不支持的平台: ${platform}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 模拟发布（实际部署时替换为真实API）
 */
async function simulatePublish(platform: string, material: any): Promise<{
  success: boolean;
  url?: string;
  id?: string;
}> {
  // 模拟发布延迟
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 生成模拟的发布链接
  const platformDomains: Record<string, string> = {
    douyin: 'douyin.com',
    kuaishou: 'kuaishou.com',
    xiaohongshu: 'xiaohongshu.com',
    weibo: 'weibo.com',
    bili: 'bilibili.com',
    toutiao: 'toutiao.com',
  };

  const domain = platformDomains[platform] || 'example.com';
  const id = `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    success: true,
    url: `https://www.${domain}/detail/${id}`,
    id,
  };
}

export default router;
