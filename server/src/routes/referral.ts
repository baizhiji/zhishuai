/**
 * 转介绍推荐API
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取推荐统计
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // 通过 shareRecords 统计推荐
    const shareRecords = await prisma.shareRecord.count({
      where: { userId },
    });

    res.json({
      totalReferrals: shareRecords,
      rewardAmount: 0,
      pendingReward: 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取推荐用户列表
router.get('/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    // 返回分享记录作为推荐记录
    const records = await prisma.shareRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(pageSize),
    });

    const total = await prisma.shareRecord.count({
      where: { userId },
    });

    res.json({ users: records, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
