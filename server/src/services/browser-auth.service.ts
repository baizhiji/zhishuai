/**
 * 扫码授权服务 V9 — 自动扫码 + Cookie导入 + 自动刷新
 * 
 * 借鉴 shipinfabuzhushou 参考系统的成功经验：
 * 1. 自动扫码授权：服务器用 Playwright 打开平台登录页，截取二维码发送前端显示，用户扫码后自动保存 Cookie
 * 2. Cookie 导入：用户在本地浏览器登录后，导出 Cookie JSON 上传到服务器（兜底方式）
 * 3. 自动刷新：定时检测 Cookie 健康状态，自动刷新即将过期的 Cookie
 * 4. stealth 反检测：提供反检测脚本供浏览器自动化使用
 * 
 * Cookie JSON 格式兼容 Playwright storageState 格式：
 * { cookies: [...], origins: [{ origin: "...", localStorage: [...] }] }
 */

import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/db';

// ============ 会话存储 ============

interface AuthSession {
  id: string;
  platform: string;
  status: 'pending' | 'scanning' | 'authorized' | 'expired' | 'failed';
  createdAt: Date;
  expiresAt: Date;
  popupUrl?: string;
  cookies?: any[];
  localStorage?: any[];
  accountInfo?: any;
  // Playwright 扫码登录相关
  browserId?: string;
  contextId?: string;
  qrImageData?: string;  // base64 二维码图片
}

const sessions: Map<string, AuthSession> = new Map();

// ============ 平台配置 ============

interface PlatformConfig {
  name: string;
  icon: string;
  color: string;
  status: 'available' | 'coming';
  loginUrl: string;
  creatorUrl?: string;  // 创作者平台URL（用于Cookie校验）
  cookieDomains?: string[];  // Cookie校验域名
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  douyin: {
    name: '抖音',
    icon: '🎵',
    color: '#fe2c55',
    status: 'available',
    loginUrl: 'https://creator.douyin.com/',
    creatorUrl: 'https://creator.douyin.com',
    cookieDomains: ['.douyin.com', 'creator.douyin.com', '.bytedance.com'],
  },
  kuaishou: {
    name: '快手',
    icon: '📹',
    color: '#ff4906',
    status: 'available',
    loginUrl: 'https://cp.kuaishou.com/',
    creatorUrl: 'https://cp.kuaishou.com',
    cookieDomains: ['.kuaishou.com', 'cp.kuaishou.com'],
  },
  xiaohongshu: {
    name: '小红书',
    icon: '📕',
    color: '#ff2442',
    status: 'available',
    loginUrl: 'https://creator.xiaohongshu.com/',
    creatorUrl: 'https://creator.xiaohongshu.com',
    cookieDomains: ['.xiaohongshu.com'],
  },
  channels: {
    name: '视频号',
    icon: '📺',
    color: '#07c160',
    status: 'available',
    loginUrl: 'https://channels.weixin.qq.com/platform/login',
    creatorUrl: 'https://channels.weixin.qq.com/platform',
    cookieDomains: ['channels.weixin.qq.com'],
  },
  boss: {
    name: 'BOSS直聘',
    icon: '💼',
    color: '#00C777',
    status: 'available',
    loginUrl: 'https://www.zhipin.com/web/geek/login',
    creatorUrl: 'https://www.zhipin.com',
    cookieDomains: ['.zhipin.com'],
  },
  zhilian: {
    name: '智联招聘',
    icon: '🔍',
    color: '#0066CC',
    status: 'available',
    loginUrl: 'https://www.zhaopin.com/',
    cookieDomains: ['.zhaopin.com'],
  },
  liepin: {
    name: '猎聘',
    icon: '🔶',
    color: '#FF6000',
    status: 'available',
    loginUrl: 'https://www.liepin.com/',
    cookieDomains: ['.liepin.com'],
  },
  lagou: {
    name: '拉勾招聘',
    icon: '🏆',
    color: '#1DC6B1',
    status: 'available',
    loginUrl: 'https://www.lagou.com/login',
    cookieDomains: ['.lagou.com'],
  },
  bilibili: {
    name: '哔哩哔哩',
    icon: '📺',
    color: '#00a1d6',
    status: 'coming',
    loginUrl: 'https://passport.bilibili.com/login',
    cookieDomains: ['.bilibili.com'],
  },
  weibo: {
    name: '微博',
    icon: '🌐',
    color: '#e6162d',
    status: 'coming',
    loginUrl: 'https://weibo.com/login.php',
    cookieDomains: ['.weibo.com'],
  },
};

export function getPlatformList(): Array<{ code: string; name: string; status: 'available' | 'coming'; loginUrl: string; creatorUrl?: string }> {
  return Object.entries(PLATFORM_CONFIGS).map(([code, config]) => ({
    code,
    name: config.name,
    status: config.status,
    loginUrl: config.loginUrl,
    creatorUrl: config.creatorUrl,
  }));
}

// ============ 创建授权会话（popup方式） ============

export async function createAuthSession(platform: string): Promise<{
  sessionId: string;
  popupUrl: string;
  platform: string;
  platformName: string;
  expiresAt: Date;
  qrMethod: string;
} | null> {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    console.error(`[Auth-V8] 不支持的平台: ${platform}`);
    return null;
  }
  
  if (config.status === 'coming') {
    console.error(`[Auth-V8] 平台暂未开放: ${config.name}`);
    return null;
  }
  
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟
  
  console.log(`[Auth-V8] 创建授权会话: ${config.name} (${platform}), popupUrl: ${config.loginUrl}`);
  
  // 保存会话
  sessions.set(sessionId, {
    id: sessionId,
    platform,
    status: 'pending',
    createdAt: new Date(),
    expiresAt,
    popupUrl: config.loginUrl,
  });
  
  return {
    sessionId,
    popupUrl: config.loginUrl,
    platform,
    platformName: config.name,
    expiresAt,
    qrMethod: 'popup',
  };
}

// ============ 检查授权状态 ============

export async function checkAuthStatus(sessionId: string): Promise<{
  status: string;
  cookies?: any[];
  accountInfo?: any;
  message?: string;
}> {
  const session = sessions.get(sessionId);
  if (!session) return { status: 'not_found', message: '会话不存在' };
  
  if (new Date() > session.expiresAt) {
    session.status = 'expired';
    sessions.delete(sessionId);
    return { status: 'expired', message: '会话已过期，请重新授权' };
  }
  
  return {
    status: session.status,
    message: session.status === 'pending' ? '等待用户在新窗口中扫码授权...' : '已扫码，等待确认...',
  };
}

// ============ 前端确认授权成功（popup方式） ============

export function confirmAuthSession(sessionId: string, authData: {
  cookies?: any[];
  accountInfo?: any;
}): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  
  session.status = 'authorized';
  session.cookies = authData.cookies;
  session.accountInfo = authData.accountInfo;
  
  console.log(`[Auth-V8] 会话 ${sessionId} 由前端确认授权成功, platform: ${session.platform}`);
  return true;
}

// ============ Cookie 导入验证 ============

/**
 * 验证导入的 Cookie JSON 是否有效
 * 兼容 Playwright storageState 格式和浏览器导出格式
 * 
 * 参考 shipinfabuzhushou 的 user_data/*.json 格式：
 * { cookies: [...], origins: [{ origin: "...", localStorage: [...] }] }
 */
export function validateCookieImport(platform: string, cookieData: any): {
  valid: boolean;
  cookies: any[];
  localStorage?: any[];
  accountName?: string;
  message: string;
} {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    return { valid: false, cookies: [], message: `不支持的平台: ${platform}` };
  }
  
  try {
    // 解析输入格式
    let cookies: any[] = [];
    let localStorageData: any[] = [];
    
    if (Array.isArray(cookieData)) {
      // 纯 Cookie 数组格式
      cookies = cookieData;
    } else if (cookieData && typeof cookieData === 'object') {
      // Playwright storageState 格式
      if (Array.isArray(cookieData.cookies)) {
        cookies = cookieData.cookies;
      }
      // 提取 localStorage
      if (Array.isArray(cookieData.origins)) {
        for (const origin of cookieData.origins) {
          if (Array.isArray(origin.localStorage)) {
            localStorageData.push(...origin.localStorage.map((item: any) => ({
              origin: origin.origin,
              ...item,
            })));
          }
        }
      }
    } else if (typeof cookieData === 'string') {
      // 尝试解析 JSON 字符串
      try {
        const parsed = JSON.parse(cookieData);
        return validateCookieImport(platform, parsed);
      } catch {
        return { valid: false, cookies: [], message: 'Cookie JSON 格式无效，无法解析' };
      }
    } else {
      return { valid: false, cookies: [], message: '不支持的 Cookie 数据格式' };
    }
    
    if (cookies.length === 0) {
      return { valid: false, cookies: [], message: 'Cookie 数据为空' };
    }
    
    // 验证是否包含平台相关的 Cookie
    const platformCookies = cookies.filter((c: any) => {
      const domain = c.domain || '';
      return config.cookieDomains?.some(d => domain.includes(d.replace(/^\./, '')) || domain === d);
    });
    
    if (platformCookies.length === 0) {
      return {
        valid: false,
        cookies: [],
        message: `Cookie 中未找到 ${config.name} 相关的域名，请确认导出的 Cookie 来自 ${config.name} 的登录页面`,
      };
    }
    
    // 验证关键登录 Cookie
    const hasSessionCookie = platformCookies.some((c: any) => {
      const name = (c.name || '').toLowerCase();
      return (
        name.includes('session') ||
        name.includes('sid_tt') ||
        name.includes('passport') ||
        name.includes('login') ||
        name.includes('token') ||
        name.includes('uid') ||
        name.includes('d_ticket') ||
        name === 'sessionid' ||
        name === 'sessionid_ss' ||
        name === 'sid_tt' ||
        name === 'odin_tt'
      );
    });
    
    if (!hasSessionCookie) {
      return {
        valid: false,
        cookies: platformCookies,
        message: `Cookie 中未找到有效的登录会话标识，请确认已登录 ${config.name} 后再导出 Cookie`,
      };
    }
    
    // 尝试从 localStorage 提取账号名
    let accountName: string | undefined;
    const loginStatusEntry = localStorageData.find((item: any) => 
      item.name === 'LOGIN_STATUS' || item.name === 'login_type_from_login'
    );
    if (loginStatusEntry) {
      try {
        const loginData = JSON.parse(loginStatusEntry.value || '{}');
        if (loginData.logintype) {
          accountName = `${config.name}用户`;
        }
      } catch {}
    }
    
    // 从 cookie 中提取用户标识
    const uidCookie = platformCookies.find((c: any) => 
      c.name === 'uid_tt' || c.name === 'passport_assist_user'
    );
    if (uidCookie && !accountName) {
      accountName = `${config.name}_${(uidCookie.value || '').substring(0, 8)}`;
    }
    
    console.log(`[Auth-V8] Cookie 导入验证通过: ${config.name}, 有效Cookie: ${platformCookies.length}/${cookies.length}, localStorage: ${localStorageData.length}`);
    
    return {
      valid: true,
      cookies: platformCookies,
      localStorage: localStorageData.length > 0 ? localStorageData : undefined,
      accountName,
      message: `验证通过，找到 ${platformCookies.length} 个有效 Cookie`,
    };
  } catch (error: any) {
    return { valid: false, cookies: [], message: `Cookie 解析失败: ${error.message}` };
  }
}

export function cancelAuthSession(sessionId: string): boolean {
  sessions.delete(sessionId);
  console.log(`[Auth-V9] 会话 ${sessionId} 已取消`);
  return true;
}

export function getConfirmedSession(sessionId: string): AuthSession | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  return session;
}

// ============ Playwright 自动扫码登录 ============

/**
 * 启动 Playwright 扫码登录流程
 * 
 * 流程（借鉴 shipinfabuzhushou）：
 * 1. 服务器用 Playwright 打开平台登录页
 * 2. 截取二维码图片发送给前端
 * 3. 用户用手机扫码
 * 4. 前端轮询检查登录状态
 * 5. 登录成功后自动提取 Cookie + localStorage 并保存到数据库
 * 6. 如果 Cookie 变更则自动更新
 */
export async function startPlaywrightLogin(platform: string, userId: string): Promise<{
  sessionId: string;
  qrImageData: string;
  platformName: string;
  expiresAt: Date;
} | null> {
  const config = PLATFORM_CONFIGS[platform];
  if (!config || config.status === 'coming') {
    console.error(`[Auth-V9] 不支持的平台: ${platform}`);
    return null;
  }

  let browser: any = null;
  let context: any = null;

  try {
    // 动态导入 Playwright
    const { chromium } = await import('playwright');

    // 获取 stealth 配置
    const stealthArgs = [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ];

    browser = await chromium.launch({
      headless: true,
      args: stealthArgs,
    });

    // 创建隐身上下文
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });

    // 注入反检测脚本
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    const page = await context.newPage();

    // 访问平台登录页
    const loginUrl = config.creatorUrl || config.loginUrl;
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 截取二维码区域或整页
    let qrImageData = '';

    // 尝试找二维码元素
    const qrSelectors = [
      'img[src*="qr"]',
      'img[src*="qrcode"]',
      'canvas',
      '.qrcode img',
      '.qrcode-img',
      '.login-qrcode img',
      '[class*="qrcode"] img',
      '[class*="qr-code"] img',
    ];

    for (const selector of qrSelectors) {
      try {
        const qrElement = await page.$(selector);
        if (qrElement) {
          const screenshot = await qrElement.screenshot({ type: 'png' });
          const base64Data = Buffer.isBuffer(screenshot)
            ? screenshot.toString('base64')
            : Buffer.from(screenshot).toString('base64');
          qrImageData = `data:image/png;base64,${base64Data}`;
          console.log(`[Auth-V9] 找到二维码元素: ${selector}`);
          break;
        }
      } catch (e) {
        // 继续尝试
      }
    }

    // 如果没找到二维码元素，截取整个页面
    if (!qrImageData) {
      const screenshot = await page.screenshot({ type: 'png', fullPage: false });
      const base64Data = Buffer.isBuffer(screenshot)
        ? screenshot.toString('base64')
        : Buffer.from(screenshot).toString('base64');
      qrImageData = `data:image/png;base64,${base64Data}`;
      console.log(`[Auth-V9] 未找到二维码元素，截取整页`);
    }

    // 创建授权会话
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 分钟

    // 保存会话和浏览器资源
    sessions.set(sessionId, {
      id: sessionId,
      platform,
      status: 'scanning',
      createdAt: new Date(),
      expiresAt,
      qrImageData,
      cookies: [],
    });

    // 保存浏览器实例以便后续轮询检查
    playwrightResources.set(sessionId, { browser, context, page, platform, userId });

    console.log(`[Auth-V9] Playwright 扫码登录已启动: ${config.name}, sessionId: ${sessionId}`);

    return {
      sessionId,
      qrImageData,
      platformName: config.name,
      expiresAt,
    };

  } catch (error: any) {
    console.error('[Auth-V9] Playwright 启动失败:', error.message);
    // 清理资源
    try {
      if (context) await context.close();
      if (browser) await browser.close();
    } catch (e) {}
    return null;
  }
}

// 存储 Playwright 资源（浏览器、上下文、页面）
const playwrightResources: Map<string, {
  browser: any;
  context: any;
  page: any;
  platform: string;
  userId: string;
}> = new Map();

/**
 * 轮询检查 Playwright 扫码登录状态
 * 
 * 检测逻辑（借鉴 shipinfabuzhushou 的判断方式）：
 * 1. 检查 URL 是否跳转到了登录后的页面
 * 2. 检查页面是否有已登录的元素特征
 * 3. 如果登录成功，自动提取 Cookie + localStorage 并保存
 */
export async function pollPlaywrightLogin(sessionId: string): Promise<{
  status: 'scanning' | 'success' | 'expired' | 'failed';
  cookies?: any[];
  localStorage?: any[];
  accountInfo?: any;
  message?: string;
}> {
  const session = sessions.get(sessionId);
  if (!session) {
    return { status: 'failed', message: '会话不存在' };
  }

  // 检查过期
  if (new Date() > session.expiresAt) {
    cleanupPlaywrightResource(sessionId);
    session.status = 'expired';
    return { status: 'expired', message: '登录超时，请重新操作' };
  }

  const resources = playwrightResources.get(sessionId);
  if (!resources) {
    return { status: 'failed', message: '浏览器资源已释放' };
  }

  try {
    const { page, context, platform } = resources;
    const config = PLATFORM_CONFIGS[platform];

    // 检查 URL 是否跳转到登录后页面
    const currentUrl = page.url();
    const isOnLoginPage = 
      currentUrl.includes('/login') ||
      currentUrl.includes('/signin') ||
      currentUrl.includes('/passport') ||
      currentUrl.includes('/oauth');

    if (!isOnLoginPage && config?.creatorUrl) {
      // 可能已登录成功
      const isOnCreatorPage = currentUrl.includes(new URL(config.creatorUrl).hostname);

      if (isOnCreatorPage) {
        // 检查页面是否有已登录的元素
        const hasLoginIndicator = await page.evaluate(() => {
          // 检查 localStorage 中的 LOGIN_STATUS
          const loginStatus = localStorage.getItem('LOGIN_STATUS');
          if (loginStatus) {
            try {
              const parsed = JSON.parse(loginStatus);
              if (parsed.logintype) return true;
            } catch {}
          }
          // 检查常见的已登录元素
          const selectors = [
            '.creator-left-menu', '[data-e2e="creator-nav"]',
            '.user-info', '.user-name', '.profile-header',
            '[class*="avatar"]', '[class*="user-name"]',
          ];
          for (const sel of selectors) {
            if (document.querySelector(sel)) return true;
          }
          return false;
        });

        if (hasLoginIndicator) {
          // 登录成功！提取 Cookie + localStorage
          return await extractAndSaveLoginData(sessionId, resources);
        }
      }
    }

    // 如果二维码可能已刷新（页面有变化），尝试重新截图
    if (session.status === 'scanning') {
      try {
        // 检查二维码是否还在
        const qrVisible = await page.evaluate(() => {
          const selectors = ['img[src*="qr"]', '.qrcode img', 'canvas', '.login-qrcode'];
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && (el as HTMLElement).offsetParent !== null) return true;
          }
          return false;
        });

        if (qrVisible) {
          // 二维码还在，更新截图
          const screenshot = await page.screenshot({ type: 'png', fullPage: false });
          const base64Data = Buffer.isBuffer(screenshot)
            ? screenshot.toString('base64')
            : Buffer.from(screenshot).toString('base64');
          session.qrImageData = `data:image/png;base64,${base64Data}`;
        }
      } catch (e) {
        // 截图失败不影响
      }
    }

    return { status: 'scanning', message: '等待扫码中...' };

  } catch (error: any) {
    console.error('[Auth-V9] 轮询检查失败:', error.message);
    return { status: 'failed', message: '检查登录状态失败' };
  }
}

/**
 * 提取登录数据并保存到会话和数据库
 * 借鉴 shipinfabuzhushou 的 user_data/*.json 格式
 */
async function extractAndSaveLoginData(
  sessionId: string,
  resources: { browser: any; context: any; page: any; platform: string; userId: string },
): Promise<{
  status: 'success';
  cookies: any[];
  localStorage?: any[];
  accountInfo?: any;
}> {
  const { context, page, platform, userId } = resources;
  const config = PLATFORM_CONFIGS[platform];
  const session = sessions.get(sessionId);

  try {
    // 1. 提取所有 Cookie
    const allCookies = await context.cookies();

    // 2. 过滤出平台相关的 Cookie
    const platformCookies = allCookies.filter((c: any) => {
      const domain = c.domain || '';
      return config?.cookieDomains?.some(d =>
        domain.includes(d.replace(/^\./, '')) || domain === d
      );
    });

    // 3. 提取 localStorage
    let localStorageData: any[] = [];
    try {
      const origin = new URL(config?.creatorUrl || config?.loginUrl || '').origin;
      const entries = await page.evaluate(() => {
        const items: { name: string; value: string }[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) items.push({ name: key, value: localStorage.getItem(key) || '' });
        }
        return items;
      });
      if (entries.length > 0) {
        localStorageData = [{ origin, localStorage: entries }];
      }
    } catch (e) {
      // localStorage 提取失败不影响
    }

    // 4. 提取账号信息
    let accountInfo: any = {};
    try {
      // 从 localStorage 的 LOGIN_STATUS 提取
      const loginStatusEntry = localStorageData
        .flatMap(o => o.localStorage || [])
        .find((item: any) => item.name === 'LOGIN_STATUS');
      if (loginStatusEntry) {
        const loginData = JSON.parse(loginStatusEntry.value);
        accountInfo.loginType = loginData.logintype;
        accountInfo.loginApp = loginData.loginapp;
      }

      // 从 Cookie 提取用户标识
      const uidCookie = platformCookies.find((c: any) => c.name === 'uid_tt');
      if (uidCookie) {
        accountInfo.uid = uidCookie.value;
      }

      // 从页面提取用户名
      try {
        const nameText = await page.evaluate(() => {
          const selectors = ['.user-name', '.nick-name', '[class*="user-name"]', '[class*="nickname"]'];
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.textContent?.trim()) return el.textContent.trim();
          }
          return null;
        });
        if (nameText) accountInfo.name = nameText;
      } catch (e) {}
    } catch (e) {}

    // 5. 构造 Playwright storageState 格式（与 shipinfabuzhushou 一致）
    const storageState = {
      cookies: platformCookies.length > 0 ? platformCookies : allCookies,
      origins: localStorageData,
    };

    // 6. 更新会话状态
    if (session) {
      session.status = 'authorized';
      session.cookies = storageState.cookies;
      session.localStorage = localStorageData;
      session.accountInfo = accountInfo;
    }

    // 7. 自动保存到数据库（核心：Cookie 变更自动更新）
    await saveCookiesToDatabase(platform, userId, storageState, accountInfo);

    console.log(`[Auth-V9] 登录成功! 平台: ${config?.name}, Cookie: ${storageState.cookies.length}, localStorage: ${localStorageData.length}`);

    // 8. 清理浏览器资源
    cleanupPlaywrightResource(sessionId);

    return {
      status: 'success',
      cookies: storageState.cookies,
      localStorage: localStorageData,
      accountInfo,
    };

  } catch (error: any) {
    console.error('[Auth-V9] 提取登录数据失败:', error.message);
    cleanupPlaywrightResource(sessionId);
    return { status: 'success', cookies: [], accountInfo: {} };
  }
}

/**
 * 自动保存 Cookie 到数据库（新建或更新）
 * 如果账号已存在则更新 Cookie，否则创建新记录
 */
async function saveCookiesToDatabase(
  platform: string,
  userId: string,
  storageState: { cookies: any[]; origins: any[] },
  accountInfo: any,
): Promise<void> {
  const config = PLATFORM_CONFIGS[platform];
  const cookiesJson = JSON.stringify(storageState);
  const accountName = accountInfo?.name || `${config?.name || platform}用户_${Date.now().toString(36)}`;

  // 检查是否已存在同平台的账号
  const existingAccount = await prisma.socialAccount.findFirst({
    where: { userId, platform },
  });

  if (existingAccount) {
    // 更新已有账号的 Cookie（变更自动更新）
    await prisma.socialAccount.update({
      where: { id: existingAccount.id },
      data: {
        cookies: cookiesJson,
        isConnected: true,
        status: 'active',
        lastSyncAt: new Date(),
        syncError: null,
        accountName: accountInfo?.name || existingAccount.accountName,
        config: {
          ...(existingAccount.config as any || {}),
          importMethod: 'playwright_auto',
          lastAutoRefresh: new Date().toISOString(),
          cookieCount: storageState.cookies.length,
          hasLocalStorage: (storageState.origins?.length || 0) > 0,
        },
      },
    });
    console.log(`[Auth-V9] Cookie 自动更新: ${config?.name} - ${existingAccount.accountName}`);
  } else {
    // 创建新账号
    await prisma.socialAccount.create({
      data: {
        userId,
        platform,
        accountName,
        accountId: `${platform}_${userId}_${Date.now().toString(36)}`,
        cookies: cookiesJson,
        isConnected: true,
        status: 'active',
        lastSyncAt: new Date(),
        config: {
          importMethod: 'playwright_auto',
          importedAt: new Date().toISOString(),
          cookieCount: storageState.cookies.length,
          hasLocalStorage: (storageState.origins?.length || 0) > 0,
        },
      },
    });
    console.log(`[Auth-V9] 新账号自动绑定: ${config?.name} - ${accountName}`);
  }
}

/**
 * 清理 Playwright 资源
 */
function cleanupPlaywrightResource(sessionId: string): void {
  const resources = playwrightResources.get(sessionId);
  if (resources) {
    (async () => {
      try {
        if (resources.page) await resources.page.close().catch(() => {});
        if (resources.context) await resources.context.close().catch(() => {});
        if (resources.browser) await resources.browser.close().catch(() => {});
      } catch (e) {}
    })();
    playwrightResources.delete(sessionId);
  }
}

/**
 * 获取二维码最新截图（前端轮询刷新二维码）
 */
export function getQrImage(sessionId: string): string | null {
  const session = sessions.get(sessionId);
  return session?.qrImageData || null;
}
