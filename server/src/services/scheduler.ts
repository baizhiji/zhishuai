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

// ============ 平台发布API对接 ============

// 平台发布配置
interface PlatformPublishConfig {
  name: string;
  publishUrl: string;
  contentTypeField: string;
  contentField: string;
  titleField?: string;
  submitSelector: string;
  successIndicator: string;
}

const PLATFORM_PUBLISH_CONFIGS: Record<string, PlatformPublishConfig> = {
  douyin: {
    name: '抖音',
    publishUrl: 'https://creator.douyin.com/creator-micro/content/upload',
    contentTypeField: 'article',
    contentField: '.editor-content',
    submitSelector: 'button[data-e2e="publish-btn"]',
    successIndicator: '.publish-success',
  },
  xiaohongshu: {
    name: '小红书',
    publishUrl: 'https://creator.xiaohongshu.com/publish/publish',
    contentTypeField: 'note',
    contentField: '.ql-editor',
    titleField: '.title-input',
    submitSelector: '.publish-btn',
    successIndicator: '.success-page',
  },
  kuaishou: {
    name: '快手',
    publishUrl: 'https://cp.kuaishou.com/article/publish',
    contentTypeField: 'article',
    contentField: '.editor-textarea',
    submitSelector: '.submit-btn',
    successIndicator: '.success-tip',
  },
};

/**
 * 通过 Playwright 自动化发布内容到指定平台
 */
async function publishViaPlaywright(
  platform: string,
  account: any,
  content: { title: string; text: string; mediaUrls?: string[]; tags?: string[] }
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  const config = PLATFORM_PUBLISH_CONFIGS[platform];
  if (!config) {
    return { success: false, error: `不支持的发布平台: ${platform}` };
  }

  if (!account.cookies) {
    return { success: false, error: '账号未授权，请先在矩阵管理中扫码授权' };
  }

  let browser: any = null;
  let context: any = null;

  try {
    const { chromium } = await import('playwright');

    // 解析存储的 Cookie
    let storageState: any;
    try {
      storageState = typeof account.cookies === 'string'
        ? JSON.parse(account.cookies)
        : account.cookies;
    } catch {
      return { success: false, error: 'Cookie 数据解析失败' };
    }

    const stealthArgs = [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ];

    browser = await chromium.launch({ headless: true, args: stealthArgs });

    // 使用已有的 Cookie 创建上下文
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      storageState: storageState,
    });

    // 注入反检测脚本
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    const page = await context.newPage();

    // 访问发布页面
    await page.goto(config.publishUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 检查是否需要重新登录（Cookie 已过期）
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/passport')) {
      // 标记账号 Cookie 过期
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: { status: 'expired', syncError: 'Cookie 已过期，请重新扫码授权' },
      });
      return { success: false, error: 'Cookie 已过期，请重新扫码授权' };
    }

    // 填写标题（如果有）
    if (config.titleField && content.title) {
      try {
        await page.fill(config.titleField, content.title);
        await page.waitForTimeout(500);
      } catch {
        logger.warn({ platform }, '无法填写标题字段');
      }
    }

    // 填写内容
    try {
      const contentEl = await page.$(config.contentField);
      if (contentEl) {
        await contentEl.click();
        await page.waitForTimeout(500);
        // 分段输入避免被反爬检测
        const chunks = content.text.match(/.{1,100}/g) || [content.text];
        for (const chunk of chunks) {
          await page.keyboard.type(chunk, { delay: 30 });
        }
        await page.waitForTimeout(1000);
      } else {
        return { success: false, error: '未找到内容输入区域，平台页面可能已更新' };
      }
    } catch (e: any) {
      return { success: false, error: `填写内容失败: ${e.message}` };
    }

    // 添加标签（如果有）
    if (content.tags && content.tags.length > 0) {
      try {
        // 尝试找标签输入区域并填入
        const tagInput = await page.$('.tag-input input, [class*="tag"] input');
        if (tagInput) {
          for (const tag of content.tags.slice(0, 5)) {
            await tagInput.fill(tag);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(300);
          }
        }
      } catch {
        // 标签添加失败不阻塞发布
      }
    }

    // 点击发布按钮
    try {
      const submitBtn = await page.$(config.submitSelector);
      if (!submitBtn) {
        return { success: false, error: '未找到发布按钮，平台页面可能已更新' };
      }
      await submitBtn.click();
      await page.waitForTimeout(3000);
    } catch (e: any) {
      return { success: false, error: `点击发布按钮失败: ${e.message}` };
    }

    // 检查发布是否成功
    const isSuccess = await page.evaluate((indicator: string) => {
      // 检查成功提示元素
      if (document.querySelector(indicator)) return true;
      // 检查URL是否变化（跳转到已发布页面）
      const url = window.location.href;
      if (!url.includes('/publish') && !url.includes('/upload')) return true;
      // 检查是否有成功 toast
      const toastSelectors = ['.success', '.toast-success', '.message-success', '[class*="success"]'];
      return toastSelectors.some(s => document.querySelector(s)?.textContent?.includes('成功'));
    }, config.successIndicator);

    if (isSuccess) {
      const publishedUrl = page.url();
      logger.info({ platform, accountName: account.accountName }, '定时发布成功');
      return { success: true, postUrl: publishedUrl };
    } else {
      return { success: false, error: '发布提交后未检测到成功状态，请人工检查' };
    }

  } catch (error: any) {
    logger.error({ platform, error: error.message }, 'Playwright 发布失败');
    return { success: false, error: error.message };
  } finally {
    // 清理资源
    try {
      if (context) await context.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
    } catch (e) {}
  }
}

// 默认任务处理器：真正对接各社交平台发布 API
registerTaskHandler('default', async (task) => {
  logger.info({ taskId: task.id, platform: task.platform, title: task.title }, 'Executing scheduled publish task');

  try {
    // 获取关联的账号信息
    const account = await prisma.socialAccount.findFirst({
      where: {
        userId: task.userId,
        platform: task.platform,
        status: 'active',
      },
    });

    if (!account) {
      return { success: false, result: `平台 ${task.platform} 没有可用账号，请先授权` };
    }

    // 获取关联的内容（从 material 或 publishRecord）
    let contentText = task.content || '';
    let contentTitle = task.title || '';
    let tags: string[] = [];

    if (task.materialId) {
      const material = await prisma.material.findUnique({
        where: { id: task.materialId },
      });
      if (material) {
        contentTitle = material.title || contentTitle;
        contentText = material.content || contentText;
        // tags 可能在 metadata 中
        if (material.tags) {
          tags = typeof material.tags === 'string' ? JSON.parse(material.tags) : material.tags;
        }
      }
    }

    // 执行 Playwright 发布
    const result = await publishViaPlaywright(task.platform, account, {
      title: contentTitle,
      text: contentText,
      tags,
    });

    // 更新 PublishRecord 状态
    if (task.publishRecordId) {
      await prisma.publishRecord.update({
        where: { id: task.publishRecordId },
        data: {
          status: result.success ? 'success' : 'failed',
          publishedUrl: result.postUrl || null,
          error: result.error || null,
          publishedAt: result.success ? new Date() : null,
        },
      });
    }

    // 更新 Material 状态
    if (task.materialId) {
      await prisma.material.update({
        where: { id: task.materialId },
        data: { status: result.success ? 'published' : 'failed' },
      });
    }

    if (result.success) {
      return {
        success: true,
        result: `已成功发布到${PLATFORM_PUBLISH_CONFIGS[task.platform]?.name || task.platform}，链接: ${result.postUrl}`,
      };
    } else {
      return { success: false, result: result.error || '发布失败' };
    }

  } catch (error: any) {
    logger.error({ taskId: task.id, error: error.message }, '定时发布执行异常');
    return { success: false, result: error.message };
  }
});
