/**
 * Hot Topics Service - 热点话题业务逻辑
 *
 * 从 hot-topics.ts 路由提取：
 * - 平台列表管理
 * - AI 驱动的热点话题生成
 * - 降级热点数据
 * - 话题详情（含 AI 增强）
 * - 基于热点生成内容
 * - 趋势数据分析
 */

import { PrismaClient } from '@prisma/client';
import { chatCompletion } from './ai-client';

const prisma = new PrismaClient();

// ==================== 类型定义 ====================

export interface HotTopicPlatform {
  id: string;
  name: string;
}

export interface HotTopicItem {
  id: string;
  platform: string;
  title: string;
  heat: number;
  trend: 'up' | 'stable' | 'down';
  category: string;
  rank: number;
  updatedAt: string;
}

export interface TopicDetail {
  id: string;
  title: string;
  heat: number;
  trend: string;
  platform: string;
  category?: string;
  background: string;
  relatedTopics: Array<{ id: string; title: string }>;
  angles: Array<{ id: string; title: string; description: string }>;
  updatedAt?: Date;
}

export interface GeneratedContent {
  title: string;
  content: string;
  hashtags: string[];
  suggestions: string[];
}

export interface TrendDataPoint {
  date: string;
  heat: number;
  newTopics: number;
}

// ==================== 常量 ====================

export const SUPPORTED_PLATFORMS: HotTopicPlatform[] = [
  { id: 'douyin', name: '抖音' },
  { id: 'weibo', name: '微博' },
  { id: 'toutiao', name: '头条' },
  { id: 'baidu', name: '百度' },
  { id: 'zhihu', name: '知乎' },
  { id: 'kuaishou', name: '快手' },
];

const STYLE_PROMPTS: Record<string, string> = {
  popular: '轻松活泼、网络化、适合大众传播',
  professional: '专业深度、数据驱动、适合行业洞察',
  emotional: '情感共鸣、故事叙述、引发用户参与',
  humorous: '幽默风趣、段子风格、轻松愉快',
};

// ==================== 业务逻辑 ====================

/**
 * 获取热点话题列表（AI 增强）
 */
export async function getHotTopics(
  platform: string = 'douyin',
  limit: number = 20,
): Promise<HotTopicItem[]> {
  const topicCount = Math.min(limit, 50);
  let topics: HotTopicItem[] = [];

  // 尝试 AI 生成
  try {
    const aiResponse = await chatCompletion('system', {
      messages: [
        {
          role: 'system',
          content: `你是一个专业的内容运营分析师，深入了解中国社交媒体生态。
请根据平台"${platform}"的热点趋势，生成${topicCount}个当前最热门的话题。
每个话题必须包含：标题、热度值(1-10000000之间的整数)、趋势(up/stable/down)、分类(如科技/美食/教育/娱乐/财经/体育/生活/时尚/汽车/旅游等)。
以JSON数组格式返回：[{title, heat, trend, category}]。只返回JSON，不要其他文字。`,
        },
        {
          role: 'user',
          content: `生成${topicCount}个${SUPPORTED_PLATFORMS.find(p => p.id === platform)?.name || platform}平台当前最热门的话题`,
        },
      ],
      temperature: 0.9,
      max_tokens: 4096,
    });

    const jsonMatch = (aiResponse as string).match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed: Array<Record<string, unknown>> = JSON.parse(jsonMatch[0]);
      topics = parsed
        .filter((t): t is Record<string, unknown> => Boolean(t && t.title && t.heat))
        .slice(0, topicCount)
        .map((t, index) => ({
          id: `${platform}-ai-${Date.now()}-${index + 1}`,
          platform,
          title: t.title as string,
          heat: t.heat as number,
          trend: (t.trend as 'up' | 'stable' | 'down') || 'stable',
          category: (t.category as string) || '综合',
          rank: index + 1,
          updatedAt: new Date().toISOString(),
        }));
    }
  } catch {
    // AI 不可用时降级
  }

  // 降级
  if (topics.length === 0) {
    topics = generateFallbackTopics(platform, topicCount);
  }

  // 缓存到数据库
  try {
    await prisma.hotTopic.createMany({
      data: topics.map((t) => ({
        topicId: t.id,
        platform: t.platform,
        title: t.title,
        heat: t.heat,
        trend: t.trend,
        category: t.category,
      })),
      skipDuplicates: true,
    }).catch(() => {});
  } catch { /* ignore */ }

  return topics;
}

/**
 * 获取话题详情（含 AI 增强分析）
 */
export async function getTopicDetail(topicId: string): Promise<TopicDetail> {
  // 先查缓存
  const cached = await prisma.hotTopic
    .findFirst({ where: { topicId } })
    .catch(() => null);

  if (cached) {
    return {
      id: cached.topicId,
      title: cached.title,
      heat: cached.heat,
      trend: cached.trend,
      platform: cached.platform,
      category: cached.category,
      background: '',
      relatedTopics: [],
      angles: [],
      updatedAt: cached.createdAt,
    };
  }

  // AI 生成详情
  let details: { background: string; relatedTopics: Array<{ id: string; title: string }>; angles: Array<{ id: string; title: string; description: string }> } = {
    background: '',
    relatedTopics: [],
    angles: [],
  };

  try {
    const aiResponse = await chatCompletion('system', {
      messages: [
        { role: 'system', content: '你是内容运营专家，返回纯JSON不添加其他文字。' },
        {
          role: 'user',
          content: `为话题"${topicId}"生成详细分析，包括话题背景、相关话题（3个）、关键角度（3个）。返回JSON格式：{background, relatedTopics:[{id,title}], angles:[{id,title,description}]}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const jsonMatch = (aiResponse as string).match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      details = JSON.parse(jsonMatch[0]);
    }
  } catch { /* ignore */ }

  return {
    id: topicId,
    title: topicId.replace(/-/g, ' '),
    heat: 5000000,
    trend: 'up',
    platform: 'unknown',
    background: details.background || '暂无详情',
    relatedTopics: details.relatedTopics || [],
    angles: details.angles || [],
  };
}

/**
 * 基于热点生成内容
 */
export async function generateContentFromTopic(
  userId: string,
  topicTitle: string,
  contentType: string = 'text',
  style: string = 'popular',
): Promise<GeneratedContent> {
  const styleDesc = STYLE_PROMPTS[style] || STYLE_PROMPTS.popular;
  let lengthDesc: string;
  if (contentType === 'short') {
    lengthDesc = '50-100字短文案';
  } else if (contentType === 'long') {
    lengthDesc = '500-800字长文';
  } else {
    lengthDesc = '200-400字中等长度';
  }

  let generatedContent: GeneratedContent | null = null;

  try {
    const aiResponse = await chatCompletion(userId, {
      messages: [
        {
          role: 'system',
          content: `你是一个顶级内容创作者。
根据热点话题和指定风格，生成以下格式的内容：
1. 标题（吸引眼球，20字以内）
2. 正文（${lengthDesc}）
3. 话题标签（3-5个）
4. 发布建议（3条具体可执行的建议）

风格要求：${styleDesc}

以JSON格式返回：{title, content, hashtags:[], suggestions:[]}。只返回JSON。`,
        },
        {
          role: 'user',
          content: `基于热点话题"${topicTitle}"创作一篇${contentType}内容`,
        },
      ],
      temperature: 0.85,
      max_tokens: 4096,
    });

    const jsonMatch = (aiResponse as string).match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      generatedContent = JSON.parse(jsonMatch[0]);
    }
  } catch { /* ignore */ }

  if (!generatedContent) {
    return {
      title: `${topicTitle}，你知道吗？`,
      content: `最近 ${topicTitle} 成为了大家热议的话题。\n\n作为新时代的追热点达人，怎么能错过这个呢？快来一起看看吧！\n\n#${topicTitle} #热门话题 #每日热点`,
      hashtags: [topicTitle, '热门话题', '今日话题'],
      suggestions: [
        '建议在话题热度最高时段发布',
        '配合相关图片效果更佳',
        '可以结合自身经历增加共鸣',
      ],
    };
  }

  return generatedContent;
}

/**
 * 获取趋势数据
 */
export async function getPlatformTrends(
  platform: string,
  days: number = 7,
): Promise<{ trends: TrendDataPoint[]; insight: string }> {
  const numDays = Math.min(days, 30);
  const trends: TrendDataPoint[] = [];
  const baseHeat = 500000 + Math.floor(Math.random() * 500000);

  for (let i = numDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const variation = Math.floor(Math.random() * 400000) - 200000;
    trends.push({
      date: date.toISOString().split('T')[0],
      heat: Math.max(100000, baseHeat + variation + (numDays - i) * 15000),
      newTopics: Math.floor(Math.random() * 30) + 15,
    });
  }

  // AI 趋势洞察
  let insight = '';
  try {
    const aiResponse = await chatCompletion('system', {
      messages: [
        { role: 'system', content: '你是一个数据分析师，用一句话总结数据趋势（30字以内）。' },
        {
          role: 'user',
          content: `${platform}平台近${numDays}天热度呈${trends[trends.length - 1].heat > trends[0].heat ? '上升' : '波动'}趋势，最新热度${trends[trends.length - 1].heat}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });
    insight = (aiResponse as string).trim();
  } catch { /* ignore */ }

  return {
    trends,
    insight: insight || `近${numDays}天热度整体平稳`,
  };
}

// ==================== 降级数据 ====================

function generateFallbackTopics(platform: string, limit: number): HotTopicItem[] {
  const topicData = [
    { title: 'AI大模型最新突破', heat: 9856000, trend: 'up' as const, category: '科技' },
    { title: '淄博烧烤', heat: 8754000, trend: 'down' as const, category: '美食' },
    { title: '高考志愿填报', heat: 7653000, trend: 'up' as const, category: '教育' },
    { title: '新能源车智能化', heat: 6542000, trend: 'stable' as const, category: '汽车' },
    { title: '暑期旅游攻略', heat: 5431000, trend: 'up' as const, category: '旅游' },
    { title: '数字人民币', heat: 4320000, trend: 'stable' as const, category: '财经' },
    { title: '健康饮食', heat: 3219000, trend: 'stable' as const, category: '健康' },
    { title: '职场穿搭', heat: 2108000, trend: 'up' as const, category: '时尚' },
    { title: '宠物养护', heat: 1987000, trend: 'up' as const, category: '生活' },
    { title: 'AI创业浪潮', heat: 1876000, trend: 'stable' as const, category: '创业' },
    { title: '亲子教育', heat: 1765000, trend: 'down' as const, category: '教育' },
    { title: '电影推荐', heat: 1654000, trend: 'stable' as const, category: '娱乐' },
    { title: '健身打卡', heat: 1543000, trend: 'up' as const, category: '运动' },
    { title: '数码测评', heat: 1432000, trend: 'down' as const, category: '科技' },
    { title: '美妆教程', heat: 1321000, trend: 'stable' as const, category: '美妆' },
    { title: '家居装修', heat: 1210000, trend: 'up' as const, category: '家居' },
    { title: '考研复习', heat: 1099000, trend: 'stable' as const, category: '教育' },
    { title: '露营装备', heat: 988000, trend: 'up' as const, category: '户外' },
    { title: '咖啡文化', heat: 877000, trend: 'stable' as const, category: '美食' },
    { title: '读书分享', heat: 766000, trend: 'down' as const, category: '文化' },
  ];

  return topicData.slice(0, limit).map((topic, index) => ({
    id: `${platform}-fallback-${index + 1}`,
    platform,
    title: topic.title,
    heat: topic.heat,
    trend: topic.trend,
    category: topic.category,
    rank: index + 1,
    updatedAt: new Date().toISOString(),
  }));
}
