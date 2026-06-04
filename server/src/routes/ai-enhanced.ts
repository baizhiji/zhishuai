/**
 * 智枢 AI SaaS 系统 - 增强型 AI 能力路由
 *
 * 使用优化后的提示词引擎，提供更高质量的内容生成
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { chatCompletion, generateImage, textToSpeech, chatCompletionStream } from '../services/ai-service';
import { PROMPTS, CONTENT_TYPES, selectModel, getOptimizedParams, QUALITY_CHECKS } from '../services/ai-prompts';

const router = Router();

// ==================== 工具函数 ====================

/**
 * 生成内容并返回（统一处理）
 */
async function generateWithPrompt(
  userId: string,
  content: { prompt: string; model?: string; temperature?: number; maxTokens?: number }
) {
  const { prompt, model, temperature, maxTokens } = content;

  const result = await chatCompletion(userId, {
    model: model || 'dashscope:qwen-max',
    messages: [{ role: 'user', content: prompt }],
    temperature: temperature || 0.7,
    max_tokens: maxTokens || 2000
  });

  return result;
}

/**
 * 质量检查
 */
function performQualityCheck(content: string, type: string, platform?: string) {
  const checks: any = {
    passed: true,
    issues: []
  };

  // 1. 敏感词检查
  const sensitiveFound = QUALITY_CHECKS.sensitiveWords.filter(word =>
    content.includes(word)
  );
  if (sensitiveFound.length > 0) {
    checks.issues.push(`敏感词：${sensitiveFound.slice(0, 3).join(', ')}`);
  }

  // 2. 平台敏感词检查
  if (platform && QUALITY_CHECKS.platformSensitive[platform as keyof typeof QUALITY_CHECKS.platformSensitive]) {
    const platformSensitive = QUALITY_CHECKS.platformSensitive[platform as keyof typeof QUALITY_CHECKS.platformSensitive];
    const found = platformSensitive.filter(word => content.includes(word));
    if (found.length > 0) {
      checks.issues.push(`平台敏感词：${found.join(', ')}`);
    }
  }

  // 3. 长度检查
  const lengthResult = QUALITY_CHECKS.lengthCheck(content, type);
  if (!lengthResult.passed) {
    checks.issues.push(lengthResult.issue);
  }

  // 4. 重复度检查
  const dupResult = QUALITY_CHECKS.duplicateCheck(content);
  if (!dupResult.passed) {
    checks.issues.push(dupResult.issue);
  }

  checks.passed = checks.issues.length === 0;

  return checks;
}

// ==================== 通用 AI 接口 ====================

// 获取所有可用的AI模型
router.get('/models', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const models = await getAvailableModels(userId);
    res.json({ success: true, data: models });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取模型列表（不带用户状态）
router.get('/model-list', async (req: Request, res: Response) => {
  try {
    const models = getModelList();
    res.json({ success: true, data: models });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 聊天补全
router.post('/chat', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { model, messages, temperature, top_p, max_tokens, stream } = req.body;

    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：model, messages'
      });
    }

    const result = await chatCompletion(userId, {
      model,
      messages,
      temperature,
      top_p,
      max_tokens,
      stream
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 图像生成
router.post('/image', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { model, prompt, negative_prompt, image_size, n, seed } = req.body;

    if (!model || !prompt) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：model, prompt'
      });
    }

    const result = await generateImage(userId, {
      model,
      prompt,
      negative_prompt,
      image_size,
      n,
      seed
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 语音合成
router.post('/tts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { model, text, voice, speed, volume, format } = req.body;

    if (!model || !text) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：model, text'
      });
    }

    const result = await textToSpeech(userId, {
      model,
      text,
      voice,
      speed,
      volume,
      format
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== 增强型内容生成接口 ====================

/**
 * 1. 短视频标题生成（增强版）
 */
router.post('/generate/title', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topic, platform, industry, targetAudience, count } = req.body;

    const prompt = PROMPTS.shortVideoTitle({
      topic,
      platform: platform || 'douyin',
      industry,
      targetAudience,
      count: count || 10
    });

    const params = getOptimizedParams('short_video_title');
    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('short_video_title'),
      temperature: params.temperature,
      maxTokens: params.maxTokens
    });

    // 质量检查
    const qualityCheck = performQualityCheck(result.text || '', 'short_video_title', platform);

    res.json({
      success: true,
      data: {
        content: result.text,
        quality: qualityCheck,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 2. 小红书文案生成（增强版）
 */
router.post('/generate/xiaohongshu', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topic, productInfo, sellingPoints, targetAudience, wordCount } = req.body;

    const prompt = PROMPTS.xiaohongshuContent({
      topic,
      productInfo,
      sellingPoints,
      targetAudience,
      wordCount
    });

    const params = getOptimizedParams('xiaohongshu_content');
    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('xiaohongshu_content'),
      temperature: params.temperature,
      maxTokens: params.maxTokens
    });

    const qualityCheck = performQualityCheck(result.text || '', 'xiaohongshu_content', 'xiaohongshu');

    res.json({
      success: true,
      data: {
        content: result.text,
        quality: qualityCheck,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 3. 短视频脚本生成（增强版）
 */
router.post('/generate/script', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topic, duration, style, platform, includeSubtitles, includeBgm } = req.body;

    const prompt = PROMPTS.shortVideoScript({
      topic,
      duration: duration || 60,
      style: style || '口播',
      platform: platform || 'douyin',
      includeSubtitles,
      includeBgm
    });

    const params = getOptimizedParams('short_video_script');
    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('short_video_script'),
      temperature: params.temperature,
      maxTokens: params.maxTokens
    });

    const qualityCheck = performQualityCheck(result.text || '', 'short_video_script', platform);

    res.json({
      success: true,
      data: {
        content: result.text,
        quality: qualityCheck,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 4. 话题标签生成（增强版）
 */
router.post('/generate/hashtags', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topic, platform, count, includeTrending } = req.body;

    const prompt = PROMPTS.hashtags({
      topic,
      platform: platform || 'douyin',
      count: count || 15,
      includeTrending
    });

    const params = getOptimizedParams('hashtags');
    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('hashtags'),
      temperature: params.temperature,
      maxTokens: params.maxTokens
    });

    res.json({
      success: true,
      data: {
        content: result.text,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 5. 批量内容生成（增强版）
 */
router.post('/generate/batch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topic, contentType, platform, count, variations } = req.body;

    const prompt = PROMPTS.batchContent({
      topic,
      contentType: contentType || '标题',
      platform: platform || 'douyin',
      count: count || 5,
      variations: variations || '相同角度不同表达'
    });

    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:qwen-max',
      temperature: 0.8,
      maxTokens: 3000
    });

    // 解析批量内容
    const items = result.text?.split('===').filter(s => s.trim()) || [];

    res.json({
      success: true,
      data: {
        contents: items.map((item: string) => ({
          content: item.trim()
        })),
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 6. 图生文（图片描述生成）
 */
router.post('/generate/image-description', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { imageDescription, purpose, tone } = req.body;

    const prompt = PROMPTS.imageToText({
      imageDescription,
      purpose: purpose || '通用',
      tone: tone || '分享'
    });

    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('summary'),
      temperature: 0.6,
      maxTokens: 1000
    });

    res.json({
      success: true,
      data: {
        content: result.text,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 7. 电商详情页生成
 */
router.post('/generate/ecommerce', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { productName, keyFeatures, priceInfo, targetAudience } = req.body;

    const prompt = PROMPTS.ecommerceDetailPage({
      productName,
      keyFeatures,
      priceInfo,
      targetAudience
    });

    const params = getOptimizedParams('ecom_detail_page');
    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('ecom_detail_page'),
      temperature: params.temperature,
      maxTokens: params.maxTokens
    });

    const qualityCheck = performQualityCheck(result.text || '', 'ecom_detail_page');

    res.json({
      success: true,
      data: {
        content: result.text,
        quality: qualityCheck,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== 招聘功能接口 ====================

/**
 * 8. 招聘JD生成（增强版）
 */
router.post('/generate/job-description', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { jobTitle, companyInfo, salary, location, highlights } = req.body;

    const prompt = PROMPTS.jobDescription({
      jobTitle,
      companyInfo,
      salary,
      location,
      highlights
    });

    const params = getOptimizedParams('job_description');
    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('job_description'),
      temperature: params.temperature,
      maxTokens: params.maxTokens
    });

    const qualityCheck = performQualityCheck(result.text || '', 'job_description');

    res.json({
      success: true,
      data: {
        content: result.text,
        quality: qualityCheck,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 9. 简历智能分析
 */
router.post('/analyze/resume', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { resumeText, jobRequirements, analysisType } = req.body;

    const prompt = PROMPTS.resumeAnalysis({
      resumeText,
      jobRequirements,
      analysisType: analysisType || 'full'
    });

    const params = getOptimizedParams('recruitment_summary');
    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('recruitment_summary'),
      temperature: params.temperature,
      maxTokens: params.maxTokens
    });

    res.json({
      success: true,
      data: {
        analysis: result.text,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 10. 主动沟通候选人话术
 */
router.post('/generate/recruitment-outreach', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { candidateName, candidateBackground, position, companyName, outreachStyle } = req.body;

    const prompt = PROMPTS.recruitmentOutreach({
      candidateName,
      candidateBackground,
      position,
      companyName,
      outreachStyle
    });

    const params = getOptimizedParams('outreach_message');
    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('outreach_message'),
      temperature: params.temperature,
      maxTokens: params.maxTokens
    });

    res.json({
      success: true,
      data: {
        content: result.text,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 11. 面试邀请生成
 */
router.post('/generate/interview-invitation', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { candidateName, position, interviewTime, interviewMode, preparation } = req.body;

    const prompt = PROMPTS.interviewInvitation({
      candidateName,
      position,
      interviewTime,
      interviewMode,
      preparation
    });

    const params = getOptimizedParams('interview_invitation');
    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('interview_invitation'),
      temperature: params.temperature,
      maxTokens: params.maxTokens
    });

    res.json({
      success: true,
      data: {
        content: result.text,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 12. 自动回复候选人
 */
router.post('/generate/auto-reply', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { candidateMessage, conversationContext, candidateStage, replyStyle } = req.body;

    const prompt = PROMPTS.autoReply({
      candidateMessage,
      conversationContext,
      candidateStage,
      replyStyle
    });

    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('ai_reply'),
      temperature: 0.5,
      maxTokens: 1000
    });

    // 解析多个回复备选
    const replies = result.text?.split(/【风格\d+】|风格\d+/).filter(s => s.trim()) || [];

    res.json({
      success: true,
      data: {
        replies: replies.slice(0, 5).map((r: string) => r.trim()),
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== 获客功能接口 ====================

/**
 * 13. 引流话术生成（增强版）
 */
router.post('/generate/outreach', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { scenario, product, targetProfile, platform, crmQrCode, warmthLevel } = req.body;

    const prompt = PROMPTS.outreachMessage({
      scenario: scenario || '私信引流',
      product,
      targetProfile,
      platform: platform || 'douyin',
      crmQrCode,
      warmthLevel
    });

    const params = getOptimizedParams('outreach_message');
    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('outreach_message'),
      temperature: params.temperature,
      maxTokens: params.maxTokens
    });

    const qualityCheck = performQualityCheck(result.text || '', 'outreach_message', platform);

    res.json({
      success: true,
      data: {
        content: result.text,
        quality: qualityCheck,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 14. 二维码说明文案
 */
router.post('/generate/qr-description', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { businessName, product, incentive } = req.body;

    const prompt = PROMPTS.qrCodeDescription({
      businessName,
      product,
      incentive
    });

    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('qr_description'),
      temperature: 0.5,
      maxTokens: 300
    });

    res.json({
      success: true,
      data: {
        content: result.text,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== AI 智能体接口 ====================

/**
 * 15. 智能体配置生成
 */
router.post('/generate/intelligent-body', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { purpose, targetAudience, personality, knowledgeDomain } = req.body;

    const prompt = PROMPTS.intelligentBody({
      purpose,
      targetAudience,
      personality,
      knowledgeDomain
    });

    const params = getOptimizedParams('intelligent_body');
    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('intelligent_body'),
      temperature: params.temperature,
      maxTokens: params.maxTokens
    });

    res.json({
      success: true,
      data: {
        content: result.text,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 16. 客服自动回复
 */
router.post('/generate/customer-reply', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { question, product, orderInfo, customerType, replyLength } = req.body;

    const prompt = PROMPTS.customerServiceReply({
      question,
      product,
      orderInfo,
      customerType,
      replyLength
    });

    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('ai_reply'),
      temperature: 0.5,
      maxTokens: 600
    });

    res.json({
      success: true,
      data: {
        content: result.text,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== 数据分析接口 ====================

/**
 * 17. 内容数据分析
 */
router.post('/analyze/content', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform, contentType, metrics, contentTitle } = req.body;

    const prompt = PROMPTS.contentAnalysis({
      platform,
      contentType,
      metrics,
      contentTitle
    });

    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:qwen-plus',
      temperature: 0.5,
      maxTokens: 2000
    });

    res.json({
      success: true,
      data: {
        analysis: result.text,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== 通用工具接口 ====================

/**
 * 18. SEO优化
 */
router.post('/tool/seo', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { content, platform, targetKeywords } = req.body;

    const prompt = PROMPTS.seoOptimization({
      content,
      platform,
      targetKeywords
    });

    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:qwen-plus',
      temperature: 0.5,
      maxTokens: 3000
    });

    res.json({
      success: true,
      data: {
        content: result.text,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 19. 内容改写
 */
router.post('/tool/rewrite', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { originalContent, rewriteType, targetPlatform } = req.body;

    const prompt = PROMPTS.contentRewrite({
      originalContent,
      rewriteType,
      targetPlatform
    });

    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:qwen-plus',
      temperature: 0.7,
      maxTokens: 3000
    });

    res.json({
      success: true,
      data: {
        content: result.text,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 20. 朋友圈文案
 */
router.post('/tool/friend-circle', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { scenario, product, tone } = req.body;

    const prompt = PROMPTS.friendCircle({
      scenario,
      product,
      tone
    });

    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('summary'),
      temperature: 0.7,
      maxTokens: 1000
    });

    res.json({
      success: true,
      data: {
        content: result.text,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 21. 社群运营话术
 */
router.post('/tool/community', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { messageType, communityType, content } = req.body;

    const prompt = PROMPTS.communityMessage({
      messageType,
      communityType,
      content
    });

    const result = await generateWithPrompt(userId, {
      prompt,
      model: 'dashscope:' + selectModel('summary'),
      temperature: 0.6,
      maxTokens: 1000
    });

    res.json({
      success: true,
      data: {
        content: result.text,
        usage: result.usage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== 辅助函数 ====================

// 获取可用模型
async function getAvailableModels(userId: string) {
  const { getModelList } = await import('../services/ai-models');
  return getModelList();
}

// 获取模型列表
function getModelList() {
  return {
    chat: [
      { id: 'dashscope:qwen-max', name: '通义千问 Max', provider: '阿里云百炼', strengths: ['复杂推理', '长文本', '专业领域'] },
      { id: 'dashscope:qwen-plus', name: '通义千问 Plus', provider: '阿里云百炼', strengths: ['通用对话', '文案生成'] },
      { id: 'dashscope:qwen-turbo', name: '通义千问 Turbo', provider: '阿里云百炼', strengths: ['快速响应', '日常对话'] },
      { id: 'dashscope:qwen-2.5-72b-instruct', name: '通义千问 72B', provider: '阿里云百炼', strengths: ['超长上下文', '专业HR'] },
      { id: 'tencent:hunyuan-pro', name: '腾讯混元 Pro', provider: '腾讯云', strengths: ['复杂任务', '深度推理'] },
      { id: 'tencent:hunyuan-instruct', name: '腾讯混元 Instruct', provider: '腾讯云', strengths: ['指令跟随', '对话'] },
      { id: 'tencent:hunyuan-flash', name: '腾讯混元 Flash', provider: '腾讯云', strengths: ['快速响应', '日常对话'] }
    ],
    image: [
      { id: 'dashscope:wanx2.1-t2i-pro', name: '通义万相 Pro', provider: '阿里云百炼' },
      { id: 'tencent:hunyuan-image', name: '混元生图', provider: '腾讯云' }
    ],
    video: [
      { id: 'dashscope:wanx2.1-i2v-pro', name: '通义万相视频 Pro', provider: '阿里云百炼' },
      { id: 'tencent:hunyuan-video', name: '混元视频', provider: '腾讯云' }
    ],
    tts: [
      { id: 'dashscope:cosyvoice', name: '通义语音', provider: '阿里云百炼' },
      { id: 'tencent:hunyuan-tts', name: '混元 TTS', provider: '腾讯云' }
    ]
  };
}

export default router;
