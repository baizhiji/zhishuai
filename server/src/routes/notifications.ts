import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { sendPushToUser, sendPushToUsers } from '../services/push-service';

const router = Router();

// ============ 推送Token注册 ============

// 注册/更新推送Token
router.post('/push-token', authMiddleware, async (req: Request, res: Response) => {
  const prisma = (req as any).prisma;
  const userId = (req as any).userId;
  const { token, platform } = req.body;

  if (!token) {
    res.status(400).json({ code: 400, message: 'token不能为空' });
    return;
  }

  if (!['fcm', 'apns', 'web'].includes(platform)) {
    res.status(400).json({ code: 400, message: 'platform必须是 fcm/apns/web' });
    return;
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        pushToken: token,
        pushPlatform: platform,
        pushTokenUpdatedAt: new Date(),
      },
    });

    res.json({ code: 0, message: '推送Token注册成功' });
  } catch (error) {
    console.error('注册推送Token失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 注销推送Token
router.delete('/push-token', authMiddleware, async (req: Request, res: Response) => {
  const prisma = (req as any).prisma;
  const userId = (req as any).userId;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        pushToken: null,
        pushPlatform: null,
        pushTokenUpdatedAt: null,
      },
    });

    res.json({ code: 0, message: '推送Token已注销' });
  } catch (error) {
    console.error('注销推送Token失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ============ 管理员发送推送 ============

// 管理员向指定用户发送推送通知
router.post('/send', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const userRole = (req as any).userRole;

  // 仅管理员和代理商可发送
  if (userRole !== 'admin' && userRole !== 'agent') {
    res.status(403).json({ code: 403, message: '无权发送推送通知' });
    return;
  }

  const { targetUserId, targetUserIds, title, body, data } = req.body;

  if (!title || !body) {
    res.status(400).json({ code: 400, message: '标题和内容不能为空' });
    return;
  }

  try {
    const message = { title, body, data };

    if (targetUserIds && Array.isArray(targetUserIds)) {
      await sendPushToUsers(targetUserIds, message);
    } else if (targetUserId) {
      await sendPushToUser(targetUserId, message);
    } else {
      res.status(400).json({ code: 400, message: '需要指定目标用户' });
      return;
    }

    res.json({ code: 0, message: '推送发送成功' });
  } catch (error) {
    console.error('发送推送失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取通知列表
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const prisma = (req as any).prisma;
  const userId = (req as any).userId;
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
router.get('/unread-count', authMiddleware, async (req: Request, res: Response) => {
  const prisma = (req as any).prisma;
  const userId = (req as any).userId;

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
router.put('/:id/read', authMiddleware, async (req: Request, res: Response) => {
  const prisma = (req as any).prisma;
  const userId = (req as any).userId;
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
router.put('/read-all', authMiddleware, async (req: Request, res: Response) => {
  const prisma = (req as any).prisma;
  const userId = (req as any).userId;

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
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  const prisma = (req as any).prisma;
  const userId = (req as any).userId;
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
