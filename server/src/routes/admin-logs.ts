import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取日志列表
router.get('/logs', async (req, res) => {
  try {
    const { page = '1', pageSize = '20', userId, action, startDate, endDate, keyword } = req.query;
    
    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action as string };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    if (keyword) {
      where.OR = [
        { userName: { contains: keyword as string } },
        { action: { contains: keyword as string } },
        { target: { contains: keyword as string } },
        { detail: { contains: keyword as string } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        include: {
          user: { select: { name: true, phone: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      prisma.adminLog.count({ where }),
    ]);

    res.json({ data: logs, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取日志统计
router.get('/logs/stats', async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const numDays = Number(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);

    const [totalLogs, todayLogs, actionStats] = await Promise.all([
      prisma.adminLog.count(),
      prisma.adminLog.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      // 按操作类型统计
      prisma.adminLog.groupBy({
        by: ['action'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    res.json({
      totalLogs,
      todayLogs,
      actionStats: actionStats.map(s => ({ action: s.action, count: s._count.id })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 记录日志（内部使用）
export async function recordLog(prisma: PrismaClient, data: {
  userId: string;
  userName?: string;
  action: string;
  target?: string;
  detail?: string;
  ip?: string;
  userAgent?: string;
}) {
  try {
    await prisma.adminLog.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        target: data.target,
        detail: data.detail,
        ip: data.ip,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to record admin log:', error);
  }
}

export default router;
