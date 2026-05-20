import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ==================== 通用统计 API ====================

// 获取总览统计
router.get('/overview', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const [materialCount, recruitmentCount, acquisitionCount, shareCount] = await Promise.all([
      prisma.material.count({ where: { userId: userId as string } }),
      prisma.recruitmentPost.count({ where: { userId: userId as string } }),
      prisma.acquisitionTask.count({ where: { userId: userId as string } }),
      prisma.shareQrCode.count({ where: { userId: userId as string } }),
    ]);
    
    res.json({
      data: {
        totalMaterials: materialCount,
        totalRecruitmentPosts: recruitmentCount,
        totalAcquisitionTasks: acquisitionCount,
        totalShareCodes: shareCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取数据趋势
router.get('/trend', async (req, res) => {
  try {
    const { userId, days = '7' } = req.query;
    const numDays = Number(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);
    
    const trendData = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      trendData.push({
        date: dateStr,
        value: Math.floor(Math.random() * 1000) + 100,
        type: '访问量',
      });
    }
    
    res.json({ data: trendData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取热门内容
router.get('/popular', async (req, res) => {
  try {
    const { userId, limit = '10' } = req.query;
    
    const materials = await prisma.material.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });
    
    res.json({ data: materials });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取平台分布
router.get('/platforms', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const platforms = [
      { name: '抖音', count: 1250, percentage: 35 },
      { name: '小红书', count: 980, percentage: 28 },
      { name: '视频号', count: 750, percentage: 21 },
      { name: '快手', count: 580, percentage: 16 },
    ];
    
    res.json({ data: platforms });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Admin 专用统计 API ====================

// Admin 总览数据
router.get('/admin/overview', async (req, res) => {
  try {
    const [totalUsers, totalAgents, totalCustomers, totalMaterials, totalPosts, totalLeads] = await Promise.all([
      prisma.user.count(),
      prisma.agent.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.material.count(),
      prisma.publishedContent.count(),
      prisma.acquisitionLead.count(),
    ]);

    // 今日活跃用户（最近24小时内有登录的）
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const todayActiveUsers = await prisma.user.count({
      where: { lastLoginAt: { gte: oneDayAgo } },
    });

    // 模拟总收入
    const totalRevenue = totalCustomers * 299; // 假设每个客户平均消费299元

    res.json({
      totalUsers,
      totalAgents,
      totalCustomers,
      todayActiveUsers,
      totalMaterials,
      totalPosts,
      totalLeads,
      totalRevenue,
    });
  } catch (error: any) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin 趋势数据
router.get('/admin/trend', async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const numDays = Number(days);
    
    const trendData = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 生成模拟趋势数据
      trendData.push({
        date: dateStr,
        newUsers: Math.floor(Math.random() * 50) + 10,
        newAgents: Math.floor(Math.random() * 5) + 1,
        newCustomers: Math.floor(Math.random() * 30) + 5,
        apiCalls: Math.floor(Math.random() * 1000) + 100,
        revenue: Math.floor(Math.random() * 5000) + 1000,
      });
    }
    
    res.json(trendData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin 平台分布
router.get('/admin/platforms', async (req, res) => {
  try {
    // 从数据库获取实际矩阵账号分布
    const accounts = await prisma.matrixAccount.groupBy({
      by: ['platform'],
      _count: { id: true },
    });

    const total = accounts.reduce((sum, a) => sum + a._count.id, 0);
    const platformMap: Record<string, string> = {
      douyin: '抖音',
      kuaishou: '快手',
      xiaohongshu: '小红书',
      wechat: '视频号',
    };

    const platforms = accounts.map(a => ({
      name: platformMap[a.platform] || a.platform,
      count: a._count.id,
      percentage: total > 0 ? Math.round((a._count.id / total) * 100) : 0,
    }));

    // 如果没有数据，返回默认
    if (platforms.length === 0) {
      platforms.push(
        { name: '抖音', count: 45, percentage: 35 },
        { name: '小红书', count: 38, percentage: 30 },
        { name: '视频号', count: 28, percentage: 22 },
        { name: '快手', count: 17, percentage: 13 },
      );
    }

    res.json(platforms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin 代理商业绩
router.get('/admin/agents', async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        user: { select: { name: true, phone: true } },
        UserAgentRelation: { select: { userId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const agentStats = agents.map(agent => ({
      id: agent.id,
      agentName: agent.user?.name || agent.companyName || '未知',
      phone: agent.user?.phone || '',
      customerCount: agent.UserAgentRelation?.length || 0,
      monthlyRevenue: Math.floor(Math.random() * 10000) + 1000, // 模拟月收入
      activityRate: Math.floor(Math.random() * 40) + 60, // 模拟活跃度 60-100%
      status: agent.status || 'active',
      region: agent.region || '全国',
    }));

    res.json(agentStats);
  } catch (error: any) {
    console.error('Agent stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin 用户列表
router.get('/admin/users', async (req, res) => {
  try {
    const { page = '1', pageSize = '20', role, keyword } = req.query;
    
    const where: any = {};
    if (role) where.role = role;
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { phone: { contains: keyword as string } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          agent: { select: { companyName: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ data: users, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
