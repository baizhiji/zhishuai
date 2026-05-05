import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取推荐码列表
router.get('/codes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 10 } = req.query;

    const codes = await prisma.shareCode.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.shareCode.count({ where: { userId } });

    res.json({
      success: true,
      data: { list: codes, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建推荐码
router.post('/codes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, videoUrl, platforms } = req.body;

    // 生成唯一推荐码
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const shareCode = await prisma.shareCode.create({
      data: {
        userId,
        title,
        videoUrl,
        platforms: platforms || [],
        code,
        scanCount: 0,
        publishCount: 0,
      },
    });

    res.json({ success: true, data: shareCode });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除推荐码
router.delete('/codes/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    await prisma.shareCode.delete({ where: { id, userId } });

    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取推荐记录
router.get('/records', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 20 } = req.query;

    const records = await prisma.shareRecord.findMany({
      where: { shareCode: { userId } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      include: { shareCode: { select: { title: true } } },
    });

    const total = await prisma.shareRecord.count({ where: { shareCode: { userId } } });

    res.json({
      success: true,
      data: { list: records, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取统计数据
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const codeCount = await prisma.shareCode.count({ where: { userId } });
    const totalScans = await prisma.shareCode.aggregate({
      where: { userId },
      _sum: { scanCount: true },
    });
    const totalPublishes = await prisma.shareCode.aggregate({
      where: { userId },
      _sum: { publishCount: true },
    });

    res.json({
      success: true,
      data: {
        totalCodes: codeCount,
        totalScans: totalScans._sum.scanCount || 0,
        totalPublishes: totalPublishes._sum.publishCount || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
