import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取分享码列表
router.get('/codes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 10 } = req.query;

    const codes = await prisma.shareQrCode.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.shareQrCode.count({ where: { userId } });

    res.json({
      success: true,
      data: { list: codes, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建分享码
router.post('/codes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, videoUrl, platforms } = req.body;

    const shareCode = await prisma.shareQrCode.create({
      data: {
        userId,
        title,
        videoUrl,
        platforms: platforms || [],
        scanCount: 0,
        publishCount: 0,
      },
    });

    res.json({ success: true, data: shareCode });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除分享码
router.delete('/codes/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    await prisma.shareQrCode.delete({ where: { id, userId } });

    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取分享记录
router.get('/records', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 20 } = req.query;

    const records = await prisma.shareRecord.findMany({
      where: { qrCode: { userId } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      include: { qrCode: { select: { title: true } } },
    });

    const total = await prisma.shareRecord.count({ where: { qrCode: { userId } } });

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

    const codeCount = await prisma.shareQrCode.count({ where: { userId } });
    const totalScans = await prisma.shareQrCode.aggregate({
      where: { userId },
      _sum: { scanCount: true },
    });
    const totalPublishes = await prisma.shareQrCode.aggregate({
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
