/**
 * CRM Advanced Service - CRM 高级功能业务逻辑
 *
 * 从 crm-advanced.ts 路由提取：
 * - 标签管理（CRUD + 客户关联）
 * - 自动化规则（CRUD + 执行引擎）
 * - 提醒管理（CRUD）
 * - CRM 统计看板
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== 类型定义 ====================

export interface TagWithCount {
  id: string;
  userId: string;
  name: string;
  color: string;
  customerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationRuleInput {
  name: string;
  trigger: string;
  condition: Record<string, unknown>;
  action: { type: string; value?: string };
}

export interface ReminderInput {
  customerId: string;
  type: 'follow_up' | 'contract' | 'birthday' | 'custom';
  title: string;
  remindAt: string;
}

export interface CRMAdvancedStats {
  totalCustomers: number;
  activeCustomers: number;
  overdueFollowUps: number;
  todayReminders: number;
  levelDistribution: Array<{ level: string; count: number }>;
  sourceDistribution: Array<{ source: string; count: number }>;
  dailyTrend: Array<{ date: string; count: number }>;
}

export interface RuleExecuteResult {
  executedCount: number;
}

// ==================== 标签管理 ====================

const DEFAULT_TAG_COLOR = '#1890ff';

/**
 * 获取标签列表（含客户数）
 */
export async function getTags(userId: string): Promise<TagWithCount[]> {
  const tags = await prisma.crmTag.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const tagsWithCount = await Promise.all(
    tags.map(async (tag) => {
      const count = await prisma.crmCustomer.count({
        where: { userId, tags: { contains: tag.id } },
      });
      return {
        ...tag,
        customerCount: count,
      };
    }),
  );

  return tagsWithCount;
}

/**
 * 创建标签
 */
export async function createTag(
  userId: string,
  name: string,
  color?: string,
): Promise<{ id: string; name: string; color: string }> {
  const existing = await prisma.crmTag.findUnique({
    where: { userId_name: { userId, name } },
  });
  if (existing) {
    throw new CrmAdvancedError('标签名称已存在', 400);
  }

  return prisma.crmTag.create({
    data: { userId, name, color: color || DEFAULT_TAG_COLOR },
  });
}

/**
 * 更新标签
 */
export async function updateTag(
  userId: string,
  tagId: string,
  data: { name?: string; color?: string },
) {
  const tag = await prisma.crmTag.findFirst({ where: { id: tagId, userId } });
  if (!tag) {
    throw new CrmAdvancedError('标签不存在', 404);
  }

  return prisma.crmTag.update({
    where: { id: tagId },
    data,
  });
}

/**
 * 删除标签（同时清理客户关联）
 */
export async function deleteTag(userId: string, tagId: string): Promise<void> {
  const tag = await prisma.crmTag.findFirst({ where: { id: tagId, userId } });
  if (!tag) {
    throw new CrmAdvancedError('标签不存在', 404);
  }

  await prisma.crmTag.delete({ where: { id: tagId } });

  // 清理所有客户的该标签关联
  const customers = await prisma.crmCustomer.findMany({
    where: { userId, tags: { contains: tagId } },
  });

  await Promise.all(
    customers.map(async (customer) => {
      const tags: string[] = JSON.parse(customer.tags || '[]').filter((t: string) => t !== tagId);
      await prisma.crmCustomer.update({
        where: { id: customer.id },
        data: { tags: JSON.stringify(tags) },
      });
    }),
  );
}

/**
 * 给客户添加/移除标签
 */
export async function toggleCustomerTags(
  userId: string,
  customerId: string,
  tagIds: string[],
  action: 'add' | 'remove',
) {
  const customer = await prisma.crmCustomer.findFirst({
    where: { id: customerId, userId },
  });
  if (!customer) {
    throw new CrmAdvancedError('客户不存在', 404);
  }

  let currentTags: string[] = JSON.parse(customer.tags || '[]');

  if (action === 'remove') {
    currentTags = currentTags.filter((t: string) => !tagIds.includes(t));
  } else {
    currentTags = [...new Set([...currentTags, ...tagIds])];
  }

  return prisma.crmCustomer.update({
    where: { id: customerId },
    data: { tags: JSON.stringify(currentTags) },
  });
}

// ==================== 自动化规则 ====================

/**
 * 获取自动化规则列表
 */
export async function getAutomationRules(userId: string) {
  return prisma.crmAutomationRule.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * 创建自动化规则
 */
export async function createAutomationRule(
  userId: string,
  data: AutomationRuleInput,
) {
  return prisma.crmAutomationRule.create({
    data: {
      userId,
      name: data.name,
      trigger: data.trigger,
      condition: JSON.stringify(data.condition),
      action: JSON.stringify(data.action),
    },
  });
}

/**
 * 更新自动化规则
 */
export async function updateAutomationRule(
  userId: string,
  ruleId: string,
  data: Partial<AutomationRuleInput & { isActive: boolean }>,
) {
  const rule = await prisma.crmAutomationRule.findFirst({
    where: { id: ruleId, userId },
  });
  if (!rule) {
    throw new CrmAdvancedError('规则不存在', 404);
  }

  return prisma.crmAutomationRule.update({
    where: { id: ruleId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.trigger !== undefined && { trigger: data.trigger }),
      ...(data.condition !== undefined && { condition: JSON.stringify(data.condition) }),
      ...(data.action !== undefined && { action: JSON.stringify(data.action) }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

/**
 * 删除自动化规则
 */
export async function deleteAutomationRule(userId: string, ruleId: string): Promise<void> {
  const rule = await prisma.crmAutomationRule.findFirst({
    where: { id: ruleId, userId },
  });
  if (!rule) {
    throw new CrmAdvancedError('规则不存在', 404);
  }

  await prisma.crmAutomationRule.delete({ where: { id: ruleId } });
}

/**
 * 执行自动化规则检查
 */
export async function executeAutomationRules(userId: string): Promise<RuleExecuteResult> {
  const rules = await prisma.crmAutomationRule.findMany({
    where: { userId, isActive: true },
  });

  let executedCount = 0;

  for (const rule of rules) {
    const condition: Record<string, unknown> = JSON.parse(rule.condition);
    const action: { type: string; value?: string } = JSON.parse(rule.action);

    if (rule.trigger === 'follow_up_overdue') {
      const days = (condition.days as number) || 7;
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - days);

      const customers = await prisma.crmCustomer.findMany({
        where: {
          userId,
          status: 'active',
          OR: [
            { lastFollowUpAt: { lt: overdueDate } },
            { lastFollowUpAt: null, createdAt: { lt: overdueDate } },
          ],
        },
      });

      for (const customer of customers) {
        if (action.type === 'notify') {
          await prisma.notification.create({
            data: {
              userId,
              title: '客户跟进提醒',
              content: `客户 ${customer.name} 已超过${days}天未跟进，请及时处理`,
              type: 'crm_reminder',
            },
          });
        } else if (action.type === 'tag') {
          const tags: string[] = JSON.parse(customer.tags || '[]');
          if (action.value && !tags.includes(action.value)) {
            tags.push(action.value);
            await prisma.crmCustomer.update({
              where: { id: customer.id },
              data: { tags: JSON.stringify(tags) },
            });
          }
        }
        // status_change 等其他操作可在此扩展
      }
    }

    await prisma.crmAutomationRule.update({
      where: { id: rule.id },
      data: { lastRunAt: new Date(), runCount: { increment: 1 } },
    });

    executedCount++;
  }

  return { executedCount };
}

// ==================== 提醒管理 ====================

/**
 * 获取提醒列表
 */
export async function getReminders(
  userId: string,
  filter?: { upcoming?: boolean; completed?: boolean },
) {
  const where: Record<string, unknown> = { userId };

  if (filter?.upcoming) {
    where.isCompleted = false;
    where.remindAt = { gte: new Date() };
  } else if (filter?.completed) {
    where.isCompleted = true;
  }

  return prisma.crmReminder.findMany({
    where,
    orderBy: { remindAt: 'asc' },
    take: 100,
  });
}

/**
 * 创建提醒
 */
export async function createReminder(userId: string, data: ReminderInput) {
  const customer = await prisma.crmCustomer.findFirst({
    where: { id: data.customerId, userId },
  });
  if (!customer) {
    throw new CrmAdvancedError('客户不存在', 404);
  }

  return prisma.crmReminder.create({
    data: {
      userId,
      customerId: data.customerId,
      type: data.type,
      title: data.title,
      remindAt: new Date(data.remindAt),
    },
  });
}

/**
 * 标记提醒完成
 */
export async function completeReminder(userId: string, reminderId: string) {
  const reminder = await prisma.crmReminder.findFirst({
    where: { id: reminderId, userId },
  });
  if (!reminder) {
    throw new CrmAdvancedError('提醒不存在', 404);
  }

  return prisma.crmReminder.update({
    where: { id: reminderId },
    data: { isCompleted: true },
  });
}

/**
 * 删除提醒
 */
export async function deleteReminder(userId: string, reminderId: string): Promise<void> {
  const reminder = await prisma.crmReminder.findFirst({
    where: { id: reminderId, userId },
  });
  if (!reminder) {
    throw new CrmAdvancedError('提醒不存在', 404);
  }

  await prisma.crmReminder.delete({ where: { id: reminderId } });
}

// ==================== CRM 统计看板 ====================

/**
 * 获取 CRM 高级统计数据
 */
export async function getCRMAdvancedStats(userId: string): Promise<CRMAdvancedStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [totalCustomers, activeCustomers, overdueFollowUps, todayReminders] = await Promise.all([
    prisma.crmCustomer.count({ where: { userId } }),
    prisma.crmCustomer.count({
      where: {
        userId,
        status: 'active',
        lastFollowUpAt: { gte: new Date(new Date().setDate(1)) },
      },
    }),
    prisma.crmCustomer.count({
      where: {
        userId,
        status: 'active',
        OR: [
          { lastFollowUpAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          { lastFollowUpAt: null },
        ],
      },
    }),
    prisma.crmReminder.count({
      where: {
        userId,
        isCompleted: false,
        remindAt: { gte: today, lt: todayEnd },
      },
    }),
  ]);

  const [levelDistribution, sourceDistribution] = await Promise.all([
    prisma.crmCustomer.groupBy({
      by: ['level'],
      where: { userId },
      _count: true,
    }),
    prisma.crmCustomer.groupBy({
      by: ['source'],
      where: { userId, source: { not: null } },
      _count: true,
    }),
  ]);

  // 7天趋势
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentCustomers = await prisma.crmCustomer.findMany({
    where: { userId, createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
  });

  const dailyTrend: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dailyTrend[date.toISOString().split('T')[0]] = 0;
  }
  recentCustomers.forEach((c) => {
    const key = c.createdAt.toISOString().split('T')[0];
    if (dailyTrend[key] !== undefined) {
      dailyTrend[key]++;
    }
  });

  return {
    totalCustomers,
    activeCustomers,
    overdueFollowUps,
    todayReminders,
    levelDistribution: levelDistribution.map((d) => ({
      level: d.level || '未分类',
      count: d._count,
    })),
    sourceDistribution: sourceDistribution.map((d) => ({
      source: d.source || '未知',
      count: d._count,
    })),
    dailyTrend: Object.entries(dailyTrend).map(([date, count]) => ({ date, count })),
  };
}

// ==================== 自定义错误类 ====================

export class CrmAdvancedError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'CrmAdvancedError';
    this.statusCode = statusCode;
  }
}
