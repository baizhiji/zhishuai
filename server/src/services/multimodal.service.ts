/**
 * Multimodal Service - Simplified version
 */
import { chatCompletion } from './ai-service';

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
}

/**
 * Process multimodal input and generate content
 */
export async function processMultimodal(input: MultimodalInput): Promise<MultimodalOutput> {
  const { type, url, content } = input;
  
  let prompt = '';
  
  if (type === 'image' && url) {
    prompt = `Analyze this image and generate: a description, 3 titles, 5 hashtags, and a short script for social media.`;
  } else if (type === 'video' && url) {
    prompt = `Analyze this video and generate: key moments, 3 titles, 5 hashtags, and a short script.`;
  } else if (content) {
    prompt = `Generate content based on: ${content}. Include: 3 titles, 5 hashtags, and a short script.`;
  }
  
  const result = await chatCompletion('system', { 
    model: 'qwen-max',
    messages: [{ role: 'user', content: prompt }] 
  });
  
  return {
    description: result,
    title: 'Generated Title',
    hashtags: ['#ai', '#content', '#viral'],
    script: result
  };
}

export default { processMultimodal };
