/**
 * 热点话题 API
 *
 * 获取各平台热点话题 + AI内容生成
 * 说明：各平台热搜榜单无公开免费 API，热点列表数据由 Playwright 采集任务写入
 * 采集表 hotTopic 后返回；未采集时返回空列表，禁止生成模拟数据。
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getPrimaryApiKey } from '../services/user-api-key.service';
import { appendAIGCLabel, appendAIGCLabelShort } from '../services/aigc-label.service';

const router = Router();
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
// 说明：各平台热搜榜单无公开 API，需接入第三方热点数据源（如新榜/微热点）后返回真实数据，
// 未配置数据源时返回空列表，禁止生成模拟数据。
router.get('/', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [],
    message: '热点榜单数据源未配置，请在系统设置中接入热点数据服务',
  });
});

// 获取单个话题详情
router.get('/:id', async (req: Request, res: Response) => {
  res.status(404).json({ success: false, message: '热点数据源未配置，暂无话题详情' });
});

// AI生成热点内容（使用真实AI API）
router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topicTitle, contentType = 'text', style = 'popular' } = req.body;

    if (!topicTitle) {
      res.status(400).json({ success: false, message: '请提供话题标题' });
      return;
    }

    const apiConfig = await resolveApiKey(userId);

    // 未配置 AI API Key 时明确报错，禁止模板降级
    if (!apiConfig) {
      res.status(400).json({
        success: false,
        message: '未配置 AI API Key，请在「设置-API配置」中添加 TokenHub 或百炼 API Key 后重试',
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
        title: appendAIGCLabelShort(parsed?.title || `关于${topicTitle}的深度分析`),
        content: appendAIGCLabel(parsed?.content || rawContent),
        hashtags: parsed?.hashtags || [],
        suggestions: parsed?.suggestions || [],
        generated: true,
      },
    });
  } catch (error: any) {
    console.error('AI生成内容错误:', error);
    res.status(500).json({
      success: false,
      message: `AI生成失败：${error?.message || '请稍后重试'}`,
    });
  }
});

// 获取趋势数据
router.get('/trends/:platform', (req: Request, res: Response) => {
  res.json({ success: true, data: [], message: '热点数据源未配置，暂无趋势数据' });
});

export default router;
