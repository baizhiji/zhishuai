/**
 * 浏览器自动化服务 - 扫码授权
 * 用于打开平台登录页面，截图二维码，检测登录状态
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

// 浏览器实例管理
let browserInstance: Browser | null = null;
let browserContext: BrowserContext | null = null;

// 平台配置
interface PlatformConfig {
  name: string;
  icon: string;
  color: string;
  loginUrl: string;
  // 二维码容器选择器（用于截图）
  qrSelector: string;
  // 登录成功检测选择器
  successSelectors: string[];
  // 用户信息提取选择器
  userInfoSelector: string;
  status: 'available' | 'coming';
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  douyin: {
    name: '抖音',
    icon: '🎵',
    color: '#fe2c55',
    loginUrl: 'https://www.douyin.com/',
    qrSelector: '.qrcode-img, .login-qrcode, [class*="qrcode"]',
    successSelectors: ['.login-mode', '.header-user-info', '[data-e2e*="user"]'],
    userInfoSelector: '.user-name, .nickname',
    status: 'available'
  },
  kuaishou: {
    name: '快手',
    icon: '📹',
    color: '#ff4906',
    loginUrl: 'https://www.kuaishou.com/',
    qrSelector: '.qrcode-img, .login-qrcode',
    successSelectors: ['.profile-header', '.user-info'],
    userInfoSelector: '.user-name',
    status: 'available'
  },
  bilibili: {
    name: '哔哩哔哩',
    icon: '📺',
    color: '#00a1d6',
    loginUrl: 'https://passport.bilibili.com/qrcode/h5/login',
    qrSelector: '.qrcode-img, .qrcode',
    successSelectors: ['.user-info', '.header-user'],
    userInfoSelector: '.username',
    status: 'available'
  },
  weibo: {
    name: '微博',
    icon: '🌐',
    color: '#e6162d',
    loginUrl: 'https://weibo.com/login',
    qrSelector: '.qrcode-img, .qrcode',
    successSelectors: ['.WB_frame', '.user-avatar'],
    userInfoSelector: '.nickname',
    status: 'available'
  },
  xiaohongshu: {
    name: '小红书',
    icon: '📕',
    color: '#ff2442',
    loginUrl: 'https://www.xiaohongshu.com/',
    qrSelector: '.qrcode, .login-qrcode',
    successSelectors: ['.user-info', '.login-success'],
    userInfoSelector: '.name',
    status: 'coming'
  }
};

// 会话管理
interface AuthSession {
  id: string;
  platform: string;
  page: Page | null;
  status: 'pending' | 'scanning' | 'authorized' | 'expired' | 'failed';
  cookies: any[];
  accountInfo: any;
  createdAt: Date;
  expiresAt: Date;
}

const sessions: Map<string, AuthSession> = new Map();

/**
 * 获取或创建浏览器实例
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    // 设置库路径
    const libPath = '/usr/lib/x86_64-linux-gnu';
    const currentPath = process.env.LD_LIBRARY_PATH || '';
    if (!currentPath.includes(libPath)) {
      process.env.LD_LIBRARY_PATH = currentPath ? `${currentPath}:${libPath}` : libPath;
    }
    
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-gpu'
      ]
    });
  }
  return browserInstance;
}

/**
 * 创建授权会话
 */
export async function createAuthSession(platform: string): Promise<{
  sessionId: string;
  qrcodeUrl: string;
  platform: string;
  platformName: string;
  expiresAt: Date;
} | null> {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) return null;
  
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟
  
  try {
    const browser = await getBrowser();
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    
    console.log(`[Auth] 正在打开 ${config.name} 登录页面...`);
    
    // 访问登录页面
    await page.goto(config.loginUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 等待二维码出现
    await page.waitForTimeout(2000);
    
    // 尝试找到二维码并截图
    let qrcodeDataUrl = '';
    
    try {
      const qrElement = await page.$(config.qrSelector);
      if (qrElement) {
        const screenshot = await qrElement.screenshot({ type: 'png' });
        qrcodeDataUrl = `data:image/png;base64,${screenshot.toString('base64')}`;
      }
    } catch (e) {
      console.log(`[Auth] 未找到 ${config.qrSelector}，尝试全页面截图`);
    }
    
    // 如果没找到二维码，截取整个登录区域
    if (!qrcodeDataUrl) {
      try {
        const body = await page.$('body');
        if (body) {
          const screenshot = await body.screenshot({ type: 'png' });
          qrcodeDataUrl = `data:image/png;base64,${screenshot.toString('base64')}`;
        }
      } catch (e) {
        console.error('[Auth] 截图失败:', e);
      }
    }
    
    // 如果还是没截到，生成一个占位图
    if (!qrcodeDataUrl) {
      // 生成一个提示图片
      qrcodeDataUrl = await qrcode.toDataURL(
        `请手动访问: ${config.loginUrl}\n平台: ${config.name}\n会话ID: ${sessionId}`,
        { width: 300, margin: 2 }
      );
    }
    
    // 保存会话
    sessions.set(sessionId, {
      id: sessionId,
      platform,
      page,
      status: 'pending',
      cookies: [],
      accountInfo: null,
      createdAt: new Date(),
      expiresAt
    });
    
    console.log(`[Auth] 会话 ${sessionId} 创建成功，平台: ${config.name}`);
    
    return {
      sessionId,
      qrcodeUrl: qrcodeDataUrl,
      platform,
      platformName: config.name,
      expiresAt
    };
    
  } catch (error: any) {
    console.error(`[Auth] 创建会话失败:`, error.message);
    return null;
  }
}

/**
 * 检查登录状态
 */
export async function checkAuthStatus(sessionId: string): Promise<{
  status: string;
  cookies?: any[];
  accountInfo?: any;
  message?: string;
}> {
  const session = sessions.get(sessionId);
  if (!session) {
    return { status: 'not_found', message: '会话不存在' };
  }
  
  // 检查过期
  if (new Date() > session.expiresAt) {
    session.status = 'expired';
    cleanupSession(sessionId);
    return { status: 'expired', message: '会话已过期，请重新授权' };
  }
  
  // 如果页面已关闭
  if (!session.page || session.page.isClosed()) {
    return { status: 'failed', message: '浏览器页面已关闭' };
  }
  
  const config = PLATFORM_CONFIGS[session.platform];
  if (!config) {
    return { status: 'failed', message: '不支持的平台' };
  }
  
  try {
    // 检查是否已登录
    for (const selector of config.successSelectors) {
      try {
        const element = await session.page.$(selector);
        if (element) {
          // 登录成功！
          session.status = 'authorized';
          session.cookies = await session.page.context().cookies();
          
          // 提取用户信息
          try {
            const nameEl = await session.page.$(config.userInfoSelector);
            if (nameEl) {
              session.accountInfo = {
                name: await nameEl.textContent()
              };
            }
          } catch (e) {
            // 忽略
          }
          
          console.log(`[Auth] 会话 ${sessionId} 授权成功`);
          
          cleanupSession(sessionId);
          
          return {
            status: 'authorized',
            cookies: session.cookies,
            accountInfo: session.accountInfo,
            message: '授权成功！'
          };
        }
      } catch (e) {
        // 继续检查下一个选择器
      }
    }
    
    // 未登录，返回当前状态
    return {
      status: session.status,
      message: '等待扫码授权...'
    };
    
  } catch (error: any) {
    console.error(`[Auth] 检查状态失败:`, error.message);
    return { status: 'error', message: error.message };
  }
}

/**
 * 清理会话
 */
function cleanupSession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    if (session.page && !session.page.isClosed()) {
      session.page.close().catch(() => {});
    }
    sessions.delete(sessionId);
    console.log(`[Auth] 会话 ${sessionId} 已清理`);
  }
}

/**
 * 取消授权会话
 */
export function cancelAuthSession(sessionId: string): boolean {
  cleanupSession(sessionId);
  return true;
}

/**
 * 获取支持的平台列表
 */
export function getPlatformList(): any[] {
  return Object.entries(PLATFORM_CONFIGS).map(([key, config]) => ({
    code: key,
    name: config.name,
    status: config.status
  }));
}

/**
 * 关闭所有资源
 */
export async function closeAll(): Promise<void> {
  for (const session of sessions.values()) {
    if (session.page && !session.page.isClosed()) {
      await session.page.close();
    }
  }
  sessions.clear();
  
  if (browserContext) {
    await browserContext.close();
    browserContext = null;
  }
  
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
