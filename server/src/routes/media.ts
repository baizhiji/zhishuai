import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============ 矩阵账号 ============

// 获取矩阵账号列表
router.get('/accounts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform, page = 1, pageSize = 20 } = req.query;

    const where: any = { userId };
    if (platform) where.platform = platform;

    const accounts = await prisma.matrixAccount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.matrixAccount.count({ where });

    res.json({
      success: true,
      data: { list: accounts, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 添加矩阵账号
router.post('/accounts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform, accountId, avatar, autoPublish, name } = req.body;

    const account = await prisma.matrixAccount.create({ // @ts-ignore
      data: { 
        userId, 
        platform, 
        accountId: accountId || '', 
        avatar: avatar || '', 
        autoPublish: autoPublish || false 
      },
    });

    res.json({ success: true, data: account });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新矩阵账号
router.put('/accounts/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { accountId, autoPublish, status, name } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (autoPublish !== undefined) data.autoPublish = autoPublish;
    if (status !== undefined) data.status = status;

    const account = await prisma.matrixAccount.update({
      where: { id, userId },
      data,
    });

    res.json({ success: true, data: account });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除矩阵账号
router.delete('/accounts/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    await prisma.matrixAccount.delete({ where: { id, userId } });

    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ 发布记录 ============

// 获取发布记录
router.get('/publish-records', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 20 } = req.query;

    const records = await prisma.publishedContent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.publishedContent.count({ where: { userId } });

    res.json({
      success: true,
      data: { list: records, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 发布内容
router.post('/publish', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, content, platform, mediaUrls } = req.body;

    const record = await prisma.publishedContent.create({
      data: {
        userId,
        title: title || '未命名',
        content: content || '',
        platform: platform || 'unknown',
        mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
        status: 'published',
      },
    });

    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ 内容数据 ============

// 获取内容数据列表
router.get('/content-data', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 20 } = req.query;

    const records = await prisma.publishedContent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.publishedContent.count({ where: { userId } });

    res.json({
      success: true,
      data: { list: records, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ 矩阵统计 ============

// 获取矩阵统计数据
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const accountCount = await prisma.matrixAccount.count({ where: { userId } });
    const publishCount = await prisma.publishedContent.count({ where: { userId } });

    res.json({
      success: true,
      data: {
        accountCount,
        publishCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
