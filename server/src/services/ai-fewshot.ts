/**
 * Few-Shot 示例库管理
 */

export interface AIExample {
  id: string;
  contentType: string;
  platform: string;
  title: string;
  content: string;
  adoptionRate: number;
  usageCount: number;
}

// 示例库
export const EXAMPLE_LIBRARY: AIExample[] = [
  {
    id: '1',
    contentType: 'title',
    platform: 'douyin',
    title: '震惊！这个技巧居然...',
    content: '震惊！这个技巧居然能让你效率翻倍',
    adoptionRate: 0.85,
    usageCount: 1234
  },
  {
    id: '2',
    contentType: 'title',
    platform: 'xiaohongshu',
    title: '姐妹们！真的绝了',
    content: '姐妹们！真的绝了，这个方法太好用了',
    adoptionRate: 0.78,
    usageCount: 987
  }
];

/**
 * 获取示例库
 */
export function getExamples(contentType?: string, platform?: string): AIExample[] {
  let examples = EXAMPLE_LIBRARY;
  
  if (contentType) {
    examples = examples.filter(e => e.contentType === contentType);
  }
  
  if (platform) {
    examples = examples.filter(e => e.platform === platform);
  }
  
  return examples;
}

/**
 * 获取最佳示例
 */
export function getBestExamples(contentType: string, platform: string, limit: number = 3): AIExample[] {
  return getExamples(contentType, platform)
    .sort((a, b) => b.adoptionRate - a.adoptionRate)
    .slice(0, limit);
}

/**
 * 生成 Few-Shot 提示词
 */
export function generateFewShotPrompt(
  contentType: string,
  platform: string,
  basePrompt: string
): string {
  const examples = getBestExamples(contentType, platform, 3);
  
  if (examples.length === 0) {
    return basePrompt;
  }
  
  const examplesText = examples.map(e => 
    `示例：${e.content}`
  ).join('\n\n');
  
  return `${basePrompt}\n\n参考优秀案例：\n${examplesText}`;
}

export default { getExamples, getBestExamples, generateFewShotPrompt, EXAMPLE_LIBRARY };
