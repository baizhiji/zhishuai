/**
 * AI Routes - 真实AI调用版本
 * 所有生成函数均调用腾讯云TokenHub / 阿里云百炼 API
 * 生成内容自动保存到素材库
 */
import { Router, Request, Response } from 'express';
import { prisma } from '../utils/db';
import { authMiddleware } from '../middleware/auth';
import {
  chatCompletion,
  chatCompletionFull,
  generateImage as aiGenerateImage,
  generateVideo,
  generateDigitalHumanVideo,
  analyzeImage,
  analyzeVideo,
  textToSpeech,
  getTaskStatus,
  checkAIServiceAvailability,
} from '../services/ai-service';
import { analyzeAndSelectModel, getTaskTypeName } from '../services/ai-model-router';

const router = Router();
// ============ 检查AI服务可用性 ============

router.get('/availability', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const result = await checkAIServiceAvailability(userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ 内容创作 ============

type CreateType = 'title' | 'topic' | 'copywriting' | 'image_to_text' |
                  'xhs_image' | 'image_generate' | 'product_detail' |
                  'short_video' | 'video_parse' | 'digital_human' | 'video_generate';

// AI创作 - 统一入口
router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { type, params } = req.body;

    // 先检查AI服务是否可用
    const availability = await checkAIServiceAvailability(userId);
    if (!availability.available) {
      res.json({
        success: false,
        error: '请先在"账号与配置 > API服务商配置"中配置API Key（腾讯云TokenHub或阿里云百炼）',
        data: null,
      });
      return;
    }

    let result = '';
    let materialType = type;
    let materialFileUrl: string | undefined;

    switch (type) {
      case 'title':
        result = await generateTitle(userId, params);
        break;
      case 'topic':
        result = await generateTopic(userId, params);
        break;
      case 'copywriting':
        result = await generateCopywriting(userId, params);
        break;
      case 'image_to_text':
        result = await generateImageToText(userId, params);
        break;
      case 'xhs_image':
        result = await generateXHSContent(userId, params);
        break;
      case 'image_generate': {
        const imgResult = await generateImageReal(userId, params);
        result = imgResult.text;
        materialFileUrl = imgResult.url;
        materialType = 'image';
        break;
      }
      case 'product_detail':
        result = await generateProductDetail(userId, params);
        break;
      case 'short_video':
        result = await generateShortVideoScript(userId, params);
        break;
      case 'video_parse':
        result = await parseVideoReal(userId, params);
        break;
      case 'digital_human': {
        const dhResult = await generateDigitalHumanReal(userId, params);
        result = dhResult.text;
        break;
      }
      case 'video_generate': {
        const vResult = await generateVideoReal(userId, params);
        result = vResult.text;
        break;
      }
      default:
        result = '未知的生成类型';
    }

    // 自动保存到素材库
    const material = await prisma.material.create({
      data: {
        userId,
        title: `${getTypeName(type)}-${Date.now()}`,
        type: materialType,
        content: result,
        fileUrl: materialFileUrl,
        status: 'unused',
      },
    });

    res.json({ success: true, data: { result, materialId: material.id, fileUrl: materialFileUrl } });
  } catch (error: any) {
    console.error('[AI Generate] 错误:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ AI Chat ============

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { messages, model, temperature, max_tokens, conversationId } = req.body;

    // 检查可用性
    const availability = await checkAIServiceAvailability(userId);
    if (!availability.available) {
      res.json({
        code: 200,
        message: '请先配置API Key',
        data: {
          result: '请先在"账号与配置 > API服务商配置"中配置API Key（腾讯云TokenHub或阿里云百炼），才能使用AI对话功能。',
          needConfig: true,
        },
      });
      return;
    }

    const result = await chatCompletion(userId, {
      model,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens ?? 4096,
    });

    // 保存消息到对话记录
    if (conversationId) {
      try {
        await prisma.chatMessage.create({
          data: {
            conversationId,
            role: 'assistant',
            content: result,
          },
        });
        await prisma.chatConversation.update({
          where: { id: conversationId },
          data: { lastMessage: result.substring(0, 100), messageCount: { increment: 1 } },
        });
      } catch {
        // 对话记录保存失败不影响返回
      }
    }

    res.json({ code: 200, message: 'success', data: { result } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ============ 图片生成 ============

router.post('/image', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { prompt, size, n } = req.body;

    const { urls } = await aiGenerateImage(userId, { prompt, size, n: n || 1 });

    res.json({ code: 200, message: 'success', data: { urls } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ============ TTS ============

router.post('/tts', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { text, voice, speed } = req.body;

    const { audioUrl } = await textToSpeech(userId, { text, voice, speed });

    res.json({ code: 200, message: 'success', data: { audioUrl } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ============ 异步任务状态查询 ============

router.get('/task/:taskId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { taskId } = req.params;
    const { provider } = req.query;

    const result = await getTaskStatus(userId, taskId, (provider as 'tokenhub' | 'dashscope') || 'tokenhub');

    // 如果任务完成，更新视频任务记录
    if (result.status === 'succeeded' || result.status === 'completed') {
      await prisma.videoTask.updateMany({
        where: { id: taskId },
        data: {
          status: 'completed',
          videoUrl: result.resultUrl,
          completedAt: new Date(),
        },
      });

      // 同时更新素材库
      const task = await prisma.videoTask.findFirst({ where: { id: taskId } });
      if (task) {
        await prisma.material.updateMany({
          where: { userId, content: { contains: taskId }, type: { in: ['digital_human', 'video_generate', 'short_video'] } },
          data: { fileUrl: result.resultUrl, status: 'unused' },
        });
      }
    } else if (result.status === 'failed') {
      await prisma.videoTask.updateMany({
        where: { id: taskId },
        data: { status: 'failed', errorMessage: '生成失败' },
      });
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 获取创作历史 ============

router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { type, page = 1, pageSize = 20 } = req.query;

    const where: any = { userId };
    if (type) where.type = type;

    const records = await prisma.material.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.material.count({ where });

    res.json({
      success: true,
      data: { list: records, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ 模型列表 ============

router.get('/models', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { provider } = req.query;
    const models = await import('../services/ai-service').then(m => m.getAvailableModels(
      userId,
      provider as 'tokenhub' | 'dashscope' | undefined
    ));
    res.json({ success: true, data: models });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 内部生成函数（调用真实AI API） ============

async function generateTitle(userId: string, params: any): Promise<string> {
  const { description, count = 5, platform } = params;
  return chatCompletion(userId, {
    messages: [
      {
        role: 'system',
        content: `你是一个自媒体爆款标题专家。根据用户描述生成${count}个高点击率的标题。每个标题一行，15-25字，使用悬念、数字、冲突、情感等技巧。${platform ? `目标平台：${platform}` : ''}`,
      },
      { role: 'user', content: `请为以下内容生成${count}个爆款标题：${description}` },
    ],
    temperature: 0.9,
    max_tokens: 2048,
  });
}

async function generateTopic(userId: string, params: any): Promise<string> {
  const { description, count = 10, platform } = params;
  return chatCompletion(userId, {
    messages: [
      {
        role: 'system',
        content: `你是一个话题标签专家。根据内容描述生成${count}个热门话题标签，每个标签以#开头。${platform ? `目标平台：${platform}，请根据该平台的标签习惯生成。` : ''}`,
      },
      { role: 'user', content: `请为以下内容生成${count}个热门话题标签：${description}` },
    ],
    temperature: 0.8,
    max_tokens: 2048,
  });
}

async function generateCopywriting(userId: string, params: any): Promise<string> {
  const { description, style, wordCount, platform } = params;
  return chatCompletion(userId, {
    messages: [
      {
        role: 'system',
        content: `你是一个专业文案撰写专家。请根据要求撰写${style || '专业'}风格的文案。${wordCount ? `字数要求：约${wordCount}字。` : ''}${platform ? `目标平台：${platform}，请符合该平台的内容风格。` : ''}`,
      },
      { role: 'user', content: `请撰写以下内容的文案：${description}` },
    ],
    temperature: 0.8,
    max_tokens: wordCount ? Math.min(wordCount * 2, 4096) : 2048,
  });
}

async function generateImageToText(userId: string, params: any): Promise<string> {
  const { imageUrl, prompt } = params;
  return analyzeImage(userId, {
    imageUrl,
    prompt: prompt || '请详细描述这张图片的内容，包括主体、场景、色调、风格等信息，并生成适合发布到自媒体的文案描述。',
  });
}

async function generateXHSContent(userId: string, params: any): Promise<string> {
  const { description, style } = params;
  return chatCompletion(userId, {
    messages: [
      {
        role: 'system',
        content: '你是一个小红书爆款内容专家。请生成符合小红书风格的图文内容：包含吸引眼球的标题、emoji表情、分段描述、热门话题标签。文案风格要活泼、种草感强。',
      },
      {
        role: 'user',
        content: `请为以下内容生成小红书风格的图文笔记：${description}。${style ? `风格：${style}` : ''}`,
      },
    ],
    temperature: 0.85,
    max_tokens: 2048,
  });
}

async function generateImageReal(userId: string, params: any): Promise<{ text: string; url?: string }> {
  const { prompt, size, count } = params;
  try {
    const { urls } = await aiGenerateImage(userId, {
      prompt,
      size: size || '1024x1024',
      n: count || 1,
    });
    return {
      text: `图片生成成功！已生成${urls.length}张图片，已保存到素材库。`,
      url: urls[0],
    };
  } catch (error: any) {
    return { text: `图片生成失败：${error.message}。请检查API Key配置和额度。` };
  }
}

async function generateProductDetail(userId: string, params: any): Promise<string> {
  const { productName, features, description } = params;
  return chatCompletion(userId, {
    messages: [
      {
        role: 'system',
        content: '你是一个电商详情页文案专家。请生成完整的电商产品详情页文案，包括：产品亮点、核心卖点（3-5个）、使用场景、用户评价示例、购买引导。文案要突出产品优势，激发购买欲望。',
      },
      {
        role: 'user',
        content: `产品名称：${productName}\n${features ? `特点：${features}` : ''}\n${description ? `描述：${description}` : ''}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });
}

async function generateShortVideoScript(userId: string, params: any): Promise<string> {
  const { description, duration = 60, platform, style } = params;
  return chatCompletion(userId, {
    messages: [
      {
        role: 'system',
        content: `你是一个短视频脚本编剧专家。请生成${duration}秒的短视频脚本，包含：开场吸引（前3秒）、正文内容、高潮转折、结尾引导。${platform ? `目标平台：${platform}。` : ''}${style ? `风格：${style}。` : ''}请给出分镜描述、台词/旁白、画面建议。`,
      },
      { role: 'user', content: `请为以下内容生成短视频脚本：${description}` },
    ],
    temperature: 0.8,
    max_tokens: 3000,
  });
}

async function parseVideoReal(userId: string, params: any): Promise<string> {
  const { videoUrl, prompt } = params;

  // 如果有视频URL，调用视频理解API
  if (videoUrl) {
    try {
      return await analyzeVideo(userId, {
        videoUrl,
        prompt: prompt || '请分析这个视频的内容，包括：视频主题、关键画面描述、文案/对白内容、视频风格、适合的目标受众，并给出如何制作类似爆款视频的建议。',
      });
    } catch (error: any) {
      return `视频解析失败：${error.message}。请检查视频链接是否正确，以及API Key配置。`;
    }
  }

  return '请提供视频链接进行解析。';
}

async function generateDigitalHumanReal(userId: string, params: any): Promise<{ text: string }> {
  const { script, digitalHumanId, audioUrl } = params;

  try {
    const result = await generateDigitalHumanVideo(userId, {
      script,
      digitalHumanId,
      audioUrl,
    });

    // 创建视频任务记录
    await prisma.videoTask.create({
      data: {
        userId,
        humanId: digitalHumanId || null,
        title: `数字人口播-${Date.now()}`,
        script,
        status: 'processing',
      },
    });

    return {
      text: `数字人视频生成任务已提交！任务ID: ${result.taskId}，状态: ${result.status}。视频生成需要一些时间，请稍后在素材库中查看结果。`,
    };
  } catch (error: any) {
    return { text: `数字人视频生成失败：${error.message}。请检查API Key配置和额度。` };
  }
}

async function generateVideoReal(userId: string, params: any): Promise<{ text: string }> {
  const { prompt, duration, resolution, model } = params;

  try {
    const result = await generateVideo(userId, {
      prompt,
      model,
      duration,
      resolution,
    });

    // 创建视频任务记录
    await prisma.videoTask.create({
      data: {
        userId,
        title: `AI视频生成-${Date.now()}`,
        script: prompt,
        status: 'processing',
      },
    });

    return {
      text: `视频生成任务已提交！任务ID: ${result.taskId}，状态: ${result.status}。视频生成需要一些时间，请稍后在素材库中查看结果。`,
    };
  } catch (error: any) {
    return { text: `视频生成失败：${error.message}。请检查API Key配置和额度。` };
  }
}

// ============ 辅助函数 ============

function getTypeName(type: string): string {
  const names: Record<string, string> = {
    title: '标题生成',
    topic: '话题标签',
    copywriting: '文案生成',
    image_to_text: '图转文',
    xhs_image: '小红书图文',
    image_generate: '图片生成',
    product_detail: '电商详情',
    short_video: '短视频脚本',
    video_parse: '视频解析',
    digital_human: '数字人视频',
    video_generate: '视频生成',
  };
  return names[type] || 'AI创作';
}

export default router;
