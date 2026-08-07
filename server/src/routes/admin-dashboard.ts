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
    const topAgents = await prisma.agent.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, phone: true } },
      },
    }).then(agents => agents.map((a: any) => ({
      id: a.id,
      name: a.user?.name || a.user?.phone || '未命名',
      totalCustomers: a.totalCustomers || 0,
      totalCommission: a.totalCommission || 0,
    })));

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
      },
    });
  } catch (error: any) {
    console.error('获取管理员统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
