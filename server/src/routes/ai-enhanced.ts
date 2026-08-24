/**
 * AI Enhanced Routes — 标题生成、脚本生成、标签推荐、文章生成
 * 使用统一 AI 客户端 (腾讯云TokenHub/阿里云百炼)
 */
import { Router, Response } from 'express';
import { chatCompletion, generateVideo } from '../services/ai-client';
import { appendAIGCLabel, appendAIGCLabelShort } from '../services/aigc-label.service';
import { checkContentQuality } from '../services/ai-quality';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';

const router = Router();

const PLATFORM_LABELS: Record<string, string> = {
  douyin: '抖音',
  kuaishou: '快手',
  xiaohongshu: '小红书',
  bilibili: 'B站',
  weibo: '微博',
};

// 获取 AI 生成历史（Task 2：统一两端生成历史到服务器）
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).userId;
    const page = parseInt((req.query.page as string) || '1') || 1;
    const pageSize = parseInt((req.query.pageSize as string) || '50') || 50;
    const feature = req.query.feature as string | undefined;

    const where: any = { userId };
    if (feature) where.feature = feature;

    const [items, total] = await Promise.all([
      prisma.aiGenerationHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.aiGenerationHistory.count({ where }),
    ]);

    res.json({
      code: 200,
      message: 'success',
      data: { items, total, page, pageSize },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 保存 AI 生成历史（APK / WEB 通用）
router.post('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { feature, category, title, content, config, status, provider, model, source } = req.body || {};
    if (!content) {
      res.status(400).json({ code: 400, message: 'content 不能为空', data: null });
      return;
    }

    const record = await prisma.aiGenerationHistory.create({
      data: {
        userId,
        feature: feature || 'ai-enhanced',
        category: category || null,
        title: title || null,
        content,
        config: config ?? undefined,
        status: status || 'success',
        provider: provider || null,
        model: model || null,
        source: source || 'web',
      },
    });

    res.json({ code: 200, message: 'success', data: record });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 删除 AI 生成历史
router.delete('/history/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    await prisma.aiGenerationHistory.deleteMany({ where: { id, userId } });
    res.json({ code: 200, message: 'success', data: { id } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

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
      .filter(t => t.length > 0)
      .map(t => appendAIGCLabelShort(t));

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

    res.json({ code: 200, message: 'success', data: { script: appendAIGCLabel(result) } });
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

// 爆款内容创意（完整蓝图）：AI 创作工厂生成文本内容的核心方法论，对齐桌面端 viral_analysis 四维爆款分析
const CREATIVE_SYSTEM_PROMPT = `你是爆款内容创意专家，负责把普通主题打磨成高传播、高互动的爆款内容。
请按以下流程创作：
1. 爆款潜力分析：从情绪钩子、信息差、身份标签、行动触发四个维度评估主题的爆款潜力，输出结构化分析
2. 创意方向：基于分析提出3个差异化创意方向，每个方向包含核心概念、目标受众、预期传播路径
3. 爆款标题：为最佳创意方向生成TOP3爆款标题（善用数字、悬念、身份标签、结果导向等公式）
4. 完整正文：撰写完整正文，注意平台特有的语言风格、互动引导、话题标签
5. 发布策略：给出发布建议（最佳发布时间、话题标签组合、互动引导策略）`;

// 通用增强版：默认生成也注入爆款内容创作逻辑（四维爆款基因 + 标题策划 + 钩子结构）
const DEFAULT_SYSTEM_PROMPT = (platformName: string) => `你是${platformName}平台的爆款内容创作专家，擅长把普通主题打磨成高传播、高互动的爆款内容。
创作方法论（先分析后创作）：
1. 爆款基因分析：从信息差、情绪价值、身份认同、行动诱因四个维度挖掘主题的爆款潜力，确定内容切入角度
2. 标题策划：给出1个能引发点击的爆款标题（善用数字、悬念、身份标签、结果导向等公式）
3. 正文创作：
   - 开头用钩子快速抓住注意力（痛点/悬念/数据/故事）
   - 正文结构清晰、信息密度高，适当使用emoji增强可读性
   - 内容有干货，提供实用价值或情感共鸣
   - 结尾引导互动（求赞/收藏/评论/关注）
4. 整体符合${platformName}平台的内容调性和受众偏好

输出格式：第一行输出【标题】+爆款标题，第二行起为完整正文。`;

// 生成文章/帖子
router.post('/post', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { topic, platform = 'xiaohongshu', contentType } = req.body;
    const userId = req.userId!;
    const platformName = PLATFORM_LABELS[platform] || platform;

    // AI 创作工厂（APK/客户端）生成的文本类内容统一走"爆款内容创意"完整逻辑
    const isCreativity = typeof contentType === 'string' && contentType.includes('creativity');
    const systemPrompt = isCreativity
      ? CREATIVE_SYSTEM_PROMPT
      : DEFAULT_SYSTEM_PROMPT(platformName);

    const userPrompt = [
      isCreativity
        ? '请围绕以下主题生成一份完整的爆款内容创意蓝图：'
        : `请围绕以下主题撰写一篇${platformName}平台的爆款社交媒体帖子：`,
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

    const rawContent = appendAIGCLabel(result);

    // 质量关卡（蓝皮书四大横切模块：质量优先）——不阻断主流程，低分记录日志并在响应中提示
    let quality: any = null;
    try {
      quality = await checkContentQuality(rawContent, platform);
      if (!quality.passed) {
        console.warn(`[ai-enhanced] 内容质量分偏低(${quality.score}): ${quality.issues.join('; ')}`);
      }
    } catch {
      /* 质量检查失败不影响主流程 */
    }

    res.json({ code: 200, message: 'success', data: { content: rawContent, quality } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 视频生成：文本转视频（可灵/混元/Seedance/Wan 四路降级）
// 请求体：{ prompt, provider?, model?, size?, duration?, images?, imageUrl?, text?, voice? }
router.post('/video', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      prompt,
      provider,
      model,
      size,
      duration,
      images,
      imageUrl,
      text,
      voice,
    } = req.body || {};
    if (!prompt) {
      res.status(400).json({ code: 400, message: 'prompt 不能为空', data: null });
      return;
    }

    const result = await generateVideo(userId, {
      prompt,
      provider,
      model,
      size,
      duration,
      images,
      imageUrl,
      text,
      voice,
    });

    res.json({
      code: 200,
      message: 'success',
      data: {
        videoUrl: result.url,
        provider: result.provider,
        providerLabel: result.providerLabel,
        model: result.model,
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

export default router;
