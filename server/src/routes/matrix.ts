import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取矩阵账号列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: '未授权' });
    }
    const accounts = await prisma.matrixAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取矩阵账号失败' });
  }
});

// 添加矩阵账号
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: '未授权' });
    }
    const { platform, accountName, accountId, avatar, status } = req.body;
    const account = await prisma.matrixAccount.create({
      data: {
        platform,
        accountName,
        accountId,
        avatar,
        status: status || 'active',
        userId,
      },
    });
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, error: '添加矩阵账号失败' });
  }
});

// 更新矩阵账号
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, autoPublish } = req.body;
    const account = await prisma.matrixAccount.update({
      where: { id: parseInt(id) },
      data: { status, autoPublish },
    });
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新矩阵账号失败' });
  }
});

// 删除矩阵账号
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.matrixAccount.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除矩阵账号失败' });
  }
});

export default router;
