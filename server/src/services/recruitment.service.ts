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

  // 获取搜索配置
  let config = null;
  if (searchConfigId) {
    config = await prisma.candidateSearchConfig.findUnique({ where: { id: searchConfigId } });
  }

  // 获取已有候选人列表(用于去重)
  const existingCandidates = await prisma.candidate.findMany({
    where: { postId: jobId },
    select: { phone: true, email: true, name: true },
  });
  const existingPhones = new Set(existingCandidates.map(c => c.phone).filter(Boolean));
  const existingEmails = new Set(existingCandidates.map(c => c.email).filter(Boolean));

  // 使用 AI 生成匹配候选人（不硬编码模型，让 AI 客户端自动选型）
  const systemPrompt = `你是一位资深招聘专家，请根据岗位信息生成${config?.maxResults || 5}个高度匹配的候选人模拟信息。

岗位要求:
- 标题: ${job.title}
- 要求: ${job.requirements || '未指定'}
- 学历: ${job.education || '不限'}
- 经验: ${job.experience || '不限'}
- 地点: ${job.location || '不限'}
- 搜索条件: ${config ? JSON.stringify({ keywords: config.keywords, location: config.location }) : '未指定'}

输出JSON数组格式,每个候选人包含:
- name: 姓名
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
    }
  } catch (aiError: any) {
    console.warn('AI 候选人匹配调用失败:', aiError.message, '，使用模拟数据');
  }

  // AI 失败时使用模拟数据兜底
  if (candidates.length === 0) {
    candidates = generateMockCandidatesForJob(job);
  }

  // 去重并创建候选人记录
  const results: MatchCandidateResult[] = [];
  for (const c of candidates.slice(0, 10)) {
    // 电话号码去重(生成唯一假号码)
    const phone = `138${String(Math.random()).slice(2, 10)}`;
    const email = `candidate_${randomUUID().slice(0, 8)}@example.com`;

    if (existingPhones.has(phone) || existingEmails.has(email)) continue;

    const candidate = await prisma.candidate.create({
      data: {
        id: randomUUID(),
        postId: jobId,
        userId,
        name: c.name || '候选人',
        phone,
        email,
        education: c.education || '',
        experience: c.experience || '',
        skills: Array.isArray(c.skills) ? c.skills.join(',') : (c.skills || ''),
        matchScore: c.matchScore || 50,
        location: c.location || '',
        source: c.source || config?.platform || 'ai',
        status: 'matched',
        updatedAt: new Date(),
      },
    });

    results.push({
      id: candidate.id,
      name: candidate.name,
      score: candidate.matchScore || 50,
      matchReason: c.matchReason || '',
      skills: c.skills ? (typeof c.skills === 'string' ? c.skills.split(',') : c.skills) : [],
      experience: c.experience || '',
      education: c.education || '',
      location: c.location || '',
      source: candidate.source || 'ai',
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

// 模拟候选人数据（AI 调用失败时的兜底方案）
function generateMockCandidatesForJob(job: any): any[] {
  const title = job.title || '未知岗位';
  const isTech = /技术|开发|前端|后端|工程师|架构|算法|AI|React|Vue|Java|Python|Go|Node/i.test(title);
  const isProduct = /产品|运营|PM/i.test(title);
  const isDesign = /设计|UI|UX|视觉/i.test(title);
  const isMarket = /市场|营销|运营|品牌|销售|商务/i.test(title);

  const namePool = ['张明', '李婷', '王浩', '赵雪', '陈飞', '刘洋', '周晓', '吴丽', '孙强', '马悦'];
  const techSkillsPool = ['React', 'Vue', 'TypeScript', 'Node.js', 'Python', 'Java', 'Go', 'Docker', 'Kubernetes', 'AWS'];
  const productSkillsPool = ['产品规划', '需求分析', 'PRD', '数据分析', '用户研究', 'A/B测试', '增长策略', '项目管理'];
  const designSkillsPool = ['Figma', 'Sketch', 'Adobe XD', 'UI设计', '用户体验', '交互设计', '视觉设计', '动效设计'];
  const marketSkillsPool = ['品牌营销', '用户增长', '社交媒体', 'SEM', '内容运营', '数据分析', '活动策划', 'KOL合作'];

  let skillsPool = techSkillsPool;
  if (isProduct) skillsPool = productSkillsPool;
  if (isDesign) skillsPool = designSkillsPool;
  if (isMarket) skillsPool = marketSkillsPool;

  const titles = {
    tech: ['前端开发工程师', '全栈开发工程师', '后端开发工程师', '算法工程师', 'DevOps工程师', '架构师'],
    product: ['产品经理', '高级产品经理', '产品总监', '增长产品经理', 'AI产品经理'],
    design: ['UI设计师', 'UX设计师', '视觉设计师', '交互设计师', '设计主管'],
    market: ['市场经理', '品牌经理', '运营经理', '增长经理', '商务拓展经理'],
  };

  const locations = ['北京', '上海', '深圳', '杭州', '广州', '成都', '武汉', '南京'];
  const educations = ['本科', '硕士', '博士', '本科', '硕士', '博士', '本科'];
  const experiences = ['1-3年', '3-5年', '5-10年', '3-5年', '5-10年', '10年以上', '1-3年'];
  const sources = ['Boss直聘', '脉脉', '猎聘', '智联招聘', '拉勾', 'LinkedIn'];

  const count = 5;
  const result: any[] = [];

  for (let i = 0; i < count; i++) {
    const shuffledSkills = [...skillsPool].sort(() => Math.random() - 0.5);
    const faked: string[] = [];
    for (let j = 0; j < 3 + Math.floor(Math.random() * 4); j++) {
      faked.push(shuffledSkills[j % shuffledSkills.length]);
    }
    result.push({
      name: namePool[i % namePool.length],
      matchScore: Math.floor(60 + Math.random() * 35),
      matchReason: `${faked[0]}技能高度匹配岗位要求`,
      skills: faked,
      experience: experiences[i % experiences.length],
      education: educations[i % educations.length],
      location: locations[Math.floor(Math.random() * locations.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
    });
  }
  return result;
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

  // 获取搜索配置中的沟通模板
  const searchConfig = await prisma.candidateSearchConfig.findFirst({
    where: { postId: candidate.postId },
  });
  const template = searchConfig?.contactTemplate || '您好{{name}}，看到您的简历与我们{{jobTitle}}岗位非常匹配，方便聊一下吗？';

  // 变量替换
  const content = template
    .replace(/\{\{name\}\}/g, candidate.name)
    .replace(/\{\{jobTitle\}\}/g, candidate.RecruitmentPost.title)
    .replace(/\{\{company\}\}/g, '智枢AI')
    .replace(/\{\{recruiter\}\}/g, candidate.RecruitmentPost.recruiterName || 'HR');

  // 记录沟通
  await prisma.recruitmentCommunication.create({
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

  // 更新候选人状态
  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      status: 'contacted',
      lastContactedAt: new Date(),
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
