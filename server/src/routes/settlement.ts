import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../utils/db';

const router = Router();

// 获取代理商分成统计
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { agentId } = req.query;

    if (!agentId) {
      return res.status(400).json({ error: 'agentId is required' });
    }

    // 验证agentId属于当前用户
    const agent = await prisma.agent.findFirst({
      where: { id: agentId as string, userId },
    });

    if (!agent) {
      return res.status(403).json({ error: '无权查看此代理商信息' });
    }

    const commissionRate = agent?.commissionRate || 0;

    // 真实客户统计
    const customerCount = await prisma.user.count({
      where: { agentId: agentId as string },
    });

    // 真实订单/收入数据
    const orders = await prisma.order.findMany({
      where: { agentId: agentId as string, status: 'paid' },
      select: { amount: true, createdAt: true },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const commission = totalRevenue * (commissionRate / 100);

    // 本月数据
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyCustomers = await prisma.user.count({
      where: {
        agentId: agentId as string,
        createdAt: { gte: startOfMonth },
      },
    });

    const monthlyOrders = orders.filter(o => new Date(o.createdAt) >= startOfMonth);
    const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const monthlyCommission = monthlyRevenue * (commissionRate / 100);

    // 真实结算数据
    const settlements = await prisma.settlement.findMany({
      where: { agentId: agentId as string },
      select: { amount: true, status: true },
    });

    const pendingSettlement = settlements
      .filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);

    const settledAmount = settlements
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);

    res.json({
      data: {
        totalCustomers: customerCount,
        totalRevenue,
        totalCommission: commission,
        commissionRate,
        monthlyCustomers,
        monthlyRevenue,
        monthlyCommission,
        pendingSettlement,
        settledAmount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取分成记录列表 — 真实数据
router.get('/records', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { agentId, page = 1, pageSize = 20, status } = req.query;

    if (!agentId) {
      return res.status(400).json({ error: 'agentId is required' });
    }

    // 验证代理归属
    const agent = await prisma.agent.findFirst({
      where: { id: agentId as string, userId },
    });
    if (!agent) {
      return res.status(403).json({ error: '无权查看此代理商信息' });
    }

    const where: any = { agentId: agentId as string };
    if (status) where.status = status;

    // 从结算表查询分成记录
    const [records, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      prisma.settlement.count({ where }),
    ]);

    res.json({
      data: records,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 申请结算 — 真实流程
router.post('/settle', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { agentId, amount, bankAccount, bankName } = req.body;

    if (!agentId || !amount || !bankAccount || !bankName) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    // 验证代理归属
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId },
    });
    if (!agent) {
      return res.status(403).json({ error: '无权操作此代理商' });
    }

    // 验证可结算金额
    const orders = await prisma.order.findMany({
      where: { agentId, status: 'paid' },
      select: { amount: true },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const commission = totalRevenue * ((agent.commissionRate || 0) / 100);

    // 已结算金额
    const settledAmount = await prisma.settlement.aggregate({
      where: { agentId, status: { in: ['completed', 'pending'] } },
      _sum: { amount: true },
    });

    const availableAmount = commission - Number(settledAmount._sum.amount || 0);

    if (Number(amount) > availableAmount) {
      return res.status(400).json({
        error: `可结算金额不足，当前可结算: ¥${availableAmount.toFixed(2)}`
      });
    }

    // 创建结算记录
    const settlement = await prisma.settlement.create({
      data: {
        agentId,
        amount: Number(amount),
        bankAccount,
        bankName,
        status: 'pending',
      },
    });

    res.json({
      success: true,
      message: '结算申请已提交',
      data: settlement,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
