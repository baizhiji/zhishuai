import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ==================== 客户工作台数据看板 API ====================

// 1. 获取工作台总览数据
router.get('/dashboard', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    
    // 并行获取各类数据
    const [
      materialsCount,
      recruitmentPostsCount,
      acquisitionTasksCount,
      shareCodesCount,
      matrixAccountsCount,
      publishedContentCount,
      // 近7天新增
      recentMaterials,
      recentPosts,
      recentLeads,
    ] = await Promise.all([
      // 素材总数
      prisma.material.count({ where: { userId: userId as string } }),
      // 招聘职位数
      prisma.recruitmentPost.count({ where: { userId: userId as string } }),
      // 获客任务数
      prisma.acquisitionTask.count({ where: { userId: userId as string } }),
      // 分享码数
      prisma.shareQrCode.count({ where: { userId: userId as string } }),
      // 矩阵账号数
      prisma.matrixAccount.count({ where: { userId: userId as string } }),
      // 已发布内容数
      prisma.publishedContent.count({ where: { userId: userId as string } }),
      // 近7天新增素材
      prisma.material.count({
        where: {
          userId: userId as string,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      // 近7天新增发布
      prisma.publishedContent.count({
        where: {
          userId: userId as string,
          publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      // 近7天新增潜客
      prisma.acquisitionLead.count({
        where: {
          task: { userId: userId as string },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
    ]);

    // 统计各平台账号
    const platformStats = await prisma.matrixAccount.groupBy({
      by: ['platform'],
      where: { userId: userId as string },
      _count: { id: true },
    });

    const platformMap: Record<string, string> = {
      douyin: '抖音',
      kuaishou: '快手',
      xiaohongshu: '小红书',
      wechat: '微信',
      weibo: '微博',
      zhihu: '知乎',
    };

    res.json({
      success: true,
      data: {
        overview: {
          materials: materialsCount,
          recruitmentPosts: recruitmentPostsCount,
          acquisitionTasks: acquisitionTasksCount,
          shareCodes: shareCodesCount,
          matrixAccounts: matrixAccountsCount,
          publishedContent: publishedContentCount,
        },
        weekly: {
          newMaterials: recentMaterials,
          newPosts: recentPosts,
          newLeads: recentLeads,
        },
        platforms: platformStats.map(p => ({
          platform: platformMap[p.platform] || p.platform,
          count: p._count.id,
        })),
      }
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. 获取内容发布统计（自媒体运营看板）
router.get('/media-stats', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    const { days = '30' } = req.query;
    const numDays = Number(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);

    // 获取发布数据
    const publications = await prisma.publishedContent.findMany({
      where: {
        userId: userId as string,
        publishedAt: { gte: startDate },
      },
      select: {
        id: true,
        platform: true,
        publishedAt: true,
        views: true,
        likes: true,
        comments: true,
        shares: true,
      },
    });

    // 按日聚合
    const dailyStats: Record<string, any> = {};
    for (let i = 0; i < numDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = {
        date: dateStr,
        posts: 0,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      };
    }

    // 填充数据
    publications.forEach(p => {
      const dateStr = p.publishedAt?.toISOString().split('T')[0];
      if (dateStr && dailyStats[dateStr]) {
        dailyStats[dateStr].posts++;
        dailyStats[dateStr].views += p.views || 0;
        dailyStats[dateStr].likes += p.likes || 0;
        dailyStats[dateStr].comments += p.comments || 0;
        dailyStats[dateStr].shares += p.shares || 0;
      }
    });

    // 平台分布
    const platformStats = await prisma.matrixAccount.groupBy({
      by: ['platform'],
      where: { userId: userId as string },
      _count: { id: true },
    });

    // 总计
    const totals = publications.reduce((acc, p) => ({
      views: acc.views + (p.views || 0),
      likes: acc.likes + (p.likes || 0),
      comments: acc.comments + (p.comments || 0),
      shares: acc.shares + (p.shares || 0),
    }), { views: 0, likes: 0, comments: 0, shares: 0 });

    res.json({
      success: true,
      data: {
        trend: Object.values(dailyStats).reverse(),
        platforms: platformStats.map(p => ({
          platform: p.platform,
          count: p._count.id,
        })),
        totals: {
          posts: publications.length,
          views: totals.views,
          likes: totals.likes,
          comments: totals.comments,
          shares: totals.shares,
        },
      }
    });
  } catch (error: any) {
    console.error('Media stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. 获取招聘统计
router.get('/recruitment-stats', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    
    // 职位统计
    const posts = await prisma.recruitmentPost.findMany({
      where: { userId: userId as string },
      select: {
        id: true,
        status: true,
        views: true,
        applications: true,
        createdAt: true,
      },
    });

    // 候选人统计
    const candidates = await prisma.candidate.findMany({
      where: { userId: userId as string },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    // 按状态分组
    const postStats = posts.reduce((acc, p) => {
      const status = p.status || 'draft';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const candidateStats = candidates.reduce((acc, c) => {
      const status = c.status || 'new';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 总浏览量和申请量
    const totals = posts.reduce((acc, p) => ({
      views: acc.views + (p.views || 0),
      applications: acc.applications + (p.applications || 0),
    }), { views: 0, applications: 0 });

    res.json({
      success: true,
      data: {
        posts: {
          total: posts.length,
          byStatus: postStats,
        },
        candidates: {
          total: candidates.length,
          byStatus: candidateStats,
        },
        totals,
      }
    });
  } catch (error: any) {
    console.error('Recruitment stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. 获取获客统计
router.get('/acquisition-stats', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    
    // 任务统计
    const tasks = await prisma.acquisitionTask.findMany({
      where: { userId: userId as string },
      select: {
        id: true,
        status: true,
        targetCount: true,
        actualCount: true,
        createdAt: true,
      },
    });

    // 潜客统计
    const leads = await prisma.acquisitionLead.findMany({
      where: { task: { userId: userId as string } },
      select: {
        id: true,
        status: true,
        interestLevel: true,
        createdAt: true,
      },
    });

    // 按状态分组
    const taskStats = tasks.reduce((acc, t) => {
      const status = t.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const leadStats = leads.reduce((acc, l) => {
      const status = l.status || 'new';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 按意向度分组
    const interestStats = leads.reduce((acc, l) => {
      const level = l.interestLevel || 'medium';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 转化率
    const totalSent = leads.length;
    const totalReplied = leads.filter(l => l.status === 'replied').length;
    const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;

    res.json({
      success: true,
      data: {
        tasks: {
          total: tasks.length,
          byStatus: taskStats,
        },
        leads: {
          total: leads.length,
          byStatus: leadStats,
          byInterest: interestStats,
        },
        metrics: {
          replyRate,
          avgConversion: tasks.length > 0 
            ? Math.round(tasks.reduce((acc, t) => acc + ((t.actualCount || 0) / (t.targetCount || 1)), 0) / tasks.length * 100)
            : 0,
        },
      }
    });
  } catch (error: any) {
    console.error('Acquisition stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. 获取分享统计
router.get('/share-stats', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    
    // 分享码统计
    const codes = await prisma.shareQrCode.findMany({
      where: { userId: userId as string },
      select: {
        id: true,
        scanCount: true,
        registerCount: true,
        createdAt: true,
      },
    });

    // 分享记录
    const records = await prisma.shareRecord.findMany({
      where: { userId: userId as string },
      select: {
        id: true,
        type: true,
        createdAt: true,
      },
    });

    // 按日聚合（近30天）
    const dailyStats: Record<string, any> = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = { date: dateStr, scans: 0, registers: 0 };
    }

    codes.forEach(c => {
      const dateStr = c.createdAt.toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].scans += c.scanCount || 0;
        dailyStats[dateStr].registers += c.registerCount || 0;
      }
    });

    // 总计
    const totals = codes.reduce((acc, c) => ({
      scans: acc.scans + (c.scanCount || 0),
      registers: acc.registers + (c.registerCount || 0),
    }), { scans: 0, registers: 0 });

    res.json({
      success: true,
      data: {
        totalCodes: codes.length,
        totals,
        conversionRate: totals.scans > 0 ? Math.round((totals.registers / totals.scans) * 100) : 0,
        trend: Object.values(dailyStats).reverse(),
      }
    });
  } catch (error: any) {
    console.error('Share stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
