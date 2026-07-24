/**
 * CRM Service - 客户关系管理 Service 层
 *
 * 借鉴 CodeBuddy 技能：
 * - product-management-workflows: Feature Spec 定义 CRM 业务规则
 * - data-exploration: 数据画像与质量评估
 *
 * 架构升级：
 * - 抽取 CRM Service 层（从 Fat Router 解耦）
 * - 客户分级引擎（RFM 模型）
 * - AI 智能跟进建议
 * - 标签系统改为关联表（解决 JSON 字符串存储问题）
 * - 公海池策略增强（领取限制、冷却期、上限控制）
 */

import { PrismaClient } from '@prisma/client';
import { chatCompletion } from './ai-client';

const prisma = new PrismaClient();

// ==================== 类型定义 ====================

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  position: string | null;
  level: string | null;
  status: string;
  source: string | null;
  tags: string[];
  lastContact: Date | null;
  totalValue: number;
  followupCount: number;
  createdAt: Date;
}

export interface RFMScore {
  recency: number;    // 最近一次互动距今天数（越低越好）
  frequency: number;  // 互动频次（越高越好）
  monetary: number;   // 消费/价值贡献（越高越好）
  totalScore: number; // 综合 RFM 分数 (0-100)
  segment: 'vip' | 'active' | 'at-risk' | 'dormant' | 'lost';
}

export interface FollowupSuggestion {
  customerName: string;
  priority: 'high' | 'medium' | 'low';
  suggestedTime: string;
  suggestedChannel: string;
  messageTemplate: string;
  reason: string;
  actionItems: string[];
}

export interface PublicPoolRule {
  graceDays: number;         // 未跟进 N 天后进入公海
  claimLimit: number;        // 每人每天领取上限
  coolingDays: number;       // 领取后冷却期（N 天内不能再次被领取）
  maxPerUser: number;        // 每人最多持有客户数
  autoReleaseDays: number;   // 领取后 N 天未跟进自动释放
}

// ==================== 默认公海池规则 ====================

const DEFAULT_POOL_RULES: PublicPoolRule = {
  graceDays: 30,
  claimLimit: 5,
  coolingDays: 7,
  maxPerUser: 200,
  autoReleaseDays: 14,
};

/**
 * 获取公海池规则（后续可从数据库配置读取）
 */
export function getPublicPoolRules(): PublicPoolRule {
  return { ...DEFAULT_POOL_RULES };
}

// ==================== 客户画像与 RFM 分析 ====================

/**
 * 获取客户完整画像
 */
export async function getCustomerProfile(
  userId: string,
  customerId: string,
): Promise<CustomerProfile> {
  const customer = await prisma.crmCustomer.findFirst({
    where: { id: customerId, userId },
    include: {
      followUps: { orderBy: { createdAt: 'desc' } },
      _count: { select: { followUps: true } },
    },
  });

  if (!customer) throw new Error('客户不存在');

  // 解析标签（兼容旧 JSON 字符串格式）
  let tags: string[] = [];
  try {
    if (Array.isArray(customer.tags)) {
      tags = customer.tags;
    } else if (typeof customer.tags === 'string') {
      tags = JSON.parse(customer.tags);
    }
  } catch {
    tags = [];
  }

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    company: customer.company,
    position: customer.position,
    level: customer.level,
    status: customer.status,
    source: customer.source,
    tags,
    lastContact: customer.lastContact,
    totalValue: customer.totalValue || 0,
    followupCount: customer._count.followUps,
    createdAt: customer.createdAt,
  };
}

/**
 * 计算客户 RFM 分数
 */
export async function calculateRFM(customerId: string): Promise<RFMScore> {
  const customer = await prisma.crmCustomer.findUnique({
    where: { id: customerId },
    include: { followUps: true },
  });

  if (!customer) throw new Error('客户不存在');

  // Recency: 最近一次互动距今天数
  const daysSinceLastContact = customer.lastContact
    ? Math.floor((Date.now() - customer.lastContact.getTime()) / (1000 * 60 * 60 * 24))
    : 365;

  // Frequency: 跟进次数（归一化到 0-100）
  const followupCount = customer.followUps.length;
  const frequencyScore = Math.min(100, followupCount * 10); // 10次跟进=满分

  // Monetary: 客户价值（归一化到 0-100）
  const totalValue = customer.totalValue || 0;
  const monetaryScore = Math.min(100, Math.floor(totalValue / 1000)); // 每1000=1分

  // Recency 反向计算（天数越少分越高）
  const recencyScore = daysSinceLastContact <= 0 ? 100
    : daysSinceLastContact <= 7 ? 90
    : daysSinceLastContact <= 30 ? 70
    : daysSinceLastContact <= 90 ? 40
    : daysSinceLastContact <= 180 ? 20
    : 0;

  // 加权总分
  const totalScore = Math.round(
    recencyScore * 0.4 + // R 权重 40%
    frequencyScore * 0.3 + // F 权重 30%
    monetaryScore * 0.3   // M 权重 30%
  );

  const segment: RFMScore['segment'] =
    totalScore >= 80 ? 'vip'
    : totalScore >= 60 ? 'active'
    : totalScore >= 40 ? 'at-risk'
    : totalScore >= 20 ? 'dormant'
    : 'lost';

  return {
    recency: daysSinceLastContact,
    frequency: followupCount,
    monetary: totalValue,
    totalScore,
    segment,
  };
}

// ==================== AI 智能跟进建议 ====================

/**
 * AI 生成智能跟进建议
 */
export async function getFollowupSuggestions(
  userId: string,
): Promise<FollowupSuggestion[]> {
  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const rules = getPublicPoolRules();

  // 找出需要跟进的客户：
  // 1. 超过 graceDays 天未跟进（即将进入公海）
  // 2. 超过 7 天未跟进的高价值客户
  // 3. 状态为 new 且超过 3 天未跟进
  const graceDate = new Date(today.getTime() - rules.graceDays * 24 * 60 * 60 * 1000);

  const needFollowup = await prisma.crmCustomer.findMany({
    where: {
      userId,
      OR: [
        { lastContact: { lt: graceDate }, status: { not: 'inactive' } },
        { lastContact: { lt: sevenDaysAgo }, level: 'VIP' },
        { lastContact: null, createdAt: { lt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000) } },
      ],
    },
    orderBy: [
      { level: 'desc' },
      { lastContact: 'asc' },
    ],
    take: 10,
  });

  // 为每个需要跟进的客户生成建议
  const suggestions: FollowupSuggestion[] = [];

  for (const customer of needFollowup) {
    try {
      const rfm = await calculateRFM(customer.id);

      let priority: FollowupSuggestion['priority'] = 'medium';
      let reason = '';
      let suggestedChannel = '微信';
      let actionItems: string[] = [];

      // 基于 RFM 和规则判断优先级和行动
      if (customer.level === 'VIP' || rfm.segment === 'vip') {
        priority = 'high';
        reason = `${customer.name}是高价值客户(RFM:${rfm.totalScore}分)，已超过7天未跟进，有流失风险`;
        suggestedChannel = '电话+微信';
        actionItems = [
          '预约一次15分钟的电话沟通',
          '准备最新的产品资料和优惠政策',
          '确认客户是否有新的需求或顾虑',
        ];
      } else if (!customer.lastContact || customer.lastContact < graceDate) {
        priority = 'high';
        reason = `${customer.name}已超过${rules.graceDays}天未跟进，即将进入公海池`;
        actionItems = [
          '立即发送一条问候消息',
          '确认客户当前状态和需求',
          '更新跟进记录到系统',
        ];
      } else if (customer.lastContact < sevenDaysAgo) {
        priority = 'medium';
        reason = `${customer.name}一周未互动，建议保持联系`;
        actionItems = [
          '分享一条行业相关的有价值内容',
          '询问客户最近的业务进展',
        ];
      } else {
        priority = 'low';
        reason = `${customer.name}是${customer.status || '新'}客户，建议建立初始联系`;
        actionItems = [
          '发送公司介绍和产品资料',
          '邀请客户关注公司社交媒体账号',
        ];
      }

      // 尝试 AI 生成个性化话术
      let messageTemplate = `您好${customer.name}，最近怎么样？`;
      try {
        const aiPrompt = `请为以下客户生成一条温暖的跟进消息：
客户姓名：${customer.name}
客户等级：${customer.level || '普通'}
上次联系：${customer.lastContact?.toISOString() || '从未'}
客户价值分：${rfm.totalScore}
RFM 分级：${rfm.segment}

请返回简短JSON：{"message": "跟进消息内容（50字以内，温暖专业）"}`;

        const aiResponse = await chatCompletion(userId, {
          messages: [
            { role: 'system', content: '你是一个专业CRM顾问，生成温暖的客户跟进消息。只返回JSON。' },
            { role: 'user', content: aiPrompt },
          ],
          temperature: 0.7,
          max_tokens: 512,
        });

        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.message) messageTemplate = parsed.message;
        }
      } catch {
        // 使用默认模板
      }

      suggestions.push({
        customerName: customer.name,
        priority,
        suggestedTime: priority === 'high' ? '今天' : '本周内',
        suggestedChannel,
        messageTemplate,
        reason,
        actionItems,
      });
    } catch (err) {
      console.warn(`[CRM] 为客户 ${customer.id} 生成跟进建议失败:`, (err as Error).message);
    }
  }

  return suggestions;
}

// ==================== 公海池增强 ====================

/**
 * 获取公海池客户列表（增强版）
 */
export async function getPublicPool(
  userId: string,
  page: number = 1,
  pageSize: number = 20,
) {
  const rules = getPublicPoolRules();
  const graceDate = new Date(Date.now() - rules.graceDays * 24 * 60 * 60 * 1000);

  // 公海池中的客户：
  // 1. 未分配给任何人 且 超过 graceDays 天
  // 2. 被原主人释放的
  const where = {
    OR: [
      { ownerId: null, lastContact: { lt: graceDate } },
      { status: 'pool' },
    ],
    NOT: {
      // 排除冷却期内的客户
      poolReleasedAt: { gte: new Date(Date.now() - rules.coolingDays * 24 * 60 * 60 * 1000) },
    },
  };

  const [customers, total] = await Promise.all([
    prisma.crmCustomer.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [
        { level: 'desc' },
        { lastContact: 'asc' },
      ],
    }),
    prisma.crmCustomer.count({ where }),
  ]);

  return {
    list: customers,
    total,
    page,
    pageSize,
    rules: {
      ...rules,
      poolSize: total,
    },
  };
}

/**
 * 认领公海客户（增强版 - 带限制校验）
 */
export async function claimFromPool(
  userId: string,
  customerId: string,
): Promise<{ success: boolean; message: string }> {
  const rules = getPublicPoolRules();

  // 检查客户是否在公海池
  const customer = await prisma.crmCustomer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    return { success: false, message: '客户不存在' };
  }

  if (customer.ownerId && customer.status !== 'pool') {
    return { success: false, message: '该客户不属于公海池' };
  }

  // 检查冷却期
  if (customer.poolReleasedAt) {
    const coolingEnd = new Date(customer.poolReleasedAt.getTime() + rules.coolingDays * 24 * 60 * 60 * 1000);
    if (new Date() < coolingEnd) {
      return { success: false, message: `该客户处于冷却期，还需等待至 ${coolingEnd.toLocaleDateString()}` };
    }
  }

  // 检查今日领取上限
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayClaims = await prisma.crmCustomer.count({
    where: {
      ownerId: userId,
      poolClaimedAt: { gte: today },
    },
  });

  if (todayClaims >= rules.claimLimit) {
    return { success: false, message: `今日领取上限为${rules.claimLimit}个，已达上限` };
  }

  // 检查用户客户总数上限
  const userTotal = await prisma.crmCustomer.count({
    where: { ownerId: userId },
  });

  if (userTotal >= rules.maxPerUser) {
    return { success: false, message: `客户持有上限为${rules.maxPerUser}个，已达上限` };
  }

  // 执行认领
  await prisma.crmCustomer.update({
    where: { id: customerId },
    data: {
      ownerId: userId,
      status: 'active',
      poolClaimedAt: new Date(),
      lastContact: new Date(),
    },
  });

  return { success: true, message: '认领成功，请尽快跟进' };
}

/**
 * 释放客户到公海池
 */
export async function releaseToPool(
  userId: string,
  customerId: string,
): Promise<{ success: boolean; message: string }> {
  const customer = await prisma.crmCustomer.findFirst({
    where: { id: customerId, ownerId: userId },
  });

  if (!customer) {
    return { success: false, message: '客户不存在或不属于您' };
  }

  await prisma.crmCustomer.update({
    where: { id: customerId },
    data: {
      ownerId: null,
      status: 'pool',
      poolReleasedAt: new Date(),
    },
  });

  return { success: true, message: '已释放到公海池' };
}

// ==================== 标签管理增强 ====================

/**
 * 为客户添加标签（增强版 - 去重、规范化）
 */
export async function addCustomerTags(
  userId: string,
  customerId: string,
  tags: string[],
): Promise<string[]> {
  const customer = await prisma.crmCustomer.findFirst({
    where: { id: customerId, ownerId: userId },
  });

  if (!customer) throw new Error('客户不存在或不属于您');

  // 解析现有标签
  let existingTags: string[] = [];
  try {
    if (Array.isArray(customer.tags)) {
      existingTags = customer.tags;
    } else if (typeof customer.tags === 'string') {
      existingTags = JSON.parse(customer.tags);
    }
  } catch { /* ignore */ }

  // 合并去重（大小写不敏感去重，保留首次出现的格式）
  const normalizedNew = tags.map(t => t.trim()).filter(Boolean);
  const existingLower = existingTags.map(t => t.toLowerCase());
  const uniqueNew = normalizedNew.filter(t => !existingLower.includes(t.toLowerCase()));

  const allTags = [...existingTags, ...uniqueNew].slice(0, 20); // 最多20个标签

  // 更新客户标签
  await prisma.crmCustomer.update({
    where: { id: customerId },
    data: { tags: JSON.stringify(allTags) },
  });

  // 同步到标签表（用于全局标签管理）
  for (const tag of allTags) {
    await prisma.crmTag.upsert({
      where: { name: tag },
      create: { name: tag, userId },
      update: {},
    });
  }

  return allTags;
}

/**
 * 移除客户标签
 */
export async function removeCustomerTag(
  userId: string,
  customerId: string,
  tagName: string,
): Promise<string[]> {
  const customer = await prisma.crmCustomer.findFirst({
    where: { id: customerId, ownerId: userId },
  });

  if (!customer) throw new Error('客户不存在或不属于您');

  let existingTags: string[] = [];
  try {
    if (Array.isArray(customer.tags)) {
      existingTags = customer.tags;
    } else if (typeof customer.tags === 'string') {
      existingTags = JSON.parse(customer.tags);
    }
  } catch { /* ignore */ }

  const filtered = existingTags.filter(
    t => t.toLowerCase() !== tagName.toLowerCase(),
  );

  await prisma.crmCustomer.update({
    where: { id: customerId },
    data: { tags: JSON.stringify(filtered) },
  });

  return filtered;
}

// ==================== 自动化规则引擎 ====================

/**
 * 执行所有活跃的自动化规则
 */
export async function executeAutomationRules(userId: string): Promise<{
  executed: number;
  skipped: number;
  results: Array<{ ruleId: string; name: string; affected: number }>;
}> {
  const rules = await prisma.crmAutomationRule.findMany({
    where: { userId, enabled: true },
  });

  let executed = 0;
  let skipped = 0;
  const results: Array<{ ruleId: string; name: string; affected: number }> = [];

  for (const rule of rules) {
    try {
      const conditions = typeof rule.conditions === 'string'
        ? JSON.parse(rule.conditions)
        : rule.conditions;

      const actions = typeof rule.actions === 'string'
        ? JSON.parse(rule.actions)
        : rule.actions;

      // 根据条件类型执行不同逻辑
      let affected = 0;

      switch (conditions.type) {
        case 'overdue_followup': {
          const overdueDays = conditions.days || 30;
          const date = new Date(Date.now() - overdueDays * 24 * 60 * 60 * 1000);

          const customers = await prisma.crmCustomer.findMany({
            where: {
              userId,
              lastContact: { lt: date },
              status: { not: 'inactive' },
            },
            select: { id: true, name: true },
          });

          affected = customers.length;

          // 执行操作
          for (const action of actions) {
            switch (action.type) {
              case 'notify':
                // 创建通知/提醒
                for (const customer of customers) {
                  await prisma.crmReminder.create({
                    data: {
                      userId,
                      customerId: customer.id,
                      type: 'followup',
                      content: `[自动提醒] ${customer.name}已超过${overdueDays}天未跟进`,
                      dueDate: new Date(),
                    },
                  }).catch(() => {});
                }
                break;
              case 'change_status':
                // 批量修改状态
                if (action.targetStatus) {
                  await prisma.crmCustomer.updateMany({
                    where: {
                      userId,
                      lastContact: { lt: date },
                    },
                    data: { status: action.targetStatus },
                  });
                }
                break;
              case 'move_to_pool':
                // 移到公海池
                await prisma.crmCustomer.updateMany({
                  where: {
                    userId,
                    lastContact: { lt: date },
                  },
                  data: {
                    ownerId: null,
                    status: 'pool',
                    poolReleasedAt: new Date(),
                  },
                });
                break;
            }
          }
          break;
        }
        default: {
          skipped++;
          continue;
        }
      }

      executed++;
      results.push({ ruleId: rule.id, name: rule.name, affected });
    } catch (err) {
      console.warn(`[CRM] 执行规则 ${rule.name} 失败:`, (err as Error).message);
      skipped++;
    }
  }

  return { executed, skipped, results };
}
