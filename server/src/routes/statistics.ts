/**
 * 统计数据API - 管理后台统计
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Admin 管理后台统计
const adminRouter = Router();

// 获取管理后台总览统计
adminRouter.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, totalAgents, totalCustomers, todayActive, monthlyNewUsers] = await Promise.all([
      prisma.user.count(),
      prisma.agent.count({ where: { status: 'active' } }),
      prisma.userAgentRelation.count(), // 客户数 = 关联关系数
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(now.setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
    ]);

    // 统计总收益（一次性付费代理商 + 按比例分成代理商）
    const agentStats = await prisma.agent.aggregate({
      _sum: {
        totalPaid: true,
        monthlyPaid: true,
      },
    });

    // 统计客户总支付金额
    const customerStats = await prisma.user.aggregate({
      _sum: {
        totalPaid: true,
        monthlyPaid: true,
      },
      where: {
        role: 'user',
      },
    });

    res.json({
      data: {
        totalUsers,
        totalAgents,
        totalCustomers,
        todayActiveUsers: todayActive,
        monthlyNewUsers,
        totalMaterials: 0,
        totalPosts: 0,
        totalLeads: 0,
        totalRevenue: agentStats._sum.totalPaid || 0,
        monthlyRevenue: agentStats._sum.monthlyPaid || 0,
        totalCustomerPaid: customerStats._sum.totalPaid || 0,
        monthlyCustomerPaid: customerStats._sum.monthlyPaid || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取趋势数据
adminRouter.get('/trend', async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const numDays = Number(days);

    const trendData = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const [newUsers, newAgents, newCustomers] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
        prisma.agent.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
        prisma.userAgentRelation.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
      ]);

      trendData.push({
        date: startOfDay.toISOString().split('T')[0],
        newUsers,
        newAgents,
        newCustomers,
        apiCalls: Math.floor(Math.random() * 1000) + 100,
        revenue: Math.floor(Math.random() * 5000) + 1000,
      });
    }

    res.json({ data: trendData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取平台分布
adminRouter.get('/platforms', async (req, res) => {
  try {
    const [mediaUsers, recruitmentUsers, acquisitionUsers] = await Promise.all([
      prisma.user.count({
        where: {
          featureSwitches: {
            some: {
              featureCode: 'media',
              enabled: true,
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          featureSwitches: {
            some: {
              featureCode: 'recruitment',
              enabled: true,
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          featureSwitches: {
            some: {
              featureCode: 'acquisition',
              enabled: true,
            },
          },
        },
      }),
    ]);

    const platforms = [
      { name: '自媒体运营', count: mediaUsers },
      { name: '招聘助手', count: recruitmentUsers },
      { name: '智能获客', count: acquisitionUsers },
    ];

    res.json({ data: platforms });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取代理商列表（带统计数据）
adminRouter.get('/agents', async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 获取每个代理商关联的用户信息
    const agentIds = agents.map((a) => a.id);
    const relations = await prisma.userAgentRelation.findMany({
      where: { agentId: { in: agentIds } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            totalPaid: true,
            monthlyPaid: true,
          },
        },
      },
    });

    // 按代理商分组客户
    const relationMap = new Map();
    relations.forEach((r) => {
      if (!relationMap.has(r.agentId)) {
        relationMap.set(r.agentId, []);
      }
      relationMap.get(r.agentId).push(r.user);
    });

    const agentsWithStats = agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      level: agent.level,
      agentType: agent.agentType,
      commissionRate: agent.commissionRate,
      oneTimeFee: agent.oneTimeFee,
      totalPaid: agent.totalPaid,
      monthlyPaid: agent.monthlyPaid,
      balance: agent.balance,
      totalRevenue: agent.totalRevenue,
      status: agent.status,
      phone: null, // 需要单独查询
      customerCount: relationMap.get(agent.id)?.length || 0,
      customers: relationMap.get(agent.id) || [],
      createdAt: agent.createdAt,
    }));

    res.json({ data: agentsWithStats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个代理商详情
adminRouter.get('/agents/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        children: {
          select: {
            id: true,
            name: true,
            level: true,
            status: true,
          },
        },
      },
    });

    if (!agent) {
      return res.status(404).json({ error: '代理商不存在' });
    }

    // 获取关联的用户信息
    const relations = await prisma.userAgentRelation.findMany({
      where: { agentId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
            totalPaid: true,
            monthlyPaid: true,
          },
        },
      },
    });

    // 获取代理商关联的用户
    const agentUser = await prisma.user.findFirst({
      where: { agent: { some: { id } } },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    res.json({
      data: {
        ...agent,
        user: agentUser,
        customers: relations.map((r) => r.user),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取代理商业绩统计
adminRouter.get('/agents/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      select: {
        id: true,
        totalPaid: true,
        monthlyPaid: true,
        totalRevenue: true,
        balance: true,
        agentType: true,
        commissionRate: true,
        oneTimeFee: true,
      },
    });

    if (!agent) {
      return res.status(404).json({ error: '代理商不存在' });
    }

    // 获取客户列表
    const relations = await prisma.userAgentRelation.findMany({
      where: { agentId: id },
      select: { userId: true },
    });

    const customerIds = relations.map((r) => r.userId);

    // 获取客户使用统计
    const [materialCount, recruitmentCount, acquisitionCount] = await Promise.all([
      prisma.material.count({
        where: { userId: { in: customerIds } },
      }),
      prisma.recruitmentPost.count({
        where: { userId: { in: customerIds } },
      }),
      prisma.acquisitionTask.count({
        where: { userId: { in: customerIds } },
      }),
    ]);

    res.json({
      data: {
        totalPaid: agent.totalPaid,
        monthlyPaid: agent.monthlyPaid,
        totalRevenue: agent.totalRevenue,
        balance: agent.balance,
        customerCount: customerIds.length,
        customerStats: {
          materials: materialCount,
          recruitmentPosts: recruitmentCount,
          acquisitionTasks: acquisitionCount,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 注册admin子路由
router.use('/admin', adminRouter);

// 获取总览统计（用户级）
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

// 获取数据趋势（用户级）
router.get('/trend', async (req, res) => {
  try {
    const { userId, days = '7' } = req.query;
    const numDays = Number(days);

    const trendData = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      trendData.push({
        date: dateStr,
        value: Math.floor(Math.random() * 1000) + 100,
      });
    }

    res.json({ data: trendData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取统计看板（用户级）
router.get('/dashboard', async (req, res) => {
  try {
    const { userId } = req.query;

    const [materials, recruitmentPosts, acquisitionTasks, shareCodes] = await Promise.all([
      prisma.material.findMany({ where: { userId: userId as string }, take: 10, orderBy: { createdAt: 'desc' } }),
      prisma.recruitmentPost.findMany({ where: { userId: userId as string }, take: 10, orderBy: { createdAt: 'desc' } }),
      prisma.acquisitionTask.findMany({ where: { userId: userId as string }, take: 10, orderBy: { createdAt: 'desc' } }),
      prisma.shareQrCode.findMany({ where: { userId: userId as string }, take: 10, orderBy: { createdAt: 'desc' } }),
    ]);

    res.json({
      data: {
        materials,
        recruitmentPosts,
        acquisitionTasks,
        shareCodes,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
