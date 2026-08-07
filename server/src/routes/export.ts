/**
 * 数据导出 API 路由
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { exportAcquisitionData, exportStatistics, generateFilename } from '../services/export.service';
import { prisma } from '../utils/db';

const router = Router();
router.use(authMiddleware);

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
      acquisitionData,
    ] = await Promise.all([
      prisma.acquisitionData.findMany({ where: { userId } }),
    ]);

    // 计算统计数据
    const stats = {
      summary: {
        totalAcquisition: acquisitionData.length,
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
