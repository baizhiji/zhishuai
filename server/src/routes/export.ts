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
