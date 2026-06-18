/**
 * 招聘AI服务 - 主动搜索候选人、AI智能沟通、面试邀约
 * 使用腾讯云TokenHub + 阿里云百炼双通道
 */

import { chatCompletion } from './ai-service';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../utils/db';


// 生成候选人搜索关键词
export async function generateSearchKeywords(userId: string, postId: string): Promise<string[]> {
  const post = await prisma.recruitmentPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('岗位不存在');

  const prompt = `你是一位专业HR，请根据以下岗位信息，生成10个最适合在招聘平台搜索候选人的关键词组合。

岗位信息：
- 职位：${post.title}
- 经验要求：${post.experience || '不限'}
- 学历要求：${post.education || '不限'}
- 薪资范围：${post.salaryMin || '面议'}K-${post.salaryMax || '面议'}K
- 任职要求：${post.requirements || '无'}

请直接输出关键词列表，每行一个，不要编号，不要其他说明。关键词应该包含：
1. 核心技能组合（如"React+TypeScript"）
2. 行业+岗位（如"电商产品经理"）
3. 特定技术栈（如"Node.js全栈"）
4. 资历级别（如"5年前端架构"）`;

  const result = await chatCompletion(userId, [
    { role: 'system', content: '你是专业HR招聘助手，擅长生成精准的候选人搜索关键词。' },
    { role: 'user', content: prompt },
  ]);

  return result.split('\n').filter(line => line.trim()).map(line => line.trim());
}

// AI生成个性化沟通话术
export async function generateContactMessage(
  userId: string,
  postId: string,
  candidateInfo: { name: string; skills?: string; experience?: string; source?: string }
): Promise<string> {
  const post = await prisma.recruitmentPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('岗位不存在');

  const prompt = `你是一位有亲和力的HR，需要给候选人发一条主动沟通消息。要求：
1. 称呼候选人姓名，体现个性化
2. 简要介绍公司和岗位亮点
3. 根据候选人的技能和经验，说明匹配之处
4. 语气自然友好，不像模板消息，像真人HR在聊
5. 控制在150字以内
6. 结尾要有明确的行动号召（如约聊、约面试）

岗位：${post.title}
薪资：${post.salaryMin || '面议'}K-${post.salaryMax || '面议'}K
核心要求：${post.requirements || '无特殊要求'}

候选人信息：
- 姓名：${candidateInfo.name}
- 技能：${candidateInfo.skills || '未知'}
- 经验：${candidateInfo.experience || '未知'}
- 来源：${candidateInfo.source || '招聘平台'}

请直接输出消息内容，不要任何格式标记。`;

  return await chatCompletion(userId, [
    { role: 'system', content: '你是一位专业且有亲和力的HR招聘顾问，擅长用自然、真诚的语言与候选人沟通，让候选人感受到被重视。' },
    { role: 'user', content: prompt },
  ]);
}

// AI生成面试邀约消息
export async function generateInterviewInvitation(
  userId: string,
  postId: string,
  candidateName: string,
  interviewType: string,
  scheduledTime: string,
  duration: number
): Promise<string> {
  const post = await prisma.recruitmentPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('岗位不存在');

  const typeMap: Record<string, string> = {
    video: '视频面试',
    phone: '电话面试',
    onsite: '现场面试',
  };

  const prompt = `你是一位HR，需要给候选人发送面试邀约消息。要求：
1. 语气专业热情，确认候选人通过了初步筛选
2. 明确告知面试类型、时间、时长
3. 提供面试准备建议
4. 询问候选人时间是否方便
5. 控制在200字以内

岗位：${post.title}
面试类型：${typeMap[interviewType] || interviewType}
面试时间：${scheduledTime}
面试时长：${duration}分钟
候选人：${candidateName}

请直接输出消息内容。`;

  return await chatCompletion(userId, [
    { role: 'system', content: '你是专业HR招聘顾问，擅长发送有吸引力的面试邀约。' },
    { role: 'user', content: prompt },
  ]);
}

// AI匹配度评分
export async function scoreCandidateMatch(
  userId: string,
  postId: string,
  candidateInfo: { name: string; skills?: string; experience?: string; education?: string; resume?: string }
): Promise<{ score: number; analysis: string }> {
  const post = await prisma.recruitmentPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('岗位不存在');

  const prompt = `请评估候选人与岗位的匹配度，给出0-100的评分和简短分析。

岗位信息：
- 职位：${post.title}
- 经验：${post.experience || '不限'}
- 学历：${post.education || '不限'}
- 要求：${post.requirements || '无'}

候选人信息：
- 姓名：${candidateInfo.name}
- 技能：${candidateInfo.skills || '未知'}
- 经验：${candidateInfo.experience || '未知'}
- 学历：${candidateInfo.education || '未知'}
- 简历摘要：${candidateInfo.resume || '无'}

请严格按以下JSON格式返回，不要其他内容：
{"score": 85, "analysis": "候选人具备5年React经验，与岗位核心要求高度匹配，但缺乏大型项目经验"}`;

  const result = await chatCompletion(userId, [
    { role: 'system', content: '你是专业HR评估助手，擅长精准评估候选人与岗位的匹配度。请始终返回JSON格式。' },
    { role: 'user', content: prompt },
  ]);

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // 解析失败，返回默认评分
  }

  return { score: 50, analysis: '自动评估暂不可用，请人工审核' };
}

// AI生成面试问题
export async function generateInterviewQuestions(
  userId: string,
  postId: string,
  round: number
): Promise<string[]> {
  const post = await prisma.recruitmentPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('岗位不存在');

  const roundMap: Record<number, string> = {
    1: '初试（基础能力和文化匹配）',
    2: '复试（专业技能深入）',
    3: '终试（综合评估和薪资沟通）',
  };

  const prompt = `请为以下岗位的第${round}轮面试（${roundMap[round] || '面试'}）生成8个面试问题。

岗位：${post.title}
经验要求：${post.experience || '不限'}
核心要求：${post.requirements || '无'}

要求：
1. 问题从易到难排列
2. 包含行为面试题（STAR法则）
3. 包含技术/专业能力考察
4. 包含1-2个开放性问题考察思维方式
5. 每个问题一行，不要编号

请直接输出问题列表。`;

  const result = await chatCompletion(userId, [
    { role: 'system', content: '你是专业面试官，擅长设计有深度、有区分度的面试问题。' },
    { role: 'user', content: prompt },
  ]);

  return result.split('\n').filter(line => line.trim()).map(line => line.trim());
}

// AI回复候选人消息（自动沟通）
export async function generateAutoReply(
  userId: string,
  candidateMessage: string,
  context: { jobTitle: string; candidateName: string; previousMessages?: string }
): Promise<string> {
  const prompt = `你是一位专业HR，正在与候选人${context.candidateName}沟通${context.jobTitle}岗位。

${context.previousMessages ? `之前的沟通记录：\n${context.previousMessages}\n` : ''}

候选人最新消息：${candidateMessage}

请以HR身份自然地回复，要求：
1. 语气友好专业，像真人对话
2. 回答候选人的问题或关切
3. 适时推进招聘流程（约面试、了解意向等）
4. 不确定的不要编造，说"我确认后回复您"
5. 控制在100字以内

请直接输出回复内容。`;

  return await chatCompletion(userId, [
    { role: 'system', content: '你是专业HR招聘顾问，擅长自然、真诚地与候选人沟通。' },
    { role: 'user', content: prompt },
  ]);
}
