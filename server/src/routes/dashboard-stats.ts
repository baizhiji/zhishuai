import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 获取完整统计数据（供前端 dashboard 使用）
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 获取各类统计数据
    const [
      totalLeads,
      todayLeads,
      weekLeads,
      totalCustomers,
      activeTasks,
      totalMaterials,
      totalPosts,
    ] = await Promise.all([
      prisma.acquisitionLead.count({ where: { userId } }),
      prisma.acquisitionLead.count({ where: { userId, createdAt: { gte: today } } }),
      prisma.acquisitionLead.count({ where: { userId, createdAt: { gte: weekAgo } } }),
      prisma.crmCustomer.count({ where: { userId } }),
      prisma.acquisitionTask.count({ where: { userId, status: 'running' } }),
      prisma.material.count({ where: { userId } }),
      prisma.publishedContent.count({ where: { userId } }),
    ]);

    // 获取本月数据趋势
    const monthLeads = await prisma.acquisitionLead.groupBy({
      by: ['createdAt'],
      where: { userId, createdAt: { gte: monthAgo } },
      _count: true,
    });

    // 生成每日统计
    const dailyStats: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = 0;
    }
    monthLeads.forEach(l => {
      const dateStr = l.createdAt.toISOString().split('T')[0];
      if (dailyStats[dateStr] !== undefined) {
        dailyStats[dateStr] += l._count;
      }
    });

    res.json({
      leads: {
        total: totalLeads,
        today: todayLeads,
        week: weekLeads,
        trend: weekLeads > 0 ? Math.round((todayLeads / (weekLeads / 7)) * 100) - 100 : 0,
      },
      customers: {
        total: totalCustomers,
      },
      tasks: {
        active: activeTasks,
      },
      materials: {
        total: totalMaterials,
      },
      content: {
        total: totalPosts,
      },
      dailyStats: Object.entries(dailyStats)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// 获取仪表盘概览统计
router.get('/overview', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 获取各类统计数据
    const [
      totalLeads,
      todayLeads,
      weekLeads,
      totalCustomers,
      activeTasks,
      totalMaterials,
      totalPosts,
    ] = await Promise.all([
      // 总潜客数
      prisma.acquisitionLead.count({ where: { userId } }),
      // 今日潜客
      prisma.acquisitionLead.count({ 
        where: { userId, createdAt: { gte: today } } 
      }),
      // 本周潜客
      prisma.acquisitionLead.count({ 
        where: { userId, createdAt: { gte: weekAgo } } 
      }),
      // CRM 客户总数
      prisma.crmCustomer.count({ where: { userId } }),
      // 活跃获客任务
      prisma.acquisitionTask.count({ 
        where: { userId, status: 'running' } 
      }),
      // 素材总数
      prisma.material.count({ where: { userId } }),
      // 发布内容总数
      prisma.publishedContent.count({ where: { userId } }),
    ]);

    // 获取本月数据趋势
    const monthLeads = await prisma.acquisitionLead.groupBy({
      by: ['createdAt'],
      where: { userId, createdAt: { gte: monthAgo } },
      _count: true,
    });

    // 生成每日统计
    const dailyStats: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = 0;
    }
    monthLeads.forEach(l => {
      const dateStr = l.createdAt.toISOString().split('T')[0];
      if (dailyStats[dateStr] !== undefined) {
        dailyStats[dateStr] += l._count;
      }
    });

    res.json({
      leads: {
        total: totalLeads,
        today: todayLeads,
        week: weekLeads,
        trend: weekLeads > 0 ? Math.round((todayLeads / (weekLeads / 7)) * 100) - 100 : 0,
      },
      customers: {
        total: totalCustomers,
      },
      tasks: {
        active: activeTasks,
      },
      materials: {
        total: totalMaterials,
      },
      content: {
        total: totalPosts,
      },
      dailyStats: Object.entries(dailyStats)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error) {
    console.error('获取概览统计失败:', error);
    res.status(500).json({ error: '获取概览统计失败' });
  }
});

// 获取获客统计
router.get('/acquisition', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const [tasks, leads, statusStats] = await Promise.all([
      prisma.acquisitionTask.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          _count: { select: { leads: true } },
        },
      }),
      prisma.acquisitionLead.count({ where: { userId } }),
      prisma.acquisitionLead.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
    ]);

    const qualityStats = await prisma.acquisitionLead.groupBy({
      by: ['aiQuality'],
      where: { userId, aiQuality: { not: null } },
      _count: true,
    });

    const tasksWithCount = tasks.map(t => ({
      ...t,
      actualCount: t._count.leads,
      _count: undefined,
    }));

    res.json({
      tasks: tasksWithCount,
      totalLeads: leads,
      statusBreakdown: statusStats.map(s => ({
        status: s.status,
        count: s._count,
      })),
      qualityBreakdown: qualityStats.map(s => ({
        quality: s.aiQuality,
        count: s._count,
      })),
    });
  } catch (error) {
    console.error('获取获客统计失败:', error);
    res.status(500).json({ error: '获取获客统计失败' });
  }
});

// 获取内容发布统计
router.get('/content', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const [totalPosts, postsByPlatform, recentPosts] = await Promise.all([
      prisma.publishedContent.count({ where: { userId } }),
      prisma.publishedContent.groupBy({
        by: ['platform'],
        where: { userId },
        _count: true,
      }),
      prisma.publishedContent.findMany({
        where: { userId },
        orderBy: { publishedAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({
      total: totalPosts,
      byPlatform: postsByPlatform.map(p => ({
        platform: p.platform,
        count: p._count,
      })),
      recent: recentPosts,
    });
  } catch (error) {
    console.error('获取内容统计失败:', error);
    res.status(500).json({ error: '获取内容统计失败' });
  }
});

// 获取素材统计
router.get('/materials', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const [totalMaterials, materialsByType] = await Promise.all([
      prisma.material.count({ where: { userId } }),
      prisma.material.groupBy({
        by: ['type'],
        where: { userId },
        _count: true,
      }),
    ]);

    res.json({
      total: totalMaterials,
      byType: materialsByType.map(m => ({
        type: m.type,
        count: m._count,
      })),
    });
  } catch (error) {
    console.error('获取素材统计失败:', error);
    res.status(500).json({ error: '获取素材统计失败' });
  }
});

// 获取客户统计
router.get('/customers', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const [total, statusStats, recentCustomers] = await Promise.all([
      prisma.crmCustomer.count({ where: { userId } }),
      prisma.crmCustomer.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      prisma.crmCustomer.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({
      total,
      byStatus: statusStats.map(s => ({
        status: s.status,
        count: s._count,
      })),
      recent: recentCustomers,
    });
  } catch (error) {
    console.error('获取客户统计失败:', error);
    res.status(500).json({ error: '获取客户统计失败' });
  }
});

export default router;
