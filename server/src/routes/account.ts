import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取账户信息
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // 获取统计数据
    const stats = await getUserStats(userId);

    res.json({ success: true, data: { ...user, stats } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新用户信息
router.put('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, avatar },
    });

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 修改密码
router.put('/password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { oldPassword, newPassword } = req.body;

    // 验证旧密码
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.password !== oldPassword) {
      return res.status(400).json({ error: '原密码错误' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });

    res.json({ success: true, message: '密码修改成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取套餐列表
router.get('/packages', async (req: Request, res: Response) => {
  try {
    const packages = [
      { id: 'basic', name: '基础版', price: 99, features: ['素材库100条', 'AI创作100次', '1个账号'] },
      { id: 'standard', name: '标准版', price: 299, features: ['素材库500条', 'AI创作500次', '3个账号'] },
      { id: 'professional', name: '专业版', price: 599, features: ['素材库无限', 'AI创作无限', '10个账号'] },
    ];

    res.json({ success: true, data: packages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 员工管理
router.get('/staff', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 20 } = req.query;

    // 查找该用户创建的所有子账号
    const staff = await prisma.user.findMany({
      where: { parentId: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.user.count({ where: { parentId: userId } });

    res.json({
      success: true,
      data: { list: staff, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 添加员工
router.post('/staff', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { phone, name, role } = req.body;

    const staff = await prisma.user.create({
      data: {
        phone,
        name,
        role: role || 'staff',
        parentId: userId,
      },
    });

    res.json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ 辅助函数 ============

async function getUserStats(userId: string) {
  const [
    materialCount,
    accountCount,
    publishCount,
    referralCount,
  ] = await Promise.all([
    prisma.material.count({ where: { userId } }),
    prisma.matrixAccount.count({ where: { userId } }),
    prisma.publishRecord.count({ where: { userId } }),
    prisma.referral.count({ where: { referrerId: userId } }),
  ]);

  return {
    materialCount,
    accountCount,
    publishCount,
    referralCount,
  };
}

export default router;
