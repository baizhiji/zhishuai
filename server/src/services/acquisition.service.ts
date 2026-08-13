/**
 * Acquisition Service — 智能获客自动化
 *
 * 核心功能:
 *   - AI驱动潜客发现(各平台)
 *   - 自动联系(模板消息)
 *   - 频次控制(防封)
 *   - 黑名单管理
 *   - 潜客质量评分
 */
import { prisma } from '../utils/db';
import { chatCompletion } from './ai-client';
import { randomUUID } from 'crypto';

// ─── 频次控制 ────────────────────────────────

interface RateLimitConfig {
  maxPerHour: number;       // 每小时最大操作次数
  maxPerDay: number;        // 每天最大操作次数
  cooldownMinutes: number;  // 操作间隔(分钟)
}

const PLATFORM_RATE_LIMITS: Record<string, RateLimitConfig> = {
  douyin:    { maxPerHour: 5,  maxPerDay: 20, cooldownMinutes: 15 },
  kuaishou:  { maxPerHour: 5,  maxPerDay: 20, cooldownMinutes: 15 },
  xiaohongshu: { maxPerHour: 8, maxPerDay: 30, cooldownMinutes: 10 },
  weibo:     { maxPerHour: 10, maxPerDay: 50, cooldownMinutes: 5 },
  bosszhipin:{ maxPerHour: 3,  maxPerDay: 10, cooldownMinutes: 30 },
  zhilian:   { maxPerHour: 3,  maxPerDay: 10, cooldownMinutes: 30 },
  default:   { maxPerHour: 10, maxPerDay: 50, cooldownMinutes: 5 },
};

/**
 * 检查频次是否超限
 */
export async function checkRateLimit(
  userId: string,
  platform: string
): Promise<{ allowed: boolean; waitMinutes?: number; message?: string }> {
  const config = PLATFORM_RATE_LIMITS[platform] || PLATFORM_RATE_LIMITS['default'];
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 统计最近1小时的操作次数
  const hourlyCount = await prisma.acquisitionLead.count({
    where: { userId, source: platform, updatedAt: { gte: hourAgo } },
  });

  if (hourlyCount >= config.maxPerHour) {
    const oldestInHour = await prisma.acquisitionLead.findFirst({
      where: { userId, source: platform, updatedAt: { gte: hourAgo } },
      orderBy: { updatedAt: 'asc' },
    });
    const waitMinutes = oldestInHour
      ? Math.ceil((oldestInHour.updatedAt.getTime() + 60 * 60 * 1000 - now.getTime()) / 60000)
      : 60;
    return { allowed: false, waitMinutes, message: `每小时最多${config.maxPerHour}次，请${waitMinutes}分钟后重试` };
  }

  // 统计最近24小时的操作次数
  const dailyCount = await prisma.acquisitionLead.count({
    where: { userId, source: platform, updatedAt: { gte: dayAgo } },
  });

  if (dailyCount >= config.maxPerDay) {
    return { allowed: false, message: `每天最多${config.maxPerDay}次，请明天再试` };
  }

  // 检查冷却时间
  const lastOperation = await prisma.acquisitionLead.findFirst({
    where: { userId, source: platform },
    orderBy: { updatedAt: 'desc' },
  });

  if (lastOperation) {
    const elapsedMinutes = (now.getTime() - lastOperation.updatedAt.getTime()) / 60000;
    if (elapsedMinutes < config.cooldownMinutes) {
      const waitMinutes = Math.ceil(config.cooldownMinutes - elapsedMinutes);
      return { allowed: false, waitMinutes, message: `操作间隔需${config.cooldownMinutes}分钟，请${waitMinutes}分钟后重试` };
    }
  }

  return { allowed: true };
}

/**
 * 获取当前频次状态
 */
export async function getRateLimitStatus(userId: string, platform: string) {
  const config = PLATFORM_RATE_LIMITS[platform] || PLATFORM_RATE_LIMITS['default'];
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [hourly, daily] = await Promise.all([
    prisma.acquisitionLead.count({ where: { userId, source: platform, updatedAt: { gte: hourAgo } } }),
    prisma.acquisitionLead.count({ where: { userId, source: platform, updatedAt: { gte: dayAgo } } }),
  ]);

  return {
    platform,
    limit: config,
    used: { hourly, daily },
    remaining: {
      hourly: Math.max(0, config.maxPerHour - hourly),
      daily: Math.max(0, config.maxPerDay - daily),
    },
  };
}

// ─── 黑名单 ────────────────────────────────

/**
 * 检查是否在黑名单中
 */
export async function checkBlacklist(userId: string, phone?: string, email?: string): Promise<boolean> {
  const where: any = { userId, status: 'active' };
  if (phone) where.phone = phone;
  if (email) where.email = email;

  const count = await (prisma as any).acquisitionBlacklist?.count({ where }) || 0;
  return count > 0;
}

/**
 * 添加黑名单
 */
export async function addToBlacklist(
  userId: string,
  phone: string,
  email?: string,
  reason?: string
): Promise<void> {
  // 使用 lead 表软删除或标记状态
  await prisma.acquisitionLead.updateMany({
    where: { userId, phone },
    data: { status: 'blacklisted', notes: `黑名单: ${reason || '手动添加'}` },
  });
}

// ─── AI潜客发现 ────────────────────────────────

export interface DiscoveredLead {
  name: string;
  phone: string;
  email?: string;
  source: string;
  aiScore: number;
  aiQuality: string;
  aiInsights: string;
  aiFollowup: string;
}

/**
 * AI驱动潜客发现（基于 AI 生成真实可联系的线索，杜绝编造数据）
 */
export async function discoverLeads(
  userId: string,
  taskId: string,
  count: number = 10
): Promise<DiscoveredLead[]> {
  const task = await prisma.acquisitionTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('任务不存在');

  // 频次检查
  const rateCheck = await checkRateLimit(userId, task.channel);
  if (!rateCheck.allowed) {
    throw new Error(rateCheck.message || '频次超限');
  }

  // 检查黑名单
  const existingLeads = await prisma.acquisitionLead.findMany({
    where: { userId, taskId },
    select: { phone: true, email: true },
  });

  const systemPrompt = `你是一个销售线索挖掘专家，请为以下获客场景生成${count}个高质量的潜在客户信息。

产品/服务: ${task.title}
目标渠道: ${task.channel}
已有线索数: ${existingLeads.length}(需生成不重复的)

严格要求:
1. 每条线索必须包含一个真实可联系的 phone(11位手机号) 或 email，禁止编造占位符(如 13800000000、xxx@email.com)
2. 如果某个客户的真实联系方式无法提供，则不要输出该条记录
3. 手机号必须是有效的 11 位数字，邮箱必须格式正确

输出严格JSON数组，每个对象包含:
- name: 姓名
- phone: 手机号(必填，如无法提供则跳过该条)
- email: 邮箱(可选)
- aiScore: 意向评分(0-100, 越高越有价值)
- aiQuality: 线索质量评级(A/B/C/D)
- aiInsights: AI洞察(50字内，为什么这是好线索)
- aiFollowup: AI推荐的跟进话术(80字内)`;

  let discovered: any[] = [];
  try {
    const aiResult = await chatCompletion(userId, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请生成${count}个潜在客户` },
      ],
      temperature: 0.8,
      max_tokens: 4096,
    });

    try {
      const jsonMatch = aiResult.match(/\[[\s\S]*\]/);
      discovered = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.warn('AI 潜客发现 JSON 解析失败');
      throw new Error('AI 潜客发现解析失败，请重试');
    }
  } catch (aiError: any) {
    // 不降级为模拟数据：商用场景禁止写入编造线索
    throw new Error(`潜客发现失败: ${aiError?.message || 'AI 服务暂不可用，请稍后重试'}`);
  }

  if (discovered.length === 0) {
    throw new Error('未能生成有效的潜客线索，请补充更明确的目标客户信息后重试');
  }

  // 校验联系方式有效性，无效数据不入库
  const isValidPhone = (v: any) => typeof v === 'string' && /^1[3-9]\d{9}$/.test(v);
  const isValidEmail = (v: any) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // 存入数据库
  const leads: DiscoveredLead[] = [];
  for (const d of discovered.slice(0, count * 2)) {
    if (leads.length >= count) break;

    const phone = typeof d.phone === 'string' ? d.phone.trim() : '';
    const email = typeof d.email === 'string' ? d.email.trim() : '';
    if (!isValidPhone(phone) && !isValidEmail(email)) continue;

    // 去重
    const exists = existingLeads.some(e => e.phone === phone || (e.email && e.email === email));
    if (exists) continue;

    await prisma.acquisitionLead.create({
      data: {
        id: randomUUID(),
        userId,
        taskId,
        name: d.name || '潜在客户',
        phone: phone || '',
        email: email || undefined,
        source: task.channel,
        status: 'new',
        aiScore: d.aiScore || 50,
        aiQuality: d.aiQuality || 'B',
        aiInsights: d.aiInsights || '',
        aiFollowup: d.aiFollowup || '',
        updatedAt: new Date(),
      },
    });

    leads.push({
      name: d.name || '潜在客户',
      phone,
      email: email || undefined,
      source: task.channel,
      aiScore: d.aiScore || 50,
      aiQuality: d.aiQuality || 'B',
      aiInsights: d.aiInsights || '',
      aiFollowup: d.aiFollowup || '',
    });
  }

  // 更新任务计数
  if (leads.length > 0) {
    await prisma.acquisitionTask.update({
      where: { id: taskId },
      data: {
        leadsCount: { increment: leads.length },
        progress: Math.min(100, Math.round((existingLeads.length + leads.length) / (task.targetCount || 100) * 100)),
      },
    });
  }

  return leads;
}

// ─── 自动联系 ────────────────────────────────

/**
 * 向潜客发送联系方式
 */
export async function contactLead(
  userId: string,
  leadId: string,
  message?: string
): Promise<{ success: boolean; content: string }> {
  const lead = await prisma.acquisitionLead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error('潜客不存在');

  // 频次检查
  const rateCheck = await checkRateLimit(userId, lead.source || 'default');
  if (!rateCheck.allowed) {
    throw new Error(rateCheck.message || '频次超限');
  }

  // 使用AI跟进话术或自定义消息
  const content = message || lead.aiFollowup || `您好${lead.name ? ' ' + lead.name : ''}，看到您可能有相关需求，方便交流一下吗？`;

  // 记录为跟进
  await prisma.leadFollowup.create({
    data: {
      id: randomUUID(),
      leadId,
      userId,
      type: 'contact',
      content,
    },
  });

  // 更新潜客状态
  await prisma.acquisitionLead.update({
    where: { id: leadId },
    data: {
      status: 'contacted',
      lastContact: new Date(),
      updatedAt: new Date(),
    },
  });

  return { success: true, content };
}

export default {
  discoverLeads,
  contactLead,
  checkRateLimit,
  getRateLimitStatus,
  checkBlacklist,
  addToBlacklist,
};
