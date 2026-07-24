/**
 * 数字人服务层
 * 封装数字人 CRUD、视频模板、视频任务的业务逻辑
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── 类型定义 ───
export interface CreateHumanInput {
  name: string;
  gender?: string;
  style?: string;
  voice?: string;
  description?: string;
  avatar?: string;
}

export interface UpdateHumanInput {
  name?: string;
  gender?: string;
  style?: string;
  voice?: string;
  description?: string;
  avatar?: string;
  status?: string;
}

export interface CreateTaskInput {
  humanId?: string;
  templateId?: string;
  title: string;
  script: string;
  backgroundMusic?: string;
}

export interface UpdateTaskInput {
  status?: string;
  progress?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  style?: string;
}

// ─── 数字人 CRUD ───
export async function getHumanList(userId: string, params: ListParams) {
  const { page = 1, pageSize = 10, status } = params;
  const where: Record<string, unknown> = { userId };
  if (status) where.status = status;

  const [list, total] = await Promise.all([
    prisma.digitalHuman.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.digitalHuman.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

export async function getHumanById(id: string, userId: string) {
  return prisma.digitalHuman.findFirst({ where: { id, userId } });
}

export async function createHuman(userId: string, input: CreateHumanInput) {
  if (!input.name) {
    throw new ValidationError('名称不能为空');
  }

  return prisma.digitalHuman.create({
    data: {
      userId,
      name: input.name,
      gender: input.gender || 'female',
      style: input.style || 'professional',
      voice: input.voice || 'default',
      description: input.description,
      avatar: input.avatar,
    },
  });
}

export async function updateHuman(id: string, userId: string, input: UpdateHumanInput) {
  const existing = await prisma.digitalHuman.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError('数字人不存在');

  return prisma.digitalHuman.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.gender !== undefined && { gender: input.gender }),
      ...(input.style !== undefined && { style: input.style }),
      ...(input.voice !== undefined && { voice: input.voice }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.avatar !== undefined && { avatar: input.avatar }),
      ...(input.status !== undefined && { status: input.status }),
    },
  });
}

export async function deleteHuman(id: string, userId: string) {
  const existing = await prisma.digitalHuman.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError('数字人不存在');

  await prisma.digitalHuman.delete({ where: { id } });
  return true;
}

// ─── 视频模板 ───
export async function getTemplateList(params: ListParams) {
  const { page = 1, pageSize = 20, style } = params;
  const where: Record<string, unknown> = {};
  if (style) where.style = style;

  const [list, total] = await Promise.all([
    prisma.videoTemplate.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { usageCount: 'desc' },
    }),
    prisma.videoTemplate.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

// ─── 视频任务 ───
export async function getTaskList(userId: string, params: ListParams) {
  const { page = 1, pageSize = 10, status } = params;
  const where: Record<string, unknown> = { userId };
  if (status) where.status = status;

  const [list, total] = await Promise.all([
    prisma.videoTask.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.videoTask.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

export async function getTaskById(id: string, userId: string) {
  return prisma.videoTask.findFirst({ where: { id, userId } });
}

export async function createTask(userId: string, input: CreateTaskInput) {
  if (!input.title || !input.script) {
    throw new ValidationError('标题和脚本不能为空');
  }

  const task = await prisma.videoTask.create({
    data: {
      userId,
      humanId: input.humanId,
      templateId: input.templateId,
      title: input.title,
      script: input.script,
      backgroundMusic: input.backgroundMusic,
      status: 'pending',
      progress: 0,
    },
  });

  // 更新使用计数（事务非关键，并行执行）
  const updates: Promise<unknown>[] = [];
  if (input.humanId) {
    updates.push(
      prisma.digitalHuman.update({
        where: { id: input.humanId },
        data: { usageCount: { increment: 1 } },
      })
    );
  }
  if (input.templateId) {
    updates.push(
      prisma.videoTemplate.update({
        where: { id: input.templateId },
        data: { usageCount: { increment: 1 } },
      })
    );
  }
  await Promise.all(updates);

  return task;
}

export async function updateTask(id: string, userId: string, input: UpdateTaskInput) {
  const existing = await prisma.videoTask.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError('视频任务不存在');

  const updateData: Record<string, unknown> = {};
  if (input.status) updateData.status = input.status;
  if (input.progress !== undefined) updateData.progress = input.progress;
  if (input.videoUrl) updateData.videoUrl = input.videoUrl;
  if (input.thumbnailUrl) updateData.thumbnailUrl = input.thumbnailUrl;
  if (input.errorMessage) updateData.errorMessage = input.errorMessage;
  if (input.status === 'completed') updateData.completedAt = new Date();
  if (input.status === 'processing' && !existing.startedAt) updateData.startedAt = new Date();

  return prisma.videoTask.update({ where: { id }, data: updateData });
}

export async function cancelTask(id: string, userId: string) {
  const existing = await prisma.videoTask.findFirst({
    where: { id, userId, status: { in: ['pending', 'processing'] } },
  });
  if (!existing) throw new NotFoundError('视频任务不存在或无法取消');

  return prisma.videoTask.update({
    where: { id },
    data: { status: 'cancelled' },
  });
}

export async function deleteTask(id: string, userId: string) {
  const existing = await prisma.videoTask.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError('视频任务不存在');

  await prisma.videoTask.delete({ where: { id } });
  return true;
}

// ─── 统计 ───
export async function getDigitalHumanStats(userId: string) {
  const [humans, tasks] = await Promise.all([
    prisma.digitalHuman.count({ where: { userId } }),
    prisma.videoTask.findMany({ where: { userId }, select: { status: true } }),
  ]);

  return {
    totalHumans: humans,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    processingTasks: tasks.filter(t => t.status === 'processing').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
  };
}

// ─── 自定义错误类 ───
export class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
