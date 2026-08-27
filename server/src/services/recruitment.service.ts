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
import { randomUUID } from 'crypto';
import * as recruitmentPlatform from './recruitment-platform.service';

/** 当前支持真实搜索的招聘平台 */
const SUPPORTED_TALENT_PLATFORMS = ['bosszhipin', 'zhilian'];

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
 * 真实候选人匹配：使用授权账号在招聘平台（BOSS直聘/智联）真实搜索候选人
 * 不再使用 AI 编造候选人 —— 未授权账号或采集失败时明确报错
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

  // 平台值规范化（兼容前端 boss 简写）与支持校验
  const rawPlatform = config?.platform || 'bosszhipin';
  const platform = rawPlatform === 'boss' ? 'bosszhipin' : rawPlatform;
  if (!SUPPORTED_TALENT_PLATFORMS.includes(platform)) {
    throw new Error(`暂不支持在「${recruitmentPlatform.platformLabel(platform)}」真实搜索候选人，当前支持 BOSS直聘 / 智联招聘`);
  }
  const keywords = config?.keywords
    ? String(config.keywords).split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
    : [job.title];

  // 真实平台搜索（授权账号 cookies + Playwright）
  const platformCandidates = await recruitmentPlatform.searchTalent(userId, platform, {
    keywords,
    maxResults: config?.maxResults || 20,
  });

  if (platformCandidates.length === 0) {
    throw new Error('未在招聘平台搜索到候选人，请调整搜索关键词或检查账号授权');
  }

  // 去重：按姓名去重（平台候选人无手机号）
  const existingCandidates = await prisma.candidate.findMany({
    where: { postId: jobId },
    select: { name: true },
  });
  const existingNames = new Set(existingCandidates.map(c => c.name));

  // 写入候选人记录
  const results: MatchCandidateResult[] = [];
  for (const pc of platformCandidates) {
    if (existingNames.has(pc.name)) continue;
    existingNames.add(pc.name);

    const candidate = await prisma.candidate.create({
      data: {
        id: randomUUID(),
        postId: jobId,
        userId,
        name: pc.name,
        phone: '',
        education: pc.education || '',
        experience: pc.jobTitle ? `${pc.jobTitle}${pc.experience ? `（${pc.experience}）` : ''}` : pc.experience || '',
        location: pc.location || '',
        matchScore: 70,
        skills: pc.jobTitle || '',
        source: 'platform',
        platform,
        sourceUrl: pc.sourceUrl || '',
        remark: pc.company ? `来源公司：${pc.company}` : '来自招聘平台真实搜索',
        status: 'matched',
        updatedAt: new Date(),
      },
    });

    results.push({
      id: candidate.id,
      name: candidate.name,
      score: 70,
      matchReason: pc.jobTitle ? `平台候选人：${pc.jobTitle}` : '来自招聘平台真实搜索',
      skills: pc.jobTitle ? [pc.jobTitle] : [],
      experience: pc.experience || '',
      education: pc.education || '',
      location: pc.location || '',
      source: 'platform',
    });
  }

  // 更新岗位候选人数量 + 搜索配置最后执行时间
  if (results.length > 0) {
    await prisma.recruitmentPost.update({
      where: { id: jobId },
      data: { candidateCount: { increment: results.length } },
    });
    if (searchConfigId) {
      await (prisma as any).candidateSearchConfig?.update({
        where: { id: searchConfigId },
        data: { lastSearchedAt: new Date() },
      }).catch(() => {});
    }
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
  deliveryStatus?: string;
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

  // 真实发送：平台来源候选人通过 Playwright 在招聘平台发送私信
  let deliveryStatus = 'local';
  let deliveryError: string | undefined;
  if (candidate.platform) {
    const sendResult = await recruitmentPlatform.sendChatMessage(
      userId,
      { platform: candidate.platform, sourceUrl: candidate.sourceUrl || undefined },
      content,
    );
    if (sendResult.sent) {
      deliveryStatus = 'sent';
    } else {
      deliveryStatus = 'failed';
      deliveryError = sendResult.error;
    }
  } else {
    deliveryError = '候选人无平台来源，仅本地记录沟通';
  }

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
        deliveryStatus,
        deliveryError,
        deliveredAt: deliveryStatus === 'sent' ? new Date() : undefined,
      },
    });
  } catch { /* recruitmentCommunication 表不存在，跳过记录 */ }

  // 更新候选人状态
  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      status: 'contacted',
      lastContactedAt: new Date(),
      updatedAt: new Date(),
      remark: deliveryStatus === 'failed' ? `发送失败：${deliveryError}` : candidate.remark,
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
    message: deliveryStatus === 'sent'
      ? '沟通消息已真实发送到招聘平台'
      : deliveryStatus === 'failed'
        ? `消息未送达：${deliveryError}`
        : '沟通消息已记录（仅本地，未真实发送）',
    content,
    newStage: 'contacted',
    deliveryStatus,
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
): Promise<{ contacted: number; failed: number; delivered: number; results: CommunicationResult[] }> {
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
  let delivered = 0;

  for (const c of candidates) {
    try {
      const r = await contactCandidate(userId, c.id);
      results.push(r);
      if (r.deliveryStatus === 'sent') delivered++;
      contacted++;
    } catch {
      failed++;
    }
  }

  return { contacted, failed, delivered, results };
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
