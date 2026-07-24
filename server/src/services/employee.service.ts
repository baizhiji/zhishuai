/**
 * 员工管理服务层
 * 封装员工 CRUD、登录、权限管理的业务逻辑
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── 常量 ───
const DEFAULT_PASSWORD = '123456';
const BCRYPT_ROUNDS = 10;

const PERMISSIONS: Record<string, string[]> = {
  staff: ['view_materials', 'create_content', 'manage_own_posts'],
  manager: ['view_materials', 'create_content', 'manage_own_posts', 'view_reports', 'manage_team'],
  admin: ['view_materials', 'create_content', 'manage_own_posts', 'view_reports', 'manage_team', 'manage_settings'],
};

// ─── 类型 ───
export interface ListParams {
  userId?: string;
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}

export interface CreateEmployeeInput {
  userId: string;
  name: string;
  phone: string;
  password?: string;
  email?: string;
  role?: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  permissions?: string[];
}

export interface LoginInput {
  phone: string;
  password: string;
}

// ─── 员工列表 ───
export async function getEmployeeList(params: ListParams) {
  const { userId, page = 1, pageSize = 20, keyword, status } = params;
  const where: Record<string, unknown> = {};

  if (userId) where.userId = userId;
  if (status) where.status = status;
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { phone: { contains: keyword } },
      { email: { contains: keyword } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      select: {
        id: true, name: true, phone: true, email: true, avatar: true,
        role: true, permissions: true, status: true, lastLoginAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

// ─── 创建员工 ───
export async function createEmployee(input: CreateEmployeeInput) {
  const { userId, name, phone, password, email, role = 'staff' } = input;

  if (!name || !phone) {
    throw new ValidationError('姓名和手机号为必填项');
  }

  const existing = await prisma.employee.findUnique({ where: { phone } });
  if (existing) throw new ValidationError('该手机号已注册');

  const hashedPassword = await bcrypt.hash(password || DEFAULT_PASSWORD, BCRYPT_ROUNDS);
  const rolePermissions = PERMISSIONS[role] || PERMISSIONS.staff;

  return prisma.employee.create({
    data: {
      userId, name, phone, password: hashedPassword, email, role,
      permissions: rolePermissions,
      status: 'active',
    },
    select: { id: true, name: true, phone: true, email: true, role: true, status: true, createdAt: true },
  });
}

// ─── 更新员工 ───
export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  const { name, email, role, status, permissions } = input;

  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (email !== undefined) data.email = email;
  if (role) {
    data.role = role;
    data.permissions = PERMISSIONS[role] || PERMISSIONS.staff;
  }
  if (status) data.status = status;
  if (permissions) data.permissions = permissions;

  return prisma.employee.update({
    where: { id },
    data,
    select: { id: true, name: true, phone: true, email: true, role: true, status: true, permissions: true },
  });
}

// ─── 重置密码 ───
export async function resetEmployeePassword(id: string, password?: string) {
  const hashedPassword = await bcrypt.hash(password || DEFAULT_PASSWORD, BCRYPT_ROUNDS);
  await prisma.employee.update({ where: { id }, data: { password: hashedPassword } });
  return true;
}

// ─── 删除员工 ───
export async function deleteEmployee(id: string) {
  await prisma.employee.delete({ where: { id } });
  return true;
}

// ─── 员工登录 ───
export async function employeeLogin(input: LoginInput, ip?: string) {
  const { phone, password } = input;

  if (!phone || !password) {
    throw new ValidationError('手机号和密码不能为空');
  }

  const employee = await prisma.employee.findUnique({ where: { phone } });
  if (!employee) {
    await logLoginFailure('unknown', ip, '员工不存在');
    throw new AuthError('手机号或密码错误');
  }

  if (employee.status !== 'active') {
    throw new AuthError('账号已被禁用');
  }

  const validPassword = await bcrypt.compare(password, employee.password);
  if (!validPassword) {
    await logLoginFailure(employee.id, ip, '密码错误');
    throw new AuthError('手机号或密码错误');
  }

  // 并行更新登录时间 + 记录日志
  await Promise.all([
    prisma.employee.update({ where: { id: employee.id }, data: { lastLoginAt: new Date() } }),
    prisma.employeeLoginLog.create({ data: { employeeId: employee.id, ip, status: 'success' } }),
  ]);

  const { password: _, ...employeeInfo } = employee;
  return {
    ...employeeInfo,
    mainUserId: employee.userId,
    token: `emp_${employee.id}_${Date.now()}`,
  };
}

// ─── 登录日志 ───
export async function getLoginLogs(employeeId: string, page = 1, pageSize = 20) {
  const [list, total] = await Promise.all([
    prisma.employeeLoginLog.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employeeLoginLog.count({ where: { employeeId } }),
  ]);

  return { list, total, page, pageSize };
}

// ─── 辅助函数 ───
async function logLoginFailure(employeeId: string, ip?: string, errorMsg?: string) {
  try {
    await prisma.employeeLoginLog.create({
      data: { employeeId, ip, status: 'failed', errorMsg },
    });
  } catch {
    // 日志记录失败不影响主流程
  }
}

// ─── 自定义错误类 ───
export class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthError extends Error {
  statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
