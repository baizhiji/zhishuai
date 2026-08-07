/**
 * Playwright Service — 浏览器自动化管理
 *
 * 职责:
 *   - 管理浏览器实例生命周期(启动/关闭/复用)
 *   - 各平台登录流程(抖音/快手/小红书/视频号/Boss直聘/智联招聘等)
 *   - Cookie持久化(登录后保存，过期后自动重新登录)
 *   - 页面操作辅助(截图/填表/点击/等待)
 */
import { chromium, firefox, Browser, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

// ─── 类型定义 ────────────────────────────────

export interface PlatformLoginConfig {
  platform: string;
  loginUrl: string;
  waitForSelector: string;        // 登录成功后出现的元素选择器
  cookieFileName: string;
  loginTimeout: number;
}

export interface PublishConfig {
  platform: string;
  postUrl?: string;               // 目标发布页面URL
  filePath?: string;              // 视频文件路径
  title?: string;
  description?: string;
  tags?: string[];
  coverImage?: string;
}

export interface AcquisitionConfig {
  platform: string;
  searchUrl?: string;             // 搜索页面URL
  keywords: string[];
  filters?: Record<string, string>;
  maxResults?: number;
}

interface CookieData {
  platform: string;
  cookies: any[];
  savedAt: string;
}

// ─── 平台配置 ────────────────────────────────

export const PLATFORM_LOGIN_CONFIGS: Record<string, PlatformLoginConfig> = {
  douyin: {
    platform: 'douyin',
    loginUrl: 'https://creator.douyin.com/',
    waitForSelector: '.creator-avatar, .account-info',
    cookieFileName: 'douyin_cookies.json',
    loginTimeout: 120000, // 2分钟扫码等待
  },
  kuaishou: {
    platform: 'kuaishou',
    loginUrl: 'https://cp.kuaishou.com/',
    waitForSelector: '.user-info, .avatar-wrap',
    cookieFileName: 'kuaishou_cookies.json',
    loginTimeout: 120000,
  },
  xiaohongshu: {
    platform: 'xiaohongshu',
    loginUrl: 'https://creator.xiaohongshu.com/',
    waitForSelector: '.creator-name, .user-center',
    cookieFileName: 'xiaohongshu_cookies.json',
    loginTimeout: 120000,
  },
  shipinhao: {
    platform: 'shipinhao',
    loginUrl: 'https://channels.weixin.qq.com/',
    waitForSelector: '.account-info, .nickname',
    cookieFileName: 'shipinhao_cookies.json',
    loginTimeout: 180000, // 3分钟登录等待
  },
  bosszhipin: {
    platform: 'bosszhipin',
    loginUrl: 'https://www.zhipin.com/web/user/?ka=header-login',
    waitForSelector: '.user-nav, .nickname',
    cookieFileName: 'bosszhipin_cookies.json',
    loginTimeout: 120000,
  },
  zhilian: {
    platform: 'zhilian',
    loginUrl: 'https://i.zhaopin.com/',
    waitForSelector: '.user-name, .resume-name',
    cookieFileName: 'zhilian_cookies.json',
    loginTimeout: 120000,
  },
};

// ─── 服务类 ────────────────────────────────

class PlaywrightService {
  private browser: Browser | null = null;
  private contexts: Map<string, BrowserContext> = new Map();
  private cookieDir: string;
  private initialized = false;

  constructor() {
    this.cookieDir = path.join(process.cwd(), 'data', 'cookies');
  }

  /**
   * 初始化浏览器
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // 确保cookie目录存在
    if (!fs.existsSync(this.cookieDir)) {
      fs.mkdirSync(this.cookieDir, { recursive: true });
    }

    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    this.initialized = true;
    console.log('[PlaywrightService] Browser launched');
  }

  /**
   * 获取或创建平台浏览器上下文(含Cookie注入)
   */
  async getContext(platform: string): Promise<BrowserContext> {
    await this.init();

    if (this.contexts.has(platform)) {
      return this.contexts.get(platform)!;
    }

    const config = PLATFORM_LOGIN_CONFIGS[platform];
    if (!config) {
      throw new Error(`未知平台: ${platform}`);
    }

    const context = await this.browser!.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    // 尝试注入已保存的Cookie
    const savedCookies = this.loadCookies(config.cookieFileName);
    if (savedCookies && savedCookies.length > 0) {
      await context.addCookies(savedCookies);
      console.log(`[PlaywrightService] Injected ${savedCookies.length} cookies for ${platform}`);
    }

    this.contexts.set(platform, context);
    return context;
  }

  /**
   * 平台登录(如果Cookie有效则跳过，否则打开页面等用户扫码)
   */
  async ensureLogin(platform: string): Promise<{ success: boolean; message: string }> {
    const config = PLATFORM_LOGIN_CONFIGS[platform];
    if (!config) {
      return { success: false, message: `未知平台: ${platform}` };
    }

    const context = await this.getContext(platform);
    const page = await context.newPage();

    try {
      // 尝试访问页面验证Cookie是否有效
      await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded' });

      const isLoggedIn = await page.$(config.waitForSelector).catch(() => null);

      if (isLoggedIn) {
        console.log(`[PlaywrightService] ${platform} 已登录(Cookie有效)`);
        await page.close();
        return { success: true, message: '已登录' };
      }

      // Cookie无效，需要登录
      console.log(`[PlaywrightService] ${platform} 需要登录，等待扫码...`);
      await page.waitForSelector(config.waitForSelector, { timeout: config.loginTimeout });
      
      // 保存新Cookie
      const cookies = await context.cookies();
      this.saveCookies(config.cookieFileName, cookies);
      
      console.log(`[PlaywrightService] ${platform} 登录成功`);
      await page.close();
      return { success: true, message: '登录成功' };
    } catch (error: any) {
      await page.close().catch(() => {});
      return { success: false, message: `登录失败: ${error.message}` };
    }
  }

  /**
   * 发布内容到平台
   */
  async publishContent(platform: string, config: PublishConfig): Promise<{ success: boolean; message: string; postUrl?: string }> {
    const loginResult = await this.ensureLogin(platform);
    if (!loginResult.success) {
      return { success: false, message: `未登录平台 ${platform}: ${loginResult.message}` };
    }

    const context = await this.getContext(platform);
    const page = await context.newPage();

    try {
      // 根据平台导航到发布页面
      const publishUrls: Record<string, string> = {
        douyin: 'https://creator.douyin.com/creator-micro/content/upload',
        kuaishou: 'https://cp.kuaishou.com/article/publish/video',
        xiaohongshu: 'https://creator.xiaohongshu.com/publish/publish',
        shipinhao: 'https://channels.weixin.qq.com/web/pages/post/create',
      };

      const targetUrl = config.postUrl || publishUrls[platform] || PLATFORM_LOGIN_CONFIGS[platform].loginUrl;
      await page.goto(targetUrl, { waitUntil: 'networkidle' });

      // 上传视频文件(如果有)
      if (config.filePath) {
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(config.filePath);
          await page.waitForTimeout(5000); // 等待上传完成
        }
      }

      // 填写标题
      if (config.title) {
        const titleInput = await page.$('[placeholder*="标题"], input[class*="title"], textarea[class*="title"]');
        if (titleInput) {
          await titleInput.fill(config.title);
        }
      }

      // 填写描述
      if (config.description) {
        const descInput = await page.$('[placeholder*="描述"], [placeholder*="简介"], textarea[placeholder*="分享"]');
        if (descInput) {
          await descInput.fill(config.description);
        }
      }

      // 添加标签
      if (config.tags && config.tags.length > 0) {
        const tagInput = await page.$('[placeholder*="标签"], [placeholder*="话题"]');
        if (tagInput) {
          await tagInput.fill(config.tags.join(' '));
        }
      }

      // 点击发布按钮
      const publishBtn = await page.$('button:has-text("发布"), button:has-text("投稿"), button:has-text("上传")');
      if (publishBtn) {
        await publishBtn.click();
        await page.waitForTimeout(5000);
        return { success: true, message: '发布成功', postUrl: page.url() };
      }

      return { success: false, message: '未找到发布按钮' };
    } catch (error: any) {
      return { success: false, message: `发布失败: ${error.message}` };
    } finally {
      await page.close().catch(() => {});
    }
  }

  /**
   * 获取Agent操作的页面(返回给调用者用于自定义操作)
   */
  async getPage(platform: string): Promise<{ page: Page; context: BrowserContext }> {
    const loginResult = await this.ensureLogin(platform);
    if (!loginResult.success) {
      throw new Error(`未登录 ${platform}: ${loginResult.message}`);
    }

    const context = await this.getContext(platform);
    const page = await context.newPage();
    return { page, context };
  }

  /**
   * 截取当前页面截图
   */
  async screenshot(platform: string): Promise<string> {
    const context = await this.getContext(platform);
    const pages = context.pages();
    if (pages.length === 0) {
      throw new Error(`${platform} 无打开的页面`);
    }

    const buffer = await pages[pages.length - 1].screenshot({ type: 'png', fullPage: false });
    return buffer.toString('base64');
  }

  /**
   * 关闭平台上下文
   */
  async closeContext(platform: string): Promise<void> {
    const context = this.contexts.get(platform);
    if (context) {
      await context.close();
      this.contexts.delete(platform);
    }
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    for (const context of this.contexts.values()) {
      await context.close().catch(() => {});
    }
    this.contexts.clear();

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.initialized = false;
  }

  // ─── Cookie管理 ────────────────────────────────

  private loadCookies(fileName: string): any[] {
    const filePath = path.join(this.cookieDir, fileName);
    if (!fs.existsSync(filePath)) return [];

    try {
      const data: CookieData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      // Cookie有效期检查(TODO: 实现过期检测)
      return data.cookies || [];
    } catch {
      return [];
    }
  }

  private saveCookies(fileName: string, cookies: any[]): void {
    const filePath = path.join(this.cookieDir, fileName);
    const data: CookieData = {
      platform: fileName.replace('_cookies.json', ''),
      cookies,
      savedAt: new Date().toISOString(),
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

const playwrightService = new PlaywrightService();
export default playwrightService;
export { PlaywrightService };

// ─── 兼容旧代码的函数导出 ────────────────────────────────

/**
 * 创建浏览器实例(兼容旧接口)
 */
export async function createBrowser(): Promise<any> {
  await playwrightService.init();
  return (playwrightService as any).browser;
}

/**
 * 创建浏览器上下文(兼容旧接口)
 */
export async function createContext(platform: string): Promise<any> {
  return playwrightService.getContext(platform);
}

/**
 * 获取平台适配器(兼容旧接口)
 */
export function getAdapter(platform: string): any {
  const config = PLATFORM_LOGIN_CONFIGS[platform];
  if (!config) throw new Error(`Unknown platform: ${platform}`);
  return {
    platform,
    loginUrl: config.loginUrl,
    waitForSelector: config.waitForSelector,
    login: () => playwrightService.ensureLogin(platform),
    publish: (cfg: any) => playwrightService.publishContent(platform, cfg),
    getPage: () => playwrightService.getPage(platform),
    close: () => playwrightService.closeContext(platform),
  };
}

/**
 * 平台配置导出(兼容旧代码)
 */
export const PLATFORM_CONFIGS = PLATFORM_LOGIN_CONFIGS;
