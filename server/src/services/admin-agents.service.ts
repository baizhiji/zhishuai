/**
 * Admin Agents Service - 管理员代理商/客户管理 Service 层
 */
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../middleware/auth';

const prisma = new PrismaClient();

// ==================== 错误类 ====================

export class AdminValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'AdminValidationError';
  }
}

export class AdminNotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'AdminNotFoundError';
  }
}

// ==================== 类型定义 ====================

export interface CreateAgentInput {
  phone: string;
  password: string;
  name?: string;
  level?: string;
  region?: string;
  commissionRate?: number;
  parentId?: string;
}

export interface UpdateAgentInput {
  name?: string;
  level?: string;
  region?: string;
  commissionRate?: number;
  status?: string;
}

export interface CreateCustomerInput {
  phone: string;
  password?: string;
  name?: string;
  agentId?: string;
  expireMonths?: number;
}

export interface UpdateCustomerInput {
  name?: string;
  status?: string;
  expireAt?: string;
}

export interface QueryOptions {
  status?: string;
  level?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

// ==================== 代理商管理 ====================

export async function getAgentList(opts: QueryOptions) {
  const { status, level, page = 1, pageSize = 20 } = opts;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (level) where.level = level;

  const [agents, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      include: {
        user: { select: { phone: true, name: true, avatar: true, createdAt: true } },
        children: { select: { id: true } },
        _count: { select: { agentRelations: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.agent.count({ where }),
  ]);

  return {
    agents,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getAgentDetail(id: string) {
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      user: { select: { phone: true, name: true, avatar: true, createdAt: true } },
      parent: { include: { user: { select: { name: true } } } },
      children: { include: { user: { select: { name: true, phone: true } } } },
      agentRelations: {
        include: { user: { select: { id: true, name: true, phone: true, createdAt: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      _count: { select: { agentRelations: true } },
    },
  });

  if (!agent) throw new AdminNotFoundError('代理商不存在');
  return agent;
}

export async function createAgent(input: CreateAgentInput) {
  const { phone, password, name, level = 'district', region, commissionRate = 0.3, parentId } = input;

  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) throw new AdminValidationError('该手机号已注册');

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { phone, password: hashPassword(password), name, role: 'agent' },
    });

    const agent = await tx.agent.create({
      data: { userId: user.id, name: name || phone, level, region, commissionRate, parentId },
    });

    return { user, agent };
  });

  return result.agent;
}

export async function updateAgent(id: string, input: UpdateAgentInput) {
  const { name, level, region, commissionRate, status } = input;

  const agent = await prisma.agent.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(level !== undefined && { level }),
      ...(region !== undefined && { region }),
      ...(commissionRate !== undefined && { commissionRate }),
      ...(status !== undefined && { status }),
    },
    include: { user: { select: { phone: true, name: true } } },
  });

  return agent;
}

export async function toggleAgentStatus(id: string, status: string) {
  const agent = await prisma.agent.update({
    where: { id },
    data: { status },
    include: { user: { select: { phone: true, name: true } } },
  });

  await prisma.user.update({
    where: { id: agent.userId },
    data: { status: status === 'frozen' ? 'inactive' : 'active' },
  });

  return agent;
}

export async function deleteAgent(id: string) {
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: { _count: { select: { agentRelations: true } } },
  });

  if (!agent) throw new AdminNotFoundError('代理商不存在');
  if (agent._count.agentRelations > 0) throw new AdminValidationError('该代理商下有客户，无法删除');

  await prisma.agent.delete({ where: { id } });
}

export async function getAgentStats(id: string, period: string = 'monthly') {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      break;
    case 'weekly':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 84);
      break;
    default:
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  }

  const [stats, summary] = await Promise.all([
    prisma.agentStats.findMany({
      where: { agentId: id, period, periodStart: { gte: startDate } },
      orderBy: { periodStart: 'desc' },
    }),
    prisma.agent.findUnique({
      where: { id },
      select: { balance: true, totalRevenue: true, _count: { select: { agentRelations: true } } },
    }),
  ]);

  return {
    stats,
    summary: {
      balance: summary?.balance || 0,
      totalRevenue: summary?.totalRevenue || 0,
      totalCustomers: summary?._count.agentRelations || 0,
    },
  };
}

export async function getAgentCustomers(id: string, opts: { status?: string; page?: number; pageSize?: number }) {
  const { status, page = 1, pageSize = 20 } = opts;
  const skip = (page - 1) * pageSize;

  const agent = await prisma.agent.findUnique({ where: { id }, select: { userId: true } });
  if (!agent) throw new AdminNotFoundError('代理商不存在');

  const where: Record<string, unknown> = { agentRelation: { agent: { id } } };
  if (status) where.status = status;

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, phone: true, name: true, avatar: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    customers,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

// ==================== 客户管理 ====================

export async function getCustomerList(opts: QueryOptions) {
  const { status, keyword, page = 1, pageSize = 20 } = opts;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { phone: { contains: keyword } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        agentRelation: { include: { agent: { include: { user: { select: { name: true } } } } } },
        _count: { select: { matrixAccounts: true, publishedContents: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    customers,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function createCustomer(input: CreateCustomerInput) {
  const { phone, password, name, agentId, expireMonths } = input;

  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) throw new AdminValidationError('该手机号已注册');

  const expireAt = expireMonths === -1
    ? new Date('2099-12-31')
    : new Date(Date.now() + (expireMonths || 0) * 30 * 24 * 60 * 60 * 1000);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        phone,
        password: hashPassword(password || '123456'),
        name: name || phone,
        role: 'customer',
      },
    });

    if (agentId) {
      await tx.userAgentRelation.create({ data: { userId: newUser.id, agentId } });
    }

    const allFeatures = await tx.featureSwitch.findMany();
    if (allFeatures.length > 0) {
      await tx.userFeatureSwitch.createMany({
        data: allFeatures.map(f => ({
          userId: newUser.id,
          featureCode: f.code,
          enabled: f.code === 'factory',
        })),
      });
    }

    return newUser;
  });

  return user;
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  const { name, status, expireAt } = input;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(status !== undefined && { status }),
      ...(expireAt !== undefined && { expireAt: new Date(expireAt) }),
    },
  });

  return user;
}

export async function toggleCustomerStatus(id: string, status: string) {
  const user = await prisma.user.update({
    where: { id },
    data: { status: status === 'frozen' ? 'inactive' : 'active' },
  });
  return user;
}

export async function deleteCustomer(id: string) {
  await prisma.$transaction([
    prisma.userAgentRelation.deleteMany({ where: { userId: id } }),
    prisma.userFeatureSwitch.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);
}

export async function setCustomerFeature(customerId: string, featureCode: string, enabled: boolean) {
  return prisma.userFeatureSwitch.upsert({
    where: { userId_featureCode: { userId: customerId, featureCode } },
    update: { enabled },
    create: { userId: customerId, featureCode, enabled },
  });
}

export async function setCustomerFeatures(customerId: string, features: string[]) {
  for (const featureCode of features) {
    await prisma.userFeatureSwitch.upsert({
      where: { userId_featureCode: { userId: customerId, featureCode } },
      update: { enabled: true },
      create: { userId: customerId, featureCode, enabled: true },
    });
  }
}
