/**
 * 多模态联合生成服务
 */

import { generateTitlePrompt, generateScriptPrompt, generateHashtagsPrompt } from './ai-prompts';
import { chatCompletion } from './ai-service';

/**
 * 生成完整内容包
 */
export async function generateContentPackage(params: {
  topic: string;
  platform: string;
  contentType: 'video' | 'image' | 'text';
}): Promise<{
  titles: string[];
  content: string;
  hashtags: string[];
  script?: string;
}> {
  // 生成标题
  const titlePrompt = generateTitlePrompt(params.topic, params.platform);
  const titleResult = await chatCompletion([
    { role: 'user', content: titlePrompt + '\n\n生成5个标题' }
  ]);

  // 生成正文
  const contentPrompt = `生成一篇关于"${params.topic}"的${params.platform}平台内容`;
  const contentResult = await chatCompletion([
    { role: 'user', content: contentPrompt }
  ]);

  // 生成标签
  const hashtagPrompt = generateHashtagsPrompt(params.topic, params.platform, 10);
  const hashtagResult = await chatCompletion([
    { role: 'user', content: hashtagPrompt }
  ]);

  return {
    titles: titleResult.split('\n').filter(Boolean),
    content: contentResult,
    hashtags: hashtagResult.split('\n').filter(Boolean)
  };
}

/**
 * 图生视频
 */
export async function imageToVideo(imageUrl: string): Promise<{ videoUrl: string }> {
  // TODO: 接入视频生成 API
  return { videoUrl: imageUrl.replace('.jpg', '.mp4') };
}

/**
 * 语音合成
 */
export async function synthesizeSpeech(text: string, voice?: string): Promise<{ audioUrl: string }> {
  // TODO: 接入语音合成 API
  return { audioUrl: 'placeholder_audio.mp3' };
}

export default { generateContentPackage, imageToVideo, synthesizeSpeech };
