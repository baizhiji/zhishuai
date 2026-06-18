/**
 * 统计 API 路由 - 已添加权限校验
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 获取总览统计
router.get('/overview', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const prisma = (req as any).prisma;

    const [materialCount, recruitmentCount, acquisitionCount, publishCount] = await Promise.all([
      prisma.material.count({ where: { userId } }),
      prisma.recruitmentPost.count({ where: { userId } }),
      prisma.acquisitionTask.count({ where: { userId } }),
      prisma.publishRecord.count({ where: { userId } }),
    ]);

    res.json({
      success: true,
      data: {
        totalMaterials: materialCount,
        totalRecruitmentPosts: recruitmentCount,
        totalAcquisitionTasks: acquisitionCount,
        totalPublishRecords: publishCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取数据趋势
router.get('/trend', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const prisma = (req as any).prisma;
    const { days = '7' } = req.query;
    const numDays = Number(days);

    const trendData = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const dateStart = new Date();
      dateStart.setDate(dateStart.getDate() - i);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + 1);

      const count = await prisma.material.count({
        where: { userId, createdAt: { gte: dateStart, lt: dateEnd } },
      });

      trendData.push({
        date: dateStart.toISOString().split('T')[0],
        value: count,
        type: '内容生成',
      });
    }

    res.json({ success: true, data: trendData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取热门内容
router.get('/popular', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const prisma = (req as any).prisma;
    const { limit = '10' } = req.query;

    const materials = await prisma.material.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    res.json({ success: true, data: materials });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取平台分布
router.get('/platforms', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const prisma = (req as any).prisma;

    const accounts = await prisma.socialAccount.findMany({ where: { userId } });
    const platformCounts: Record<string, number> = {};
    accounts.forEach((acc: any) => {
      platformCounts[acc.platform] = (platformCounts[acc.platform] || 0) + 1;
    });

    const platformNames: Record<string, string> = {
      douyin: '抖音', kuaishou: '快手', xiaohongshu: '小红书',
      weixin: '视频号', bilibili: 'B站', weibo: '微博',
    };

    const total = accounts.length || 1;
    const platforms = Object.entries(platformCounts).map(([platform, count]) => ({
      name: platformNames[platform] || platform,
      count,
      percentage: Math.round((count / total) * 100),
    }));

    res.json({ success: true, data: platforms });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
