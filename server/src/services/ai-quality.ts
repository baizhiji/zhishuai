/**
 * AI 质量控制流水线
 */

export interface QualityCheckResult {
  passed: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

/**
 * 检查内容质量
 */
export async function checkContentQuality(
  content: string,
  contentType: string
): Promise<QualityCheckResult> {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // 检查长度
  if (content.length < 10) {
    issues.push('内容太短');
    score -= 20;
    suggestions.push('增加内容长度');
  }

  if (content.length > 5000) {
    issues.push('内容太长');
    score -= 10;
    suggestions.push('精简内容');
  }

  // 检查是否包含敏感词
  const sensitiveWords = ['赌博', '毒品', '色情', '暴力'];
  for (const word of sensitiveWords) {
    if (content.includes(word)) {
      issues.push(`包含敏感词: ${word}`);
      score -= 30;
      suggestions.push('移除敏感词');
      break;
    }
  }

  // 检查重复
  const words = content.split(/\s+/);
  const uniqueWords = new Set(words);
  const duplicationRate = 1 - (uniqueWords.size / words.length);
  
  if (duplicationRate > 0.5) {
    issues.push('内容重复度较高');
    score -= 15;
    suggestions.push('增加内容多样性');
  }

  return {
    passed: score >= 70,
    score: Math.max(0, score),
    issues,
    suggestions
  };
}

/**
 * 质量检查后重生成
 */
export async function qualityCheckWithRegenerate(
  generateFunc: () => Promise<string>,
  contentType: string,
  maxAttempts: number = 3
): Promise<{ content: string; attempts: number }> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const content = await generateFunc();
    const result = await checkContentQuality(content, contentType);
    
    if (result.passed) {
      return { content, attempts: attempts + 1 };
    }
    
    attempts++;
  }
  
  // 返回最后一次生成的内容
  const finalContent = await generateFunc();
  return { content: finalContent, attempts: maxAttempts };
}

export default { checkContentQuality, qualityCheckWithRegenerate };
