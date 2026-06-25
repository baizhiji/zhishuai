/**
 * 数据导出 API 路由
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { exportCustomers, exportAcquisitionData, exportPublishRecords, exportStatistics, generateFilename } from '../services/export.service';
import { prisma } from '../utils/db';


const router = Router();
router.use(authMiddleware);

// ==================== 导出历史记录 ====================

router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { limit = '20' } = req.query;

    const records = await prisma.apiUsageLog.findMany({
      where: {
        userId,
        endpoint: { startsWith: '/api/export/' },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit), 100),
      select: {
        id: true,
        endpoint: true,
        createdAt: true,
        status: true,
      },
    });

    // 从endpoint提取类型和格式
    const list = records.map(r => {
      const pathParts = r.endpoint.replace('/api/export/', '').split('?');
      const type = pathParts[0] || 'unknown';
      const params = new URLSearchParams(pathParts[1] || '');
      return {
        id: r.id,
        type,
        format: (params.get('format') || 'csv').toUpperCase(),
        date: r.createdAt?.toISOString(),
        size: '-',
        records: 0,
        fileSize: '-',
        recordCount: 0,
        createdAt: r.createdAt?.toISOString(),
        status: r.status,
      };
    });

    res.json({ success: true, data: { list, total: list.length } });
  } catch (error: any) {
    console.error('[导出历史]', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== 导出统计 ====================

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // 本周起始
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [totalCount, weeklyCount] = await Promise.all([
      prisma.apiUsageLog.count({
        where: {
          userId,
          endpoint: { startsWith: '/api/export/' },
          status: 'success',
        },
      }),
      prisma.apiUsageLog.count({
        where: {
          userId,
          endpoint: { startsWith: '/api/export/' },
          status: 'success',
          createdAt: { gte: weekStart },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalCount,
        totalRecords: 0,
        totalSize: '-',
        weeklyCount,
      },
    });
  } catch (error: any) {
    console.error('[导出统计]', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== 客户数据导出 ====================

router.get('/customers', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { format = 'csv', level, status } = req.query;

    const where: any = { userId };
    if (level) where.level = level;
    if (status) where.status = status;

    const customers = await prisma.crmCustomer.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    await exportCustomers(
      customers.map(c => ({
        ...c,
        createdAt: c.createdAt?.toISOString(),
        updatedAt: c.updatedAt?.toISOString()
      })),
      { format: format as any, filename: generateFilename('客户数据', format as any) },
      res
    );
  } catch (error: any) {
    console.error('[导出客户]', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== 获客数据导出 ====================

router.get('/acquisition', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { format = 'csv', source, intentLevel, status } = req.query;

    const where: any = { userId };
    if (source) where.source = source;
    if (intentLevel) where.intentLevel = intentLevel;
    if (status) where.status = status;

    const data = await prisma.acquisitionData.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    await exportAcquisitionData(
      data.map(d => ({
        ...d,
        createdAt: d.createdAt?.toISOString()
      })),
      { format: format as any, filename: generateFilename('获客数据', format as any) },
      res
    );
  } catch (error: any) {
    console.error('[导出获客数据]', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== 发布记录导出 ====================

router.get('/publish', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { format = 'csv', platform, status } = req.query;

    const where: any = { userId };
    if (platform) where.platform = platform;
    if (status) where.status = status;

    const records = await prisma.publishRecord.findMany({
      where,
      orderBy: { publishedAt: 'desc' }
    });

    await exportPublishRecords(
      records.map(r => ({
        ...r,
        publishedAt: r.publishedAt?.toISOString(),
        createdAt: r.createdAt?.toISOString()
      })),
      { format: format as any, filename: generateFilename('发布记录', format as any) },
      res
    );
  } catch (error: any) {
    console.error('[导出发布记录]', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== 统计数据导出 ====================

router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { format = 'csv', period = '30d' } = req.query;

    // 计算日期范围
    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else startDate.setFullYear(startDate.getFullYear() - 1);

    // 聚合统计数据
    const [
      customers,
      acquisitionData,
      publishRecords
    ] = await Promise.all([
      prisma.crmCustomer.count({ where: { userId } }),
      prisma.acquisitionData.findMany({ where: { userId } }),
      prisma.publishRecord.findMany({
        where: { userId, publishedAt: { gte: startDate } }
      })
    ]);

    // 计算统计数据
    const stats = {
      summary: {
        totalCustomers: customers,
        totalAcquisition: acquisitionData.length,
        totalPublish: publishRecords.length
      },
      acquisition: {
        bySource: acquisitionData.reduce((acc, d) => {
          acc[d.source] = (acc[d.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byIntent: acquisitionData.reduce((acc, d) => {
          acc[d.intentLevel || '未知'] = (acc[d.intentLevel || '未知'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      publish: {
        byPlatform: publishRecords.reduce((acc, r) => {
          acc[r.platform] = (acc[r.platform] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        totalViews: publishRecords.reduce((sum, r) => sum + (r.views || 0), 0),
        totalLikes: publishRecords.reduce((sum, r) => sum + (r.likes || 0), 0),
        totalComments: publishRecords.reduce((sum, r) => sum + (r.comments || 0), 0)
      },
      period: {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        days: Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      }
    };

    await exportStatistics(
      stats,
      { format: format as any, filename: generateFilename('统计数据', format as any) },
      res
    );
  } catch (error: any) {
    console.error('[导出统计]', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
