import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../utils/db';


const router = Router();
// ============ 订阅套餐管理 ============

// 获取套餐列表
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = [
      {
        id: 'basic',
        name: '基础版',
        price: 99,
        originalPrice: 199,
        period: 'monthly',
        features: [
          '素材库100条',
          'AI创作100次/月',
          '1个矩阵账号',
          '基础数据统计',
          '7天数据保留',
        ],
        recommended: false,
      },
      {
        id: 'standard',
        name: '标准版',
        price: 299,
        originalPrice: 599,
        period: 'monthly',
        features: [
          '素材库500条',
          'AI创作500次/月',
          '3个矩阵账号',
          '高级数据统计',
          '30天数据保留',
          'API接口调用',
          '声音克隆5次/月',
        ],
        recommended: true,
      },
      {
        id: 'professional',
        name: '专业版',
        price: 599,
        originalPrice: 1299,
        period: 'monthly',
        features: [
          '素材库无限',
          'AI创作无限次',
          '10个矩阵账号',
          '全部功能',
          '90天数据保留',
          'API接口无限调用',
          '声音克隆无限次',
          '数字人视频无限次',
          '专属客服',
        ],
        recommended: false,
      },
      {
        id: 'enterprise',
        name: '企业版',
        price: 1999,
        originalPrice: 3999,
        period: 'monthly',
        features: [
          '基础版全部功能',
          '不限员工账号',
          '不限矩阵账号',
          '不限AI创作次数',
          '定制功能开发',
          '私有化部署支持',
          '专属技术团队',
        ],
        recommended: false,
      },
    ];

    res.json({ success: true, data: plans });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取当前用户的订阅信息
router.get('/my', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fee: true,
        totalPaid: true,
        monthlyPaid: true,
        lastPaidAt: true,
        expireAt: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 获取最近支付记录
    const recentPayments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 判断订阅等级
    let planId = 'free';
    if (user.fee && Number(user.fee) >= 1999) planId = 'enterprise';
    else if (user.fee && Number(user.fee) >= 599) planId = 'professional';
    else if (user.fee && Number(user.fee) >= 299) planId = 'standard';
    else if (user.fee && Number(user.fee) >= 99) planId = 'basic';

    res.json({
      success: true,
      data: {
        ...user,
        planId,
        expireAt: user.expireAt,
        isExpired: user.expireAt ? new Date(user.expireAt) < new Date() : false,
        payments: recentPayments,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建支付订单
router.post('/pay', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { planId, amount, period = 'monthly' } = req.body;

    if (!planId || !amount) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 创建支付记录
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        planId,
        period,
        status: 'pending',
      },
    });

    // 生成支付订单号
    const orderNo = `PAY${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        orderNo,
        amount,
        planId,
        // 支付链接（实际需要对接微信/支付宝SDK）
        payUrl: `/api/subscription/pay/${payment.id}/confirm`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 确认支付（模拟支付成功）
router.post('/pay/:id/confirm', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: { id, userId },
    });

    if (!payment) {
      return res.status(404).json({ error: '支付记录不存在' });
    }

    // 更新支付状态
    await prisma.payment.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    });

    // 更新用户订阅信息
    const expireAt = new Date();
    expireAt.setMonth(expireAt.getMonth() + (payment.period === 'yearly' ? 12 : 1));

    await prisma.user.update({
      where: { id: userId },
      data: {
        fee: payment.amount,
        totalPaid: { increment: payment.amount },
        monthlyPaid: payment.period === 'monthly' ? payment.amount : Number(payment.amount) / 12,
        lastPaidAt: new Date(),
        expireAt,
        status: 'active',
      },
    });

    res.json({
      success: true,
      data: {
        message: '支付成功',
        expireAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取支付历史
router.get('/payments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = '1', pageSize = '20' } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize),
      }),
      prisma.payment.count({ where: { userId } }),
    ]);

    res.json({
      success: true,
      data: {
        list: payments,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
