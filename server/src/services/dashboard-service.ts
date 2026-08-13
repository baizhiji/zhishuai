/**
 * Dashboard Service - 仪表盘数据聚合服务
 *
 * 借鉴 CodeBuddy 技能：
 * - interactive-dashboard-builder: Chart.js 自包含仪表盘
 * - data-visualization: Plotly 可视化
 * - data-analysis-workflows: 数据分析工作流
 * - data-exploration: 数据画像与质量评估
 *
 * 架构：Service Layer（业务逻辑集中管理）
 * - 从多个数据源聚合统计数据
 * - 支持时间范围筛选
 * - 提供缓存机制（5分钟TTL）
 */

import { prisma } from '../utils/db';
import { appendAIGCLabelShort } from './aigc-label.service';

// ==================== 类型定义 ====================

export interface DashboardOverview {
  leads: { total: number; today: number; week: number; month: number; trend: number };
  customers: { total: number; active: number; newThisMonth: number; churnRate: number };
  recruitment: { activeJobs: number; totalCandidates: number; interviewsScheduled: number; hireRate: number };
  content: { total: number; publishedThisWeek: number; avgEngagement: number };
  acquisition: { activeTasks: number; totalLeads: number; conversionRate: number };
  revenue: { estimated: number; trend: number };
}

export interface DashboardTrend {
  date: string;
  leads: number;
  customers: number;
  candidates: number;
  content: number;
  conversions: number;
}

export interface DashboardDistribution {
  leadsBySource: Record<string, number>;
  leadsByQuality: Record<string, number>;
  customersByStatus: Record<string, number>;
  candidatesByStage: Record<string, number>;
  contentByPlatform: Record<string, number>;
}

export interface DashboardFunnel {
  stage: string;
  count: number;
  rate: number;
}

export interface HotTopicItem {
  id: string;
  rank: number;
  title: string;
  heat: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
  platform: string;
  relatedTopics: string[];
  contentIdeas: string[];
  updatedAt: string;
  aiGenerated: boolean;
}

// ==================== 缓存机制 ====================

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ==================== 日期工具 ====================

function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function getToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ==================== 核心方法 ====================

/**
 * 获取仪表盘概览数据
 * 聚合 CRM、获客、招聘、内容四大模块的 KPI
 */
export async function getDashboardOverview(userId: string, days: number = 30): Promise<DashboardOverview> {
  const cacheKey = `overview:${userId}:${days}`;
  const cached = getCache<DashboardOverview>(cacheKey);
  if (cached) return cached;

  const today = getToday();
  const weekAgo = getDateRange(7).start;
  const monthAgo = getDateRange(days).start;

  // 并行查询所有模块数据
  const [
    // 获客数据
    totalLeads, todayLeads, weekLeads, monthLeads,
    activeTasks, convertedLeads,

    // 招聘数据
    activeJobs, totalCandidates, interviewsScheduled,
    hiredCandidates,
  ] = await Promise.all([
    // 获客
    prisma.acquisitionLead.count({ where: { userId } }),
    prisma.acquisitionLead.count({ where: { userId, createdAt: { gte: today } } }),
    prisma.acquisitionLead.count({ where: { userId, createdAt: { gte: weekAgo } } }),
    prisma.acquisitionLead.count({ where: { userId, createdAt: { gte: monthAgo } } }),
    prisma.acquisitionTask.count({ where: { userId, status: 'running' } }),
    prisma.acquisitionLead.count({ where: { userId, status: 'converted' } }),

    // 招聘
    prisma.recruitmentPost.count({ where: { userId, status: 'active' } }),
    prisma.recruitmentResume.count({ where: { userId } }),
    prisma.recruitmentProcess.count({ where: { userId, stage: 'interview_scheduled' } }),
    prisma.recruitmentResume.count({ where: { userId, status: 'hired' } }),
  ]);

  // 计算趋势
  const lastMonthStart = new Date(monthAgo.getTime() - days * 24 * 60 * 60 * 1000);
  const lastMonthLeads = await prisma.acquisitionLead.count({
    where: { userId, createdAt: { gte: lastMonthStart, lt: monthAgo } },
  });
  const leadsTrend = lastMonthLeads > 0
    ? Math.round(((monthLeads - lastMonthLeads) / lastMonthLeads) * 100)
    : 0;

  const result: DashboardOverview = {
    leads: {
      total: totalLeads,
      today: todayLeads,
      week: weekLeads,
      month: monthLeads,
      trend: leadsTrend,
    },
    customers: {
      total: 0,
      active: 0,
      newThisMonth: 0,
      churnRate: 0,
    },
    recruitment: {
      activeJobs,
      totalCandidates,
      interviewsScheduled,
      hireRate: totalCandidates > 0
        ? Math.round((hiredCandidates / totalCandidates) * 100)
        : 0,
    },
    content: {
      total: 0,
      publishedThisWeek: 0,
      avgEngagement: 0,
    },
    acquisition: {
      activeTasks,
      totalLeads,
      conversionRate: totalLeads > 0
        ? Math.round((convertedLeads / totalLeads) * 100)
        : 0,
    },
    revenue: {
      estimated: convertedLeads * 5000,
      trend: leadsTrend,
    },
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * 获取趋势数据（按天聚合）
 */
export async function getDashboardTrend(userId: string, days: number = 30): Promise<DashboardTrend[]> {
  const cacheKey = `trend:${userId}:${days}`;
  const cached = getCache<DashboardTrend[]>(cacheKey);
  if (cached) return cached;

  const { start, end } = getDateRange(days);

  // 初始化日期映射
  const dateMap: Record<string, DashboardTrend> = {};
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split('T')[0];
    dateMap[key] = { date: key, leads: 0, customers: 0, candidates: 0, content: 0, conversions: 0 };
  }

  // 并行查询各维度每日数据
  const [dailyLeads, dailyCandidates] = await Promise.all([
    prisma.acquisitionLead.findMany({
      where: { userId, createdAt: { gte: start, lte: end } },
      select: { createdAt: true, status: true },
    }),
    prisma.recruitmentResume.findMany({
      where: { userId, createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    }),
  ]);

  // 聚合数据
  dailyLeads.forEach(lead => {
    const key = lead.createdAt.toISOString().split('T')[0];
    if (dateMap[key]) {
      dateMap[key].leads++;
      if (lead.status === 'converted') dateMap[key].conversions++;
    }
  });

  dailyCandidates.forEach(c => {
    const key = c.createdAt.toISOString().split('T')[0];
    if (dateMap[key]) dateMap[key].candidates++;
  });

  const result = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  setCache(cacheKey, result);
  return result;
}

/**
 * 获取分布数据
 */
export async function getDashboardDistribution(userId: string): Promise<DashboardDistribution> {
  const cacheKey = `distribution:${userId}`;
  const cached = getCache<DashboardDistribution>(cacheKey);
  if (cached) return cached;

  const [
    leadsBySource, leadsByQuality,
    candidatesByStage,
  ] = await Promise.all([
    prisma.acquisitionLead.groupBy({
      by: ['source'], where: { userId }, _count: true,
    }),
    prisma.acquisitionLead.groupBy({
      by: ['aiQuality'], where: { userId, aiQuality: { not: null } }, _count: true,
    }),
    prisma.recruitmentResume.groupBy({
      by: ['status'], where: { userId }, _count: true,
    }),
  ]);

  const result: DashboardDistribution = {
    leadsBySource: {},
    leadsByQuality: {},
    customersByStatus: {},
    candidatesByStage: {},
    contentByPlatform: {},
  };

  leadsBySource.forEach(s => { result.leadsBySource[s.source || 'unknown'] = s._count; });
  leadsByQuality.forEach(s => { if (s.aiQuality) result.leadsByQuality[s.aiQuality] = s._count; });
  candidatesByStage.forEach(s => { result.candidatesByStage[s.status] = s._count; });

  setCache(cacheKey, result);
  return result;
}

/**
 * 获取转化漏斗数据
 */
export async function getDashboardFunnel(userId: string): Promise<DashboardFunnel[]> {
  const totalLeads = await prisma.acquisitionLead.count({ where: { userId } });
  const contacted = await prisma.acquisitionLead.count({
    where: { userId, status: { in: ['contacted', 'qualified', 'converted'] } },
  });
  const qualified = await prisma.acquisitionLead.count({
    where: { userId, status: { in: ['qualified', 'converted'] } },
  });
  const converted = await prisma.acquisitionLead.count({
    where: { userId, status: 'converted' },
  });

  return [
    { stage: '线索总数', count: totalLeads, rate: 100 },
    { stage: '已触达', count: contacted, rate: totalLeads > 0 ? Math.round((contacted / totalLeads) * 100) : 0 },
    { stage: '已意向', count: qualified, rate: totalLeads > 0 ? Math.round((qualified / totalLeads) * 100) : 0 },
    { stage: '已转化', count: converted, rate: totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0 },
  ];
}

/**
 * 获取热点话题（AI 增强版）
 * 借鉴 10万+爆款选题制造机 技能的设计思路
 */
export async function getHotTopics(
  platform: string = 'douyin',
  limit: number = 20,
  aiClient?: (prompt: string) => Promise<string>,
): Promise<HotTopicItem[]> {
  const cacheKey = `hot-topics:${platform}:${limit}`;
  const cached = getCache<HotTopicItem[]>(cacheKey);
  // 热点话题缓存时间更短（30分钟）
  if (cached) return cached;

  // 尝试 AI 生成热点话题
  if (aiClient) {
    try {
      const prompt = buildHotTopicsPrompt(platform, limit);
      const aiResponse = await aiClient(prompt);

      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>;
        const topics = parsed.map((item, i) => ({
          id: `ai-hot-${platform}-${i + 1}`,
          rank: i + 1,
          title: appendAIGCLabelShort(item.title as string),
          heat: item.heat as number,
          trend: item.trend as 'up' | 'down' | 'stable',
          category: item.category as string,
          platform,
          relatedTopics: (item.relatedTopics as string[]) || [],
          contentIdeas: (item.contentIdeas as string[]) || [],
          updatedAt: new Date().toISOString(),
          aiGenerated: true,
        }));

        // 缓存 30 分钟
        cache.set(cacheKey, { data: topics, timestamp: Date.now() });
        return topics;
      }
    } catch (err) {
      console.warn('[Dashboard] AI 热点话题生成失败:', (err as Error).message);
    }
  }

  // 商用原则：未配置 AI 或生成失败时返回空数组，不返回编造的假热点
  return [];
}

function buildHotTopicsPrompt(platform: string, limit: number): string {
  const platformNames: Record<string, string> = {
    douyin: '抖音', weibo: '微博', toutiao: '头条',
    baidu: '百度', zhihu: '知乎', kuaishou: '快手',
    xiaohongshu: '小红书', bilibili: 'B站',
  };

  return `你是一位专业的社交媒体热点分析师。请根据当前时间（${new Date().toISOString().split('T')[0]}），为${platformNames[platform] || platform}平台生成${limit}条最可能的热点话题。

请以严格的JSON数组格式返回（只返回JSON，不要其他文字）：
[
  {
    "title": "话题标题",
    "heat": 500000-10000000之间的热度值（整数）,
    "trend": "up/stable/down 之一",
    "category": "分类（如：科技/娱乐/教育/财经/社会/生活方式/美食/体育）",
    "relatedTopics": ["相关话题1", "相关话题2"],
    "contentIdeas": ["内容创作建议1", "内容创作建议2", "内容创作建议3"]
  }
]

要求：
- 话题要覆盖多个领域（科技、娱乐、社会、财经、生活方式等）
- 热度值要根据话题重要程度合理分配
- 内容创作建议要有实操性，能直接用于内容生产
- 话题要有时效性，反映出近期真实热点
- 不要编造过于离谱或不存在的话题`;
}

/**
 * 获取招聘统计详情
 */
export async function getRecruitmentStats(userId: string) {
  const [
    totalJobs, activeJobs,
    totalCandidates, pendingReview,
    scheduled, interviewed,
    offered, hired, rejected,
  ] = await Promise.all([
    prisma.recruitmentPost.count({ where: { userId } }),
    prisma.recruitmentPost.count({ where: { userId, status: 'active' } }),
    prisma.recruitmentResume.count({ where: { userId } }),
    prisma.recruitmentResume.count({ where: { userId, status: 'new' } }),
    prisma.recruitmentProcess.count({ where: { userId, stage: 'interview_scheduled' } }),
    prisma.recruitmentProcess.count({ where: { userId, stage: 'interview_completed' } }),
    prisma.recruitmentProcess.count({ where: { userId, stage: 'offered' } }),
    prisma.recruitmentResume.count({ where: { userId, status: 'hired' } }),
    prisma.recruitmentResume.count({ where: { userId, status: 'rejected' } }),
  ]);

  return {
    jobs: { total: totalJobs, active: activeJobs },
    candidates: { total: totalCandidates, pendingReview },
    pipeline: { scheduled, interviewed, offered, hired, rejected },
    metrics: {
      reviewRate: totalCandidates > 0 ? Math.round((totalCandidates - pendingReview) / totalCandidates * 100) : 0,
      interviewRate: totalCandidates > 0 ? Math.round(interviewed / totalCandidates * 100) : 0,
      offerRate: interviewed > 0 ? Math.round(offered / interviewed * 100) : 0,
      hireRate: totalCandidates > 0 ? Math.round(hired / totalCandidates * 100) : 0,
    },
  };
}

/**
 * 获取 CRM 统计详情
 */
export async function getCRMStats(userId: string) {
  // CRM model removed, return empty report
  return {
    total: 0,
    active: 0,
    newThisMonth: 0,
    needFollowUp: 0,
    churnRisk: 0,
    byStatus: {},
    byLevel: {},
  };
}

// 清除缓存（供外部调用）
export function clearDashboardCache(): void {
  cache.clear();
}
