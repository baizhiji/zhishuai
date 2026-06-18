/**
 * 社交账号授权路由
 * 处理扫码授权、账号绑定等
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 支持的平台列表
const PLATFORMS = [
  { id: 'douyin', name: '抖音' },
  { id: 'kuaishou', name: '快手' },
  { id: 'xiaohongshu', name: '小红书' },
  { id: 'weibo', name: '微博' },
  { id: 'bilibili', name: 'B站' },
  { id: 'boss', name: 'BOSS直聘' },
  { id: 'weixin', name: '微信公众号' },
];

/**
 * 获取支持的平台列表
 */
router.get('/platforms', (req: Request, res: Response) => {
  res.json({ code: 0, data: PLATFORMS });
});

/**
 * 获取用户社交账号列表
 */
router.get('/accounts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;

    const accounts = await prisma.matrixAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ code: 0, data: accounts });
  } catch (error: any) {
    console.error('获取账号列表失败:', error);
    res.status(500).json({ code: 500, message: '获取账号列表失败' });
  }
});

/**
 * 绑定社交账号（通过Cookie方式）
 */
router.post('/bind', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { platform, accountName, cookies, avatar, note } = req.body;

    if (!platform || !accountName) {
      return res.status(400).json({ code: 400, message: '平台和账号名为必填项' });
    }

    // 检查是否已绑定
    const existing = await prisma.matrixAccount.findFirst({
      where: { userId, platform, accountName },
    });

    if (existing) {
      return res.status(400).json({ code: 400, message: '该账号已绑定' });
    }

    const account = await prisma.matrixAccount.create({
      data: {
        userId,
        platform,
        accountName,
        avatar: avatar || '',
        note: note || '',
        status: 'active',
        autoPublish: false,
        cookies: cookies ? JSON.stringify(cookies) : null,
      },
    });

    res.json({ code: 0, data: account });
  } catch (error: any) {
    console.error('绑定账号失败:', error);
    res.status(500).json({ code: 500, message: '绑定账号失败' });
  }
});

/**
 * 解绑社交账号
 */
router.delete('/accounts/:accountId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { accountId } = req.params;

    const account = await prisma.matrixAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return res.status(404).json({ code: 404, message: '账号不存在或无权操作' });
    }

    await prisma.matrixAccount.delete({ where: { id: accountId } });

    res.json({ code: 0, message: '解绑成功' });
  } catch (error: any) {
    console.error('解绑失败:', error);
    res.status(500).json({ code: 500, message: '解绑失败' });
  }
});

/**
 * 更新账号状态
 */
router.put('/accounts/:accountId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { accountId } = req.params;
    const { status, autoPublish, note, cookies } = req.body;

    const account = await prisma.matrixAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return res.status(404).json({ code: 404, message: '账号不存在或无权操作' });
    }

    const updated = await prisma.matrixAccount.update({
      where: { id: accountId },
      data: {
        ...(status !== undefined && { status }),
        ...(autoPublish !== undefined && { autoPublish }),
        ...(note !== undefined && { note }),
        ...(cookies !== undefined && { cookies: JSON.stringify(cookies) }),
      },
    });

    res.json({ code: 0, data: updated });
  } catch (error: any) {
    console.error('更新账号失败:', error);
    res.status(500).json({ code: 500, message: '更新账号失败' });
  }
});

/**
 * 刷新账号Cookie状态
 */
router.post('/accounts/:accountId/refresh', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { accountId } = req.params;

    const account = await prisma.matrixAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return res.status(404).json({ code: 404, message: '账号不存在' });
    }

    // TODO: 实现Cookie刷新逻辑（检查Cookie是否有效）
    // 目前标记为活跃
    await prisma.matrixAccount.update({
      where: { id: accountId },
      data: { status: 'active' },
    });

    res.json({ code: 0, message: '刷新成功' });
  } catch (error: any) {
    console.error('刷新失败:', error);
    res.status(500).json({ code: 500, message: '刷新失败' });
  }
});

export default router;
