/**
 * 用户反馈学习系统
 * 根据用户采纳率持续优化 AI 生成效果
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 记录内容生成反馈
 */
export async function recordContentFeedback(req: Request, res: Response) {
  try {
    const {
      contentId,
      contentType,
      prompt,
      generatedContent,
      adopted,
      edited,
      rating,
      editedContent,
      userId
    } = req.body;

    // 记录反馈
    const feedback = await prisma.contentFeedback.create({
      data: {
        contentType,
        prompt: prompt.substring(0, 500),
        generatedContent: generatedContent.substring(0, 2000),
        adopted,
        edited,
        rating: rating || null,
        editedContent: editedContent?.substring(0, 2000) || null,
        userId: userId || null
      }
    });

    // 更新采纳率统计
    await updateAdoptionStats(contentType);

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('记录反馈失败:', error);
    res.status(500).json({ success: false, error: '记录反馈失败' });
  }
}

/**
 * 批量记录反馈
 */
export async function batchRecordFeedback(req: Request, res: Response) {
  try {
    const { feedbacks } = req.body;

    const results = await prisma.$transaction(
      feedbacks.map((f: any) =>
        prisma.contentFeedback.create({
          data: {
            contentType: f.contentType,
            prompt: f.prompt?.substring(0, 500) || '',
            generatedContent: f.generatedContent?.substring(0, 2000) || '',
            adopted: f.adopted,
            edited: f.edited || false,
            rating: f.rating || null,
            userId: f.userId || null
          }
        })
      )
    );

    // 更新所有涉及类型的采纳率
    const types = [...new Set(feedbacks.map((f: any) => f.contentType))];
    for (const type of types) {
      await updateAdoptionStats(type);
    }

    res.json({
      success: true,
      count: results.length
    });
  } catch (error) {
    console.error('批量记录反馈失败:', error);
    res.status(500).json({ success: false, error: '批量记录反馈失败' });
  }
}

/**
 * 获取内容采纳率统计
 */
export async function getAdoptionStats(req: Request, res: Response) {
  try {
    const { contentType, days = 30 } = req.query;

    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const where: any = { createdAt: { gte: since } };
    if (contentType) where.contentType = contentType;

    const stats = await prisma.contentFeedback.groupBy({
      by: ['contentType'],
      where,
      _count: { id: true },
      _sum: { adopted: true }
    });

    const result = stats.map(s => ({
      contentType: s.contentType,
      totalGenerations: s._count.id,
      adoptedCount: s._sum.adopted || 0,
      adoptionRate: s._sum.adopted ? (s._sum.adopted / s._count.id * 100).toFixed(1) + '%' : '0%'
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取采纳率失败:', error);
    res.status(500).json({ success: false, error: '获取采纳率失败' });
  }
}

/**
 * 获取高采纳率内容的特征分析
 */
export async function analyzeHighAdoptionPatterns(req: Request, res: Response) {
  try {
    const { contentType, minAdoptions = 10 } = req.query;

    // 获取高采纳内容
    const highAdoptionContent = await prisma.contentFeedback.findMany({
      where: {
        contentType: contentType as string,
        adopted: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // 分析提示词特征
    const promptPatterns = analyzePromptPatterns(
      highAdoptionContent.map(c => c.prompt)
    );

    // 分析生成内容特征
    const contentPatterns = analyzeContentPatterns(
      highAdoptionContent.map(c => c.generatedContent)
    );

    // 生成优化建议
    const optimizationTips = generateOptimizationTips(promptPatterns, contentPatterns);

    res.json({
      success: true,
      data: {
        sampleCount: highAdoptionContent.length,
        promptPatterns,
        contentPatterns,
        optimizationTips
      }
    });
  } catch (error) {
    console.error('分析采纳模式失败:', error);
    res.status(500).json({ success: false, error: '分析采纳模式失败' });
  }
}

/**
 * 获取智能体采纳率统计
 */
export async function getAgentAdoptionStats(req: Request, res: Response) {
  try {
    const { agentId, days = 30 } = req.query;

    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const where: any = { createdAt: { gte: since } };
    if (agentId) where.agentId = agentId;

    const stats = await prisma.agentFeedback.groupBy({
      by: ['agentId'],
      where,
      _count: { id: true },
      _sum: { helpful: true }
    });

    // 获取智能体信息
    const agents = await prisma.agent.findMany({
      where: { id: { in: stats.map(s => s.agentId) } },
      select: { id: true, name: true, description: true }
    });

    const result = stats.map(s => {
      const agent = agents.find(a => a.id === s.agentId);
      return {
        agentId: s.agentId,
        agentName: agent?.name || '未知',
        totalInteractions: s._count.id,
        helpfulCount: s._sum.helpful || 0,
        helpfulRate: s._sum.helpful ? (s._sum.helpful / s._count.id * 100).toFixed(1) + '%' : '0%'
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取智能体采纳率失败:', error);
    res.status(500).json({ success: false, error: '获取智能体采纳率失败' });
  }
}

/**
 * 记录智能体对话反馈
 */
export async function recordAgentFeedback(req: Request, res: Response) {
  try {
    const { agentId, conversationId, messageIndex, userMessage, agentResponse, helpful, userId } = req.body;

    const feedback = await prisma.agentFeedback.create({
      data: {
        agentId,
        conversationId,
        messageIndex,
        userMessage: userMessage?.substring(0, 1000) || '',
        agentResponse: agentResponse?.substring(0, 2000) || '',
        helpful: helpful ?? null,
        userId: userId || null
      }
    });

    // 更新智能体性能统计
    await updateAgentPerformance(agentId);

    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error('记录智能体反馈失败:', error);
    res.status(500).json({ success: false, error: '记录智能体反馈失败' });
  }
}

/**
 * 获取优化后的提示词
 */
export async function getOptimizedPrompt(req: Request, res: Response) {
  try {
    const { contentType } = req.query;

    if (!contentType) {
      res.status(400).json({ success: false, error: '缺少 contentType 参数' });
      return;
    }

    // 获取最新统计
    const stats = await prisma.contentFeedback.groupBy({
      by: ['contentType'],
      where: { contentType: contentType as string },
      _count: { id: true },
      _sum: { adopted: true }
    });

    if (stats.length === 0 || stats[0]._count.id < 5) {
      // 样本不足，返回默认提示词
      res.json({
        success: true,
        data: {
          contentType,
          optimizationLevel: 'default',
          message: '样本不足，使用默认提示词'
        }
      });
      return;
    }

    const stat = stats[0];
    const adoptionRate = stat._sum.adopted ? stat._sum.adopted / stat._count.id : 0;

    // 获取高采纳内容的特征
    const highAdoption = await analyzeHighAdoptionPatternsInternal(contentType as string);

    res.json({
      success: true,
      data: {
        contentType,
        sampleCount: stat._count.id,
        adoptionRate: (adoptionRate * 100).toFixed(1) + '%',
        optimizationLevel: adoptionRate > 0.7 ? 'high' : adoptionRate > 0.4 ? 'medium' : 'low',
        insights: highAdoption.optimizationTips
      }
    });
  } catch (error) {
    console.error('获取优化提示词失败:', error);
    res.status(500).json({ success: false, error: '获取优化提示词失败' });
  }
}

// ============ 内部辅助函数 ============

/**
 * 更新采纳率统计
 */
async function updateAdoptionStats(contentType: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const stats = await prisma.contentFeedback.aggregate({
    where: { contentType, createdAt: { gte: thirtyDaysAgo } },
    _count: { id: true },
    _sum: { adopted: true }
  });

  const adoptionRate = stats._sum.adopted ? stats._sum.adopted / stats._count.id : 0;

  // 记录或更新统计
  await prisma.promptOptimization.upsert({
    where: { contentType },
    create: {
      contentType,
      sampleCount: stats._count.id,
      adoptionRate,
      lastUpdated: new Date()
    },
    update: {
      sampleCount: stats._count.id,
      adoptionRate,
      lastUpdated: new Date()
    }
  });
}

/**
 * 更新智能体性能统计
 */
async function updateAgentPerformance(agentId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const stats = await prisma.agentFeedback.aggregate({
    where: { agentId, createdAt: { gte: thirtyDaysAgo } },
    _count: { id: true },
    _sum: { helpful: true }
  });

  const helpfulRate = stats._sum.helpful ? stats._sum.helpful / stats._count.id : 0;

  await prisma.agent.update({
    where: { id: agentId },
    data: {
      totalInteractions: { increment: 1 },
      helpfulRate
    }
  });
}

/**
 * 分析提示词模式
 */
function analyzePromptPatterns(prompts: string[]): any {
  const patterns = {
    hasExamples: 0,
    hasConstraints: 0,
    hasStyleRequirements: 0,
    hasPlatformSpecific: 0,
    averageLength: 0
  };

  prompts.forEach(p => {
    if (p.includes('示例') || p.includes('例如')) patterns.hasExamples++;
    if (p.includes('要求') || p.includes('必须') || p.includes('不要')) patterns.hasConstraints++;
    if (p.includes('风格') || p.includes('语气')) patterns.hasStyleRequirements++;
    if (p.includes('抖音') || p.includes('小红书') || p.includes('快手')) patterns.hasPlatformSpecific++;
    patterns.averageLength += p.length;
  });

  const count = prompts.length || 1;
  patterns.averageLength = Math.round(patterns.averageLength / count);

  return {
    hasExamples: `${(patterns.hasExamples / count * 100).toFixed(1)}%`,
    hasConstraints: `${(patterns.hasConstraints / count * 100).toFixed(1)}%`,
    hasStyleRequirements: `${(patterns.hasStyleRequirements / count * 100).toFixed(1)}%`,
    hasPlatformSpecific: `${(patterns.hasPlatformSpecific / count * 100).toFixed(1)}%`,
    averagePromptLength: patterns.averageLength
  };
}

/**
 * 分析内容模式
 */
function analyzeContentPatterns(contents: string[]): any {
  const patterns = {
    hasEmoji: 0,
    hasNumbers: 0,
    hasQuestions: 0,
    hasCallToAction: 0,
    averageLength: 0
  };

  contents.forEach(c => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]/gu;
    if (emojiRegex.test(c)) patterns.hasEmoji++;
    if (/\d+/.test(c)) patterns.hasNumbers++;
    if (c.includes('？') || c.includes('?')) patterns.hasQuestions++;
    if (c.includes('点击') || c.includes('关注') || c.includes('评论') || c.includes('转发')) patterns.hasCallToAction++;
    patterns.averageLength += c.length;
  });

  const count = contents.length || 1;
  patterns.averageLength = Math.round(patterns.averageLength / count);

  return {
    hasEmoji: `${(patterns.hasEmoji / count * 100).toFixed(1)}%`,
    hasNumbers: `${(patterns.hasNumbers / count * 100).toFixed(1)}%`,
    hasQuestions: `${(patterns.hasQuestions / count * 100).toFixed(1)}%`,
    hasCallToAction: `${(patterns.hasCallToAction / count * 100).toFixed(1)}%`,
    averageContentLength: patterns.averageLength
  };
}

/**
 * 生成优化建议
 */
function generateOptimizationTips(promptPatterns: any, contentPatterns: any): string[] {
  const tips: string[] = [];

  // 提示词优化建议
  const exampleRate = parseFloat(promptPatterns.hasExamples);
  if (exampleRate < 30) {
    tips.push('建议增加示例（Few-Shot）来提高生成质量');
  }

  const constraintRate = parseFloat(promptPatterns.hasConstraints);
  if (constraintRate < 50) {
    tips.push('建议增加更多约束条件来控制输出质量');
  }

  const styleRate = parseFloat(promptPatterns.hasStyleRequirements);
  if (styleRate < 40) {
    tips.push('建议明确指定内容风格和语气');
  }

  const platformRate = parseFloat(promptPatterns.hasPlatformSpecific);
  if (platformRate < 60) {
    tips.push('建议针对具体平台优化提示词');
  }

  // 内容优化建议
  const emojiRate = parseFloat(contentPatterns.hasEmoji);
  if (emojiRate < 30) {
    tips.push('高采纳内容中 emoji 使用率较高，建议适当增加');
  }

  const ctaRate = parseFloat(contentPatterns.hasCallToAction);
  if (ctaRate < 50) {
    tips.push('建议增加行动号召（CTA）来提高转化');
  }

  const questionRate = parseFloat(contentPatterns.hasQuestions);
  if (questionRate < 30) {
    tips.push('高采纳内容中问句使用较多，建议增加互动性提问');
  }

  return tips;
}

/**
 * 内部分析采纳模式（不经过 HTTP）
 */
async function analyzeHighAdoptionPatternsInternal(contentType: string): Promise<any> {
  const highAdoptionContent = await prisma.contentFeedback.findMany({
    where: { contentType, adopted: true },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const promptPatterns = analyzePromptPatterns(
    highAdoptionContent.map(c => c.prompt)
  );
  const contentPatterns = analyzeContentPatterns(
    highAdoptionContent.map(c => c.generatedContent)
  );
  const optimizationTips = generateOptimizationTips(promptPatterns, contentPatterns);

  return { promptPatterns, contentPatterns, optimizationTips };
}

/**
 * 获取提示词优化建议（用于自动优化）
 */
export async function getPromptOptimizationSuggestions(req: Request, res: Response) {
  try {
    const { contentType } = req.query;

    const optimizations = await prisma.promptOptimization.findMany({
      where: contentType ? { contentType: contentType as string } : {},
      orderBy: { adoptionRate: 'desc' }
    });

    const suggestions = await Promise.all(
      optimizations.map(async opt => {
        const insights = await analyzeHighAdoptionPatternsInternal(opt.contentType);
        return {
          contentType: opt.contentType,
          currentAdoptionRate: (opt.adoptionRate * 100).toFixed(1) + '%',
          sampleCount: opt.sampleCount,
          recommendations: insights.optimizationTips
        };
      })
    );

    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('获取优化建议失败:', error);
    res.status(500).json({ success: false, error: '获取优化建议失败' });
  }
}

/**
 * 导出反馈数据用于分析
 */
export async function exportFeedbackData(req: Request, res: Response) {
  try {
    const { contentType, startDate, endDate, format = 'json' } = req.query;

    const where: any = {};
    if (contentType) where.contentType = contentType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const data = await prisma.contentFeedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000
    });

    if (format === 'csv') {
      const headers = ['ID', 'ContentType', 'Prompt', 'GeneratedContent', 'Adopted', 'Edited', 'Rating', 'CreatedAt'];
      const rows = data.map(d => [
        d.id,
        d.contentType,
        `"${d.prompt.replace(/"/g, '""')}"`,
        `"${d.generatedContent.replace(/"/g, '""')}"`,
        d.adopted,
        d.edited,
        d.rating || '',
        d.createdAt.toISOString()
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=feedback_data.csv');
      res.send(csv);
    } else {
      res.json({ success: true, data });
    }
  } catch (error) {
    console.error('导出反馈数据失败:', error);
    res.status(500).json({ success: false, error: '导出反馈数据失败' });
  }
}
