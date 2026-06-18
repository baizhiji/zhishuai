// 定时任务执行引擎 - 使用 node-cron 轮询数据库执行
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { prisma } from '../utils/db';


// 任务处理器类型
type TaskHandler = (task: any) => Promise<{ success: boolean; result?: string }>;

// 注册的任务处理器
const taskHandlers: Record<string, TaskHandler> = {};

// 注册任务处理器
export function registerTaskHandler(type: string, handler: TaskHandler) {
  taskHandlers[type] = handler;
  logger.info({ type }, 'Task handler registered');
}

// 执行单个待执行任务
async function executeTask(task: any) {
  try {
    // 标记为执行中
    await prisma.scheduledTask.update({
      where: { id: task.id },
      data: { status: 'processing' },
    });

    // 查找处理器（根据平台类型）
    const handler = taskHandlers[task.platform] || taskHandlers['default'];

    if (!handler) {
      await prisma.scheduledTask.update({
        where: { id: task.id },
        data: { status: 'failed', result: '未找到任务处理器' },
      });
      return;
    }

    const result = await handler(task);

    if (result.success) {
      await prisma.scheduledTask.update({
        where: { id: task.id },
        data: {
          status: 'completed',
          result: result.result || '执行成功',
          publishedAt: new Date(),
        },
      });
      logger.info({ taskId: task.id, platform: task.platform }, 'Scheduled task completed');
    } else {
      await prisma.scheduledTask.update({
        where: { id: task.id },
        data: {
          status: 'failed',
          result: result.result || '执行失败',
        },
      });
      logger.warn({ taskId: task.id, platform: task.platform }, 'Scheduled task failed');
    }
  } catch (error: any) {
    logger.error({ taskId: task.id, error: error.message }, 'Scheduled task error');
    try {
      await prisma.scheduledTask.update({
        where: { id: task.id },
        data: { status: 'failed', result: error.message },
      });
    } catch (e) {
      // 更新失败也忽略
    }
  }
}

// 轮询并执行到期任务
export async function pollScheduledTasks() {
  try {
    const now = new Date();

    // 查找到期的待执行任务
    const pendingTasks = await prisma.scheduledTask.findMany({
      where: {
        status: 'pending',
        scheduledTime: { lte: now },
      },
      take: 20, // 每次最多处理20个
    });

    if (pendingTasks.length > 0) {
      logger.info({ count: pendingTasks.length }, 'Processing scheduled tasks');

      // 并行执行（限制并发数）
      await Promise.allSettled(pendingTasks.map(task => executeTask(task)));
    }
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to poll scheduled tasks');
  }
}

// 启动定时轮询（每30秒检查一次）
let pollInterval: ReturnType<typeof setInterval> | null = null;

export function startScheduler() {
  if (pollInterval) return; // 避免重复启动

  logger.info('Starting scheduled task engine (30s interval)');
  pollInterval = setInterval(pollScheduledTasks, 30 * 1000);

  // 启动时立即执行一次
  pollScheduledTasks();
}

export function stopScheduler() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    logger.info('Scheduled task engine stopped');
  }
}

// 默认任务处理器（占位 - 实际发布逻辑需对接各平台API）
registerTaskHandler('default', async (task) => {
  logger.info({ taskId: task.id, platform: task.platform }, 'Executing scheduled publish task');
  // TODO: 对接各社交平台发布API
  return { success: true, result: '任务已加入发布队列' };
});
