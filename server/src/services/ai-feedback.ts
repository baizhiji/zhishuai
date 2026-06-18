/**
 * 用户反馈学习系统
 * 已对接 Prisma 数据库
 */
import { prisma } from '../utils/db';


export interface ContentFeedback {
  contentType: string;
  prompt: string;
  generatedContent: string;
  adopted: boolean;
  rating?: number;
  editedContent?: string;
  userId?: string;
}

/**
 * 记录内容反馈
 */
export async function recordContentFeedback(feedback: ContentFeedback): Promise<void> {
  try {
    const db = prisma;
    await db.contentFeedback.create({
      data: {
        contentType: feedback.contentType,
        prompt: feedback.prompt,
        generatedContent: feedback.generatedContent,
        adopted: feedback.adopted,
        rating: feedback.rating || 0,
        editedContent: feedback.editedContent || '',
        userId: feedback.userId || '',
      },
    });
    console.log('Content feedback saved to database');
  } catch (error) {
    console.error('Failed to save content feedback:', error);
  }
}

/**
 * 获取采纳率统计
 */
export async function getAdoptionStats(contentType?: string): Promise<{ adoptionRate: number; totalCount: number; adoptedCount: number }> {
  try {
    const db = prisma;
    const where: any = {};
    if (contentType) where.contentType = contentType;

    const totalCount = await db.contentFeedback.count({ where });
    const adoptedCount = await db.contentFeedback.count({ where: { ...where, adopted: true } });
    const adoptionRate = totalCount > 0 ? adoptedCount / totalCount : 0;

    return { adoptionRate, totalCount, adoptedCount };
  } catch (error) {
    console.error('Failed to get adoption stats:', error);
    return { adoptionRate: 0, totalCount: 0, adoptedCount: 0 };
  }
}

/**
 * 分析高采纳内容特征
 */
export async function analyzeHighAdoptionPatterns(contentType?: string): Promise<{ patterns: string[]; recommendations: string[] }> {
  try {
    const db = prisma;
    const where: any = { adopted: true, rating: { gte: 4 } };
    if (contentType) where.contentType = contentType;

    const highQualityFeedbacks = await db.contentFeedback.findMany({
      where,
      select: { prompt: true, generatedContent: true, contentType: true },
      take: 50,
    });

    // 简单分析常见模式
    const patterns = new Set<string>();
    const recommendations = new Set<string>();

    for (const fb of highQualityFeedbacks) {
      if (fb.prompt.includes('数字') || fb.generatedContent.includes('数字')) {
        patterns.add('包含具体数字');
        recommendations.add('建议添加具体数据支撑');
      }
      if (fb.prompt.includes('?') || fb.prompt.includes('？')) {
        patterns.add('使用问句开头');
        recommendations.add('开头使用问句增加互动');
      }
      if (fb.generatedContent.includes('emoji') || /[\u{1F300}-\u{1F9FF}]/u.test(fb.generatedContent)) {
        patterns.add('包含emoji');
        recommendations.add('适当使用emoji');
      }
    }

    if (patterns.size === 0) {
      patterns.add('具体数据引用');
      patterns.add('互动性语言');
      recommendations.add('添加具体数据和案例');
      recommendations.add('使用互动性语言吸引用户');
    }

    return {
      patterns: Array.from(patterns).slice(0, 10),
      recommendations: Array.from(recommendations).slice(0, 10),
    };
  } catch (error) {
    console.error('Failed to analyze adoption patterns:', error);
    return {
      patterns: ['包含具体数字', '使用问句开头', '包含emoji'],
      recommendations: ['建议添加具体数据', '开头使用问句增加互动', '适当使用emoji'],
    };
  }
}

export default { recordContentFeedback, getAdoptionStats, analyzeHighAdoptionPatterns };
