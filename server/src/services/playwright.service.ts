/**
 * Playwright 浏览器自动化服务
 * 用于模拟登录、自动填表、文件上传、消息发送等操作
 */

import { chromium, Browser, BrowserContext, Page, chromium as playwright } from 'playwright';
import * as qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

// 浏览器实例缓存
const browserInstances: Map<string, Browser> = new Map();
const contextCache: Map<string, BrowserContext> = new Map();

// 平台配置 - 各平台OAuth扫码授权页面
export const PLATFORM_CONFIGS: Record<string, {
  name: string;
  // OAuth扫码授权页面URL（生成真实二维码）
  oauthUrl: string;
  // 回调地址
  redirectUri: string;
  // OAuth参数
  oauthParams?: Record<string, string>;
  // 二维码图片选择器
  qrSelector: string;
  // 页面加载后需要点击的按钮（如果二维码需要点击才显示）
  clickToShowQr?: string;
  // 登录成功后检查的URL
  successUrlPattern?: string;
}> = {
  douyin: {
    name: '抖音',
    oauthUrl: 'https://open.douyin.com/platform/oauth/qrcode/connect',
    redirectUri: 'https://baizhiji.net/api/oauth/callback/douyin',
    qrSelector: 'img.qrcode-img, .qrcode-img, canvas, img[src*="qrcode"]',
    successUrlPattern: '/creator-micro/'
  },
  kuaishou: {
    name: '快手',
    oauthUrl: 'https://open.kuaishou.com/platform/oauth/authorize',
    redirectUri: 'https://baizhiji.net/api/oauth/callback/kuaishou',
    qrSelector: 'img.qrcode, .qrcode-img, canvas',
    successUrlPattern: '/profile'
  },
  xiaohongshu: {
    name: '小红书',
    oauthUrl: 'https://creator.xiaohongshu.com/creator/post',
    qrSelector: '.login-qrcode, .qrcode, canvas',
    clickToShowQr: 'button:has-text("扫码登录")',
    successUrlPattern: '/creator/'
  },
  weibo: {
    name: '微博',
    oauthUrl: 'https://api.weibo.com/oauth2/authorize',
    redirectUri: 'https://baizhiji.net/api/oauth/callback/weibo',
    qrSelector: '.qrcode, img.qrcode-img, canvas',
    successUrlPattern: '/account/'
  },
  boss: {
    name: 'BOSS直聘',
    oauthUrl: 'https://www.zhipin.com/web/geek/login',
    qrSelector: '.qrcode, img.qrcode-img, canvas',
    successUrlPattern: '/web/geek/home'
  },
  channels: {
    name: '视频号',
    oauthUrl: 'https://channels.weixin.qq.com/login',
    qrSelector: '.qrcode, img.qrcode-img, canvas',
    successUrlPattern: '/login'
  },
  zhihu: {
    name: '知乎',
    oauthUrl: 'https://www.zhihu.com/signin',
    qrSelector: '.qrcode, img.qrcode, canvas',
    successUrlPattern: '/people/'
  },
  baijiahao: {
    name: '百家号',
    oauthUrl: 'https://baijiahao.baidu.com/login',
    qrSelector: '.qrcode, img.qrcode, canvas',
    successUrlPattern: '/'
  },
  toutiao: {
    name: '今日头条',
    oauthUrl: 'https://mp.toutiao.com/auth/page/login',
    qrSelector: '.qrcode, img.qrcode, canvas',
    successUrlPattern: '/profile'
  },
  liepin: {
    name: '前程无忧',
    oauthUrl: 'https://www.liepin.com/login/',
    qrSelector: '.qrcode, img.qrcode, canvas',
    successUrlPattern: '/myaccount/'
  },
  zhilian: {
    name: '智联招聘',
    oauthUrl: 'https://www.zhaopin.com/login/',
    qrSelector: '.qrcode, img.qrcode, canvas',
    successUrlPattern: '/jobs/'
  }
};

export interface BrowserSession {
  browserId: string;
  contextId: string;
  platform: string;
  cookies: any[];
  createdAt: Date;
}

export interface LoginResult {
  success: boolean;
  cookies?: any[];
  accountInfo?: {
    id?: string;
    name?: string;
    avatar?: string;
  };
  error?: string;
}

export interface TaskResult {
  success: boolean;
  output?: any;
  screenshots?: string[];
  logs?: string[];
  error?: string;
}

/**
 * 创建浏览器实例
 */
export async function createBrowser(userId: string): Promise<Browser> {
  const browserId = `browser-${userId}-${Date.now()}`;
  
  const browser = await playwright.launch({
    headless: true, // 生产环境设为 true
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  
  browserInstances.set(browserId, browser);
  return browser;
}

/**
 * 创建浏览器上下文（隔离环境）
 */
export async function createContext(browser: Browser, userId: string): Promise<BrowserContext> {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ignoreHTTPSErrors: true,
    javaScriptEnabled: true,
    storageState: undefined
  });
  
  const contextId = `context-${userId}-${Date.now()}`;
  contextCache.set(contextId, context);
  return context;
}

/**
 * 启动扫码登录流程，获取真实二维码
 */
export async function startQRCodeLogin(platform: string, sessionId: string): Promise<{
  qrcodeUrl: string;
  browserId: string;
  contextId: string;
} | null> {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    throw new Error(`不支持的平台: ${platform}`);
  }

  try {
    // 创建浏览器实例
    const browser = await createBrowser(`oauth-${sessionId}`);
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const browserId = `browser-${sessionId}`;
    const contextId = `context-${sessionId}`;

    // 存储浏览器会话
    browserSessions.set(sessionId, {
      browserId,
      contextId,
      platform,
      cookies: [],
      createdAt: new Date()
    });

    // 访问OAuth授权页面
    await page.goto(config.oauthUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // 如果需要点击才显示二维码
    if (config.clickToShowQr) {
      try {
        await page.click(config.clickToShowQr, { timeout: 5000 });
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log('点击显示二维码失败，继续');
      }
    }
    
    // 等待二维码容器出现
    const qrSelector = config.qrSelector;
    if (qrSelector) {
      try {
        await page.waitForSelector(qrSelector, { timeout: 15000 });
      } catch (e) {
        // 尝试等待更长时间或截图看实际页面状态
        await page.waitForTimeout(5000);
      }
    }

    // 等待二维码加载
    await page.waitForTimeout(3000);

    // 截取二维码区域
    let qrcodeUrl = '';
    
    if (qrSelector) {
      try {
        // 尝试截取二维码元素
        const qrElement = await page.$(qrSelector);
        if (qrElement) {
          const screenshot = await qrElement.screenshot({ type: 'png' });
          qrcodeUrl = `data:image/png;base64,${screenshot.toString('base64')}`;
        }
      } catch (e) {
        console.log('截取二维码元素失败，尝试截取整页');
      }
    }

    // 如果没找到二维码区域，截取整个页面
    if (!qrcodeUrl) {
      const screenshot = await page.screenshot({ type: 'png', fullPage: false });
      qrcodeUrl = `data:image/png;base64,${screenshot.toString('base64')}`;
    }

    return { qrcodeUrl, browserId, contextId };
  } catch (error: any) {
    console.error('启动扫码登录失败:', error);
    return null;
  }
}

/**
 * 检查登录状态
 */
export async function checkLoginStatus(sessionId: string, platform: string): Promise<LoginResult> {
  const session = browserSessions.get(sessionId);
  if (!session) {
    return { success: false, error: '会话不存在' };
  }

  try {
    const context = contextCache.get(session.contextId);
    if (!context) {
      return { success: false, error: '浏览器上下文不存在' };
    }

    const page = await context.newPage();
    
    // 获取登录成功选择器
    const loginSelectors = getLoginSuccessSelectors(platform);
    
    for (const selector of loginSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        // 登录成功
        const cookies = await context.cookies();
        const accountInfo = await extractAccountInfo(page, platform);
        
        return {
          success: true,
          cookies,
          accountInfo
        };
      } catch (e) {
        // 继续尝试
      }
    }

    return { success: false, error: '等待登录中...' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 关闭扫码登录会话
 */
export async function closeQRCodeLogin(sessionId: string): Promise<void> {
  const session = browserSessions.get(sessionId);
  if (session) {
    try {
      const context = contextCache.get(session.contextId);
      if (context) {
        await context.close();
        contextCache.delete(session.contextId);
      }
      const browser = browserInstances.get(session.browserId);
      if (browser) {
        await browser.close();
        browserInstances.delete(session.browserId);
      }
    } catch (e) {
      console.error('关闭浏览器会话失败:', e);
    }
    browserSessions.delete(sessionId);
  }
}

// 导出选择器获取函数（供oauth.ts使用）
export function getLoginSuccessSelectors(platform: string): string[] {
  const selectors: Record<string, string[]> = {
    douyin: ['.creator-left-menu', '[data-e2e="creator-nav"]', '.user-info', '.left-menu', '.login-qrcode'],
    kuaishou: ['.profile-header', '.user-name', '.login-qrcode'],
    xiaohongshu: ['.user-info', '.creator-header', '.login-qrcode'],
    weibo: ['.WB_frame', '.user_at', '.WB_main'],
    boss: ['.boss-header', '.user-info', '.login-qrcode'],
    channels: ['.login-qrcode', '.user-info'],
    zhihu: ['.App', '.SignContainer'],
    baijiahao: ['.login-qrcode', '.user-info'],
    toutiao: ['.login-qrcode', '.user-info'],
    liepin: ['.login-qrcode', '.user-info'],
    zhilian: ['.login-qrcode', '.user-info']
  };
  
  return selectors[platform] || ['body'];
}

/**
 * 生成登录二维码（旧的假二维码，用于兼容）
 */
export async function generateLoginQRCode_old(platform: string, sessionId: string): Promise<{
  qrcodeUrl: string;
  qrcodeData: string;
}> {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    throw new Error(`不支持的平台: ${platform}`);
  }
  
  const state = uuidv4();
  
  // 生成二维码内容
  const qrcodeData = JSON.stringify({
    sessionId,
    platform,
    state,
    timestamp: Date.now()
  });
  
  // 生成二维码图片
  const qrcodeUrl = await qrcode.toDataURL(qrcodeData, {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
  
  return { qrcodeUrl, qrcodeData };
}

/**
 * 等待扫码登录
 */
export async function waitForLogin(page: Page, platform: string, timeout: number = 120000): Promise<LoginResult> {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    return { success: false, error: `不支持的平台: ${platform}` };
  }
  
  try {
    // 访问登录页面
    await page.goto(config.loginUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // 等待登录成功（通过检测用户信息元素）
    const loginSelectors = getLoginSuccessSelectors(platform);
    
    for (const selector of loginSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: timeout / 2 });
        // 登录成功，获取cookies
        const cookies = await page.context().cookies();
        const accountInfo = await extractAccountInfo(page, platform);
        
        return {
          success: true,
          cookies,
          accountInfo
        };
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }
    
    return { success: false, error: '登录超时' };
    
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 获取登录成功的检测选择器
 */
function getLoginSuccessSelectors(platform: string): string[] {
  const selectors: Record<string, string[]> = {
    douyin: ['.creator-left-menu', '[data-e2e="creator-nav"]', '.user-info'],
    kuaishou: ['.profile-header', '.user-name'],
    xiaohongshu: ['.user-info', '.creator-header'],
    weibo: ['.WB_frame .WB_main_login'],
    boss: ['.boss-header', '.user-info'],
    lagou: ['.user-logo', '.header-user-info'],
    zhipin: ['.user-info', '.header-user']
  };
  
  return selectors[platform] || ['body'];
}

/**
 * 提取账号信息
 */
async function extractAccountInfo(page: Page, platform: string): Promise<any> {
  const info: any = {};
  
  try {
    // 尝试获取用户名
    const nameSelectors = [
      '.user-name',
      '.nick-name',
      '[class*="name"]',
      '[class*="user"]'
    ];
    
    for (const selector of nameSelectors) {
      const element = await page.$(selector);
      if (element) {
        info.name = await element.textContent();
        break;
      }
    }
    
    // 尝试获取头像
    const avatarSelectors = [
      'img.avatar',
      'img[class*="avatar"]',
      '[class*="avatar"] img'
    ];
    
    for (const selector of avatarSelectors) {
      const element = await page.$(selector);
      if (element) {
        info.avatar = await element.getAttribute('src');
        break;
      }
    }
    
  } catch (e) {
    // 忽略错误
  }
  
  return info;
}

/**
 * 通用页面操作
 */
export async function navigateAndWait(page: Page, url: string, selector?: string, timeout: number = 30000): Promise<boolean> {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout });
    if (selector) {
      await page.waitForSelector(selector, { timeout });
    }
    return true;
  } catch (e) {
    console.error('导航失败:', e);
    return false;
  }
}

/**
 * 点击元素
 */
export async function clickElement(page: Page, selector: string, timeout: number = 5000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout });
    await page.click(selector);
    return true;
  } catch (e) {
    console.error('点击失败:', selector, e);
    return false;
  }
}

/**
 * 填写表单
 */
export async function fillForm(page: Page, fields: Record<string, string>): Promise<boolean> {
  try {
    for (const [selector, value] of Object.entries(fields)) {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.fill(selector, value);
    }
    return true;
  } catch (e) {
    console.error('填写表单失败:', e);
    return false;
  }
}

/**
 * 上传文件
 */
export async function uploadFile(page: Page, selector: string, filePath: string): Promise<boolean> {
  try {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click(selector);
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
    return true;
  } catch (e) {
    console.error('上传文件失败:', e);
    return false;
  }
}

/**
 * 截图
 */
export async function takeScreenshot(page: Page, name: string): Promise<string | null> {
  try {
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false
    });
    // 返回 base64 编码的图片
    return screenshot.toString('base64');
  } catch (e) {
    console.error('截图失败:', e);
    return null;
  }
}

/**
 * 获取元素文本
 */
export async function getElementText(page: Page, selector: string): Promise<string | null> {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return await page.textContent(selector);
  } catch (e) {
    return null;
  }
}

/**
 * 等待元素可见
 */
export async function waitForVisible(page: Page, selector: string, timeout: number = 5000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 等待元素消失
 */
export async function waitForHidden(page: Page, selector: string, timeout: number = 5000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'hidden', timeout });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 滚动到元素
 */
export async function scrollToElement(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.$eval(selector, (el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 关闭浏览器上下文
 */
export async function closeContext(contextId: string): Promise<void> {
  const context = contextCache.get(contextId);
  if (context) {
    await context.close();
    contextCache.delete(contextId);
  }
}

/**
 * 关闭浏览器实例
 */
export async function closeBrowser(browserId: string): Promise<void> {
  const browser = browserInstances.get(browserId);
  if (browser) {
    await browser.close();
    browserInstances.delete(browserId);
  }
}

/**
 * 清理所有浏览器资源
 */
export async function cleanupAll(): Promise<void> {
  for (const context of contextCache.values()) {
    await context.close();
  }
  contextCache.clear();
  
  for (const browser of browserInstances.values()) {
    await browser.close();
  }
  browserInstances.clear();
}

/**
 * 随机延迟（防检测）
 */
export async function randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 模拟人类输入
 */
export async function humanType(page: Page, selector: string, text: string): Promise<void> {
  await page.click(selector);
  await page.fill(selector, '');
  
  for (const char of text) {
    await page.keyboard.type(char, { delay: Math.random() * 100 + 50 });
    await randomDelay(30, 80);
  }
}

// 从 platform-adapter 重新导出 getAdapter
export { getAdapter } from './platform-adapter';
