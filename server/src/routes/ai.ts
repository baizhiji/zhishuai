/**
 * AI 能力路由
 * 提供统一的 AI 调用接口
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getAvailableModels, chatCompletion, generateImage, textToSpeech } from '../services/ai-service';
import { getModelList } from '../services/ai-models';

const router = Router();

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

// 预设的 AI 功能接口

// 1. 内容生成（标题、文案、话题标签等）
router.post('/generate/content', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { type, topic, keywords, platform } = req.body;
    
    // 根据类型选择合适的提示词
    const prompts: Record<string, string> = {
      title: `请为以下主题生成10个吸引人的短视频标题，每个标题不超过30字：\n主题：${topic}\n关键词：${keywords || ''}\n格式：每行一个标题`,
      hashtags: `请为以下主题生成15个适合${platform || '短视频'}平台的话题标签（带#号）：\n主题：${topic}\n格式：#话题1 #话题2 ...`,
      script: `请为以下主题生成一个短视频脚本，包含开场、主体、结尾：\n主题：${topic}\n要求：时长约60秒，语言生动有趣，适合短视频平台`,
      description: `请为以下产品生成一段小红书风格的推广文案：\n产品：${topic}\n要求：包含emoji表情，适当话题标签，吸引人阅读`,
      adCopy: `请为以下产品/服务生成一段广告文案：\n产品/服务：${topic}\n要求：简洁有力，突出卖点，适合朋友圈传播`
    };
    
    const result = await chatCompletion(userId, {
      model: 'dashscope:qwen-plus',
      messages: [
        { role: 'user', content: prompts[type] || prompts.script }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. 图片生成
router.post('/generate/image', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { prompt, style, size, platform } = req.body;
    
    // 优化提示词
    let enhancedPrompt = prompt;
    if (style) {
      enhancedPrompt += `，${style}风格`;
    }
    if (platform) {
      enhancedPrompt += `，适合${platform}平台`;
    }
    
    const result = await generateImage(userId, {
      model: 'dashscope:wanx2.1-t2i-pro',
      prompt: enhancedPrompt,
      image_size: size || '1024x1024',
      n: 1
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. 视频脚本生成
router.post('/generate/video-script', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topic, duration, style, platform } = req.body;
    
    const prompt = `请为以下主题生成一个${duration || 60}秒的短视频脚本：

主题：${topic}
风格：${style || '活泼有趣'}
平台：${platform || '抖音/快手'}

要求：
1. 分镜头脚本，包含景别、时长、画面描述
2. 包含配音文字
3. 包含背景音乐建议
4. 包含字幕建议
5. 总时长控制在${duration || 60}秒左右`;

    const result = await chatCompletion(userId, {
      model: 'dashscope:qwen-plus',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. 评论回复生成
router.post('/generate/reply', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { comment, context, tone } = req.body;
    
    const prompt = `请根据以下评论生成3个不同风格的回复：

原始评论：${comment}
${context ? `上下文：${context}` : ''}
语气：${tone || '友好热情'}

要求：
1. 每个回复不超过50字
2. 符合短视频平台风格
3. 可以引导关注或私信
4. 3个回复风格要有差异`;

    const result = await chatCompletion(userId, {
      model: 'dashscope:qwen-plus',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 500
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. 招聘JD生成
router.post('/generate/job-description', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { jobTitle, requirements, benefits, salary } = req.body;
    
    const prompt = `请生成一份完整的招聘JD：

职位：${jobTitle}
要求：${requirements || '无'}
福利：${benefits || '无'}
薪资：${salary || '面议'}

要求：
1. 职位描述（工作内容）
2. 任职要求（硬性条件）
3. 加分项
4. 福利待遇
5. 发展机会
6. 适合人群`;

    const result = await chatCompletion(userId, {
      model: 'dashscope:qwen-plus',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. 简历分析
router.post('/analyze/resume', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { resume, jobRequirement } = req.body;
    
    const prompt = `请分析以下简历是否符合招聘要求：

简历内容：
${resume}

岗位要求：
${jobRequirement}

分析内容：
1. 简历与岗位的匹配度（0-100分）
2. 优势亮点
3. 不足之处
4. 建议问题（面试时重点问）
5. 是否推荐录用`;

    const result = await chatCompletion(userId, {
      model: 'dashscope:qwen-plus',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1500
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. 获客话术生成
router.post('/generate/sales-pitch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { product, targetAudience, goal } = req.body;
    
    const prompt = `请为以下产品生成引流话术：

产品/服务：${product}
目标人群：${targetAudience || '潜在客户'}
目标：${goal || '吸引咨询'}

要求：
1. 开场白（引起注意）
2. 价值介绍（突出卖点）
3. 信任背书
4. 行动号召（引导私信/扫码）
5. 备用话术（3个不同角度）`;

    const result = await chatCompletion(userId, {
      model: 'dashscope:qwen-plus',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 2000
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
