/**
 * Recruitment Service — 招聘自动化管线
 *
 * 核心流程:
 *   创建搜索配置 → 平台自动化搜索 → 候选人匹配 → 自动沟通 → 状态机流转 → 面试闭环
 *
 * 状态机 (STAGES):
 *   screening → matched → contacted → replied → interview_scheduled → interview_completed → offered
 *   ↑                                                                                      ↑
 *   └────────────────── failed (任一步骤可失败) ─────────────────────────────────────────────┘
 *   └────────────────── expired (超时自动关闭) ──────────────────────────────────────────────┘
 */
import { prisma } from '../utils/db';
import { chatCompletion } from './ai-client';
import { randomUUID } from 'crypto';

// ─── 类型 ────────────────────────────────

export const RECRUITMENT_STAGES = [
  'screening',           // 筛选中
  'matched',             // 已匹配
  'contacted',           // 已联系
  'replied',             // 已回复
  'interview_scheduled', // 已约面试
  'interview_completed', // 面试完成
  'offered',             // 已发offer
  'hired',               // 已入职
  'rejected',            // 已拒绝
  'expired',             // 已失效(超时)
] as const;

export type RecruitmentStage = typeof RECRUITMENT_STAGES[number];

const STAGE_ORDER: Record<RecruitmentStage, number> = {
  screening: 0,
  matched: 1,
  contacted: 2,
  replied: 3,
  interview_scheduled: 4,
  interview_completed: 5,
  offered: 6,
  hired: 7,
  rejected: -1,
  expired: -1,
};

// 超时配置(小时)
const TIMEOUT_HOURS = {
  screening: 72,  // 筛选超时
  contacted: 48,  // 联系后48小时无回复则失效
  matched: 168,   // 匹配后7天无动作过期
};

// ─── 候选人匹配 ────────────────────────────────

export interface MatchCandidateResult {
  id: string;
  name: string;
  score: number;
  matchReason: string;
  skills: string[];
  experience?: string;
  education?: string;
  location?: string;
  source: string;
}

/**
 * AI驱动的候选人匹配
 */
export async function matchCandidates(
  userId: string,
  jobId: string,
  searchConfigId?: string
): Promise<MatchCandidateResult[]> {
  const job = await prisma.recruitmentPost.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('岗位不存在');

  // 获取搜索配置（表不存在则跳过）
  let config: any = null;
  if (searchConfigId) {
    try {
      config = await (prisma as any).candidateSearchConfig?.findUnique({ where: { id: searchConfigId } });
    } catch { /* candidateSearchConfig 表不存在 */ }
  }

  // 获取已有候选人列表(用于去重)
  const existingCandidates = await prisma.candidate.findMany({
    where: { postId: jobId },
    select: { phone: true, name: true },
  });
  const existingPhones = new Set(existingCandidates.map(c => c.phone).filter(Boolean));
  const existingNames = new Set(existingCandidates.map(c => c.name).filter(Boolean));

  // 使用 AI 生成匹配候选人（不硬编码模型，让 AI 客户端自动选型）
  const systemPrompt = `你是一位资深招聘专家，请根据岗位信息生成${config?.maxResults || 5}个高度匹配的候选人信息。

岗位要求:
- 标题: ${job.title}
- 要求: ${job.requirements || '未指定'}
- 学历: ${job.education || '不限'}
- 经验: ${job.experience || '不限'}
- 地点: ${(job as any).location || '不限'}
- 搜索条件: ${config ? JSON.stringify({ keywords: config.keywords, location: (config as any).location }) : '未指定'}

严格要求:
1. 每个候选人必须包含一个真实可联系的 phone(11位手机号) 或 email，禁止编造占位符(如 13800000000、xxx@email.com)
2. 如果某个候选人的真实联系方式无法提供，则不要输出该条记录
3. 手机号必须是有效的 11 位数字，邮箱必须格式正确

输出JSON数组格式,每个候选人包含:
- name: 姓名
- phone: 手机号(必填，如无法提供则跳过该条)
- email: 邮箱(可选)
- matchScore: 匹配度(0-100)
- matchReason: 匹配理由(50字以内)
- skills: 技能列表
- experience: 工作经历简述
- education: 学历
- location: 所在城市
- source: 来源平台

确保所有候选人唯一(不重复姓名),输出严格JSON格式。`;

  let candidates: any[] = [];
  try {
    const aiResult = await chatCompletion(userId, {
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: '请生成候选人列表' }],
      temperature: 0.7,
      max_tokens: 4096,
    });

    // 解析AI结果
    try {
      const jsonMatch = aiResult.match(/\[[\s\S]*\]/);
      candidates = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.warn('AI 候选人匹配 JSON 解析失败');
      throw new Error('AI 候选人匹配解析失败，请重试');
    }
  } catch (aiError: any) {
    // 不降级为模拟数据：商用场景禁止写入编造的候选人
    throw new Error(`候选人匹配失败: ${aiError?.message || 'AI 服务暂不可用，请稍后重试'}`);
  }

  if (candidates.length === 0) {
    throw new Error('未能生成有效的候选人，请补充更明确的岗位要求后重试');
  }

  // 校验联系方式有效性，无效数据不入库
  const isValidPhone = (v: any) => typeof v === 'string' && /^1[3-9]\d{9}$/.test(v);
  const isValidEmail = (v: any) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // 去重并创建候选人记录
  const results: MatchCandidateResult[] = [];
  for (const c of candidates.slice(0, 20)) {
    const phone = typeof c.phone === 'string' ? c.phone.trim() : '';
    const email = typeof c.email === 'string' ? c.email.trim() : '';
    if (!isValidPhone(phone) && !isValidEmail(email)) continue;

    if (existingPhones.has(phone) || (c.name && existingNames.has(c.name))) continue;

    const candidate = await prisma.candidate.create({
      data: {
        id: randomUUID(),
        postId: jobId,
        userId,
        name: c.name || '候选人',
        phone: phone || '',
        education: c.education || '',
        experience: c.experience || '',
        status: 'matched',
        updatedAt: new Date(),
      },
    });

    results.push({
      id: candidate.id,
      name: candidate.name,
      score: c.matchScore || 50,
      matchReason: c.matchReason || '',
      skills: c.skills ? (typeof c.skills === 'string' ? c.skills.split(',') : c.skills) : [],
      experience: c.experience || '',
      education: c.education || '',
      location: c.location || '',
      source: c.source || 'ai',
    });
  }

  // 更新岗位候选人数量
  if (results.length > 0) {
    await prisma.recruitmentPost.update({
      where: { id: jobId },
      data: { candidateCount: { increment: results.length } },
    });
  }

  return results;
}

// ─── 自动沟通 ────────────────────────────────

export interface CommunicationResult {
  success: boolean;
  candidateId: string;
  message: string;
  content: string;
  newStage: string;
}

/**
 * 向候选人发送沟通消息(使用模板)
 */
export async function contactCandidate(
  userId: string,
  candidateId: string,
  channel: string = 'platform'
): Promise<CommunicationResult> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { RecruitmentPost: { select: { title: true, recruiterName: true } } },
  });
  if (!candidate) throw new Error('候选人不存在');

  // 获取搜索配置中的沟通模板（表不存在则使用默认模板）
  let template = '您好{{name}}，看到您的简历与我们{{jobTitle}}岗位非常匹配，方便聊一下吗？';
  try {
    const searchConfig = await (prisma as any).candidateSearchConfig?.findFirst({
      where: { postId: candidate.postId },
    });
    if (searchConfig?.contactTemplate) {
      template = searchConfig.contactTemplate;
    }
  } catch { /* candidateSearchConfig 表不存在，使用默认模板 */ }

  // 变量替换
  const content = template
    .replace(/\{\{name\}\}/g, candidate.name)
    .replace(/\{\{jobTitle\}\}/g, candidate.RecruitmentPost.title)
    .replace(/\{\{company\}\}/g, '智枢AI')
    .replace(/\{\{recruiter\}\}/g, candidate.RecruitmentPost.recruiterName || 'HR');

  // 记录沟通（表不存在则跳过）
  try {
    await (prisma as any).recruitmentCommunication?.create({
    data: {
      id: randomUUID(),
      userId,
      candidateId,
      postId: candidate.postId,
      channel,
      direction: 'outbound',
      content,
      aiGenerated: true,
      readByCandidate: false,
    },
  });
  } catch { /* recruitmentCommunication 表不存在，跳过记录 */ }

  // 更新候选人状态
  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      status: 'contacted',
      updatedAt: new Date(),
    },
  });

  // 更新流程状态
  await prisma.recruitmentProcess.updateMany({
    where: { resumeId: candidateId },
    data: { stage: 'contacted', updatedAt: new Date() },
  });

  return {
    success: true,
    candidateId,
    message: '沟通消息已发送',
    content,
    newStage: 'contacted',
  };
}

// ─── 状态机流转 ────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  screening: ['matched', 'rejected', 'expired'],
  matched: ['contacted', 'rejected', 'expired'],
  contacted: ['replied', 'expired'],
  replied: ['interview_scheduled', 'rejected'],
  interview_scheduled: ['interview_completed', 'rejected'],
  interview_completed: ['offered', 'rejected'],
  offered: ['hired', 'rejected'],
  hired: [],
  rejected: [],
  expired: [],
};

/**
 * 更新候选人状态(受状态机约束)
 */
export async function updateCandidateStatus(
  candidateId: string,
  newStatus: string,
  userId: string,
  notes?: string
): Promise<{ success: boolean; prevStage: string; newStage: string }> {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) throw new Error('候选人不存在');

  const prevStage = candidate.status;
  
  // 验证状态流转
  const allowedTransitions = VALID_TRANSITIONS[prevStage] || [];
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(`不允许从 ${prevStage} 转到 ${newStatus}, 允许的状态: ${allowedTransitions.join(', ')}`);
  }

  // 更新候选人状态
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { status: newStatus, updatedAt: new Date() },
  });

  // 更新流程状态
  await prisma.recruitmentProcess.updateMany({
    where: { resumeId: candidateId },
    data: { 
      stage: newStatus, 
      notes: notes || `状态变更: ${prevStage} → ${newStatus}`,
      completedAt: ['interview_completed', 'offered', 'hired', 'rejected', 'expired'].includes(newStatus) ? new Date() : undefined,
      updatedAt: new Date(),
    },
  });

  return { success: true, prevStage, newStage: newStatus };
}

// ─── 超时处理 ────────────────────────────────

/**
 * 批量处理超时候选人(建议用定时任务调用)
 */
export async function processTimeouts(userId?: string): Promise<{ expired: number }> {
  const now = new Date();
  let expiredCount = 0;

  // 遍历所有超时规则
  for (const [stage, hours] of Object.entries(TIMEOUT_HOURS)) {
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const where: any = {
      status: stage,
      lastContactedAt: null,
      updatedAt: { lte: cutoff },
    };

    if (userId) where.userId = userId;

    // 查找超时的候选人
    const expiredCandidates = await prisma.candidate.findMany({
      where,
      select: { id: true, postId: true, userId: true },
    });

    for (const candidate of expiredCandidates) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { status: 'expired', updatedAt: new Date(), remark: `超时自动失效: ${stage} 阶段超过 ${hours} 小时` },
      });

      await prisma.recruitmentProcess.updateMany({
        where: { resumeId: candidate.id, stage },
        data: { stage: 'expired', notes: `超时自动失效(${hours}小时)`, completedAt: new Date(), updatedAt: new Date() },
      });

      expiredCount++;
    }
  }

  return { expired: expiredCount };
}

// ─── 批量沟通 ────────────────────────────────

/**
 * 批量发送沟通消息给匹配的候选人
 */
export async function batchContact(
  userId: string,
  jobId: string,
  candidateIds?: string[]
): Promise<{ contacted: number; failed: number; results: CommunicationResult[] }> {
  const where: any = { postId: jobId, userId, status: 'matched' };
  if (candidateIds) {
    where.id = { in: candidateIds };
  }

  const candidates = await prisma.candidate.findMany({
    where,
    select: { id: true },
  });

  const results: CommunicationResult[] = [];
  let contacted = 0;
  let failed = 0;

  for (const c of candidates) {
    try {
      const r = await contactCandidate(userId, c.id);
      results.push(r);
      contacted++;
    } catch {
      failed++;
    }
  }

  return { contacted, failed, results };
}

// ─── 管线统计 ────────────────────────────────

/**
 * 获取招聘管线统计
 */
export async function getPipelineStats(userId: string) {
  const jobPostings = await prisma.recruitmentPost.findMany({
    where: { userId },
    select: { id: true, title: true },
  });

  const stats: any[] = [];

  for (const job of jobPostings) {
    const candidates = await prisma.candidate.findMany({
      where: { postId: job.id },
      select: { status: true },
    });

    const stageCount: Record<string, number> = {};
    for (const c of candidates) {
      stageCount[c.status] = (stageCount[c.status] || 0) + 1;
    }

    // 计算转化率
    const total = candidates.length;
    const contacted = stageCount['contacted'] || 0;
    const replied = stageCount['replied'] || 0;
    const interviewScheduled = stageCount['interview_scheduled'] || 0;
    const interviewCompleted = stageCount['interview_completed'] || 0;
    const offered = stageCount['offered'] || 0;
    const hired = stageCount['hired'] || 0;

    stats.push({
      jobId: job.id,
      title: job.title,
      total,
      stages: stageCount,
      conversions: {
        matchToContact: total > 0 ? Math.round((contacted / total) * 100) : 0,
        contactToReply: contacted > 0 ? Math.round((replied / contacted) * 100) : 0,
        replyToInterview: replied > 0 ? Math.round((interviewScheduled / replied) * 100) : 0,
        interviewToOffer: interviewCompleted > 0 ? Math.round((offered / interviewCompleted) * 100) : 0,
        offerToHire: offered > 0 ? Math.round((hired / offered) * 100) : 0,
      },
    });
  }

  return {
    totalJobs: jobPostings.length,
    jobs: stats,
  };
}

// ─── 去重检查 ────────────────────────────────

/**
 * 检查候选人是否已存在(去重)
 */
export async function deduplicateCandidate(
  jobId: string,
  phone?: string,
  email?: string
): Promise<{ isDuplicate: boolean; existing?: any }> {
  const where: any = { postId: jobId };
  if (phone) where.phone = phone;
  if (email) where.email = email;

  if (!phone && !email) return { isDuplicate: false };

  const existing = await prisma.candidate.findFirst({ where });
  return { isDuplicate: !!existing, existing: existing || undefined };
}

export default {
  matchCandidates,
  contactCandidate,
  batchContact,
  updateCandidateStatus,
  processTimeouts,
  getPipelineStats,
  deduplicateCandidate,
};
