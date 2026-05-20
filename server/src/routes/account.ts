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

// 员工管理 - 获取列表
router.get('/staff', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 20 } = req.query;

    // 通过 UserAgentRelation 查找该用户创建的所有子账号
    const relations = await prisma.userAgentRelation.findMany({
      where: { agentId: userId },
      select: { userId: true },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.userAgentRelation.count({ where: { agentId: userId } });

    const staffIds = relations.map(r => r.userId);
    const staff = await prisma.user.findMany({
      where: { id: { in: staffIds } },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

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

    // 先创建用户
    const staff = await prisma.user.create({
      data: {
        phone,
        name,
        role: role || 'staff',
        password: '888888', // 默认密码
      },
    });

    // 创建用户与代理商的关系
    await prisma.userAgentRelation.create({
      data: {
        userId: staff.id,
        agentId: userId,
      },
    });

    res.json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除员工
router.delete('/staff/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const staffId = req.params.id;

    // 删除关联关系
    await prisma.userAgentRelation.deleteMany({
      where: { userId: staffId, agentId: userId },
    });

    // 删除用户
    await prisma.user.delete({ where: { id: staffId } });

    res.json({ success: true, message: '员工已删除' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新员工
router.put('/staff/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const staffId = req.params.id;
    const { name, status, role } = req.body;

    const staff = await prisma.user.update({
      where: { id: staffId },
      data: { name, status, role },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
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
    prisma.publishedContent.count({ where: { userId } }),
    prisma.shareRecord.count({ where: { referrerId: userId } }),
  ]);

  return {
    materialCount,
    accountCount,
    publishCount,
    referralCount,
  };
}

export default router;
