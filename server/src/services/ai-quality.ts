/**
 * AI 内容质量评分系统
 * 智枢 AI SaaS 系统 - 后端
 *
 * 功能：
 * 1. 多维度质量评分
 * 2. 问题自动检测
 * 3. 智能重生成触发
 * 4. 质量报告生成
 */

import { chatCompletion } from './ai-service';

// ==================== 评分维度定义 ====================

export interface QualityDimensions {
  relevance: number;        // 相关性 (1-10)
  creativity: number;       // 创意性 (1-10)
  fluency: number;          // 流畅度 (1-10)
  compliance: number;        // 合规性 (1-10)
  engagement: number;       // 吸引力 (1-10)
  format: number;           // 格式规范性 (1-10)
}

export interface QualityReport {
  overallScore: number;     // 综合评分 (1-10)
  dimensions: QualityDimensions;
  issues: QualityIssue[];
  suggestions: string[];
  passThreshold: boolean;
}

export interface QualityIssue {
  type: 'error' | 'warning' | 'suggestion';
  dimension: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  fixable: boolean;
}

// ==================== 敏感词检测 ====================

// 平台敏感词库
const PLATFORM_SENSITIVE_WORDS: Record<string, string[]> = {
  抖音: [
    '微信', 'QQ', '二维码', '加我', '联系方式',
    '最便宜', '全网最低', '国家级', '最佳',
    '第一', '顶级', '极品', '绝对'
  ],
  快手: [
    '微信', 'QQ', '外链', '诱导分享',
    '最', '第一', '国家级', '绝对化用语'
  ],
  小红书: [
    '最便宜', '全网最低价', '最好用',
    '国家级', '第一', '根治', '特效药'
  ],
  视频号: [
    '微信', 'QQ', '二维码', '诱导分享',
    '最', '第一', '国家级'
  ]
};

// 通用敏感词
const COMMON_SENSITIVE_WORDS = [
  '赌博', '彩票', '毒品', '色情', '暴力',
  '政治', '反动', '分裂', '邪教',
  '诈骗', '传销', '非法集资',
  '野生动物', '保护动物制品',
  '处方药', '医疗器械', '代孕',
  '封建迷信', '算命', '风水'
];

// ==================== 质量评分器 ====================

export class QualityScorer {

  /**
   * 综合质量评分
   */
  static async assess(
    content: string,
    type: string,
    platform?: string
  ): Promise<QualityReport> {
    // 并行执行多个检查
    const [
      dimensions,
      issues,
      suggestions
    ] = await Promise.all([
      this.assessDimensions(content, type, platform),
      this.detectIssues(content, type, platform),
      this.generateSuggestions(content, type, platform)
    ]);

    // 计算综合评分
    const overallScore = this.calculateOverallScore(dimensions);

    return {
      overallScore,
      dimensions,
      issues,
      suggestions,
      passThreshold: overallScore >= 7
    };
  }

  /**
   * 评估各维度分数
   */
  private static async assessDimensions(
    content: string,
    type: string,
    platform?: string
  ): Promise<QualityDimensions> {
    const response = await chatCompletion('system', {
      model: 'dashscope:hunyuan-flash',
      messages: [{
        role: 'user',
        content: `请评估以下内容的质量评分（每个维度1-10分），只输出JSON格式：

内容类型：${type}
平台：${platform || '通用'}

内容：
${content.slice(0, 2000)}

评估维度：
1. relevance - 相关性：内容与主题的匹配程度
2. creativity - 创意性：内容的创新程度和吸引力
3. fluency - 流畅度：语言表达是否通顺自然
4. compliance - 合规性：是否符合平台规则和法律要求
5. engagement - 吸引力：是否能引起用户兴趣和互动
6. format - 格式规范性：格式是否规范、结构是否清晰

请按以下JSON格式输出，只输出JSON，不要其他内容：
{
  "relevance": 8,
  "creativity": 7,
  "fluency": 9,
  "compliance": 8,
  "engagement": 7,
  "format": 8
}`
      }],
      temperature: 0.1,
      max_tokens: 200
    });

    try {
      const content = response.choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error('[QualityScorer] Failed to parse dimensions');
    }

    // 默认返回中等分数
    return {
      relevance: 7,
      creativity: 7,
      fluency: 7,
      compliance: 7,
      engagement: 7,
      format: 7
    };
  }

  /**
   * 检测问题
   */
  private static async detectIssues(
    content: string,
    type: string,
    platform?: string
  ): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // 1. 敏感词检查
    const sensitiveIssues = this.checkSensitiveWords(content, platform);
    issues.push(...sensitiveIssues);

    // 2. 长度检查
    const lengthIssue = this.checkLength(content, type);
    if (lengthIssue) issues.push(lengthIssue);

    // 3. 重复度检查
    const duplicationIssue = this.checkDuplication(content);
    if (duplicationIssue) issues.push(duplicationIssue);

    // 4. 格式检查
    const formatIssue = this.checkFormat(content, type);
    if (formatIssue) issues.push(formatIssue);

    // 5. AI 生成特征检查
    const aiFeatureIssue = this.checkAIFeatures(content);
    if (aiFeatureIssue) issues.push(aiFeatureIssue);

    return issues;
  }

  /**
   * 敏感词检查
   */
  private static checkSensitiveWords(
    content: string,
    platform?: string
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const contentLower = content.toLowerCase();

    // 检查通用敏感词
    for (const word of COMMON_SENSITIVE_WORDS) {
      if (contentLower.includes(word)) {
        issues.push({
          type: 'error',
          dimension: 'compliance',
          description: `包含敏感词：${word}`,
          severity: 'high',
          fixable: false
        });
      }
    }

    // 检查平台特定敏感词
    if (platform && PLATFORM_SENSITIVE_WORDS[platform]) {
      for (const word of PLATFORM_SENSITIVE_WORDS[platform]) {
        if (content.includes(word)) {
          issues.push({
            type: 'warning',
            dimension: 'compliance',
            description: `平台敏感词：${word}（可能导致限流）`,
            severity: 'medium',
            fixable: true
          });
        }
      }
    }

    return issues;
  }

  /**
   * 长度检查
   */
  private static checkLength(content: string, type: string): QualityIssue | null {
    const length = content.length;

    const lengthRules: Record<string, { min: number; max: number }> = {
      'title': { min: 5, max: 30 },
      'short_post': { min: 50, max: 300 },
      'post': { min: 200, max: 1000 },
      'long_post': { min: 500, max: 3000 },
      'script': { min: 100, max: 2000 },
      'message': { min: 20, max: 200 },
      'jd': { min: 300, max: 2000 }
    };

    const rule = lengthRules[type] || { min: 50, max: 5000 };

    if (length < rule.min) {
      return {
        type: 'warning',
        dimension: 'format',
        description: `内容过短（${length}字），建议至少${rule.min}字`,
        severity: 'medium',
        fixable: true
      };
    }

    if (length > rule.max) {
      return {
        type: 'warning',
        dimension: 'format',
        description: `内容过长（${length}字），建议控制在${rule.max}字以内`,
        severity: 'low',
        fixable: true
      };
    }

    return null;
  }

  /**
   * 重复度检查
   */
  private static checkDuplication(content: string): QualityIssue | null {
    const words = content.split(/\s+/);
    const wordCount: Record<string, number> = {};

    for (const word of words) {
      if (word.length >= 2) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    }

    // 检查重复率
    const totalWords = words.length;
    let repeatedWords = 0;

    for (const count of Object.values(wordCount)) {
      if (count > 3) {
        repeatedWords += count;
      }
    }

    const duplicationRate = repeatedWords / totalWords;

    if (duplicationRate > 0.3) {
      return {
        type: 'warning',
        dimension: 'fluency',
        description: `内容重复率较高（${(duplicationRate * 100).toFixed(0)}%），建议增加变化`,
        severity: 'medium',
        fixable: true
      };
    }

    return null;
  }

  /**
   * 格式检查
   */
  private static checkFormat(content: string, type: string): QualityIssue | null {
    // 检查标题格式
    if (type === 'title' || type === 'douyin_title') {
      if (content.includes('\n')) {
        return {
          type: 'warning',
          dimension: 'format',
          description: '标题不应包含换行符',
          severity: 'low',
          fixable: true
        };
      }
    }

    // 检查话题标签格式
    if (content.includes('#') && !/^#[\u4e00-\u9fa5\w]+/.test(content)) {
      return {
        type: 'warning',
        dimension: 'format',
        description: '话题标签格式不规范，应为 #话题#',
        severity: 'low',
        fixable: true
      };
    }

    return null;
  }

  /**
   * AI 特征检查
   */
  private static checkAIFeatures(content: string): QualityIssue | null {
    const aiPatterns = [
      { pattern: /当然可以|当然可以！|以下是为|以下是一个|作为一个AI/, severity: 'low' as const },
      { pattern: /首先|其次|最后|第一|第二|第三/gi, severity: 'low' as const },
      { pattern: /总之|综上所述|综上所述，/, severity: 'low' as const },
      { pattern: /需要注意|请注意|务必/, severity: 'low' as const }
    ];

    for (const { pattern, severity } of aiPatterns) {
      if (pattern.test(content)) {
        return {
          type: 'suggestion',
          dimension: 'creativity',
          description: '内容可能过于模板化，建议增加个性化表达',
          severity,
          fixable: true
        };
      }
    }

    return null;
  }

  /**
   * 生成改进建议
   */
  private static async generateSuggestions(
    content: string,
    type: string,
    platform?: string
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // 基于问题自动生成建议
    const issues = await this.detectIssues(content, type, platform);

    for (const issue of issues) {
      if (issue.fixable) {
        switch (issue.dimension) {
          case 'engagement':
            suggestions.push('增加情感共鸣元素，使用更有感染力的表达');
            break;
          case 'creativity':
            suggestions.push('增加独特视角或新颖表达，避免套路化');
            break;
          case 'format':
            suggestions.push('优化内容结构，使表达更加清晰');
            break;
          default:
            suggestions.push(issue.description);
        }
      }
    }

    // 基于内容类型生成特定建议
    const typeSuggestions = this.getTypeSuggestions(type, platform);
    suggestions.push(...typeSuggestions);

    // 去重并限制数量
    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * 获取类型特定建议
   */
  private static getTypeSuggestions(type: string, platform?: string): string[] {
    const suggestions: string[] = [];

    if (type.includes('title')) {
      suggestions.push('标题可以增加悬念或数字，提高点击率');
      if (platform === '抖音') {
        suggestions.push('抖音标题建议使用强情绪词，如"绝了"、"震惊"');
      }
      if (platform === '小红书') {
        suggestions.push('小红书标题建议使用"姐妹们"、"亲测"等口语化表达');
      }
    }

    if (type.includes('post') || type.includes('content')) {
      suggestions.push('开头要有吸引力，快速抓住读者注意力');
      suggestions.push('结尾要引导互动，如"你们觉得呢"');
    }

    if (type.includes('script')) {
      suggestions.push('口播脚本建议每句话控制在15字以内');
      suggestions.push('增加停顿标记和情绪提示');
    }

    if (type.includes('message') || type.includes('outreach')) {
      suggestions.push('私信话术要简洁，控制在100字以内');
      suggestions.push('避免明显的营销感，保持自然对话风格');
    }

    return suggestions;
  }

  /**
   * 计算综合评分
   */
  private static calculateOverallScore(dimensions: QualityDimensions): number {
    // 加权平均
    const weights = {
      relevance: 0.25,
      creativity: 0.15,
      fluency: 0.15,
      compliance: 0.20,
      engagement: 0.15,
      format: 0.10
    };

    return (
      dimensions.relevance * weights.relevance +
      dimensions.creativity * weights.creativity +
      dimensions.fluency * weights.fluency +
      dimensions.compliance * weights.compliance +
      dimensions.engagement * weights.engagement +
      dimensions.format * weights.format
    );
  }

  /**
   * 快速评分（简化版）
   */
  static async quickScore(content: string): Promise<number> {
    const report = await this.assess(content, 'general');
    return report.overallScore;
  }

  /**
   * 合规性检查
   */
  static checkCompliance(content: string, platform?: string): boolean {
    const issues = this.checkSensitiveWords(content, platform);
    return !issues.some(issue => issue.type === 'error');
  }
}

// ==================== 智能重生成器 ====================

export interface RegenerateOptions {
  maxAttempts?: number;
  qualityThreshold?: number;
  improveFocus?: string[];
}

export class IntelligentRegenerator {
  /**
   * 带质量控制的生成
   */
  static async generateWithQualityControl(
    userId: string,
    basePrompt: string,
    type: string,
    platform?: string,
    options: RegenerateOptions = {}
  ): Promise<{
    content: string;
    quality: QualityReport;
    attempts: number;
  }> {
    const {
      maxAttempts = 3,
      qualityThreshold = 7,
      improveFocus = []
    } = options;

    let attempts = 0;
    let bestContent = '';
    let bestQuality: QualityReport | null = null;

    while (attempts < maxAttempts) {
      attempts++;

      // 生成内容
      const content = await this.generateContent(userId, basePrompt, type, attempts > 1 ? improveFocus : []);

      // 评估质量
      const quality = await QualityScorer.assess(content, type, platform);

      // 记录最佳结果
      if (!bestQuality || quality.overallScore > bestQuality.overallScore) {
        bestContent = content;
        bestQuality = quality;
      }

      // 如果达到阈值，停止
      if (quality.passThreshold && quality.overallScore >= qualityThreshold) {
        return { content, quality, attempts };
      }

      // 更新改进焦点
      if (quality.issues.length > 0) {
        improveFocus = quality.issues
          .filter(i => i.fixable)
          .map(i => i.description);
      }
    }

    // 返回最佳结果
    return { content: bestContent, quality: bestQuality!, attempts };
  }

  /**
   * 生成内容（带改进提示）
   */
  private static async generateContent(
    userId: string,
    prompt: string,
    type: string,
    improvements: string[]
  ): Promise<string> {
    let enhancedPrompt = prompt;

    if (improvements.length > 0) {
      enhancedPrompt += '\n\n【需要改进】\n';
      improvements.forEach((imp, idx) => {
        enhancedPrompt += `${idx + 1}. ${imp}\n`;
      });
      enhancedPrompt += '\n请在保持优势的同时，改进上述问题。';
    }

    const response = await chatCompletion(userId, {
      model: 'dashscope:qwen-max',
      messages: [{ role: 'user', content: enhancedPrompt }],
      temperature: 0.7,
      max_tokens: 3000
    });

    return response.choices[0]?.message?.content || '';
  }
}

// ==================== 便捷方法 ====================

/**
 * 快速质量评分
 */
export async function quickQualityCheck(content: string, platform?: string): Promise<number> {
  return QualityScorer.quickScore(content);
}

/**
 * 完整质量报告
 */
export async function fullQualityReport(
  content: string,
  type: string,
  platform?: string
): Promise<QualityReport> {
  return QualityScorer.assess(content, type, platform);
}

/**
 * 合规性检查
 */
export function checkContentCompliance(content: string, platform?: string): boolean {
  return QualityScorer.checkCompliance(content, platform);
}

/**
 * 智能生成（带质量控制）
 */
export async function generateWithQuality(
  userId: string,
  prompt: string,
  type: string,
  platform?: string,
  threshold: number = 7
): Promise<{ content: string; score: number; attempts: number }> {
  const result = await IntelligentRegenerator.generateWithQualityControl(
    userId,
    prompt,
    type,
    platform,
    { qualityThreshold: threshold }
  );

  return {
    content: result.content,
    score: result.quality.overallScore,
    attempts: result.attempts
  };
}
