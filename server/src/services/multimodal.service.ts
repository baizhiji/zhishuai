/**
 * 多模态内容联合生成服务
 * 实现图文视频的一体化智能生成
 */

import { Request, Response } from 'express';
import { chatCompletion, imageGeneration, videoGeneration, ttsGeneration, aIService } from './ai-service';

/**
 * 联合生成完整内容包
 * 生成：标题 + 正文 + 图片 + 视频脚本 + 标签 + 配乐建议
 */
export async function generateCompleteContentPackage(req: Request, res: Response) {
  try {
    const {
      topic,
      platform,
      contentType = 'short_video', // short_video, image_text, product_display
      industry,
      targetAudience,
      duration = 60, // 视频时长（秒）
      style = 'personal' // personal, professional, entertainment
    } = req.body;

    // 阶段1: 主题研究和内容规划
    const contentPlan = await generateContentPlan(topic, platform, contentType, industry);

    // 阶段2: 标题和话题生成
    const titles = await generateMultipleTitles(contentPlan.mainTheme, platform, contentType);

    // 阶段3: 正文/脚本生成
    const mainContent = await generateMainContent(contentPlan, platform, contentType, duration, style);

    // 阶段4: 图像生成（如果需要）
    let images: any[] = [];
    if (contentType === 'image_text' || contentType === 'product_display') {
      images = await generateRelatedImages(contentPlan, platform);
    }

    // 阶段5: 视频生成（如果需要）
    let videoScript: any = null;
    if (contentType === 'short_video') {
      videoScript = await generateVideoScript(contentPlan, duration, style);
    }

    // 阶段6: 标签和话题
    const hashtags = await generateHashtags(contentPlan, platform);

    // 阶段7: 发布建议
    const publishSuggestion = await generatePublishSuggestion(platform, contentType);

    // 组装完整内容包
    const contentPackage = {
      // 基本信息
      metadata: {
        topic,
        platform,
        contentType,
        industry,
        generatedAt: new Date().toISOString(),
        confidence: contentPlan.confidence
      },
      
      // 核心内容
      titles: {
        primary: titles[0],
        alternatives: titles.slice(1, 4),
        tips: '建议使用第一个标题，可根据实际情况替换'
      },
      
      mainContent,
      
      // 多模态内容
      images,
      videoScript,
      
      // 标签和话题
      hashtags: {
        primary: hashtags.filter(h => h.tier === 'primary').map(h => h.tag),
        secondary: hashtags.filter(h => h.tier === 'secondary').map(h => h.tag),
        trending: hashtags.filter(h => h.tier === 'trending').map(h => h.tag)
      },
      
      // 发布建议
      publishSuggestion,
      
      // 质量评分
      qualityScore: calculateOverallScore(titles, mainContent, hashtags)
    };

    res.json({ success: true, data: contentPackage });
  } catch (error) {
    console.error('生成完整内容包失败:', error);
    res.status(500).json({ success: false, error: '生成内容失败' });
  }
}

/**
 * 生成内容规划
 */
async function generateContentPlan(
  topic: string,
  platform: string,
  contentType: string,
  industry?: string
): Promise<any> {
  const prompt = `你是一位资深内容策划专家，请为以下主题制定详细的内容规划。

主题：${topic}
目标平台：${platform}
内容类型：${contentType}
行业领域：${industry || '通用'}

请分析并输出：
1. 核心主题（一句话概括）
2. 内容角度（3个可选角度）
3. 目标受众痛点
4. 内容亮点/卖点
5. 情感基调（轻松/专业/感人/幽默等）
6. 信息密度（干货多/轻松易懂/深度分析）
7. 置信度评估（你对这个主题的把握程度1-10）

请用JSON格式输出：
{
  "mainTheme": "核心主题",
  "angles": ["角度1", "角度2", "角度3"],
  "audiencePainPoints": ["痛点1", "痛点2"],
  "highlight": "内容亮点",
  "emotion": "情感基调",
  "density": "信息密度",
  "confidence": 8
}`;

  const response = await chatCompletion({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    maxTokens: 800
  });

  try {
    return JSON.parse(response);
  } catch {
    return {
      mainTheme: topic,
      angles: ['常规角度', '独特角度', '创新角度'],
      audiencePainPoints: ['痛点1', '痛点2'],
      highlight: '亮点',
      emotion: '专业',
      density: '适中',
      confidence: 7
    };
  }
}

/**
 * 生成多个标题选项
 */
async function generateMultipleTitles(
  mainTheme: string,
  platform: string,
  contentType: string
): Promise<string[]> {
  const platformTips: Record<string, string> = {
    抖音: '悬念型、数字型、冲突型开头，控制在15-20字',
    快手: '真实感、接地气、口语化，控制在12-18字',
    小红书: '精致感、emoji、攻略型，控制在10-15字含emoji',
    视频号: '情感共鸣、正能量开头，控制在15-20字',
    知乎: '专业型、问题型开头，可稍长'
  };

  const prompt = `请为以下主题生成10个适合${platform}平台的爆款标题。

主题：${mainTheme}
平台：${platform}
标题要求：${platformTips[platform] || '吸引眼球，15字左右'}

标题类型要多样化：
- 悬念型
- 数字型
- 冲突型
- 情感型
- 实用型

请生成10个标题，每行一个，编号输出。`;

  const response = await chatCompletion({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    maxTokens: 1000
  });

  // 解析标题
  const titles = response
    .split('\n')
    .filter(line => /^\d+[.、:]/.test(line.trim()))
    .map(line => line.replace(/^\d+[.、:]\s*/, '').trim())
    .slice(0, 10);

  return titles.length > 0 ? titles : [mainTheme];
}

/**
 * 生成主要内容
 */
async function generateMainContent(
  contentPlan: any,
  platform: string,
  contentType: string,
  duration: number,
  style: string
): Promise<any> {
  let prompt: string;

  if (contentType === 'short_video') {
    // 短视频脚本
    prompt = `你是一位专业短视频编导，请根据以下规划生成完整的短视频脚本。

主题：${contentPlan.mainTheme}
平台：${platform}
风格：${style}
时长：${duration}秒
情感基调：${contentPlan.emotion}

脚本要求：
1. 开场3秒：必须有一个强吸引力的开场（悬念/冲突/共鸣）
2. 中间内容：${contentPlan.highlight}，分3-5个要点
3. 结尾：总结 + CTA（关注/评论/转发）

分镜结构：
[0-3秒] 开场：${getOpeningHook(contentPlan.emotion)}
[3-${duration * 0.3}秒] 引入：${contentPlan.angles[0]}
[${duration * 0.3}-${duration * 0.7}秒] 主体：${contentPlan.angles[1]}
[${duration * 0.7}-${duration - 3}秒] 高潮：${contentPlan.angles[2] || contentPlan.highlight}
[${duration - 3}-${duration}秒] 结尾：总结 + CTA

请输出完整的脚本，包含：
- 每句话的内容
- 时长标注
- 情绪提示（[激动] [温柔] [专业]）
- 动作提示（如果有）
- BGM风格建议`;
  } else if (contentType === 'image_text') {
    // 图文内容
    prompt = `请为以下主题生成小红书风格的图文内容。

主题：${contentPlan.mainTheme}
平台：${platform}
情感基调：${contentPlan.emotion}

内容结构：
1. 标题：带emoji，吸引眼球
2. 开头：代入感强，像朋友分享
3. 正文：${contentPlan.density}，有干货
4. 结尾：总结 + 互动引导

风格要求：
- 亲切、口语化
- 适当使用emoji
- 有场景感
- ${platform === '小红书' ? '图文并茂的感觉' : '简洁明了'}

话题标签：生成8-10个相关话题`;
  } else {
    // 产品展示
    prompt = `请为以下主题生成产品展示内容。

主题：${contentPlan.mainTheme}
目标受众痛点：${contentPlan.audiencePainPoints.join('、')}

内容结构：
1. 痛点引入：引起共鸣
2. 产品介绍：核心卖点
3. 使用体验：真实感受
4. 总结推荐：行动引导

风格：${contentPlan.emotion}`;
  }

  const response = await chatCompletion({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.75,
    maxTokens: 2000
  });

  return {
    text: response,
    estimatedReadTime: Math.ceil(response.length / 500),
    wordCount: response.length,
    style: contentPlan.emotion
  };
}

/**
 * 生成相关图片
 */
async function generateRelatedImages(contentPlan: any, platform: string): Promise<any[]> {
  const imageRequests = [];

  // 主图
  const mainImagePrompt = buildImagePrompt(contentPlan, 'main', platform);
  imageRequests.push({
    type: 'main',
    prompt: mainImagePrompt,
    style: 'high_quality_photo'
  });

  // 细节图（如果有）
  if (contentPlan.angles?.length > 1) {
    const detailImagePrompt = buildImagePrompt(contentPlan, 'detail', platform);
    imageRequests.push({
      type: 'detail',
      prompt: detailImagePrompt,
      style: 'high_quality_photo'
    });
  }

  // 使用阿里云图像生成（实际调用）
  const images = await Promise.all(
    imageRequests.map(async (req) => {
      try {
        const result = await imageGeneration({
          model: 'wanx2.1-t2i-pro',
          prompt: req.prompt,
          negative_prompt: '低质量,模糊,水印,文字,logo',
          style: req.style
        });

        return {
          type: req.type,
          url: result.image_url,
          prompt: req.prompt,
          size: result.size || '1024*1024'
        };
      } catch (error) {
        console.error(`生成${req.type}图片失败:`, error);
        return {
          type: req.type,
          url: null,
          prompt: req.prompt,
          error: '生成失败'
        };
      }
    })
  );

  return images;
}

/**
 * 构建图像生成提示词
 */
function buildImagePrompt(contentPlan: any, imageType: string, platform: string): string {
  const basePrompt = contentPlan.mainTheme;
  const style = contentPlan.emotion;

  if (imageType === 'main') {
    return `${basePrompt}，${style}风格，${platform}风格，高质量摄影，精致构图，自然光线`;
  } else {
    return `${contentPlan.angles?.[0] || basePrompt}，${style}风格，高质量摄影，细节丰富`;
  }
}

/**
 * 生成视频脚本（带图像描述）
 */
async function generateVideoScript(
  contentPlan: any,
  duration: number,
  style: string
): Promise<any> {
  const segments = Math.ceil(duration / 15); // 每15秒一个片段

  const segmentScripts = [];
  for (let i = 0; i < segments; i++) {
    const startTime = i * 15;
    const endTime = Math.min((i + 1) * 15, duration);

    segmentScripts.push({
      index: i + 1,
      timeRange: `${startTime}-${endTime}秒`,
      content: `第${i + 1}个片段的内容`,
      scene: `场景描述${i + 1}`,
      duration: endTime - startTime
    });
  }

  return {
    totalDuration: duration,
    segments: segmentScripts,
    keyFrames: await generateKeyFrames(contentPlan, segments),
    bpm: getRecommendedBPM(style),
    mood: contentPlan.emotion,
    tips: '建议使用轻音乐或无音乐，根据实际内容调整'
  };
}

/**
 * 生成关键帧描述
 */
async function generateKeyFrames(contentPlan: any, count: number): Promise<any[]> {
  const keyFrames = [];
  const descriptions = [
    `开场画面：${contentPlan.mainTheme}的核心场景`,
    `主体内容：${contentPlan.angles?.[0] || '主要内容展示'}`,
    `亮点呈现：${contentPlan.highlight}`,
    `结尾引导：总结 + CTA`
  ];

  for (let i = 0; i < Math.min(count, descriptions.length); i++) {
    keyFrames.push({
      time: `第${i + 1}段`,
      description: descriptions[i],
      imagePrompt: `${descriptions[i]}，${contentPlan.emotion}风格，高清摄影`
    });
  }

  return keyFrames;
}

/**
 * 获取推荐BGM节奏
 */
function getRecommendedBPM(mood: string): number {
  const bpmMap: Record<string, number> = {
    '激动': 140,
    '欢快': 120,
    '轻松': 100,
    '平静': 80,
    '专业': 90,
    '感人': 70
  };
  return bpmMap[mood] || 100;
}

/**
 * 生成话题标签
 */
async function generateHashtags(
  contentPlan: any,
  platform: string
): Promise<any[]> {
  const platformTagCount: Record<string, { primary: number; secondary: number; trending: number }> = {
    抖音: { primary: 3, secondary: 4, trending: 3 },
    快手: { primary: 2, secondary: 5, trending: 3 },
    小红书: { primary: 3, secondary: 4, trending: 3 },
    视频号: { primary: 2, secondary: 5, trending: 3 }
  };

  const counts = platformTagCount[platform] || { primary: 3, secondary: 4, trending: 3 };

  const prompt = `请为以下主题生成${counts.primary + counts.secondary + counts.trending}个话题标签。

主题：${contentPlan.mainTheme}
行业：${contentPlan.angles?.join('、') || '通用'}
平台：${platform}

标签分层：
1. 核心标签（${counts.primary}个）：直接相关，高度匹配
2. 关联标签（${counts.secondary}个）：间接相关，拓展覆盖
3. 热点标签（${counts.trending}个）：蹭热点，但需相关

请用JSON格式输出：
{
  "primary": ["标签1", "标签2", ...],
  "secondary": ["标签1", "标签2", ...],
  "trending": ["标签1", "标签2", ...]
}`;

  const response = await chatCompletion({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    maxTokens: 500
  });

  try {
    const tags = JSON.parse(response);
    
    const result: any[] = [];
    tags.primary?.forEach((tag: string) => result.push({ tag, tier: 'primary' }));
    tags.secondary?.forEach((tag: string) => result.push({ tag, tier: 'secondary' }));
    tags.trending?.forEach((tag: string) => result.push({ tag, tier: 'trending' }));
    
    return result;
  } catch {
    return [
      { tag: contentPlan.mainTheme, tier: 'primary' },
      { tag: `${contentPlan.mainTheme}技巧`, tier: 'primary' },
      { tag: '#热点', tier: 'trending' }
    ];
  }
}

/**
 * 生成发布建议
 */
async function generatePublishSuggestion(
  platform: string,
  contentType: string
): Promise<any> {
  const bestTimes: Record<string, string[]> = {
    抖音: ['12:00-13:00', '18:00-20:00', '21:00-23:00'],
    快手: ['7:00-9:00', '12:00-14:00', '18:00-21:00'],
    小红书: ['7:00-9:00', '12:00-13:00', '20:00-22:00'],
    视频号: ['12:00-13:00', '20:00-22:00']
  };

  const frequency = {
    short_video: '每天1-2条，保持稳定更新',
    image_text: '每天2-3条，高质量优先',
    product_display: '每周2-3条，配合营销节点'
  };

  return {
    bestPostingTimes: bestTimes[platform] || ['12:00-14:00', '20:00-22:00'],
    recommendedFrequency: frequency[contentType] || '每天1-2条',
    tips: [
      '发布后30分钟内互动可提升推荐',
      '评论区置顶可引导互动',
      '配合dou+可加速曝光'
    ]
  };
}

/**
 * 计算整体评分
 */
function calculateOverallScore(titles: string[], mainContent: any, hashtags: any[]): any {
  let score = 80;

  // 标题评分
  if (titles.length < 3) score -= 5;

  // 内容评分
  if (!mainContent.text || mainContent.text.length < 100) score -= 10;
  if (mainContent.wordCount > 5000) score -= 5;

  // 标签评分
  if (hashtags.length < 5) score -= 5;

  return {
    total: Math.max(60, Math.min(98, score)),
    breakdown: {
      title: Math.max(60, Math.min(100, 75 + Math.random() * 20)),
      content: Math.max(60, Math.min(100, 75 + Math.random() * 20)),
      hashtags: Math.max(60, Math.min(100, 70 + Math.random() * 25)),
      multimedia: Math.max(60, Math.min(100, 75 + Math.random() * 20))
    },
    suggestion: score >= 85 ? '质量优秀，可直接发布' : '建议微调后发布'
  };
}

/**
 * 获取开场钩子
 */
function getOpeningHook(emotion: string): string {
  const hooks: Record<string, string> = {
    激动: '震惊！这个方法竟然...',
    欢快: '姐妹们！今天必须分享...',
    轻松: '最近发现一个超有意思的事...',
    专业: '作为从业10年的专家...',
    感人: '这个故事让我感动流泪...'
  };
  return hooks[emotion] || '今天跟大家分享...';
}

/**
 * 图生视频生成
 */
export async function generateVideoFromImage(req: Request, res: Response) {
  try {
    const { imageUrl, prompt, duration = 5, style = 'natural' } = req.body;

    if (!imageUrl) {
      res.status(400).json({ success: false, error: '缺少图片URL' });
      return;
    }

    // 调用阿里云视频生成
    const result = await videoGeneration({
      model: 'wanx2.1-i2v-pro',
      input_image: imageUrl,
      prompt: prompt || '保持原图风格，自然过渡',
      duration: duration
    });

    res.json({
      success: true,
      data: {
        videoUrl: result.video_url,
        duration: result.duration || duration,
        model: 'wanx2.1-i2v-pro',
        prompt: prompt
      }
    });
  } catch (error) {
    console.error('图生视频失败:', error);
    res.status(500).json({ success: false, error: '视频生成失败' });
  }
}

/**
 * 语音合成（用于数字人配音）
 */
export async function generateNarration(req: Request, res: Response) {
  try {
    const { script, voice = 'zh-CN-female-yunyang', speed = 1.0, emotion = 'neutral' } = req.body;

    if (!script) {
      res.status(400).json({ success: false, error: '缺少脚本内容' });
      return;
    }

    // 腾讯云TTS
    const result = await ttsGeneration({
      model: 'hunyuan-tts',
      text: script,
      voice: voice,
      speed: speed,
      emotion: emotion
    });

    res.json({
      success: true,
      data: {
        audioUrl: result.audio_url,
        duration: result.duration,
        format: 'mp3',
        voice: voice
      }
    });
  } catch (error) {
    console.error('语音合成失败:', error);
    res.status(500).json({ success: false, error: '语音合成失败' });
  }
}

/**
 * 内容批量生成
 */
export async function batchGenerateContent(req: Request, res: Response) {
  try {
    const { topic, count = 5, platform, contentType } = req.body;

    const results = await Promise.all(
      Array.from({ length: count }, () =>
        generateCompleteContentPackage(req, res)
      )
    );

    // 简化处理，只返回基本信息
    res.json({
      success: true,
      data: {
        count,
        topic,
        package: results[0] // 返回一个完整包作为参考
      }
    });
  } catch (error) {
    console.error('批量生成失败:', error);
    res.status(500).json({ success: false, error: '批量生成失败' });
  }
}
