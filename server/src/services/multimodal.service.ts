/**
 * Multimodal Service — 多模态内容处理
 * 使用统一 AI 客户端 (腾讯云TokenHub/阿里云百炼)
 */
import { chatCompletion, generateImage } from './ai-client';

export interface MultimodalInput {
  type: 'image' | 'video' | 'text';
  url?: string;
  content?: string;
}

export interface MultimodalOutput {
  description?: string;
  title?: string;
  hashtags?: string[];
  script?: string;
  imageUrl?: string;
}

/**
 * 处理多模态输入并生成内容
 */
export async function processMultimodal(
  userId: string,
  input: MultimodalInput
): Promise<MultimodalOutput> {
  const { type, url, content } = input;
  let prompt = '';
  let systemPrompt = '';
  let platform: 'xiaohongshu' | 'douyin' = 'xiaohongshu';

  if (type === 'image' && url) {
    platform = 'xiaohongshu';
    systemPrompt = '你是一个专业的内容创作助手。请根据图片内容进行精准分析，输出适合社交媒体发布的内容。';
    prompt = `请分析这张图片（${url}），生成以下内容：
1. 图片详细描述（视觉元素、色调、构图、氛围）
2. 3个适合小红书/朋友圈的标题（15-25字）
3. 5个相关热门标签（以#开头）
4. 一段100字左右的配图文案`;
  } else if (type === 'video' && url) {
    platform = 'douyin';
    systemPrompt = '你是一个短视频内容分析专家。请根据视频内容进行精准分析。';
    prompt = `请分析这个视频（${url}），生成以下内容：
1. 视频核心内容概述
2. 关键高光时刻描述（2-3处）
3. 3个适合抖音的标题（15-25字）
4. 5个相关热门标签（以#开头）
5. 一段60字左右的视频简介`;
  } else if (content) {
    platform = 'xiaohongshu';
    systemPrompt = '你是一个专业的内容创作助手。擅长根据用户输入生成高质量的社交媒体内容。';
    prompt = `请根据以下内容生成社交媒体发布素材：
原始内容：${content}

请生成：
1. 一段吸引人的标题（20-30字）
2. 一篇结构完整的社交媒体帖子（150-300字）
3. 5-8个相关标签`;
  } else {
    return {
      description: '请提供图片URL、视频URL或文本内容',
      title: '',
      hashtags: [],
      script: '',
    };
  }

  const result = await chatCompletion(userId, {
    model: 'qwen3.8-max',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2048,
    platform,
  });

  // 解析生成的内容
  const hashtags = (result.match(/#\S+/g) || []).slice(0, 8);
  const lines = result.split('\n').filter(l => l.trim());

  return {
    description: result,
    title: lines[0] || '生成标题',
    hashtags: hashtags.length > 0 ? hashtags : ['#内容创作', '#AI', '#干货'],
    script: result,
  };
}

export default { processMultimodal };
