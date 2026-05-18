/**
 * AI 智能获客服务
 */
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// 获客策略分析系统提示词
const ACQUISITION_STRATEGY_PROMPT = `你是一个专业的获客营销顾问。请根据以下信息制定获客策略。

请返回JSON格式：
{
  "targetProfile": {
    "age": "目标年龄段",
    "gender": "目标性别",
    "location": "目标地区",
    "interests": ["兴趣1", "兴趣2"],
    "income": "收入水平"
  },
  "channels": [
    { "name": "渠道名称", "weight": 80, "reason": "选择理由" }
  ],
  "content": {
    "headlines": ["标题1", "标题2", "标题3"],
    "hooks": ["钩子1", "钩子2"],
    "callsToAction": "行动号召"
  },
  "postingTimes": ["最佳发布时间1", "最佳发布时间2"],
  "hashtags": ["标签1", "标签2", "标签3", "标签4", "标签5"],
  "budget": {
    "daily": 100,
    "total": 1000,
    "allocation": { "抖音": 40, "小红书": 30, "微信": 30 }
  },
  "kpis": {
    "cpl": 10,  // 每个线索成本
    "conversionRate": 5,  // 转化率百分比
    "engagementRate": 3  // 互动率百分比
  },
  "analysis": "简要策略分析（100字以内）"
}`;

/**
 * 生成获客策略
 */
export async function generateAcquisitionStrategy(
  productInfo: string,
  targetAudience: string,
  apiKey: string
): Promise<any> {
  const prompt = `请为以下产品制定获客策略：

产品信息：${productInfo}
目标受众：${targetAudience}

${ACQUISITION_STRATEGY_PROMPT}`;

  const response = await fetch(`${process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com'}/api/v1/services/aigc/text-generation/generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      input: {
        messages: [
          { role: 'system', content: '你是一个专业的获客营销顾问，擅长制定精准获客策略。' },
          { role: 'user', content: prompt },
        ],
      },
      parameters: {
        temperature: 0.7,
        max_tokens: 2000,
      },
    }),
  });

  const data = await response.json();
  const content = data.output?.choices?.[0]?.message?.content || '';

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error('策略生成失败');
}

/**
 * 生成内容创意
 */
export async function generateContentIdeas(
  productInfo: string,
  platform: string,
  apiKey: string
): Promise<{ title: string; content: string; hashtags: string[] }[]> {
  const prompt = `请为以下产品在${platform}平台生成10个内容创意：

产品：${productInfo}

请以JSON数组格式返回：
[
  {
    "title": "标题",
    "content": "内容正文（100-200字）",
    "hashtags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
  }
]`;

  const response = await fetch(`${process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com'}/api/v1/services/aigc/text-generation/generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      input: {
        messages: [
          { role: 'system', content: '你是一个专业的内容营销专家。' },
          { role: 'user', content: prompt },
        ],
      },
      parameters: {
        temperature: 0.8,
        max_tokens: 3000,
      },
    }),
  });

  const data = await response.json();
  const content = data.output?.choices?.[0]?.message?.content || '';

  const arrayMatch = content.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[0]);
  }

  return [];
}

/**
 * 分析线索质量
 */
export async function analyzeLeadQuality(
  leadData: any,
  targetProfile: any,
  apiKey: string
): Promise<{ score: number; quality: string; insights: string[] }> {
  const prompt = `请分析以下线索与目标客户的匹配度：

线索信息：
- 姓名：${leadData.name || '未知'}
- 性别：${leadData.gender || '未知'}
- 年龄：${leadData.age || '未知'}
- 地区：${leadData.location || '未知'}
- 职业：${leadData.occupation || '未知'}
- 兴趣：${leadData.interests?.join('、') || '未知'}
- 来源：${leadData.source || '未知'}

目标客户画像：
- 年龄：${targetProfile.age || '未知'}
- 性别：${targetProfile.gender || '未知'}
- 地区：${targetProfile.location || '未知'}
- 兴趣：${targetProfile.interests?.join('、') || '未知'}
- 收入：${targetProfile.income || '未知'}

请返回JSON格式：
{
  "score": 75,  // 匹配分数 0-100
  "quality": "高",  // 高、中、低
  "insights": ["洞察1", "洞察2", "洞察3"]
}`;

  const response = await fetch(`${process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com'}/api/v1/services/aigc/text-generation/generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      input: {
        messages: [
          { role: 'system', content: '你是一个专业的销售线索分析师。' },
          { role: 'user', content: prompt },
        ],
      },
      parameters: {
        temperature: 0.3,
        max_tokens: 1000,
      },
    }),
  });

  const data = await response.json();
  const content = data.output?.choices?.[0]?.message?.content || '';

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return { score: 50, quality: '中', insights: ['未能完成分析'] };
}

/**
 * 生成跟进话术
 */
export async function generateFollowUpMessage(
  leadData: any,
  productInfo: string,
  apiKey: string
): Promise<{ message: string; approach: string; tips: string[] }> {
  const prompt = `请为以下线索生成个性化的跟进策略：

线索信息：
- 姓名：${leadData.name || '未知'}
- 来源：${leadData.source || '未知'}
- 互动内容：${leadData.lastInteraction || '无'}
- 兴趣点：${leadData.interests || '未知'}

产品信息：${productInfo}

请返回JSON格式：
{
  "message": "个性化消息内容（50字以内）",
  "approach": "跟进方式建议",
  "tips": ["技巧1", "技巧2", "技巧3"]
}`;

  const response = await fetch(`${process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com'}/api/v1/services/aigc/text-generation/generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      input: {
        messages: [
          { role: 'system', content: '你是一个专业的销售沟通专家。' },
          { role: 'user', content: prompt },
        ],
      },
      parameters: {
        temperature: 0.7,
        max_tokens: 800,
      },
    }),
  });

  const data = await response.json();
  const content = data.output?.choices?.[0]?.message?.content || '';

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return {
    message: '您好，感谢您的关注...',
    approach: '电话/微信',
    tips: ['及时回复', '突出产品优势'],
  };
}

/**
 * 创建获客自动化任务
 */
export async function createAcquisitionAutomation(
  userId: string,
  data: {
    name: string;
    platform: string;
    targetCount: number;
    productInfo: string;
    targetAudience: string;
    schedule?: string;
  }
) {
  // 生成策略
  const apiKey = process.env.DASHSCOPE_API_KEY;
  let strategy = null;
  
  if (apiKey) {
    try {
      strategy = await generateAcquisitionStrategy(data.productInfo, data.targetAudience, apiKey);
    } catch (error) {
      console.error('生成获客策略失败:', error);
    }
  }

  return await prisma.acquisitionAutomation.create({
    data: {
      id: uuidv4(),
      userId,
      name: data.name,
      platform: data.platform,
      targetLeads: data.targetCount,
      currentLeads: 0,
      productInfo: data.productInfo,
      targetAudience: data.targetAudience,
      strategy: strategy || undefined,
      status: 'draft', // draft, scheduled, running, paused, completed
      schedule: data.schedule ? new Date(data.schedule) : null,
      startedAt: null,
      completedAt: null,
    },
  });
}

/**
 * 更新自动化任务
 */
export async function updateAcquisitionAutomation(
  automationId: string,
  userId: string,
  data: {
    status?: string;
    currentLeads?: number;
    notes?: string;
  }
) {
  const updateData: any = { ...data };
  
  if (data.status === 'running') {
    updateData.startedAt = new Date();
  } else if (data.status === 'completed') {
    updateData.completedAt = new Date();
  }

  return await prisma.acquisitionAutomation.update({
    where: { id: automationId, userId },
    data: updateData,
  });
}

/**
 * 获取获客自动化列表
 */
export async function getAcquisitionAutomations(userId: string, status?: string) {
  const where: any = { userId };
  if (status) where.status = status;

  return await prisma.acquisitionAutomation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * 批量分析线索质量
 */
export async function batchAnalyzeLeads(
  userId: string,
  apiKey: string,
  targetProfile?: any
) {
  const leads = await prisma.acquisitionLead.findMany({
    where: { userId, aiScore: null },
    take: 50,
  });

  const results: { leadId: string; score: number; quality: string }[] = [];

  for (const lead of leads) {
    try {
      const analysis = await analyzeLeadQuality(lead, targetProfile || {}, apiKey);
      
      await prisma.acquisitionLead.update({
        where: { id: lead.id },
        data: {
          aiScore: analysis.score,
          aiQuality: analysis.quality,
          aiInsights: analysis.insights,
        },
      });

      results.push({
        leadId: lead.id,
        score: analysis.score,
        quality: analysis.quality,
      });
    } catch (error) {
      console.error(`分析线索 ${lead.id} 失败:`, error);
    }
  }

  return results;
}
