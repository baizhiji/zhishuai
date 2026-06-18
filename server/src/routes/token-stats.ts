import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../utils/db';


const router = Router();
// 获取 Token 使用量统计
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // 获取用户的服务商统计
    const stats = await prisma.apiUsageLog.groupBy({
      by: ['providerName', 'providerId'],
      where: { userId },
      _count: { id: true },
      _sum: {
        requestTokens: true,
        responseTokens: true,
        cost: true,
      },
    });

    // 格式化统计数据
    const formattedStats = stats.map(stat => ({
      provider: stat.providerId,
      providerName: stat.providerName,
      callCount: stat._count.id,
      totalTokens: (stat._sum.requestTokens || 0) + (stat._sum.responseTokens || 0),
      inputTokens: stat._sum.requestTokens || 0,
      outputTokens: stat._sum.responseTokens || 0,
      totalCost: Number(stat._sum.cost || 0),
    }));

    // 计算总计
    const totalStats = {
      totalCalls: formattedStats.reduce((sum, s) => sum + s.callCount, 0),
      totalTokens: formattedStats.reduce((sum, s) => sum + s.totalTokens, 0),
      totalCost: formattedStats.reduce((sum, s) => sum + s.totalCost, 0),
    };

    res.json({
      success: true,
      data: {
        byProvider: formattedStats,
        total: totalStats,
      },
    });
  } catch (error) {
    console.error('获取Token统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计失败',
    });
  }
});

// 获取每日使用趋势
router.get('/daily', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const days = parseInt(req.query.days as string) || 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.apiUsageLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 按日期分组
    const dailyStats: Record<string, { calls: number; tokens: number; cost: number }> = {};
    
    logs.forEach(log => {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { calls: 0, tokens: 0, cost: 0 };
      }
      dailyStats[date].calls += 1;
      dailyStats[date].tokens += (log.requestTokens || 0) + (log.responseTokens || 0);
      dailyStats[date].cost += Number(log.cost || 0);
    });

    // 转换为数组
    const chartData = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
    }));

    res.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error('获取每日统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计失败',
    });
  }
});

export default router;
