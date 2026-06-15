/**
 * 浏览器自动化服务 - 扫码授权
 * 用于打开平台登录页面，截图二维码，检测登录状态
 * 
 * 改进：更隐蔽的配置，避免被反爬虫检测
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as qrcode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// 二维码临时存储目录
const QRCODE_DIR = path.join(__dirname, '../../../public/qrcodes');
if (!fs.existsSync(QRCODE_DIR)) {
  fs.mkdirSync(QRCODE_DIR, { recursive: true });
}

// 浏览器实例管理
let browserInstance: Browser | null = null;

// 平台配置
interface PlatformConfig {
  name: string;
  icon: string;
  color: string;
  // 多个登录 URL 尝试
  loginUrls: string[];
  // 二维码图片选择器
  qrSelectors: string[];
  // 登录成功检测选择器
  successSelectors: string[];
  // 用户信息提取
  userInfoSelectors: string[];
  status: 'available' | 'coming';
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  douyin: {
    name: '抖音',
    icon: '🎵',
    color: '#fe2c55',
    // 抖音有多个登录入口，尝试不同的
    loginUrls: [
      'https://www.douyin.com/login/',
      'https://www.douyin.com/discover',
      'https://live.douyin.com/',
    ],
    qrSelectors: [
      // 扫码登录区域
      '.login-qrcode img',
      '.qrcode-img img',
      'img[class*="qrcode"]',
      'img[class*="qr-code"]',
      // 通用图片二维码
      'img[src*="qr"]',
      'img[src*="qrcode"]',
      // 整个二维码容器
      '.login-qrcode',
      '.qrcode-container',
      '[class*="scan-login"]',
      '[class*="qr-login"]',
    ],
    successSelectors: [
      // 登录成功后的元素
      '.header-user-info',
      '[data-e2e*="user"]',
      '.user-info',
      '.login-success',
      '.avatar-wrapper',
      // 导航栏用户区域
      '.nav-user',
      '.user-avatar',
    ],
    userInfoSelectors: [
      '.nickname',
      '.user-name',
      '[class*="nick"]',
      '.header-user-info .name',
    ],
    status: 'available'
  },
  kuaishou: {
    name: '快手',
    icon: '📹',
    color: '#ff4906',
    loginUrls: [
      'https://www.kuaishou.com/',
      'https://www.kuaishou.com/new窝窝',
    ],
    qrSelectors: [
      '.qrcode-img img',
      '.login-qrcode img',
      'img[class*="qr"]',
      '[class*="qrcode"] img',
    ],
    successSelectors: [
      '.profile-header',
      '.user-info',
      '.avatar-wrapper',
      '.user-avatar',
    ],
    userInfoSelectors: [
      '.user-name',
      '.nick-name',
      '[class*="nick"]',
    ],
    status: 'available'
  },
  bilibili: {
    name: '哔哩哔哩',
    icon: '📺',
    color: '#00a1d6',
    loginUrls: [
      'https://passport.bilibili.com/qrcode/h5/login',
      'https://passport.bilibili.com/login',
    ],
    qrSelectors: [
      '.qrcode-img img',
      '.qrcode img',
      '#qrcode img',
      'img[class*="qr"]',
    ],
    successSelectors: [
      '.user-info',
      '.header-user',
      '.avatar-wrapper',
    ],
    userInfoSelectors: [
      '.username',
      '.nickname',
      '.user-name',
    ],
    status: 'available'
  },
  weibo: {
    name: '微博',
    icon: '🌐',
    color: '#e6162d',
    loginUrls: [
      'https://weibo.com/login.php',
      'https://login.sina.com.cn/signup/signin.php',
    ],
    qrSelectors: [
      '.qrcode-img img',
      '.qrcode img',
      'img[class*="qr"]',
      '#qrcode img',
    ],
    successSelectors: [
      '.WB_frame',
      '.user-avatar',
      '.nav-user',
    ],
    userInfoSelectors: [
      '.nickname',
      '.username',
    ],
    status: 'available'
  },
  xiaohongshu: {
    name: '小红书',
    icon: '📕',
    color: '#ff2442',
    loginUrls: [
      'https://www.xiaohongshu.com/',
      'https://creator.xiaohongshu.com/login',
    ],
    qrSelectors: [
      '.qrcode',
      '.login-qrcode img',
      '[class*="qrcode"] img',
      'img[class*="qr"]',
    ],
    successSelectors: [
      '.user-info',
      '.login-success',
      '.avatar-wrapper',
    ],
    userInfoSelectors: [
      '.name',
      '.nickname',
    ],
    status: 'coming'
  }
};

// 会话管理
interface AuthSession {
  id: string;
  platform: string;
  page: Page | null;
  context: BrowserContext | null;
  status: 'pending' | 'scanning' | 'authorized' | 'expired' | 'failed';
  cookies: any[];
  accountInfo: any;
  createdAt: Date;
  expiresAt: Date;
}

const sessions: Map<string, AuthSession> = new Map();

// 真实用户代理
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
];

/**
 * 获取随机用户代理
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * 获取或创建浏览器实例
 * 改进：移除自动化特征，使用更真实的浏览器配置
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    // 设置浏览器依赖库路径
    const libPath = '/usr/lib/x86_64-linux-gnu';
    const currentPath = process.env.LD_LIBRARY_PATH || '';
    if (!currentPath.includes(libPath)) {
      process.env.LD_LIBRARY_PATH = currentPath ? `${currentPath}:${libPath}` : libPath;
    }
    
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        // 禁用自动化检测特征
        '--disable-blink-features=AutomationControlled',
        // 禁用开发者工具检测
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // 安全相关
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--allow-running-insecure-content',
        // 性能与稳定性
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-webgl',
        '--ignore-certificate-errors',
        // 防止被检测
        '--disable-infobars',
        '--disable-extensions',
        '--no-first-run',
        '--no-zygote',
      ]
    });
  }
  return browserInstance;
}

/**
 * 创建新的浏览器上下文（隔离会话）
 */
async function createBrowserContext(): Promise<BrowserContext> {
  const browser = await getBrowser();
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: getRandomUserAgent(),
    // 不记录权限
    permissions: [],
    // 地理定位（可选）
    // geolocation: { latitude: 39.9042, longitude: 116.4074 },
  });
  
  // 注入脚本，隐藏 webdriver 属性
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });
  
  return context;
}

/**
 * 获取支持的平台列表
 */
export function getPlatformList(): Array<{ code: string; name: string; status: 'available' | 'coming' }> {
  return Object.entries(PLATFORM_CONFIGS).map(([code, config]) => ({
    code,
    name: config.name,
    status: config.status
  }));
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
  
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  
  try {
    console.log(`[Auth] 正在为 ${config.name} 创建授权会话...`);
    
    // 创建新的浏览器上下文
    context = await createBrowserContext();
    page = await context.newPage();
    
    // 尝试多个登录 URL
    let loginSuccess = false;
    for (const loginUrl of config.loginUrls) {
      try {
        console.log(`[Auth] 尝试访问: ${loginUrl}`);
        
        await page.goto(loginUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        // 等待页面加载
        await page.waitForTimeout(3000);
        
        // 检查是否成功加载（页面有内容）
        const bodyText = await page.textContent('body');
        if (bodyText && bodyText.length > 100) {
          console.log(`[Auth] 成功加载页面，内容长度: ${bodyText.length}`);
          loginSuccess = true;
          break;
        }
      } catch (e: any) {
        console.log(`[Auth] URL ${loginUrl} 失败: ${e.message}`);
      }
    }
    
    if (!loginSuccess) {
      console.log(`[Auth] 所有登录 URL 都失败了`);
      throw new Error('无法访问登录页面');
    }
    
    // 等待二维码出现
    console.log(`[Auth] 等待二维码加载...`);
    await page.waitForTimeout(2000);
    
    // 尝试截取二维码
    let qrcodeDataUrl = '';
    
    // 方法1: 查找二维码图片元素
    for (const selector of config.qrSelectors) {
      try {
        const imgElement = await page.$(selector);
        if (imgElement) {
          // 尝试获取图片 src
          const src = await imgElement.getAttribute('src');
          if (src && (src.startsWith('http') || src.startsWith('data:image'))) {
            console.log(`[Auth] 找到二维码图片: ${selector}, src长度: ${src.length}`);
            qrcodeDataUrl = src;
            break;
          }
          
          // 如果是相对路径，尝试截图该元素
          const box = await imgElement.boundingBox();
          if (box && box.width > 50 && box.height > 50) {
            const screenshot = await page.screenshot({ 
              type: 'png',
              clip: {
                x: Math.max(0, box.x - 10),
                y: Math.max(0, box.y - 10),
                width: Math.min(box.width + 20, 600),
                height: Math.min(box.height + 20, 600)
              }
            });
            const base64Data = Buffer.isBuffer(screenshot) 
              ? screenshot.toString('base64')
              : Buffer.from(screenshot as unknown as Buffer).toString('base64');
            qrcodeDataUrl = `data:image/png;base64,${base64Data}`;
            console.log(`[Auth] 截图二维码区域: ${selector}, ${box.width}x${box.height}`);
            break;
          }
        }
      } catch (e: any) {
        console.log(`[Auth] 选择器 ${selector} 失败: ${e.message}`);
      }
    }
    
    // 方法2: 如果没找到，截图整个页面左侧区域（通常登录在左侧）
    if (!qrcodeDataUrl) {
      console.log(`[Auth] 未找到二维码图片，尝试截图页面...`);
      const screenshot = await page.screenshot({ 
        type: 'png',
        fullPage: false
      });
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
      context,
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
    console.error(`[Auth] 创建会话失败:`, error);
    
    // 清理
    if (context) await context.close().catch(() => {});
    
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
    // 截图当前页面状态，用于调试
    const currentScreenshot = await session.page.screenshot({ type: 'png' });
    console.log(`[Auth] 会话 ${sessionId} 当前页面截图: ${currentScreenshot.length} bytes`);
    
    // 检查是否已登录
    for (const selector of config.successSelectors) {
      try {
        const element = await session.page.$(selector);
        if (element) {
          console.log(`[Auth] 检测到登录成功元素: ${selector}`);
          
          // 登录成功！
          session.status = 'authorized';
          session.cookies = await session.page.context().cookies();
          
          // 提取用户信息
          for (const userSelector of config.userInfoSelectors) {
            try {
              const nameEl = await session.page.$(userSelector);
              if (nameEl) {
                const name = await nameEl.textContent();
                session.accountInfo = {
                  name: name?.trim(),
                  platform: config.name
                };
                break;
              }
            } catch (e) {
              // 继续尝试下一个选择器
            }
          }
          
          console.log(`[Auth] 会话 ${sessionId} 授权成功，用户信息:`, session.accountInfo);
          
          // 清理页面
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
    
    // 检查是否正在扫码
    const pageText = await session.page.textContent('body').catch(() => '');
    if (pageText?.includes('扫码') || pageText?.includes('扫描')) {
      session.status = 'scanning';
    }
    
    // 未登录，返回当前状态
    return {
      status: session.status,
      message: session.status === 'scanning' ? '已扫码，等待确认...' : '等待扫码授权...'
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
    // 关闭页面
    if (session.page && !session.page.isClosed()) {
      session.page.close().catch(() => {});
    }
    // 关闭上下文
    if (session.context) {
      session.context.close().catch(() => {});
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
