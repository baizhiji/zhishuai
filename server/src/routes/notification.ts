import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取通知列表
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { type, page = 1, pageSize = 20 } = req.query;

    const where: any = { userId };
    if (type && type !== 'all') where.type = type;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.notification.count({ where });

    res.json({
      success: true,
      data: { list: notifications, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取未读数量
router.get('/unread-count', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const count = await prisma.notification.count({
      where: { userId, read: false },
    });

    res.json({ success: true, data: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 标记已读
router.put('/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    await prisma.notification.update({
      where: { id, userId },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 全部标记已读
router.put('/read-all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除通知
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    await prisma.notification.delete({ where: { id, userId } });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 发送通知（内部使用）
export async function sendNotification(
  userId: string,
  title: string,
  content: string,
  type: 'system' | 'order' | 'activity' = 'system'
) {
  try {
    await prisma.notification.create({
      data: { userId, title, content, type },
    });
  } catch (error) {
    console.error('发送通知失败:', error);
  }
}

export default router;
