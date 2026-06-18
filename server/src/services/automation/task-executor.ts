/**
 * 自动化任务执行器
 * 读取 AutomationTask 配置，调度 Playwright 自动化脚本执行
 */
import { createBrowser, createContext, closeBrowser, navigateAndWait, clickElement, fillForm, uploadFile, takeScreenshot, randomDelay } from '../playwright.service';
import { humanClick, humanType as stealthHumanType, humanScroll, saveCookies, restoreCookies, adaptiveDelay } from '../stealth.service';
import { prisma } from '../../utils/db';


// 任务执行状态
const runningTasks: Map<string, { browserId: string; abortController: AbortController }> = new Map();

export interface PublishTaskConfig {
  platform: string;
  accountId: string;
  materialId: string;
  title?: string;
  content?: string;
  mediaUrls?: string[];
  tags?: string[];
  scheduledAt?: string;
}

export interface CommentCollectConfig {
  platform: string;
  accountId: string;
  targetUrl: string;
  maxComments: number;
}

/**
 * 执行自动发布任务
 */
export async function executePublishTask(userId: string, taskId: string, config: PublishTaskConfig): Promise<void> {
  const abortController = new AbortController();

  try {
    // 更新任务状态
    await prisma.automationTask.update({
      where: { id: taskId },
      data: { status: 'running', lastRunAt: new Date() },
    });

    // 创建执行记录
    const execution = await prisma.taskExecution.create({
      data: {
        taskId,
        userId,
        platform: config.platform,
        action: 'publish',
        status: 'running',
        startTime: new Date(),
        input: config as any,
      },
    });

    const screenshots: string[] = [];
    const logs: string[] = [];

    // 创建浏览器
    const browser = await createBrowser(`task-${taskId}`);
    const browserId = `task-${taskId}`;
    runningTasks.set(taskId, { browserId, abortController });

    try {
      const context = await createContext(browser, `task-${taskId}`);

      // 恢复已保存的 cookies（登录态）
      await restoreCookies(context, config.accountId);

      const page = await context.newPage();

      // 根据平台选择发布脚本
      const { getPublisher } = await import('./automation/platform-publisher');
      const publisher = getPublisher(config.platform);

      if (!publisher) {
        throw new Error(`不支持的平台: ${config.platform}`);
      }

      logs.push(`[开始] ${publisher.name} 自动发布`);

      // 执行发布流程
      const result = await publisher.publish(page, {
        title: config.title || '',
        content: config.content || '',
        mediaUrls: config.mediaUrls || [],
        tags: config.tags || [],
        onLog: (msg: string) => logs.push(msg),
        onScreenshot: async () => {
          const shot = await takeScreenshot(page, `publish-${Date.now()}`);
          if (shot) screenshots.push(shot);
        },
        signal: abortController.signal,
      });

      // 保存 cookies
      await saveCookies(context, config.accountId);

      // 更新执行记录
      await prisma.taskExecution.update({
        where: { id: execution.id },
        data: {
          status: result.success ? 'completed' : 'failed',
          endTime: new Date(),
          output: result as any,
          screenshots: JSON.stringify(screenshots),
          logs: JSON.stringify(logs),
          error: result.error,
        },
      });

      // 更新任务统计
      await prisma.automationTask.update({
        where: { id: taskId },
        data: {
          status: 'idle',
          runCount: { increment: 1 },
          successCount: { increment: result.success ? 1 : 0 },
          failCount: { increment: result.success ? 0 : 1 },
        },
      });

      // 如果发布成功，更新素材状态
      if (result.success && config.materialId) {
        await prisma.material.update({
          where: { id: config.materialId },
          data: { status: 'published', publishedAt: new Date() },
        }).catch(() => {});
      }

    } finally {
      await closeBrowser(browserId);
      runningTasks.delete(taskId);
    }
  } catch (error: any) {
    // 更新任务为失败
    await prisma.automationTask.update({
      where: { id: taskId },
      data: {
        status: 'idle',
        runCount: { increment: 1 },
        failCount: { increment: 1 },
      },
    }).catch(() => {});

    throw error;
  }
}

/**
 * 执行评论采集任务
 */
export async function executeCommentCollectTask(userId: string, taskId: string, config: CommentCollectConfig): Promise<void> {
  try {
    await prisma.automationTask.update({
      where: { id: taskId },
      data: { status: 'running', lastRunAt: new Date() },
    });

    const execution = await prisma.taskExecution.create({
      data: {
        taskId,
        userId,
        platform: config.platform,
        action: 'collect_comments',
        status: 'running',
        startTime: new Date(),
        input: config as any,
      },
    });

    const browser = await createBrowser(`task-${taskId}`);
    const browserId = `task-${taskId}`;
    const screenshots: string[] = [];
    const logs: string[] = [];

    try {
      const context = await createContext(browser, `task-${taskId}`);
      await restoreCookies(context, config.accountId);
      const page = await context.newPage();

      // 导航到目标页面
      logs.push(`[导航] ${config.targetUrl}`);
      await navigateAndWait(page, config.targetUrl);

      // 滚动加载评论
      const comments: any[] = [];
      let retryCount = 0;
      const maxRetry = 3;

      while (comments.length < config.maxComments && retryCount < maxRetry) {
        await humanScroll(page, 300, 500);
        await adaptiveDelay(1000, 2000);

        // 提取评论 - 通用选择器
        const newComments = await page.evaluate((max: number) => {
          const commentElements = document.querySelectorAll(
            '[class*="comment"], [class*="reply"], [class*="message"]'
          );
          const results: any[] = [];
          commentElements.forEach((el, idx) => {
            if (idx >= max) return;
            const textEl = el.querySelector('[class*="text"], [class*="content"], p');
            const userEl = el.querySelector('[class*="name"], [class*="author"], [class*="user"]');
            const timeEl = el.querySelector('[class*="time"], [class*="date"]');
            if (textEl?.textContent?.trim()) {
              results.push({
                content: textEl.textContent.trim(),
                author: userEl?.textContent?.trim() || '匿名',
                time: timeEl?.textContent?.trim() || '',
              });
            }
          });
          return results;
        }, config.maxComments - comments.length);

        if (newComments.length === 0) {
          retryCount++;
        } else {
          retryCount = 0;
          comments.push(...newComments);
        }
      }

      logs.push(`[完成] 采集到 ${comments.length} 条评论`);

      await prisma.taskExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          endTime: new Date(),
          output: { commentCount: comments.length, comments: comments.slice(0, 50) },
          screenshots: JSON.stringify(screenshots),
          logs: JSON.stringify(logs),
        },
      });

      await prisma.automationTask.update({
        where: { id: taskId },
        data: { status: 'idle', runCount: { increment: 1 }, successCount: { increment: 1 } },
      });

    } finally {
      await closeBrowser(browserId);
      runningTasks.delete(taskId);
    }
  } catch (error: any) {
    await prisma.automationTask.update({
      where: { id: taskId },
      data: { status: 'idle', runCount: { increment: 1 }, failCount: { increment: 1 } },
    }).catch(() => {});
    throw error;
  }
}

/**
 * 取消运行中的任务
 */
export async function cancelTask(taskId: string): Promise<void> {
  const running = runningTasks.get(taskId);
  if (running) {
    running.abortController.abort();
    await closeBrowser(running.browserId);
    runningTasks.delete(taskId);
  }

  await prisma.automationTask.update({
    where: { id: taskId },
    data: { status: 'idle' },
  }).catch(() => {});
}
