import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import {
  getDashboardOverview,
  getDashboardTrend,
  getDashboardDistribution,
  getDashboardFunnel,
  getHotTopics,
} from '../services/dashboard-service';
import { getCustomerDashboardSummary } from '../services/customer-dashboard';
import { getBusinessLinesSummary, getAgentBusinessLinesSummary } from '../services/dashboard-business-lines';
import { chatCompletion } from '../services/ai-client';
import { prisma } from '../utils/db';

const router = Router();

// ============================================
// 辅助：统一错误处理
// ============================================
function handleError(res: Response, error: unknown, context: string): void {
  const errMsg = error instanceof Error ? error.message : String(error);
  console.error(`[Dashboard] ${context}:`, errMsg);
  res.status(500).json({ success: false, message: errMsg });
}

// 获取完整统计数据（兼容旧接口）
router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const overview = await getDashboardOverview(req.userId!, 30);
    res.json({ success: true, data: overview });
  } catch (error: unknown) {
    handleError(res, error, '获取统计数据');
  }
});

// 获取仪表盘概览（新版）
router.get('/overview', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const overview = await getDashboardOverview(req.userId!, days);
    res.json({ success: true, data: overview });
  } catch (error: unknown) {
    handleError(res, error, '获取概览统计');
  }
});

// 获取趋势数据（新版）
router.get('/trend', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const trend = await getDashboardTrend(req.userId!, days);
    res.json({ success: true, data: trend });
  } catch (error: unknown) {
    handleError(res, error, '获取趋势数据');
  }
});

// 获取分布数据（新版）
router.get('/distribution', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const distribution = await getDashboardDistribution(req.userId!);
    res.json({ success: true, data: distribution });
  } catch (error: unknown) {
    handleError(res, error, '获取分布数据');
  }
});

// 获取转化漏斗（新版）
router.get('/funnel', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const funnel = await getDashboardFunnel(req.userId!);
    res.json({ success: true, data: funnel });
  } catch (error: unknown) {
    handleError(res, error, '获取漏斗数据');
  }
});

// 获取热点话题（新版，AI 增强）
router.get('/hot-topics', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const platform = (req.query.platform as string) || 'all';
    const limit = Number(req.query.limit) || 20;

    const aiGenerate = async (prompt: string) => {
      return await chatCompletion(req.userId!, {
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 4096,
      });
    };

    const topics = await getHotTopics(platform, limit, aiGenerate);
    res.json({ success: true, data: topics });
  } catch (error: unknown) {
    console.error('[Dashboard] 获取热点话题失败:', error);
    const fallbackPlatform = (req.query.platform as string) || 'douyin';
    const topics = await getHotTopics(fallbackPlatform, Number(req.query.limit) || 20);
    res.json({ success: true, data: topics });
  }
});

// 获取获客统计
router.get('/acquisition', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const [tasks, leads, statusStats] = await Promise.all([
      prisma.acquisitionTask.findMany({
        where: { userId }, orderBy: { createdAt: 'desc' }, take: 10,
        include: { _count: { select: { AcquisitionLead: true } } },
      }),
      prisma.acquisitionLead.count({ where: { userId } }),
      prisma.acquisitionLead.groupBy({ by: ['status'], where: { userId }, _count: true }),
    ]);
    const qualityStats = await prisma.acquisitionLead.groupBy({
      by: ['aiQuality'], where: { userId, aiQuality: { not: null } }, _count: true,
    });
    const tasksWithCount = tasks.map(t => ({ ...t, actualCount: t._count.AcquisitionLead, _count: undefined }));
    res.json({
      success: true,
      data: {
        tasks: tasksWithCount,
        totalLeads: leads,
        statusBreakdown: statusStats.map(s => ({ status: s.status, count: s._count })),
        qualityBreakdown: qualityStats.map(s => ({ quality: s.aiQuality, count: s._count })),
      },
    });
  } catch (error: unknown) {
    handleError(res, error, '获取获客统计');
  }
});

// 获取素材统计
router.get('/materials', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const [totalMaterials, materialsByType] = await Promise.all([
      prisma.material.count({ where: { userId } }),
      prisma.material.groupBy({ by: ['type'], where: { userId }, _count: true }),
    ]);
    res.json({
      success: true,
      data: {
        total: totalMaterials,
        byType: materialsByType.map(m => ({ type: m.type, count: m._count })),
      },
    });
  } catch (error: unknown) {
    handleError(res, error, '获取素材统计');
  }
});

// 客户工作台综合摘要（一次请求聚合所有数据，避免前端多次调用）
router.get('/customer-summary', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const summary = await getCustomerDashboardSummary(req.userId!);
    res.json({ success: true, data: summary });
  } catch (error: unknown) {
    handleError(res, error, '获取客户工作台摘要');
  }
});

// ==================== 四条业务线聚合 KPI ====================

// 客户端业务线概览
router.get('/business-lines', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const data = await getBusinessLinesSummary(req.userId!);
    res.json({ success: true, data });
  } catch (error: unknown) {
    handleError(res, error, '获取业务线概览');
  }
});

// Agent端业务线概览（名下所有客户聚合）
router.get('/agent/business-lines', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const data = await getAgentBusinessLinesSummary(req.userId!);
    res.json({ success: true, data });
  } catch (error: unknown) {
    handleError(res, error, '获取代理业务线概览');
  }
});

export default router;
