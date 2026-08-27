/**
 * 智能获客-自动跟评调度器
 *
 * 定时扫描 active 的 AutoCommentTask：
 *  - 按配置的目标内容 URL 逐条生成合规话术并自动跟评（复用 commentDeliveryService 完整风控链路）
 *  - 每日限额控制、当日去重、熔断/频控时提前停止本轮
 */
import { prisma } from '../utils/db';
import { commentDeliveryService } from './comment-delivery.service';

export interface RunTaskResult {
  processed: number;
  sent: number;
  skipped: number;
  errors: string[];
}

/**
 * 执行单个自动跟评任务（一轮）
 */
export async function runAutoCommentTask(taskId: string): Promise<RunTaskResult> {
  const task = await prisma.autoCommentTask.findUnique({ where: { id: taskId } });
  if (!task || !task.active) return { processed: 0, sent: 0, skipped: 0, errors: [] };

  // 解析目标 URL 列表
  let targetUrls: string[] = [];
  try {
    targetUrls = Array.isArray(task.targetUrls) ? task.targetUrls : JSON.parse(String(task.targetUrls || '[]'));
  } catch {
    targetUrls = [];
  }
  if (!Array.isArray(targetUrls)) targetUrls = [];
  if (targetUrls.length === 0) {
    return { processed: 0, sent: 0, skipped: 0, errors: ['任务未配置目标内容 URL'] };
  }

  // 今日已发送数量（任务级每日限额）
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  let sentToday = 0;
  try {
    sentToday = await prisma.commentDelivery.count({
      where: { userId: task.userId, platform: task.platform, createdAt: { gte: startOfDay } },
    });
  } catch {
    sentToday = 0;
  }
  const remaining = Math.max(task.dailyLimit - sentToday, 0);
  if (remaining <= 0) {
    return { processed: 0, sent: 0, skipped: 0, errors: ['已达到今日发送上限'] };
  }

  // 当日已处理目标（去重）
  let doneUrls: string[] = [];
  try {
    const recordsToday = await prisma.autoCommentRecord.findMany({
      where: { taskId, createdAt: { gte: startOfDay } },
      select: { targetUrl: true },
    });
    doneUrls = recordsToday.map((r: any) => r.targetUrl).filter(Boolean);
  } catch {
    doneUrls = [];
  }
  const doneSet = new Set(doneUrls);

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const url of targetUrls) {
    if (doneSet.has(url)) {
      skipped++;
      continue;
    }
    if (sent >= remaining) break;
    doneSet.add(url);

    let record: any = null;
    try {
      record = await prisma.autoCommentRecord.create({
        data: { taskId, targetUrl: url, status: 'processing' },
      });
    } catch { /* 记录表不可用时继续发送 */ }

    const result = await commentDeliveryService.sendComment({
      userId: task.userId,
      platform: task.platform,
      targetUrl: url,
      topic: task.name,
    });

    processed++;
    if (result.success) {
      sent++;
      if (record) {
        await prisma.autoCommentRecord.update({
          where: { id: record.id },
          data: { status: 'sent', deliveryId: result.deliveryId || null, message: result.message },
        }).catch(() => {});
      }
    } else {
      if (record) {
        await prisma.autoCommentRecord.update({
          where: { id: record.id },
          data: { status: 'failed', message: result.message },
        }).catch(() => {});
      }
      // 熔断 / 频控 / 无账号：提前停止本轮，避免空耗
      if (['break', 'rate-limit', 'no-account'].includes(result.blockedReason || '')) {
        errors.push(result.message);
        break;
      }
    }
  }

  await prisma.autoCommentTask.update({
    where: { id: taskId },
    data: { lastRunAt: new Date(), updatedAt: new Date() },
  }).catch(() => {});

  return { processed, sent, skipped, errors };
}

/**
 * 扫描所有 active 任务，执行到期的任务
 */
export async function runDueAutoCommentTasks(): Promise<void> {
  let tasks: any[] = [];
  try {
    tasks = await prisma.autoCommentTask.findMany({ where: { active: true } });
  } catch {
    return; // 表不存在
  }
  for (const t of tasks) {
    const due = !t.lastRunAt || Date.now() - new Date(t.lastRunAt).getTime() >= t.intervalMinutes * 60 * 1000;
    if (!due) continue;
    try {
      await runAutoCommentTask(t.id);
    } catch (e: any) {
      console.error(`[auto-comment] 任务 ${t.id} 执行失败:`, e.message);
    }
  }
}

/**
 * 注册自动跟评调度器（5 分钟扫描一次，启动 10 秒后首跑）
 * 返回停止函数
 */
export function setupAutoCommentScheduler(): () => void {
  const timer = setInterval(async () => {
    try {
      await runDueAutoCommentTasks();
    } catch (e: any) {
      console.error('[auto-comment] 调度失败:', e.message);
    }
  }, 5 * 60 * 1000);

  setTimeout(() => {
    runDueAutoCommentTasks().catch(() => {});
  }, 10 * 1000);

  console.log('[auto-comment] 自动跟评调度器已启动（5 分钟/次扫描）');
  return () => clearInterval(timer);
}
