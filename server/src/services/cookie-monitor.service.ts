/**
 * Cookie 自动监控与刷新服务
 * 
 * 核心功能：
 * 1. 定时检测已绑定账号的 Cookie 是否过期（用 Playwright 访问平台验证）
 * 2. Cookie 即将过期时自动刷新（用已存 Cookie 创建浏览器上下文，访问平台获取新 Cookie）
 * 3. Cookie 失效时通知用户重新授权
 * 4. 数据库自动更新，无需用户手动操作
 * 
 * 工作原理：
 * - 借鉴 shipinfabuzhushou 的 user_data/*.json 模式
 * - 用 Playwright storageState 恢复浏览器会话
 * - 访问平台创作者中心页面，如果仍然登录态则获取新 Cookie 写回
 * - 如果已掉线则标记为 expired，推送通知提醒用户
 */

import { prisma } from '../utils/db';
import { logger } from '../utils/logger';
import { PLATFORM_CONFIGS } from './browser-auth.service';
import { sendPushToUser } from './push-service';

// ============ 配置 ============

const MONITOR_CONFIG = {
  /** 检测间隔（毫秒），默认 6 小时 */
  checkIntervalMs: parseInt(process.env.COOKIE_CHECK_INTERVAL || '21600000', 10),
  /** Cookie 即将过期的阈值（毫秒），默认 24 小时 */
  expiryWarningMs: parseInt(process.env.COOKIE_EXPIRY_WARNING || '86400000', 10),
  /** 单次检测最多处理账号数 */
  batchSize: 10,
  /** Playwright 页面超时（毫秒） */
  pageTimeout: 30000,
  /** 并发检测上限 */
  maxConcurrency: 3,
};

// ============ Cookie 健康检查 ============

export interface CookieHealthResult {
  accountId: string;
  platform: string;
  userId: string;
  healthy: boolean;
  reason?: string;
  newCookies?: string;
  checkedAt: Date;
}

/**
 * 用 Playwright 检测单个账号的 Cookie 是否仍然有效
 * 
 * 流程：
 * 1. 从数据库读取已存的 Cookie（Playwright storageState 格式）
 * 2. 创建浏览器上下文并注入 Cookie
 * 3. 访问平台创作者中心页面
 * 4. 检查是否仍处于登录态（通过 URL 跳转或页面元素判断）
 * 5. 如果仍登录，获取最新 Cookie 并返回
 * 6. 如果已掉线，标记为失效
 */
export async function checkCookieHealth(accountId: string): Promise<CookieHealthResult> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || !account.cookies) {
    return {
      accountId,
      platform: account?.platform || 'unknown',
      userId: account?.userId || '',
      healthy: false,
      reason: '账号不存在或无Cookie数据',
      checkedAt: new Date(),
    };
  }

  const platformConfig = PLATFORM_CONFIGS[account.platform];
  if (!platformConfig || !platformConfig.creatorUrl) {
    return {
      accountId,
      platform: account.platform,
      userId: account.userId,
      healthy: false,
      reason: `平台 ${account.platform} 未配置创作者中心URL`,
      checkedAt: new Date(),
    };
  }

  let browser: any = null;
  let context: any = null;

  try {
    // 动态导入 Playwright（服务器可能未安装）
    const { chromium } = await import('playwright');

    // 解析已存的 Cookie 数据
    let cookieData: any;
    try {
      cookieData = JSON.parse(account.cookies);
    } catch {
      return {
        accountId,
        platform: account.platform,
        userId: account.userId,
        healthy: false,
        reason: 'Cookie 数据解析失败',
        checkedAt: new Date(),
      };
    }

    // 构造 Playwright storageState
    let storageState: any;
    if (cookieData.cookies && Array.isArray(cookieData.cookies)) {
      // Playwright storageState 格式
      storageState = {
        cookies: cookieData.cookies,
        origins: cookieData.origins || [],
      };
    } else if (Array.isArray(cookieData)) {
      // 纯 Cookie 数组格式
      storageState = { cookies: cookieData, origins: [] };
    } else {
      return {
        accountId,
        platform: account.platform,
        userId: account.userId,
        healthy: false,
        reason: 'Cookie 格式不兼容',
        checkedAt: new Date(),
      };
    }

    // 创建浏览器上下文并注入 Cookie
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ storageState });
    const page = await context.newPage();

    // 访问创作者中心页面
    const response = await page.goto(platformConfig.creatorUrl, {
      waitUntil: 'domcontentloaded',
      timeout: MONITOR_CONFIG.pageTimeout,
    });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 判断是否仍处于登录态
    const currentUrl = page.url();
    const isRedirectedToLogin = 
      currentUrl.includes('/login') || 
      currentUrl.includes('/signin') ||
      currentUrl.includes('/oauth') ||
      currentUrl.includes('/passport');

    if (isRedirectedToLogin) {
      // 已掉线 - Cookie 失效
      await prisma.socialAccount.update({
        where: { id: accountId },
        data: {
          status: 'expired',
          isConnected: false,
          syncError: 'Cookie 已失效，请重新授权',
          lastSyncAt: new Date(),
        },
      });

      logger.info({ accountId, platform: account.platform }, 'Cookie 已失效，已标记为 expired');

      return {
        accountId,
        platform: account.platform,
        userId: account.userId,
        healthy: false,
        reason: 'Cookie 已失效（被重定向到登录页）',
        checkedAt: new Date(),
      };
    }

    // 仍然登录态 - 获取最新 Cookie
    const freshCookies = await context.cookies();
    const freshStorageState = {
      cookies: freshCookies,
      origins: [],
    };

    // 尝试提取 localStorage
    try {
      const origin = new URL(platformConfig.creatorUrl).origin;
      const localStorageData = await page.evaluate(() => {
        const entries: { name: string; value: string }[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            entries.push({ name: key, value: localStorage.getItem(key) || '' });
          }
        }
        return entries;
      });
      if (localStorageData.length > 0) {
        freshStorageState.origins = [{
          origin,
          localStorage: localStorageData,
        }];
      }
    } catch (e) {
      // localStorage 提取失败不影响主流程
    }

    // 更新数据库中的 Cookie
    const newCookiesJson = JSON.stringify(freshStorageState);
    await prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        cookies: newCookiesJson,
        status: 'active',
        isConnected: true,
        lastSyncAt: new Date(),
        syncError: null,
      },
    });

    logger.info({ 
      accountId, 
      platform: account.platform, 
      cookieCount: freshCookies.length,
    }, 'Cookie 健康检查通过，已自动刷新');

    return {
      accountId,
      platform: account.platform,
      userId: account.userId,
      healthy: true,
      newCookies: newCookiesJson,
      checkedAt: new Date(),
    };

  } catch (error: any) {
    logger.error({ accountId, error: error.message }, 'Cookie 健康检查异常');

    // Playwright 不可用时做轻量级检查（检查 Cookie 中的过期时间）
    return checkCookieExpiryLightweight(account);
  } finally {
    // 清理浏览器资源
    try {
      if (context) await context.close();
      if (browser) await browser.close();
    } catch (e) {
      // 忽略清理错误
    }
  }
}

/**
 * 轻量级 Cookie 过期检查（无需 Playwright，仅检查 Cookie 的 expires 字段）
 */
function checkCookieExpiryLightweight(account: any): CookieHealthResult {
  try {
    const cookieData = JSON.parse(account.cookies);
    const cookies = cookieData.cookies || cookieData;
    const now = Date.now() / 1000;

    // 检查关键登录 Cookie 是否过期
    const expiredCookies = cookies.filter((c: any) => {
      if (c.expires && c.expires > 0 && c.expires < now) {
        return true;
      }
      return false;
    });

    const hasSessionCookie = cookies.some((c: any) => {
      const name = (c.name || '').toLowerCase();
      return name.includes('session') || name.includes('sid_tt') || 
             name.includes('passport') || name === 'sessionid';
    });

    if (expiredCookies.length > 0 && !hasSessionCookie) {
      return {
        accountId: account.id,
        platform: account.platform,
        userId: account.userId,
        healthy: false,
        reason: `${expiredCookies.length} 个 Cookie 已过期`,
        checkedAt: new Date(),
      };
    }

    // 无法确定是否过期，保守判断为健康
    return {
      accountId: account.id,
      platform: account.platform,
      userId: account.userId,
      healthy: true,
      reason: '轻量级检查未发现过期（需 Playwright 做深度验证）',
      checkedAt: new Date(),
    };
  } catch (e: any) {
    return {
      accountId: account.id,
      platform: account.platform,
      userId: account.userId,
      healthy: false,
      reason: `轻量级检查失败: ${e.message}`,
      checkedAt: new Date(),
    };
  }
}

// ============ 批量健康检查 ============

/**
 * 批量检测所有活跃账号的 Cookie 健康状态
 */
export async function batchCheckCookieHealth(): Promise<{
  total: number;
  healthy: number;
  expired: number;
  error: number;
  results: CookieHealthResult[];
}> {
  // 获取所有活跃的、有 Cookie 的账号
  const accounts = await prisma.socialAccount.findMany({
    where: {
      status: 'active',
      isConnected: true,
      cookies: { not: null },
    },
    take: MONITOR_CONFIG.batchSize,
    orderBy: { lastSyncAt: 'asc' }, // 优先检查最久未同步的
  });

  logger.info({ count: accounts.length }, '开始批量 Cookie 健康检查');

  const results: CookieHealthResult[] = [];
  
  // 限制并发
  const chunks: any[][] = [];
  for (let i = 0; i < accounts.length; i += MONITOR_CONFIG.maxConcurrency) {
    chunks.push(accounts.slice(i, i + MONITOR_CONFIG.maxConcurrency));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.allSettled(
      chunk.map(account => checkCookieHealth(account.id))
    );

    for (const result of chunkResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          accountId: 'unknown',
          platform: 'unknown',
          userId: 'unknown',
          healthy: false,
          reason: `检查异常: ${result.reason}`,
          checkedAt: new Date(),
        });
      }
    }
  }

  const healthy = results.filter(r => r.healthy).length;
  const expired = results.filter(r => !r.healthy && r.reason?.includes('失效')).length;
  const error = results.filter(r => !r.healthy && !r.reason?.includes('失效')).length;

  logger.info({ total: results.length, healthy, expired, error }, '批量 Cookie 健康检查完成');

  return { total: results.length, healthy, expired, error, results };
}

// ============ 过期通知 ============

/**
 * 向用户推送 Cookie 过期通知
 */
export async function notifyExpiredAccounts(results: CookieHealthResult[]): Promise<void> {
  const expiredResults = results.filter(r => !r.healthy);
  
  // 按 userId 分组
  const byUser = new Map<string, CookieHealthResult[]>();
  for (const result of expiredResults) {
    const list = byUser.get(result.userId) || [];
    list.push(result);
    byUser.set(result.userId, list);
  }

  for (const [userId, userExpired] of byUser) {
    const platformNames = userExpired.map(r => {
      const config = PLATFORM_CONFIGS[r.platform];
      return config?.name || r.platform;
    });

    try {
      await sendPushToUser(userId, {
        title: '账号授权已过期',
        body: `${platformNames.join('、')} 的授权已失效，请重新绑定以确保自动化功能正常运行。`,
        data: {
          notificationType: 'cookie_expired',
          platforms: userExpired.map(r => r.platform),
        },
      });

      logger.info({ userId, platforms: platformNames }, '已推送 Cookie 过期通知');
    } catch (e: any) {
      logger.error({ userId, error: e.message }, '推送 Cookie 过期通知失败');
    }
  }
}

// ============ 定时监控引擎 ============

let monitorInterval: ReturnType<typeof setInterval> | null = null;

/**
 * 启动 Cookie 自动监控
 * 定期检查所有活跃账号的 Cookie 健康状态，自动刷新或通知用户
 */
export function startCookieMonitor(): void {
  if (monitorInterval) return; // 避免重复启动

  logger.info({ 
    intervalMs: MONITOR_CONFIG.checkIntervalMs,
    intervalHours: (MONITOR_CONFIG.checkIntervalMs / 3600000).toFixed(1),
  }, 'Cookie 自动监控服务已启动');

  // 启动后延迟 60 秒再执行第一次检查（等服务器完全启动）
  setTimeout(async () => {
    try {
      const result = await batchCheckCookieHealth();
      if (result.expired > 0) {
        await notifyExpiredAccounts(result.results);
      }
    } catch (e: any) {
      logger.error({ error: e.message }, 'Cookie 监控首次检查失败');
    }
  }, 60000);

  // 定时执行
  monitorInterval = setInterval(async () => {
    try {
      const result = await batchCheckCookieHealth();
      if (result.expired > 0) {
        await notifyExpiredAccounts(result.results);
      }
    } catch (e: any) {
      logger.error({ error: e.message }, 'Cookie 定时监控检查失败');
    }
  }, MONITOR_CONFIG.checkIntervalMs);
}

/**
 * 停止 Cookie 自动监控
 */
export function stopCookieMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    logger.info('Cookie 自动监控服务已停止');
  }
}

/**
 * 手动触发检查（供 API 调用）
 */
export async function manualCheck(accountId?: string): Promise<CookieHealthResult | typeof batchResult> {
  if (accountId) {
    return checkCookieHealth(accountId);
  }
  
  const batchResult = await batchCheckCookieHealth();
  if (batchResult.expired > 0) {
    await notifyExpiredAccounts(batchResult.results);
  }
  return batchResult;
}
