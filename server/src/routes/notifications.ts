import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';

const router = Router();

// 获取通知列表
router.get('/', verifyToken, async (req: Request, res: Response) => {
  const prisma = (req as any).prisma;
  const userId = (req as any).user.id;
  const { type, page = '1', pageSize = '20' } = req.query;
  
  const pageNum = parseInt(page as string);
  const pageSizeNum = parseInt(pageSize as string);
  const skip = (pageNum - 1) * pageSizeNum;

  try {
    const where: any = { userId };
    if (type && type !== 'all') {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSizeNum,
      }),
      prisma.notification.count({ where }),
    ]);

    // 更新未读数量
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({
      code: 0,
      message: '获取成功',
      data: {
        list: notifications,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('获取通知列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取未读数量
router.get('/unread-count', verifyToken, async (req: Request, res: Response) => {
  const prisma = (req as any).prisma;
  const userId = (req as any).user.id;

  try {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({ code: 0, message: '获取成功', data: count });
  } catch (error) {
    console.error('获取未读数量失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 标记已读
router.put('/:id/read', verifyToken, async (req: Request, res: Response) => {
  const prisma = (req as any).prisma;
  const userId = (req as any).user.id;
  const { id } = req.params;

  try {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    res.json({ code: 0, message: '标记成功' });
  } catch (error) {
    console.error('标记已读失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 标记全部已读
router.put('/read-all', verifyToken, async (req: Request, res: Response) => {
  const prisma = (req as any).prisma;
  const userId = (req as any).user.id;

  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ code: 0, message: '标记成功' });
  } catch (error) {
    console.error('标记全部已读失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 删除通知
router.delete('/:id', verifyToken, async (req: Request, res: Response) => {
  const prisma = (req as any).prisma;
  const userId = (req as any).user.id;
  const { id } = req.params;

  try {
    await prisma.notification.delete({
      where: { id, userId },
    });

    res.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('删除通知失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

export default router;
