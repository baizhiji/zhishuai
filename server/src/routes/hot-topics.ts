/**
 * 热点话题 API
 * 
 * 获取各平台热点话题 + AI内容生成
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { getPrimaryApiKey } from '../services/user-api-key.service';

const router = Router();
const prisma = new PrismaClient();

// 热点话题平台列表
const HOT_TOPIC_PLATFORMS = [
  { id: 'douyin', name: '抖音', icon: '🎵' },
  { id: 'weibo', name: '微博', icon: '📱' },
  { id: 'toutiao', name: '头条', icon: '📰' },
  { id: 'baidu', name: '百度', icon: '🔍' },
  { id: 'zhihu', name: '知乎', icon: '💬' },
  { id: 'kuaishou', name: '快手', icon: '📷' },
];

// 获取用户的AI API Key
async function resolveApiKey(userId: string): Promise<{ key: string; model: string; baseUrl: string; headers: Record<string, string> } | null> {
  // 1. 用户自己的key
  try {
    const thKey = await getPrimaryApiKey(userId, 'tokenhub');
    if (thKey?.apiKey) return {
      key: thKey.apiKey,
      model: 'hunyuan-2.0-instruct-20251111',
      baseUrl: 'https://tokenhub.cloud.tencent.com',
      headers: { 'X-TC-Provider': 'tokenhub' },
    };
  } catch {}
  
  try {
    const dsKey = await getPrimaryApiKey(userId, 'dashscope');
    if (dsKey?.apiKey) return {
      key: dsKey.apiKey,
      model: 'qwen-plus',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      headers: {},
    };
  } catch {}
  
  // 2. 环境变量
  if (process.env.TENCENT_TOKENHUB_API_KEY) return {
    key: process.env.TENCENT_TOKENHUB_API_KEY,
    model: 'hunyuan-2.0-instruct-20251111',
    baseUrl: 'https://tokenhub.cloud.tencent.com',
    headers: { 'X-TC-Provider': 'tokenhub' },
  };
  
  if (process.env.DASHSCOPE_API_KEY) return {
    key: process.env.DASHSCOPE_API_KEY,
    model: 'qwen-plus',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    headers: {},
  };
  
  return null;
}

// 获取支持的平台列表
router.get('/platforms', (req: Request, res: Response) => {
  res.json({ success: true, data: HOT_TOPIC_PLATFORMS });
});

// 获取热点话题列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const { platform = 'douyin', category = '', limit = '20' } = req.query;
    const mockHotTopics = generateMockHotTopics(platform as string, Number(limit));
    res.json({ success: true, data: mockHotTopics });
  } catch (error: any) {
    console.error('获取热点话题失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取单个话题详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topic = {
      id,
      title: '热门话题标题',
      heat: 1000000,
      trend: 'up',
      platform: 'douyin',
      relatedTopics: [{ id: '1', title: '相关话题1' }, { id: '2', title: '相关话题2' }],
      contents: [
        { id: 'c1', title: '相关内容的标题1', author: '作者1', likes: 10000, comments: 5000 },
      ],
    };
    res.json({ success: true, data: topic });
  } catch (error: any) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// AI生成热点内容（使用真实AI API）
router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topicId, topicTitle, contentType = 'text', style = 'popular' } = req.body;

    if (!topicTitle) {
      res.status(400).json({ success: false, message: '请提供话题标题' });
      return;
    }

    const apiConfig = await resolveApiKey(userId);
    
    // 如果没有AI API Key，降级为模板生成
    if (!apiConfig) {
      const templateContent = {
        title: `${topicTitle}，你知道吗？`,
        content: `最近 ${topicTitle} 成为了大家热议的话题。\n\n作为新时代的内容创作者，如何抓住这个热点呢？\n\n1. 深度分析话题背景\n2. 结合自身领域发表观点\n3. 添加互动元素引导评论\n\n快来参与讨论吧！\n\n#${topicTitle} #热门话题 #每日热点`,
        hashtags: [topicTitle, '热门话题', '今日话题'],
        suggestions: ['建议在话题热度最高时段发布', '配合相关图片效果更佳', '可以结合自身经历增加共鸣'],
        generated: false,
      };
      res.json({
        success: true,
        data: templateContent,
        message: '使用模板生成（配置AI API Key可获得更高质量内容）',
      });
      return;
    }

    // 使用真实AI生成
    const styleMap: Record<string, string> = {
      popular: '轻松活泼、接地气的风格',
      professional: '专业严谨的风格',
      emotional: '情感共鸣、打动人心',
      humorous: '幽默风趣的风格',
    };
    const styleDesc = styleMap[style] || '轻松自然的风格';

    const prompt = `你是一个专业的内容创作者。请基于以下热点话题创作发布内容：

话题：${topicTitle}
内容类型：${contentType}
风格要求：${styleDesc}

请生成：
1. 一个吸引人的标题
2. 一篇适合社交媒体发布的正文（200-400字）
3. 3-5个相关话题标签
4. 2-3条发布建议

请以JSON格式返回，格式为：{"title": "...", "content": "...", "hashtags": [...], "suggestions": [...]}`;

    const response = await fetch(`${apiConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.key}`,
        ...apiConfig.headers,
      },
      body: JSON.stringify({
        model: apiConfig.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI服务调用失败(${response.status})`);
    }

    const data: any = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const match = rawContent.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    } catch {}

    res.json({
      success: true,
      data: {
        title: parsed?.title || `关于${topicTitle}的深度分析`,
        content: parsed?.content || rawContent,
        hashtags: parsed?.hashtags || [topicTitle, '热点'],
        suggestions: parsed?.suggestions || ['在高峰时段发布效果更佳'],
        generated: true,
      },
    });
  } catch (error: any) {
    console.error('AI生成内容错误:', error);
    // 降级为模板生成
    res.json({
      success: true,
      data: {
        title: `${req.body.topicTitle}，值得关注`,
        content: `关于 ${req.body.topicTitle} 的讨论正在持续升温，各行各业的人都在发表自己的看法...`,
        hashtags: [req.body.topicTitle, '热点'],
        suggestions: ['请稍后重试获取AI生成内容'],
        generated: false,
      },
      message: 'AI生成暂时不可用，已返回模板内容',
    });
  }
});

// 获取趋势数据
router.get('/trends/:platform', (req: Request, res: Response) => {
  const { platform } = req.params;
  const { days = '7' } = req.query;
  const trends = [];
  const numDays = Number(days);
  for (let i = numDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    trends.push({
      date: date.toISOString().split('T')[0],
      heat: Math.floor(Math.random() * 1000000) + 500000,
      newTopics: Math.floor(Math.random() * 50) + 20,
    });
  }
  res.json({ success: true, data: trends });
});

// 生成模拟热点话题数据
function generateMockHotTopics(platform: string, limit: number) {
  const platformNames: Record<string, string> = {
    douyin: '抖音', weibo: '微博', toutiao: '头条', baidu: '百度', zhihu: '知乎', kuaishou: '快手',
  };

  const categories = ['社会', '娱乐', '科技', '体育', '财经', '生活方式', '教育', '健康'];
  const topics = [];
  const now = new Date();

  for (let i = 0; i < limit; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const heat = Math.floor(Math.random() * 5000000) + 100000;
    const trends: Array<'up' | 'down' | 'stable'> = ['up', 'down', 'stable'];
    
    const prefix = platformNames[platform] || '热门';
    const titles = [
      `${prefix}热点：${category}领域最新动态`,
      `大家都在讨论的${category}话题`,
      `${category}行业今日重大消息`,
      `不可错过的${category}热点事件`,
      `${prefix}热搜：${category}话题持续升温`,
    ];

    topics.push({
      id: `topic-${platform}-${i}`,
      platform,
      platformName: platformNames[platform],
      title: titles[i % titles.length],
      heat,
      trend: trends[Math.floor(Math.random() * trends.length)],
      category,
      rank: i + 1,
      updatedAt: new Date(now.getTime() - Math.random() * 3600000).toISOString(),
    });
  }

  return topics.sort((a, b) => b.heat - a.heat);
}

export default router;
