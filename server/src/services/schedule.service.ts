/**
 * 定时发布服务
 * 支持定时发布内容到各平台
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ScheduledTask {
  id: string;
  userId: string;
  title: string;
  content: string;
  mediaUrls?: string[];
  platforms: string[];
  scheduledAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建定时发布任务
 */
export async function createScheduledTask(
  userId: string,
  data: {
    title: string;
    content: string;
    mediaUrls?: string[];
    platforms: string[];
    scheduledAt: Date;
  }
) {
  return await prisma.scheduledTask.create({
    data: {
      userId,
      title: data.title,
      content: data.content,
      mediaUrls: data.mediaUrls ? JSON.stringify(data.mediaUrls) : null,
      platforms: JSON.stringify(data.platforms),
      scheduledAt: data.scheduledAt,
      status: 'pending'
    }
  });
}

/**
 * 获取用户的定时任务列表
 */
export async function getScheduledTasks(
  userId: string,
  options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const where: any = { userId };
  
  if (options.status) {
    where.status = options.status;
  }
  
  const [tasks, total] = await Promise.all([
    prisma.scheduledTask.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      take: options.limit || 20,
      skip: options.offset || 0
    }),
    prisma.scheduledTask.count({ where })
  ]);
  
  return {
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      content: t.content,
      mediaUrls: t.mediaUrls ? JSON.parse(t.mediaUrls) : [],
      platforms: JSON.parse(t.platforms),
      scheduledAt: t.scheduledAt,
      status: t.status,
      createdAt: t.createdAt
    })),
    total,
    hasMore: (options.offset || 0) + tasks.length < total
  };
}

/**
 * 取消定时任务
 */
export async function cancelScheduledTask(taskId: string, userId: string) {
  return await prisma.scheduledTask.updateMany({
    where: {
      id: taskId,
      userId,
      status: 'pending'
    },
    data: {
      status: 'cancelled'
    }
  });
}

/**
 * 删除定时任务
 */
export async function deleteScheduledTask(taskId: string, userId: string) {
  return await prisma.scheduledTask.deleteMany({
    where: {
      id: taskId,
      userId
    }
  });
}

/**
 * 获取待执行的任务
 */
export async function getPendingTasks(beforeTime: Date) {
  return await prisma.scheduledTask.findMany({
    where: {
      status: 'pending',
      scheduledAt: { lte: beforeTime }
    }
  });
}

/**
 * 更新任务状态
 */
export async function updateTaskStatus(taskId: string, status: string, error?: string) {
  return await prisma.scheduledTask.update({
    where: { id: taskId },
    data: {
      status,
      errorMessage: error
    }
  });
}

/**
 * 检查定时任务是否可执行
 */
export function isTaskExecutable(task: any): boolean {
  if (task.status !== 'pending') return false;
  return new Date(task.scheduledAt) <= new Date();
}
