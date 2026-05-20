import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取代理商分成统计
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.query;

    if (!agentId) {
      return res.status(400).json({ error: 'agentId is required' });
    }

    // 获取代理商信息
    const agent = await prisma.agent.findUnique({
      where: { id: agentId as string }
    });

    // 获取分成比例
    const commissionRate = agent?.commissionRate || 0;

    // 统计名下客户数量
    const customerCount = await prisma.user.count({
      where: { agentId: agentId as string }
    });

    // 统计收入（这里可以接入实际支付数据）
    // 目前使用 Mock 数据
    const totalRevenue = customerCount * 100; // 模拟每人贡献100元
    const commission = totalRevenue * (commissionRate / 100);

    // 获取本月数据
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyCustomers = await prisma.user.count({
      where: {
        agentId: agentId as string,
        createdAt: { gte: startOfMonth }
      }
    });

    const monthlyRevenue = monthlyCustomers * 100;
    const monthlyCommission = monthlyRevenue * (commissionRate / 100);

    res.json({
      data: {
        totalCustomers: customerCount,
        totalRevenue,
        totalCommission: commission,
        commissionRate,
        monthlyCustomers,
        monthlyRevenue,
        monthlyCommission,
        pendingSettlement: commission * 0.2, // 模拟待结算
        settledAmount: commission * 0.8 // 模拟已结算
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取分成记录列表
router.get('/records', async (req: Request, res: Response) => {
  try {
    const { agentId, page = 1, pageSize = 20 } = req.query;

    if (!agentId) {
      return res.status(400).json({ error: 'agentId is required' });
    }

    // Mock 分成记录
    const mockRecords = [
      { id: '1', date: '2024-05-01', customerCount: 5, amount: 500, commission: 250, status: 'settled' },
      { id: '2', date: '2024-04-01', customerCount: 3, amount: 300, commission: 150, status: 'settled' },
      { id: '3', date: '2024-03-01', customerCount: 2, amount: 200, commission: 100, status: 'settled' },
    ];

    const total = mockRecords.length;
    const skip = (Number(page) - 1) * Number(pageSize);

    res.json({
      data: mockRecords.slice(skip, skip + Number(pageSize)),
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 申请结算
router.post('/settle', async (req: Request, res: Response) => {
  try {
    const { agentId, amount, bankAccount, bankName } = req.body;

    if (!agentId || !amount) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    // 创建结算申请记录（可以扩展为独立的结算表）
    res.json({
      success: true,
      message: '结算申请已提交',
      data: {
        id: `ST${Date.now()}`,
        agentId,
        amount,
        bankAccount,
        bankName,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
