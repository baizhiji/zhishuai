import { Router, Request, Response } from 'express';
import { prisma } from '../utils/db';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

// 管理员总览统计
router.get('/', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalAgents,
      activeAgents,
      totalCustomers,
      activeCustomers,
      disabledCustomers,
      newAgentsThisMonth,
      newAgentsLastMonth,
      newCustomersThisMonth,
      newCustomersLastMonth,
      pendingTickets,
      totalMaterials,
      totalApiProviders,
      enabledApiProviders,
    ] = await Promise.all([
      prisma.agent.count(),
      prisma.agent.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.user.count({ where: { role: 'customer', status: 'active' } }),
      prisma.user.count({ where: { role: 'customer', status: 'disabled' } }),
      prisma.agent.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.agent.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.user.count({ where: { role: 'customer', createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { role: 'customer', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.ticket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      prisma.material.count(),
      prisma.apiProvider.count(),
      prisma.apiProvider.count({ where: { enabled: true } }),
    ]);

    // 客户来源 Top（按代理商分组，按 createdAt 倒序）
    const agentsRaw = await prisma.agent.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        name: true,
        totalPaid: true,
      },
    });

    // 分开查询用户，避免required relation null报错
    const userIds = agentsRaw.map(a => a.userId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, phone: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const topAgents = agentsRaw.map(a => {
      const u = userMap.get(a.userId);
      return {
        id: a.id,
        name: a.name || u?.name || u?.phone || '未命名',
        totalCustomers: 0,
        totalCommission: Number(a.totalPaid) || 0,
      };
    });

    // 代理商区域分布：按 region 第一级（省份）聚合
    const agentsWithRegion = await prisma.agent.findMany({
      select: { region: true, level: true },
    });

    const regionMap = new Map<string, number>();
    agentsWithRegion.forEach(a => {
      let key = '未设置区域';
      if (a.region) {
        const firstPart = a.region.split(' / ')[0]?.trim();
        if (firstPart) key = firstPart;
      } else if (a.level === 'national') {
        key = '全国代理';
      } else if (a.level === 'personal') {
        key = '个人代理';
      }
      regionMap.set(key, (regionMap.get(key) || 0) + 1);
    });

    const agentRegionDistribution = Array.from(regionMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    res.json({
      success: true,
      data: {
        // 代理商
        totalAgents,
        activeAgents,
        newAgentsThisMonth,
        newAgentsLastMonth,
        // 客户
        totalCustomers,
        activeCustomers,
        disabledCustomers,
        newCustomersThisMonth,
        newCustomersLastMonth,
        // 工单 / 素材 / 发布
        pendingTickets,
        totalMaterials,
        // API 服务商
        totalApiProviders,
        enabledApiProviders,
        // 排行榜
        topAgents,
        // 区域分布
        agentRegionDistribution,
      },
    });
  } catch (error: any) {
    console.error('获取管理员统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
