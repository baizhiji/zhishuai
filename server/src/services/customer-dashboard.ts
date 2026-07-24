/**
 * Customer Dashboard Summary Service
 *
 * 专门为客户 dashboard 提供一站式摘要数据，覆盖：
 * - 内容创作（素材/已发布）
 * - AI 创作工厂
 * - 智能获客
 * - 推荐分享
 * - CRM 客户
 * - 招聘
 * - 矩阵账号
 * - 工单
 * - 7 天趋势
 * - 多维分布
 * - 转化漏斗
 * - 最近活动
 *
 * 设计目标：所有数据使用一次并行查询聚合，避免前端多次请求；
 * 即使客户某模块数据为 0 也返回完整结构，便于前端无空态渲染。
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== 类型定义 ====================

export interface CustomerDashboardSummary {
  // 顶部 KPI 卡片
  kpi: {
    materials: { total: number; weekNew: number; trend: number };
    published: { total: number; weekNew: number; views: number; likes: number };
    leads: { total: number; weekNew: number; converted: number; trend: number };
    shares: { total: number; scans: number; conversions: number };
    candidates: { total: number; weekNew: number; hired: number };
    crmCustomers: { total: number; active: number; newMonth: number };
    matrixAccounts: number;
    pendingTickets: number;
    aiUsage: { total: number; weekTokens: number };
  };

  // 7天趋势（每日 4 条核心数据）
  trend: Array<{
    date: string;
    materials: number;
    published: number;
    leads: number;
    shares: number;
  }>;

  // 多维分布
  distribution: {
    materialsByType: Record<string, number>;
    contentByPlatform: Record<string, { count: number; views: number; likes: number; comments: number; shares: number }>;
    leadsBySource: Record<string, number>;
    leadsByStatus: Record<string, number>;
    leadsByQuality: Record<string, number>;
    crmByStatus: Record<string, number>;
    candidatesByStage: Record<string, number>;
  };

  // 业务转化漏斗（素材 → 发布 → 获客 → 转化）
  funnel: Array<{ stage: string; count: number; rate: number; color: string }>;

  // 详细数据表格
  tables: {
    publishedContent: Array<{
      id: string;
      title: string;
      platform: string;
      accountName?: string | null;
      views: number;
      likes: number;
      comments: number;
      shares: number;
      publishedAt?: Date | null;
      createdAt: Date;
    }>;
    recentLeads: Array<{
      id: string;
      name?: string | null;
      phone: string;
      source?: string | null;
      status: string;
      aiQuality?: string | null;
      aiScore?: number | null;
      createdAt: Date;
    }>;
    recentMaterials: Array<{
      id: string;
      type: string;
      title?: string | null;
      status: string;
      usedCount: number;
      createdAt: Date;
    }>;
    topShares: Array<{
      id: string;
      title: string;
      scanCount: number;
      publishCount: number;
      activeCount: number;
      conversionCount: number;
      createdAt: Date;
    }>;
  };

  // 今日活动
  recentActivities: Array<{
    time: string;
    type: 'material' | 'publish' | 'lead' | 'share' | 'crm' | 'candidate';
    content: string;
    status?: string;
  }>;

  generatedAt: string;
}

// ==================== 工具函数 ====================

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function safeDiv(a: number, b: number): number {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}

// ==================== 主函数 ====================

export async function getCustomerDashboardSummary(
  userId: string,
): Promise<CustomerDashboardSummary> {
  const now = new Date();
  const today = startOfDay(now);
  const weekStart = daysAgo(6); // 7 天数据（含今天）
  const monthStart = daysAgo(29);
  const lastMonthStart = daysAgo(59);

  // ─── 并行查询：核心 KPI（每条独立 promise，避免一处错误拖垮全部） ───
  const safeQuery = async <T,>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      console.warn(`[CustomerDashboard] ${label} query failed:`, (err as Error).message);
      return fallback;
    }
  };

  const [
    // 素材
    totalMaterials, weekMaterials,
    // 已发布内容
    totalPublished, weekPublished, contentAgg,
    // 获客线索
    totalLeads, weekLeads, lastMonthLeads, convertedLeads,
    // 推荐分享
    totalShareCodes, shareScanAgg, shareConvertedAgg, topShares,
    // CRM
    totalCrm, activeCrm, newCrmMonth,
    // 招聘
    totalResumes, weekResumes, hiredResumes,
    // 矩阵账号
    matrixAccountsCount,
    // 工单
    pendingTickets,
    // AI 使用（与 7 天 token）
    aiUsageTotal, weekAiTokens,
  ] = await Promise.all([
    safeQuery('totalMaterials', () => prisma.material.count({ where: { userId } }), 0),
    safeQuery('weekMaterials', () => prisma.material.count({ where: { userId, createdAt: { gte: weekStart } } }), 0),

    safeQuery('totalPublished', () => prisma.publishedContent.count({ where: { userId } }), 0),
    safeQuery('weekPublished', () => prisma.publishedContent.count({ where: { userId, publishedAt: { gte: weekStart } } }), 0),
    safeQuery('contentAgg', () => prisma.publishedContent.aggregate({
      where: { userId },
      _sum: { views: true, likes: true, comments: true, shares: true },
    }), { _sum: { views: 0, likes: 0, comments: 0, shares: 0 } }),

    safeQuery('totalLeads', () => prisma.acquisitionLead.count({ where: { userId } }), 0),
    safeQuery('weekLeads', () => prisma.acquisitionLead.count({ where: { userId, createdAt: { gte: weekStart } } }), 0),
    safeQuery('lastMonthLeads', () => prisma.acquisitionLead.count({
      where: { userId, createdAt: { gte: lastMonthStart, lt: monthStart } },
    }), 0),
    safeQuery('convertedLeads', () => prisma.acquisitionLead.count({ where: { userId, status: 'converted' } }), 0),

    safeQuery('totalShareCodes', () => prisma.shareQrCode.count({ where: { userId } }), 0),
    safeQuery('shareScanAgg', () => prisma.shareQrCode.aggregate({
      where: { userId }, _sum: { scanCount: true },
    }), { _sum: { scanCount: 0 } }),
    safeQuery('shareConvertedAgg', () => prisma.shareRecord.count({
      where: { userId, status: 'converted' },
    }), 0),
    safeQuery('topShares', () => prisma.shareQrCode.findMany({
      where: { userId },
      orderBy: { scanCount: 'desc' },
      take: 5,
      select: { id: true, title: true, scanCount: true, publishCount: true, activeCount: true, createdAt: true },
    }), []),

    safeQuery('totalCrm', () => prisma.crmCustomer.count({ where: { userId } }), 0),
    safeQuery('activeCrm', () => prisma.crmCustomer.count({ where: { userId, status: 'active' } }), 0),
    safeQuery('newCrmMonth', () => prisma.crmCustomer.count({ where: { userId, createdAt: { gte: monthStart } } }), 0),

    safeQuery('totalResumes', () => prisma.recruitmentResume.count({ where: { userId } }), 0),
    safeQuery('weekResumes', () => prisma.recruitmentResume.count({ where: { userId, createdAt: { gte: weekStart } } }), 0),
    safeQuery('hiredResumes', () => prisma.recruitmentResume.count({ where: { userId, status: 'hired' } }), 0),

    safeQuery('matrixAccounts', () => prisma.matrixAccount.count({ where: { userId, status: 'active' } }), 0),

    safeQuery('pendingTickets', () => prisma.ticket.count({ where: { userId, status: { in: ['pending', 'processing'] } } }), 0),

    safeQuery('aiUsageTotal', () => prisma.aiUsageStats.aggregate({
      where: { userId },
      _sum: { successCount: true, failCount: true },
    }), { _sum: { successCount: 0, failCount: 0 } }),
    safeQuery('weekAiTokens', () => prisma.aiUsageStats.aggregate({
      where: { userId, periodStart: { gte: weekStart } },
      _sum: { tokens: true },
    }), { _sum: { tokens: 0 } }),
  ]);

  // ─── 计算趋势：上一周期对比 ───
  const leadsTrend = lastMonthLeads > 0
    ? Math.round(((weekLeads - lastMonthLeads / 4) / (lastMonthLeads / 4)) * 100)
    : (weekLeads > 0 ? 100 : 0);

  // ─── 7天趋势明细 ───
  const trend: CustomerDashboardSummary['trend'] = [];
  for (let i = 6; i >= 0; i--) {
    const d = daysAgo(i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    trend.push({
      date: isoDate(d),
      materials: 0,
      published: 0,
      leads: 0,
      shares: 0,
    });
    // 实际值在下面用 queryMany 一次性查后填入
  }

  // 一次性查 7 天的素材/发布/获客/分享
  const [dayMaterials, dayPublished, dayLeads, dayShares] = await Promise.all([
    safeQuery('dayMaterials', () => prisma.material.findMany({
      where: { userId, createdAt: { gte: weekStart, lte: now } },
      select: { createdAt: true },
    }), []),
    safeQuery('dayPublished', () => prisma.publishedContent.findMany({
      where: { userId, publishedAt: { gte: weekStart, lte: now } },
      select: { publishedAt: true },
    }), []),
    safeQuery('dayLeads', () => prisma.acquisitionLead.findMany({
      where: { userId, createdAt: { gte: weekStart, lte: now } },
      select: { createdAt: true },
    }), []),
    safeQuery('dayShares', () => prisma.shareRecord.findMany({
      where: { userId, scannedAt: { gte: weekStart, lte: now } },
      select: { scannedAt: true },
    }), []),
  ]);

  const trendMap = new Map(trend.map(t => [t.date, t]));
  for (const m of dayMaterials as Array<{ createdAt: Date }>) {
    const k = isoDate(m.createdAt);
    const item = trendMap.get(k);
    if (item) item.materials += 1;
  }
  for (const p of dayPublished as Array<{ publishedAt: Date | null }>) {
    if (!p.publishedAt) continue;
    const k = isoDate(p.publishedAt);
    const item = trendMap.get(k);
    if (item) item.published += 1;
  }
  for (const l of dayLeads as Array<{ createdAt: Date }>) {
    const k = isoDate(l.createdAt);
    const item = trendMap.get(k);
    if (item) item.leads += 1;
  }
  for (const s of dayShares as Array<{ scannedAt: Date }>) {
    const k = isoDate(s.scannedAt);
    const item = trendMap.get(k);
    if (item) item.shares += 1;
  }

  // ─── 分布数据 ───
  const [
    materialsByTypeRaw,
    contentByPlatformRaw,
    leadsBySourceRaw,
    leadsByStatusRaw,
    leadsByQualityRaw,
    crmByStatusRaw,
    candidatesByStageRaw,
  ] = await Promise.all([
    safeQuery('materialsByType', () => prisma.material.groupBy({
      by: ['type'], where: { userId }, _count: true,
    }), []),
    safeQuery('contentByPlatform', () => prisma.publishedContent.groupBy({
      by: ['platform'], where: { userId },
      _count: true,
      _sum: { views: true, likes: true, comments: true, shares: true },
    }), []),
    safeQuery('leadsBySource', () => prisma.acquisitionLead.groupBy({
      by: ['source'], where: { userId }, _count: true,
    }), []),
    safeQuery('leadsByStatus', () => prisma.acquisitionLead.groupBy({
      by: ['status'], where: { userId }, _count: true,
    }), []),
    safeQuery('leadsByQuality', () => prisma.acquisitionLead.groupBy({
      by: ['aiQuality'], where: { userId, aiQuality: { not: null } }, _count: true,
    }), []),
    safeQuery('crmByStatus', () => prisma.crmCustomer.groupBy({
      by: ['status'], where: { userId }, _count: true,
    }), []),
    safeQuery('candidatesByStage', () => prisma.recruitmentResume.groupBy({
      by: ['status'], where: { userId }, _count: true,
    }), []),
  ]);

  const materialsByType: Record<string, number> = {};
  for (const r of materialsByTypeRaw as Array<{ type: string; _count: number }>) {
    materialsByType[r.type] = r._count;
  }

  const contentByPlatform: Record<string, { count: number; views: number; likes: number; comments: number; shares: number }> = {};
  for (const r of contentByPlatformRaw as Array<{ platform: string; _count: number; _sum: { views: number | null; likes: number | null; comments: number | null; shares: number | null } }>) {
    contentByPlatform[r.platform] = {
      count: r._count,
      views: r._sum.views || 0,
      likes: r._sum.likes || 0,
      comments: r._sum.comments || 0,
      shares: r._sum.shares || 0,
    };
  }

  const leadsBySource: Record<string, number> = {};
  for (const r of leadsBySourceRaw as Array<{ source: string | null; _count: number }>) {
    leadsBySource[r.source || 'unknown'] = r._count;
  }

  const leadsByStatus: Record<string, number> = {};
  for (const r of leadsByStatusRaw as Array<{ status: string; _count: number }>) {
    leadsByStatus[r.status] = r._count;
  }

  const leadsByQuality: Record<string, number> = {};
  for (const r of leadsByQualityRaw as Array<{ aiQuality: string | null; _count: number }>) {
    if (r.aiQuality) leadsByQuality[r.aiQuality] = r._count;
  }

  const crmByStatus: Record<string, number> = {};
  for (const r of crmByStatusRaw as Array<{ status: string; _count: number }>) {
    crmByStatus[r.status] = r._count;
  }

  const candidatesByStage: Record<string, number> = {};
  for (const r of candidatesByStageRaw as Array<{ status: string; _count: number }>) {
    candidatesByStage[r.status] = r._count;
  }

  // ─── 转化漏斗 ───
  const funnelBase = totalMaterials || 0;
  const funnel = [
    { stage: '创作素材', count: totalMaterials, rate: 100, color: '#1890ff' },
    { stage: '已发布', count: totalPublished, rate: safeDiv(totalPublished, funnelBase), color: '#13c2c2' },
    { stage: '获得线索', count: totalLeads, rate: safeDiv(totalLeads, funnelBase), color: '#722ed1' },
    { stage: '已转化', count: convertedLeads, rate: safeDiv(convertedLeads, funnelBase), color: '#52c41a' },
  ];

  // ─── 详细表格数据 ───
  const [publishedContent, recentLeads, recentMaterials] = await Promise.all([
    safeQuery('publishedContentList', () => prisma.publishedContent.findMany({
      where: { userId },
      orderBy: { publishedAt: 'desc' },
      take: 10,
      select: {
        id: true, title: true, platform: true, accountName: true,
        views: true, likes: true, comments: true, shares: true,
        publishedAt: true, createdAt: true,
      },
    }), []),
    safeQuery('recentLeadsList', () => prisma.acquisitionLead.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, name: true, phone: true, source: true, status: true,
        aiQuality: true, aiScore: true, createdAt: true,
      },
    }), []),
    safeQuery('recentMaterialsList', () => prisma.material.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, type: true, title: true, status: true, usedCount: true, createdAt: true },
    }), []),
  ]);

  // ─── 今日活动（合并 5 类） ───
  const todayMaterials = await safeQuery('todayMaterials', () => prisma.material.findMany({
    where: { userId, createdAt: { gte: today } },
    select: { id: true, type: true, title: true, createdAt: true },
  }), []);
  const todayLeads = await safeQuery('todayLeads', () => prisma.acquisitionLead.findMany({
    where: { userId, createdAt: { gte: today } },
    select: { id: true, name: true, source: true, createdAt: true },
  }), []);
  const todayPublished = await safeQuery('todayPublished', () => prisma.publishedContent.findMany({
    where: { userId, publishedAt: { gte: today } },
    select: { id: true, title: true, platform: true, publishedAt: true },
  }), []);

  const activities: CustomerDashboardSummary['recentActivities'] = [];
  for (const m of todayMaterials as Array<{ id: string; type: string; title: string | null; createdAt: Date }>) {
    activities.push({
      time: isoDate(m.createdAt),
      type: 'material',
      content: `创建了${typeLabel(m.type)}「${m.title || '未命名'}」`,
    });
  }
  for (const l of todayLeads as Array<{ id: string; name: string | null; source: string | null; createdAt: Date }>) {
    activities.push({
      time: isoDate(l.createdAt),
      type: 'lead',
      content: `新增${sourceLabel(l.source)}线索「${l.name || '匿名'}」`,
      status: '已获取',
    });
  }
  for (const p of todayPublished as Array<{ id: string; title: string; platform: string; publishedAt: Date | null }>) {
    if (!p.publishedAt) continue;
    activities.push({
      time: isoDate(p.publishedAt),
      type: 'publish',
      content: `发布到${platformLabel(p.platform)}「${p.title}」`,
      status: '已发布',
    });
  }
  activities.sort((a, b) => (a.time < b.time ? 1 : -1));

  return {
    kpi: {
      materials: {
        total: totalMaterials,
        weekNew: weekMaterials,
        trend: weekMaterials > 0 ? 100 : 0,
      },
      published: {
        total: totalPublished,
        weekNew: weekPublished,
        views: contentAgg._sum.views || 0,
        likes: contentAgg._sum.likes || 0,
      },
      leads: {
        total: totalLeads,
        weekNew: weekLeads,
        converted: convertedLeads,
        trend: leadsTrend,
      },
      shares: {
        total: totalShareCodes,
        scans: shareScanAgg._sum.scanCount || 0,
        conversions: shareConvertedAgg,
      },
      candidates: {
        total: totalResumes,
        weekNew: weekResumes,
        hired: hiredResumes,
      },
      crmCustomers: {
        total: totalCrm,
        active: activeCrm,
        newMonth: newCrmMonth,
      },
      matrixAccounts: matrixAccountsCount,
      pendingTickets,
      aiUsage: {
        total: (aiUsageTotal._sum.successCount || 0) + (aiUsageTotal._sum.failCount || 0),
        weekTokens: weekAiTokens._sum.tokens || 0,
      },
    },
    trend,
    distribution: {
      materialsByType,
      contentByPlatform,
      leadsBySource,
      leadsByStatus,
      leadsByQuality,
      crmByStatus,
      candidatesByStage,
    },
    funnel,
    tables: {
      publishedContent: publishedContent as CustomerDashboardSummary['tables']['publishedContent'],
      recentLeads: recentLeads as CustomerDashboardSummary['tables']['recentLeads'],
      recentMaterials: recentMaterials as CustomerDashboardSummary['tables']['recentMaterials'],
      topShares: (topShares as Array<{
        id: string; title: string; scanCount: number; publishCount: number;
        activeCount: number; createdAt: Date;
      }>).map(s => ({
        ...s,
        conversionCount: shareConvertedAgg, // 用总数简化
      })),
    },
    recentActivities: activities.slice(0, 10),
    generatedAt: now.toISOString(),
  };
}

// ─── 标签辅助 ───
function typeLabel(t: string): string {
  const map: Record<string, string> = {
    title: '标题', topic: '选题', copywriter: '文案',
    image: '图片', video: '视频', audio: '音频',
  };
  return map[t] || t;
}

function sourceLabel(s: string | null | undefined): string {
  if (!s) return '未知来源';
  const map: Record<string, string> = {
    douyin: '抖音', wechat: '微信', xiaohongshu: '小红书',
    sms: '短信', scan_qr: '扫码', organic: '自然流量',
    tianyancha: '天眼查', amap: '高德地图',
    kuaishou: '快手', videoname: '视频号',
  };
  return map[s] || s;
}

function platformLabel(p: string): string {
  const map: Record<string, string> = {
    douyin: '抖音', kuaishou: '快手', xiaohongshu: '小红书',
    weibo: '微博', bilibili: 'B站', zhihu: '知乎',
    wechat: '微信', videoname: '视频号',
  };
  return map[p] || p;
}
