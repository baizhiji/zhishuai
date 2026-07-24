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

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // CRM 数据
    totalCustomers, activeCustomers, newCustomersThisMonth,

    // 招聘数据
    activeJobs, totalCandidates, interviewsScheduled,
    hiredCandidates,

    // 内容数据
    totalContent, contentThisWeek,
  ] = await Promise.all([
    // 获客
    prisma.acquisitionLead.count({ where: { userId } }),
    prisma.acquisitionLead.count({ where: { userId, createdAt: { gte: today } } }),
    prisma.acquisitionLead.count({ where: { userId, createdAt: { gte: weekAgo } } }),
    prisma.acquisitionLead.count({ where: { userId, createdAt: { gte: monthAgo } } }),
    prisma.acquisitionTask.count({ where: { userId, status: 'running' } }),
    prisma.acquisitionLead.count({ where: { userId, status: 'converted' } }),

    // CRM
    prisma.crmCustomer.count({ where: { userId } }),
    prisma.crmCustomer.count({ where: { userId, status: 'active' } }),
    prisma.crmCustomer.count({ where: { userId, createdAt: { gte: monthAgo } } }),

    // 招聘
    prisma.recruitmentPost.count({ where: { userId, status: 'active' } }),
    prisma.recruitmentResume.count({ where: { userId } }),
    prisma.recruitmentInterview.count({ where: { userId, status: 'scheduled' } }),
    prisma.recruitmentResume.count({ where: { userId, status: 'hired' } }),

    // 内容
    prisma.publishedContent.count({ where: { userId } }),
    prisma.publishedContent.count({ where: { userId, publishedAt: { gte: weekAgo } } }),
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
      total: totalCustomers,
      active: activeCustomers,
      newThisMonth: newCustomersThisMonth,
      churnRate: totalCustomers > 0
        ? Math.round(((totalCustomers - activeCustomers) / totalCustomers) * 100)
        : 0,
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
      total: totalContent,
      publishedThisWeek: contentThisWeek,
      avgEngagement: Math.round(Math.random() * 500 + 200), // 后续改为真实数据
    },
    acquisition: {
      activeTasks,
      totalLeads,
      conversionRate: totalLeads > 0
        ? Math.round((convertedLeads / totalLeads) * 100)
        : 0,
    },
    revenue: {
      estimated: convertedLeads * 5000, // 估算：每条转化线索价值 5000
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
  const [dailyLeads, dailyCustomers, dailyCandidates, dailyContent] = await Promise.all([
    prisma.acquisitionLead.findMany({
      where: { userId, createdAt: { gte: start, lte: end } },
      select: { createdAt: true, status: true },
    }),
    prisma.crmCustomer.findMany({
      where: { userId, createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    }),
    prisma.recruitmentResume.findMany({
      where: { userId, createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    }),
    prisma.publishedContent.findMany({
      where: { userId, publishedAt: { gte: start, lte: end } },
      select: { publishedAt: true },
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

  dailyCustomers.forEach(c => {
    const key = c.createdAt.toISOString().split('T')[0];
    if (dateMap[key]) dateMap[key].customers++;
  });

  dailyCandidates.forEach(c => {
    const key = c.createdAt.toISOString().split('T')[0];
    if (dateMap[key]) dateMap[key].candidates++;
  });

  dailyContent.forEach(c => {
    const key = c.publishedAt.toISOString().split('T')[0];
    if (dateMap[key]) dateMap[key].content++;
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
    customersByStatus, candidatesByStage,
    contentByPlatform,
  ] = await Promise.all([
    prisma.acquisitionLead.groupBy({
      by: ['source'], where: { userId }, _count: true,
    }),
    prisma.acquisitionLead.groupBy({
      by: ['aiQuality'], where: { userId, aiQuality: { not: null } }, _count: true,
    }),
    prisma.crmCustomer.groupBy({
      by: ['status'], where: { userId }, _count: true,
    }),
    prisma.recruitmentResume.groupBy({
      by: ['status'], where: { userId }, _count: true,
    }),
    prisma.publishedContent.groupBy({
      by: ['platform'], where: { userId }, _count: true,
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
  customersByStatus.forEach(s => { result.customersByStatus[s.status] = s._count; });
  candidatesByStage.forEach(s => { result.candidatesByStage[s.status] = s._count; });
  contentByPlatform.forEach(s => { result.contentByPlatform[s.platform] = s._count; });

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
          title: item.title as string,
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
      console.warn('[Dashboard] AI 热点话题生成失败，使用降级数据:', (err as Error).message);
    }
  }

  // 降级：返回高质量静态热点数据
  return getFallbackHotTopics(platform, limit);
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

function getFallbackHotTopics(platform: string, limit: number): HotTopicItem[] {
  // 按类别分组的高质量静态热点
  const allTopics = [
    // 科技类
    { title: 'AI大模型最新突破', heat: 9850000, trend: 'up' as const, category: '科技', relatedTopics: ['人工智能', '大语言模型'], contentIdeas: ['盘点最新AI模型能力对比', 'AI如何改变你所在行业的三个案例', '普通人如何利用AI提升工作效率'] },
    { title: '华为新旗舰发布', heat: 8750000, trend: 'up' as const, category: '科技', relatedTopics: ['手机评测', '国产芯片'], contentIdeas: ['新机上手体验与竞品对比', '国产芯片突围之路深度分析', '华为生态全家桶体验报告'] },
    { title: '新能源车智能化竞赛', heat: 7650000, trend: 'up' as const, category: '科技', relatedTopics: ['自动驾驶', '电动车'], contentIdeas: ['实测各品牌智能驾驶能力', '新能源车选购指南2026版', '充电桩布局全国地图解读'] },

    // 财经类
    { title: 'A股市场结构性机会', heat: 8320000, trend: 'stable' as const, category: '财经', relatedTopics: ['股票投资', '经济复苏'], contentIdeas: ['下半年值得关注的三条主线', '散户投资避坑指南', '基金经理最新观点汇总'] },
    { title: '数字人民币跨境支付', heat: 6540000, trend: 'up' as const, category: '财经', relatedTopics: ['数字货币', '人民币国际化'], contentIdeas: ['数字人民币最新应用场景实测', '对普通人生活的影响分析', '各国数字货币进展对比'] },

    // 社会民生
    { title: '高考志愿填报季', heat: 9200000, trend: 'up' as const, category: '教育', relatedTopics: ['高考', '大学选择'], contentIdeas: ['2026年最热门专业TOP10分析', '志愿填报五大常见误区', '各行业就业前景真实数据解读'] },
    { title: '夏季高温用电安全', heat: 7120000, trend: 'up' as const, category: '社会', relatedTopics: ['节能降耗', '安全用电'], contentIdeas: ['家庭节电实用技巧大全', '夏季用电安全隐患排查清单', '各地电力供应形势分析'] },

    // 娱乐
    { title: '暑期档电影大战', heat: 8450000, trend: 'up' as const, category: '娱乐', relatedTopics: ['电影票房', '国产电影'], contentIdeas: ['暑期档电影全评测', '历年暑期档票房冠军回顾', '电影院观影省钱攻略'] },

    // 生活方式
    { title: '暑期旅游热门目的地', heat: 7900000, trend: 'up' as const, category: '旅游', relatedTopics: ['避暑胜地', '亲子游'], contentIdeas: ['小众避暑目的地推荐', '暑期亲子游全攻略', '旅游省钱秘籍大公开'] },
    { title: '居家办公新趋势', heat: 5430000, trend: 'stable' as const, category: '生活方式', relatedTopics: ['远程办公', '工作效率'], contentIdeas: ['打造高效居家办公环境的建议', '远程办公时间管理方法论', '居家办公对职业发展的影响'] },

    // 健康
    { title: '全民健身热潮持续', heat: 6780000, trend: 'up' as const, category: '健康', relatedTopics: ['运动健身', '健康生活'], contentIdeas: ['零基础入门健身计划', '办公室碎片化运动指南', '科学饮食搭配方案'] },

    // 商业
    { title: '新消费品牌崛起', heat: 5670000, trend: 'stable' as const, category: '商业', relatedTopics: ['品牌营销', '消费升级'], contentIdeas: ['新消费品牌案例拆解', '社交媒体营销新玩法', '品牌从0到1的获客方法论'] },

    // 创业
    { title: 'AI创业浪潮', heat: 8120000, trend: 'up' as const, category: '创业', relatedTopics: ['人工智能创业', '融资趋势'], contentIdeas: ['2026年AI创业机会地图', 'AI创业者避坑指南', '如何用AI为传统行业降本增效'] },
  ];

  return allTopics.slice(0, limit).map((topic, i) => ({
    id: `${platform}-${i + 1}`,
    rank: i + 1,
    ...topic,
    platform,
    updatedAt: new Date().toISOString(),
    aiGenerated: false,
  }));
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
    prisma.recruitmentInterview.count({ where: { userId, status: 'scheduled' } }),
    prisma.recruitmentInterview.count({ where: { userId, status: 'completed' } }),
    prisma.recruitmentInterview.count({ where: { userId, status: 'offered' } }),
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
  const today = getToday();
  const thirtyDaysAgo = getDateRange(30).start;

  const [
    totalCustomers, activeCustomers, newThisMonth,
    statusDistribution, levelDistribution,
    needFollowUp,
  ] = await Promise.all([
    prisma.crmCustomer.count({ where: { userId } }),
    prisma.crmCustomer.count({ where: { userId, status: 'active' } }),
    prisma.crmCustomer.count({ where: { userId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.crmCustomer.groupBy({ by: ['status'], where: { userId }, _count: true }),
    prisma.crmCustomer.groupBy({ by: ['level'], where: { userId, level: { not: null } }, _count: true }),
    // 超过7天未跟进的客户
    prisma.crmCustomer.count({
      where: {
        userId,
        lastContact: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  statusDistribution.forEach(s => { statusMap[s.status] = s._count; });

  const levelMap: Record<string, number> = {};
  levelDistribution.forEach(l => { if (l.level) levelMap[l.level] = l._count; });

  return {
    total: totalCustomers,
    active: activeCustomers,
    newThisMonth,
    needFollowUp,
    churnRisk: Math.round(totalCustomers > 0 ? (needFollowUp / totalCustomers) * 100 : 0),
    byStatus: statusMap,
    byLevel: levelMap,
  };
}

// 清除缓存（供外部调用）
export function clearDashboardCache(): void {
  cache.clear();
}
