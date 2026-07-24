/**
 * Agent Service - 代理商客户管理业务逻辑
 *
 * 从 agent.ts 路由提取：
 * - 客户列表查询（含统计）
 * - 客户详情
 * - 客户创建（含功能开关初始化）
 * - 客户更新/冻结/解冻
 * - 密码重置
 * - 功能开关管理
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../middleware/auth';

const prisma = new PrismaClient();

// ==================== 类型定义 ====================

export interface CustomerListItem {
  id: string;
  phone: string;
  name: string;
  avatar: string | null;
  status: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  materialCount: number;
  accountCount: number;
  publishCount: number;
}

export interface CustomerDetail extends CustomerListItem {
  featureSwitches: Array<{
    featureCode: string;
    enabled: boolean;
  }>;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateCustomerInput {
  phone: string;
  name?: string;
  password?: string;
}

export interface FeatureSwitchItem {
  code: string;
  name: string;
  description: string;
  enabled: boolean;
  subFeatures: FeatureSwitchItem[];
}

const DEFAULT_PASSWORD = '123456';

// ==================== 辅助函数 ====================

async function validateAgent(agentId: string): Promise<void> {
  const agent = await prisma.user.findFirst({
    where: { id: agentId, role: 'agent' },
  });
  if (!agent) {
    throw new AgentServiceError('非代理商账号', 403);
  }
}

async function validateCustomerOwnership(agentId: string, customerId: string) {
  const customer = await prisma.user.findFirst({
    where: { id: customerId, agentRelation: { agentId } },
  });
  if (!customer) {
    throw new AgentServiceError('客户不存在', 404);
  }
  return customer;
}

async function getCustomerStats(customerId: string) {
  const [materialCount, accountCount, publishCount] = await Promise.all([
    prisma.material.count({ where: { userId: customerId } }),
    prisma.matrixAccount.count({ where: { userId: customerId } }),
    prisma.publishedContent.count({ where: { userId: customerId } }),
  ]);
  return { materialCount, accountCount, publishCount };
}

// ==================== 业务逻辑 ====================

/**
 * 获取客户列表
 */
export async function getCustomers(
  agentId: string,
  params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
  },
): Promise<PaginatedResult<CustomerListItem>> {
  await validateAgent(agentId);

  const { page = 1, pageSize = 20, keyword = '', status = '' } = params;
  const where: Record<string, unknown> = { agentId };

  if (keyword) {
    where.OR = [
      { phone: { contains: keyword } },
      { name: { contains: keyword } },
    ];
  }
  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * pageSize;

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        status: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  const list = await Promise.all(
    customers.map(async (customer) => {
      const stats = await getCustomerStats(customer.id);
      return { ...customer, ...stats };
    }),
  );

  return { list, total, page, pageSize };
}

/**
 * 获取客户详情
 */
export async function getCustomerDetail(
  agentId: string,
  customerId: string,
): Promise<CustomerDetail> {
  await validateAgent(agentId);

  const customer = await prisma.user.findFirst({
    where: { id: customerId, agentRelation: { agentId } },
    include: { featureSwitches: true },
  });

  if (!customer) {
    throw new AgentServiceError('客户不存在', 404);
  }

  const stats = await getCustomerStats(customerId);

  return {
    id: customer.id,
    phone: customer.phone,
    name: customer.name,
    avatar: customer.avatar,
    status: customer.status,
    role: customer.role,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    ...stats,
    featureSwitches: customer.featureSwitches.map((fs) => ({
      featureCode: fs.featureCode,
      enabled: fs.enabled,
    })),
  };
}

/**
 * 创建客户账号
 */
export async function createCustomer(
  agentId: string,
  input: CreateCustomerInput,
) {
  await validateAgent(agentId);

  const { phone, name, password } = input;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    throw new AgentServiceError('手机号已被注册', 400);
  }

  const customer = await prisma.user.create({
    data: {
      phone,
      name: name || phone,
      password: hashPassword(password || DEFAULT_PASSWORD),
      role: 'customer',
      agentRelation: { create: { agentId } },
      status: 'active',
    },
  });

  // 默认仅开通 AI创作工厂
  const allFeatures = await prisma.featureSwitch.findMany();
  if (allFeatures.length > 0) {
    await prisma.userFeatureSwitch.createMany({
      data: allFeatures.map((f) => ({
        userId: customer.id,
        featureCode: f.code,
        enabled: f.code === 'factory',
      })),
    });
  }

  return customer;
}

/**
 * 更新客户信息
 */
export async function updateCustomer(
  agentId: string,
  customerId: string,
  data: { name?: string; avatar?: string },
) {
  await validateCustomerOwnership(agentId, customerId);

  return prisma.user.update({
    where: { id: customerId },
    data,
  });
}

/**
 * 冻结/解冻客户
 */
export async function toggleCustomerStatus(agentId: string, customerId: string) {
  const customer = await validateCustomerOwnership(agentId, customerId);
  const newStatus = customer.status === 'active' ? 'frozen' : 'active';

  return prisma.user.update({
    where: { id: customerId },
    data: { status: newStatus },
  });
}

/**
 * 重置客户密码
 */
export async function resetCustomerPassword(
  agentId: string,
  customerId: string,
  newPassword?: string,
) {
  await validateCustomerOwnership(agentId, customerId);

  await prisma.user.update({
    where: { id: customerId },
    data: { password: hashPassword(newPassword || DEFAULT_PASSWORD) },
  });
}

/**
 * 获取客户功能开关
 */
export async function getCustomerFeatures(
  agentId: string,
  customerId: string,
): Promise<FeatureSwitchItem[]> {
  await validateCustomerOwnership(agentId, customerId);

  const [globalFeatures, customerFeatures] = await Promise.all([
    prisma.featureSwitch.findMany({ include: { subFeatures: true } }),
    prisma.userFeatureSwitch.findMany({ where: { userId: customerId } }),
  ]);

  return globalFeatures.map((feature) => {
    const customerSetting = customerFeatures.find((f) => f.featureCode === feature.code);
    return {
      id: feature.id,
      code: feature.code,
      name: feature.name,
      description: feature.description,
      enabled: customerSetting ? customerSetting.enabled : feature.enabled,
      subFeatures: feature.subFeatures.map((sub) => ({
        id: sub.id,
        code: sub.code,
        name: sub.name,
        description: sub.description,
        enabled: sub.enabled,
      })),
    };
  });
}

/**
 * 更新客户功能开关
 */
export async function updateCustomerFeatures(
  agentId: string,
  customerId: string,
  features: Array<{ code: string; enabled: boolean }>,
) {
  await validateCustomerOwnership(agentId, customerId);

  await Promise.all(
    features.map((feature) =>
      prisma.userFeatureSwitch.upsert({
        where: {
          userId_featureCode: {
            userId: customerId,
            featureCode: feature.code,
          },
        },
        create: {
          userId: customerId,
          featureCode: feature.code,
          enabled: feature.enabled,
        },
        update: {
          enabled: feature.enabled,
        },
      }),
    ),
  );
}

/**
 * 获取客户统计数据
 */
export async function getCustomerDetailStats(
  agentId: string,
  customerId: string,
  dateFilter?: { startDate?: string; endDate?: string },
) {
  await validateCustomerOwnership(agentId, customerId);

  const dateWhere: Record<string, unknown> = {};
  if (dateFilter?.startDate) {
    dateWhere.gte = new Date(dateFilter.startDate);
  }
  if (dateFilter?.endDate) {
    dateWhere.lte = new Date(dateFilter.endDate);
  }

  const where = {
    userId: customerId,
    ...(Object.keys(dateWhere).length ? { createdAt: dateWhere } : {}),
  };

  const [materialCount, accountCount, publishCount] = await Promise.all([
    prisma.material.count({ where }),
    prisma.matrixAccount.count({ where }),
    prisma.publishedContent.count({ where }),
  ]);

  return { materialCount, accountCount, publishCount };
}

// ==================== 自定义错误类 ====================

export class AgentServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'AgentServiceError';
    this.statusCode = statusCode;
  }
}
