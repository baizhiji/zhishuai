import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * 订单/支付 API 路由
 * 匹配 Web 端 api.ts 中的 /orders/* 调用
 */

// 获取订单列表
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { page = 1, pageSize = 20, type } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const userId = (req as any).user?.id;

    const where: any = { userId };
    if (type) where.type = type;

    const [list, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({ code: 200, data: { list, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message || '获取订单列表失败' });
  }
});

// 获取订单详情
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
    });
    if (!payment) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }
    res.json({ code: 200, data: payment });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message || '获取订单详情失败' });
  }
});

// 创建充值订单
router.post('/recharge', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { amount, paymentMethod } = req.body;
    const userId = (req as any).user?.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ code: 400, message: '金额无效' });
    }

    const payment = await prisma.payment.create({
      data: {
        type: 'recharge',
        amount,
        paymentMethod: paymentMethod || 'wechat',
        status: 'pending',
        userId,
        period: 'once',
        description: `余额充值 ¥${amount}`,
        createdAt: new Date(),
      },
    });

    res.json({
      code: 200,
      data: {
        orderId: payment.id,
        paymentUrl: `/pay?orderId=${payment.id}`,
        qrCode: null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message || '创建充值订单失败' });
  }
});

// 创建订阅订单
router.post('/subscribe', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { planId, paymentMethod } = req.body;
    const userId = (req as any).user?.id;

    const planPrices: Record<string, number> = {
      basic: 99,
      standard: 299,
      professional: 699,
      enterprise: 1999,
    };

    const planNames: Record<string, string> = {
      basic: '基础版',
      standard: '标准版',
      professional: '专业版',
      enterprise: '企业版',
    };

    const amount = planPrices[planId] || 299;

    const payment = await prisma.payment.create({
      data: {
        type: 'subscription',
        amount,
        planId,
        period: 'monthly',
        paymentMethod: paymentMethod || 'wechat',
        status: 'pending',
        userId,
        description: `订阅${planNames[planId] || planId} - ¥${amount}/月`,
        createdAt: new Date(),
      },
    });

    res.json({
      code: 200,
      data: {
        orderId: payment.id,
        paymentUrl: `/pay?orderId=${payment.id}`,
        qrCode: null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message || '创建订阅订单失败' });
  }
});

// 取消订单
router.post('/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
    });
    res.json({ code: 200, data: payment, message: '订单已取消' });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message || '取消订单失败' });
  }
});

// 确认支付（模拟支付回调）
router.post('/:id/confirm', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { transactionId } = req.body;
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        status: 'paid',
        transactionId: transactionId || `TXN${Date.now()}`,
        paidAt: new Date(),
      },
    });
    res.json({ code: 200, data: payment, message: '支付成功' });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message || '确认支付失败' });
  }
});

// 查询支付状态
router.get('/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true, transactionId: true, paidAt: true },
    });
    if (!payment) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }
    res.json({ code: 200, data: payment });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message || '查询支付状态失败' });
  }
});

export default router;
