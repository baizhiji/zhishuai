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
    loginUrl: 'https://www.douyin.com/aweme/home',
    qrSelector: 'img[src*="qr"]',
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
    
    // 访问登录页面 - 使用 domcontentloaded 避免 networkidle 超时
    // 确保访问的是登录页面而非主页
    const loginUrl = config.loginUrl.includes('login') ? config.loginUrl : `${config.loginUrl}/login`;
    await page.goto(loginUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    // 等待页面完全加载，包括动态内容
    await page.waitForTimeout(5000);
    
    // 尝试多种方式截取二维码
    let qrcodeDataUrl = '';
    
    // 方式1: 查找并截取登录框/二维码容器
    const qrSelectors = [
      '.login-qrcode', 
      '.qrcode', 
      '[class*="qr-code"]', 
      '[class*="qrcode"]',
      '[class*="login"] [class*="code"]',
      'img[src*="qr"]',
      '.login-box',
      '.login-container'
    ];
    
    for (const selector of qrSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const box = await element.boundingBox();
          if (box && box.width > 50 && box.height > 50) {
            // 截取更大的区域以包含完整二维码
            const screenshot = await page.screenshot({ 
              type: 'png',
              clip: { 
                x: Math.max(0, box.x - 20), 
                y: Math.max(0, box.y - 20), 
                width: Math.min(box.width + 40, 800), 
                height: Math.min(box.height + 40, 800) 
              }
            });
            // 确保正确处理 Buffer/Uint8Array
            const base64Data = Buffer.isBuffer(screenshot) 
              ? screenshot.toString('base64')
              : Buffer.from(screenshot as unknown as Buffer).toString('base64');
            qrcodeDataUrl = `data:image/png;base64,${base64Data}`;
            console.log(`[Auth] 找到二维码区域: ${selector}, 尺寸: ${box.width}x${box.height}`);
            break;
          }
        }
      } catch (e) {
        console.log(`[Auth] 选择器 ${selector} 失败: ${e.message}`);
      }
    }
    
    // 方式2: 如果没找到特定区域，截图整个登录区域（页面左侧）
    if (!qrcodeDataUrl) {
      console.log('[Auth] 未找到特定区域，使用整页截图');
      const screenshot = await page.screenshot({ type: 'png', fullPage: false });
      const base64Data = Buffer.isBuffer(screenshot) 
        ? screenshot.toString('base64')
        : Buffer.from(screenshot as unknown as Buffer).toString('base64');
      qrcodeDataUrl = `data:image/png;base64,${base64Data}`;
    }
    
    console.log(`[Auth] 二维码截图完成，长度: ${qrcodeDataUrl.length}`);
    
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
