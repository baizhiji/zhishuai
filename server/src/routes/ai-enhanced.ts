/**
 * AI Enhanced Routes — 标题生成、脚本生成、标签推荐、文章生成
 * 使用统一 AI 客户端 (腾讯云TokenHub/阿里云百炼)
 */
import { Router, Response } from 'express';
import { chatCompletion } from '../services/ai-client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const PLATFORM_LABELS: Record<string, string> = {
  douyin: '抖音',
  kuaishou: '快手',
  xiaohongshu: '小红书',
  bilibili: 'B站',
  weibo: '微博',
};

// 获取 AI 增强工具列表
router.get('/tools', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const tools = [
      { id: 'title', name: '标题生成', description: 'AI 生成高点击率爆款标题', method: 'POST', path: '/api/ai-enhanced/title', platforms: Object.keys(PLATFORM_LABELS) },
      { id: 'script', name: '脚本生成', description: 'AI 生成短视频分镜脚本', method: 'POST', path: '/api/ai-enhanced/script', platforms: Object.keys(PLATFORM_LABELS) },
      { id: 'hashtags', name: '标签推荐', description: 'AI 推荐高曝光率标签组合', method: 'POST', path: '/api/ai-enhanced/hashtags', platforms: Object.keys(PLATFORM_LABELS) },
      { id: 'post', name: '文章生成', description: 'AI 撰写社交媒体帖子', method: 'POST', path: '/api/ai-enhanced/post', platforms: Object.keys(PLATFORM_LABELS) },
    ];
    res.json({ code: 200, message: 'success', data: { tools } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 生成标题
router.post('/title', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { topic, platform = 'douyin', count = 5 } = req.body;
    const userId = req.userId!;
    const platformName = PLATFORM_LABELS[platform] || platform;

    const systemPrompt = `你是${platformName}平台的顶级内容运营专家，擅长创作高点击率、高互动率的爆款标题。
创作要点：
1. 标题长度15-25字，简洁有力
2. 使用悬念、数字、冲突、情感等技巧吸引点击
3. 避免标题党，确保内容与标题匹配
4. 融入${platformName}平台的表达风格和热词`;

    const userPrompt = [
      `主题：${topic}`,
      `平台：${platformName}`,
      `数量：${count}个`,
      '',
      '请生成标题，一行一个，不要编号。',
    ].join('\n');

    const result = await chatCompletion(userId, {

      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 500,
      platform: platform as any,
    });

    const titles = result
      .split('\n')
      .map(t => t.replace(/^\d+[\.\、\)]\s*/, '').trim())
      .filter(t => t.length > 0);

    res.json({ code: 200, message: 'success', data: { titles } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 生成脚本
router.post('/script', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { topic, duration = 60, style = '专业', platform = 'douyin' } = req.body;
    const userId = req.userId!;
    const platformName = PLATFORM_LABELS[platform] || platform;

    const systemPrompt = `你是${platformName}平台的顶级短视频编导，擅长创作结构紧凑、节奏明快的视频脚本。
创作要点：
1. 开头3秒用钩子（疑问、震撼数据、冲突场景）抓住观众
2. 中间保持信息密度，每5-10秒一个信息点或转折
3. 结尾用强CTA引导互动（点赞/评论/关注/转发）
4. 配合画面、BGM、字幕节奏进行分镜设计`;

    const userPrompt = [
      `主题：${topic}`,
      `时长：${duration}秒`,
      `风格：${style}`,
      `平台：${platformName}`,
      '',
      '请生成完整的短视频分镜脚本，包含：镜头序号、时长、画面描述、旁白/对白、字幕文案。',
    ].join('\n');

    const result = await chatCompletion(userId, {

      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2048,
      platform: platform as any,
      creativity: 0.7,
    });

    res.json({ code: 200, message: 'success', data: { script: result } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 生成标签
router.post('/hashtags', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { topic, platform = 'douyin', count = 10 } = req.body;
    const userId = req.userId!;
    const platformName = PLATFORM_LABELS[platform] || platform;

    const systemPrompt = `你是${platformName}平台的内容运营专家，擅长策划高曝光率的标签组合策略。
标签策略：
1. 热门话题标签（当下最火的泛流量标签）
2. 领域精准标签（相关领域的高质量标签）
3. 长尾标签（竞争小、搜索量稳定的蓝海标签）
4. 品牌/系列标签（如有自创话题标签）

输出格式：每行一个标签，以#开头，总计${count}个。`;

    const userPrompt = [
      `主题：${topic}`,
      `平台：${platformName}`,
      '',
      `请生成${count}个标签，每行一个，以#开头。`,
    ].join('\n');

    const result = await chatCompletion(userId, {

      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
      platform: platform as any,
    });

    const hashtags = result
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.startsWith('#') && t.length > 1);

    res.json({ code: 200, message: 'success', data: { hashtags } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 生成文章/帖子
router.post('/post', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { topic, platform = 'xiaohongshu' } = req.body;
    const userId = req.userId!;
    const platformName = PLATFORM_LABELS[platform] || platform;

    const systemPrompt = `你是${platformName}平台的顶级内容创作者，擅长撰写高互动率的社交媒体帖子。
创作要点：
1. 开头用钩子吸引关注（痛点/悬念/数据/故事）
2. 正文结构清晰，适当使用emoji增强可读性
3. 内容有干货，提供实用价值或情感共鸣
4. 结尾引导互动（求赞/收藏/评论/关注）
5. 符合${platformName}平台的内容调性和受众偏好`;

    const userPrompt = [
      `请围绕以下主题撰写一篇${platformName}平台的社交媒体帖子：`,
      '',
      `主题：${topic}`,
      '',
      '要求：内容原创、结构完整、语言生动、格式清晰。',
    ].join('\n');

    const result = await chatCompletion(userId, {

      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2048,
      platform: platform as any,
      creativity: 0.7,
    });

    res.json({ code: 200, message: 'success', data: { content: result } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

export default router;
