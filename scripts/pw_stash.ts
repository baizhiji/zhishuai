/**
 * Playwright Service — 浏览器自动化管理（商用级）
 *
 * 职责:
 *   - 管理浏览器实例生命周期(启动/关闭/复用)
 *   - 异步登录会话(生成二维码/登录页截图，轮询扫码状态，非阻塞)
 *   - 各平台登录流程(抖音/快手/小红书/Boss直聘/智联招聘/微博/B站)
 *   - Cookie 持久化 + 过期检测(登录后保存，过期后自动重新登录)
 *   - 内容发布(平台专用选择器 + 通用回退)
 *   - 数据采集(招聘平台职位采集)
 */
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

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

export interface CollectionResult {
  success: boolean;
  message: string;
  items: any[];
}

export interface LoginSession {
  id: string;
  platform: string;
  context: BrowserContext;
  page: Page;
  status: 'pending' | 'logged_in' | 'failed' | 'cancelled';
  message?: string;
  createdAt: number;
  cookies?: any[];
  accountInfo?: { name?: string; avatar?: string; accountId?: string };
}

/** 评论发布结果 */
export interface CommentPublishResult {
  success: boolean;
  message: string;
  deliveryId?: string;
}

/** 评论发布配置 */
export interface CommentPublishConfig {
  targetUrl: string;      // 目标内容页 URL
  content: string;        // 评论内容
  cookies?: any[];        // 已登录账号的 cookies（优先于文件 cookie）
  accountName?: string;   // 账号昵称（日志用）
}

interface CookieData {
  platform: string;
  cookies: any[];
  savedAt: string;
}

interface PublishSelectors {
  upload?: string;
  title?: string;
  desc?: string;
  tags?: string;
  submit?: string;
}

/** 评论发布选择器 */
interface CommentSelectors {
  input: string;          // 评论区输入框
  submit: string;         // 发表/发布按钮
  accountName: string;    // 登录后账号昵称选择器（提取账号信息用）
}

// ─── 平台配置 ────────────────────────────────

export const PLATFORM_LOGIN_CONFIGS: Record<string, PlatformLoginConfig> = {
  douyin: {
    platform: 'douyin',
    loginUrl: 'https://creator.douyin.com/',
    waitForSelector: '.creator-avatar, .account-info',
    cookieFileName: 'douyin_cookies.json',
    loginTimeout: 120000,
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
  weibo: {
    platform: 'weibo',
    loginUrl: 'https://weibo.com/',
    waitForSelector: '.woo-box-flex .name, .m-header-name',
    cookieFileName: 'weibo_cookies.json',
    loginTimeout: 120000,
  },
  bilibili: {
    platform: 'bilibili',
    loginUrl: 'https://member.bilibili.com/',
    waitForSelector: '.nickname, .bili-avatar',
    cookieFileName: 'bilibili_cookies.json',
    loginTimeout: 120000,
  },
};

/** 平台专用发布选择器(找不到时回退通用选择器) */
const PUBLISH_SELECTORS: Record<string, PublishSelectors> = {
  douyin: {
    title: '[placeholder*="标题"], input[class*="title"]',
    desc: '[placeholder*="简介"], [placeholder*="描述"]',
    tags: '[placeholder*="话题"], [placeholder*="标签"]',
    submit: 'button:has-text("发布")',
  },
  kuaishou: {
    title: '[placeholder*="标题"], input[class*="title"]',
    desc: '[placeholder*="描述"], textarea[placeholder*="简介"]',
    tags: '[placeholder*="话题"], [placeholder*="标签"]',
    submit: 'button:has-text("发布")',
  },
  xiaohongshu: {
    title: '[placeholder*="标题"], input[class*="title"]',
    desc: '[placeholder*="说点什么"], [placeholder*="正文"]',
    tags: '[placeholder*="标签"], [placeholder*="话题"]',
    submit: 'button:has-text("发布")',
  },
};

/** 平台评论选择器（跟评发送） */
const COMMENT_SELECTORS: Record<string, CommentSelectors> = {
  douyin: {
    input: '[data-e2e="comment-input"], .comment-input textarea, textarea[placeholder*="评论"]',
    submit: '[data-e2e="comment-post"], button:has-text("发布"), button:has-text("发表")',
    accountName: '.creator-avatar, .account-info, .nickname',
  },
  kuaishou: {
    input: '.comment-input textarea, textarea[placeholder*="评论"], textarea[placeholder*="说点什么"]',
    submit: 'button:has-text("发布"), button:has-text("发表")',
    accountName: '.user-info, .avatar-wrap, .nickname',
  },
  xiaohongshu: {
    input: '.comment-input textarea, #comment-input, textarea[placeholder*="评论"]',
    submit: '.comment-submit, button:has-text("发布"), button:has-text("发送")',
    accountName: '.creator-name, .user-center, .nickname',
  },
};

// ─── 服务类 ────────────────────────────────

class PlaywrightService {
  private browser: Browser | null = null;
  private contexts: Map<string, BrowserContext> = new Map();
  private sessions: Map<string, LoginSession> = new Map();
  private cookieDir: string;
  private initialized = false;
  private static readonly COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // Cookie 7 天过期

  constructor() {
    this.cookieDir = path.join(process.cwd(), 'data', 'cookies');
  }

  /**
   * 初始化浏览器
   */
  async init(): Promise<void> {
    if (this.initialized) return;

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

    const savedCookies = this.loadCookies(config.cookieFileName);
    if (savedCookies.length > 0) {
      await context.addCookies(savedCookies);
      console.log(`[PlaywrightService] Injected ${savedCookies.length} cookies for ${platform}`);
    }

    this.contexts.set(platform, context);
    return context;
  }

  // ─── 异步登录会话 ────────────────────────────────

  /**
   * 启动异步登录会话：打开平台登录页并返回登录页截图(含二维码)
   * 非阻塞 —— 后台轮询扫码状态，前端通过 getLoginStatus 查询
   */
  async startLogin(platform: string): Promise<{ sessionId: string; qrcode: string }> {
    const config = PLATFORM_LOGIN_CONFIGS[platform];
    if (!config) {
      throw new Error(`未知平台: ${platform}`);
    }
    await this.init();

    const sessionId = randomUUID();
    const context = await this.browser!.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000); // 等待二维码渲染

    const qrcode = await page.screenshot({ type: 'png' }).then(b => b.toString('base64'));

    const session: LoginSession = {
      id: sessionId,
      platform,
      context,
      page,
      status: 'pending',
      createdAt: Date.now(),
    };
    this.sessions.set(sessionId, session);
    void this.pollLoginSession(session);
    return { sessionId, qrcode };
  }

  /**
   * 查询登录会话状态(双重检测：后台轮询 + 主动检查)
   */
  async getLoginStatus(sessionId: string): Promise<{
    status: string;
    message?: string;
    platform: string;
    cookies?: any[];
    accountInfo?: { name?: string; avatar?: string; accountId?: string };
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('登录会话不存在或已过期');
    }

    if (session.status === 'pending') {
      const config = PLATFORM_LOGIN_CONFIGS[session.platform];
      const el = await session.page.$(config.waitForSelector).catch(() => null);
      if (el) {
        await this.finalizeLogin(session);
      }
    }

    const result = {
      status: session.status,
      message: session.message,
      platform: session.platform,
      cookies: session.cookies,
      accountInfo: session.accountInfo,
    };

    if (session.status === 'logged_in' || session.status === 'failed' || session.status === 'cancelled') {
      // 保留 logged_in 会话一小段时间供路由读取 cookies 后由路由调用 finishLogin 清理
      if (session.status !== 'logged_in') {
        await session.context.close().catch(() => {});
        this.sessions.delete(sessionId);
      }
    }

    return result;
  }

  /**
   * 登录成功后清理会话（路由绑定账号到数据库后调用）
   */
  async finishLogin(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    await session.context.close().catch(() => {});
    this.sessions.delete(sessionId);
  }

  /**
   * 取消登录会话
   */
  async cancelLogin(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('登录会话不存在或已过期');
    }
    session.status = 'cancelled';
    session.message = '已取消';
    await session.context.close().catch(() => {});
    this.sessions.delete(sessionId);
  }

  /**
   * 后台轮询登录状态(最多等待 config.loginTimeout 毫秒)
   */
  private async pollLoginSession(session: LoginSession): Promise<void> {
    const config = PLATFORM_LOGIN_CONFIGS[session.platform];
    const maxTries = Math.floor(config.loginTimeout / 2000);
    try {
      for (let i = 0; i < maxTries; i++) {
        if (session.status !== 'pending') return;
        await session.page.waitForTimeout(2000);
        if (session.status !== 'pending') return;
        const el = await session.page.$(config.waitForSelector).catch(() => null);
        if (el) {
          await this.finalizeLogin(session);
          return;
        }
      }
      session.status = 'failed';
      session.message = '登录超时，请重试';
    } catch (error: any) {
      session.status = 'failed';
      session.message = `登录失败: ${error.message}`;
    }
  }

  /**
   * 登录成功收尾：保存 cookies + 提取账号信息
   */
  private async finalizeLogin(session: LoginSession): Promise<void> {
    const config = PLATFORM_LOGIN_CONFIGS[session.platform];
    try {
      const cookies = await session.context.cookies();
      session.cookies = cookies;
      this.saveCookies(config.cookieFileName, cookies);

      // 提取账号昵称/头像
      const accountNameSel = COMMENT_SELECTORS[session.platform]?.accountName || config.waitForSelector;
      let name: string | undefined;
      let avatar: string | undefined;
      try {
        if (accountNameSel) {
          const el = await session.page.$(accountNameSel).catch(() => null);
          if (el) {
            name = (await el.textContent().catch(() => ''))?.trim() || undefined;
            const img = await el.$('img').catch(() => null);
            if (img) avatar = (await img.getAttribute('src').catch(() => undefined)) || undefined;
          }
        }
        if (!name) {
          const avatarEl = await session.page.$('img.creator-avatar, .avatar-wrap img, .avatar img, .user-avatar').catch(() => null);
          if (avatarEl) avatar = (await avatarEl.getAttribute('src').catch(() => undefined)) || undefined;
        }
      } catch {
        // 账号信息提取失败不阻塞登录
      }
      session.accountInfo = { name, avatar, accountId: name };

      session.status = 'logged_in';
      session.message = '登录成功';
    } catch (error: any) {
      session.status = 'failed';
      session.message = `登录失败: ${error.message}`;
    }
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
      await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded' });
      const isLoggedIn = await page.$(config.waitForSelector).catch(() => null);

      if (isLoggedIn) {
        console.log(`[PlaywrightService] ${platform} 已登录(Cookie有效)`);
        await page.close();
        return { success: true, message: '已登录' };
      }

      console.log(`[PlaywrightService] ${platform} 需要登录，等待扫码...`);
      await page.waitForSelector(config.waitForSelector, { timeout: config.loginTimeout });

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
    const selectors = PUBLISH_SELECTORS[platform] || {};

    try {
      const publishUrls: Record<string, string> = {
        douyin: 'https://creator.douyin.com/creator-micro/content/upload',
        kuaishou: 'https://cp.kuaishou.com/article/publish/video',
        xiaohongshu: 'https://creator.xiaohongshu.com/publish/publish',
        weibo: 'https://weibo.com/compose',
        bilibili: 'https://member.bilibili.com/platform/upload/video/frame',
      };

      const targetUrl = config.postUrl || publishUrls[platform] || PLATFORM_LOGIN_CONFIGS[platform].loginUrl;
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 45000 });

      if (config.filePath) {
        const fileInput = await page.$(selectors.upload || 'input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(config.filePath);
          await page.waitForTimeout(8000);
        } else {
          await page.close();
          return { success: false, message: '未找到文件上传控件，发布页面结构可能已变更' };
        }
      }

      const fields: Array<[string | undefined, string | undefined]> = [
        [selectors.title, config.title],
        [selectors.desc, config.description],
        [selectors.tags, config.tags?.join(' ')],
      ];
      for (const [selector, value] of fields) {
        if (!selector || !value) continue;
        const el = await page.$(selector).catch(() => null);
        if (el) await el.fill(value);
      }

      const submitBtn = await page.$(selectors.submit || 'button:has-text("发布"), button:has-text("投稿"), button:has-text("上传")').catch(() => null);
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(5000);
        return { success: true, message: '发布成功', postUrl: page.url() };
      }

      return { success: false, message: '未找到发布按钮，发布页面结构可能已变更' };
    } catch (error: any) {
      return { success: false, message: `发布失败: ${error.message}` };
    } finally {
      await page.close().catch(() => {});
    }
  }

  /**
   * 发布评论（跟评核心能力）
   * 打开目标内容页 → 定位评论区 → 输入话术 → 发布
   */
  async postComment(platform: string, config: CommentPublishConfig): Promise<CommentPublishResult> {
    const loginConfig = PLATFORM_LOGIN_CONFIGS[platform];
    if (!loginConfig) {
      return { success: false, message: `未知平台: ${platform}` };
    }

    await this.init();
    const context = await this.browser!.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    // 优先注入账号 cookies（来自数据库授权），无则回退文件 cookie
    const cookies = config.cookies && config.cookies.length > 0
      ? config.cookies
      : this.loadCookies(loginConfig.cookieFileName);
    if (cookies.length > 0) {
      await context.addCookies(cookies).catch(() => {});
    }

    const page = await context.newPage();
    try {
      await page.goto(config.targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(4000); // 等待评论区渲染

      const selectors = COMMENT_SELECTORS[platform] || COMMENT_SELECTORS.douyin;

      // 定位评论区输入框
      const input = await page.$(selectors.input).catch(() => null);
      if (!input) {
        // 部分平台需先点击"评论"展开输入框
        const openBtn = await page.$('button:has-text("评论"), [data-e2e*="comment"]').catch(() => null);
        if (openBtn) {
          await openBtn.click().catch(() => {});
          await page.waitForTimeout(1500);
        }
      }
      const finalInput = await page.$(selectors.input).catch(() => null);
      if (!finalInput) {
        return { success: false, message: '未找到评论输入框，页面结构可能已变更' };
      }

      await finalInput.click().catch(() => {});
      await page.waitForTimeout(500);
      await finalInput.fill(config.content).catch(() => {});
      await page.waitForTimeout(800);

      // 点击发布
      const submit = await page.$(selectors.submit).catch(() => null);
      if (!submit) {
        await page.keyboard.press('Enter').catch(() => {});
        await page.waitForTimeout(2000);
      } else {
        await submit.click().catch(() => {});
        await page.waitForTimeout(2000);
      }

      // 校验评论是否发布成功（输入框清空 or 评论列表中出现了内容）
      const inputValue = await finalInput.inputValue().catch(() => '');
      const cleared = inputValue.length === 0;
      const inList = await page
        .$(`.comment-item:has-text("${config.content.slice(0, 10)}"), .comment-list :text("${config.content.slice(0, 10)}")`)
        .catch(() => null);

      if (cleared || inList) {
        return { success: true, message: '评论发布成功' };
      }
      return { success: false, message: '评论可能未发布成功，请人工检查' };
    } catch (error: any) {
      return { success: false, message: `评论发布失败: ${error.message}` };
    } finally {
      await page.close().catch(() => {});
      await context.close().catch(() => {});
    }
  }

  /**
   * 数据采集：招聘平台职位采集(BOSS直聘/智联)，其他平台明确拒绝
   */
  async collectData(platform: string, config: AcquisitionConfig): Promise<CollectionResult> {
    if (platform !== 'bosszhipin' && platform !== 'zhilian') {
      return { success: false, message: `平台 ${platform} 暂不支持浏览器数据采集，请使用 API 数据源`, items: [] };
    }
    if (!config.keywords || config.keywords.length === 0) {
      return { success: false, message: 'keywords 不能为空', items: [] };
    }

    const loginResult = await this.ensureLogin(platform);
    if (!loginResult.success) {
      return { success: false, message: `未登录平台 ${platform}: ${loginResult.message}`, items: [] };
    }

    const context = await this.getContext(platform);
    const page = await context.newPage();
    try {
      const items: any[] = [];
      const maxTotal = config.maxResults || 20;
      for (const keyword of config.keywords.slice(0, 3)) {
        const searchUrl = this.buildSearchUrl(platform, keyword);
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);
        const keywordItems = await this.extractListItems(page, platform, maxTotal - items.length);
        items.push(...keywordItems);
        if (items.length >= maxTotal) break;
      }
      if (items.length === 0) {
        return { success: false, message: '未采集到数据，页面结构可能已变更或账号未登录', items: [] };
      }
      return { success: true, message: `采集到 ${items.length} 条职位数据`, items };
    } catch (error: any) {
      return { success: false, message: `采集失败: ${error.message}`, items: [] };
    } finally {
      await page.close().catch(() => {});
    }
  }

  /**
   * 构建搜索URL
   */
  private buildSearchUrl(platform: string, keyword: string): string {
    const encoded = encodeURIComponent(keyword);
    if (platform === 'bosszhipin') {
      return `https://www.zhipin.com/web/geek/job?query=${encoded}&city=101010100`;
    }
    return `https://sou.zhaopin.com/?jl=489&kw=${encoded}`;
  }

  /**
   * 从搜索结果页提取职位卡片
   */
  private async extractListItems(page: Page, platform: string, max: number): Promise<any[]> {
    const selectors = platform === 'bosszhipin'
      ? { item: '.job-card-wrapper', title: '.job-name', company: '.company-name', salary: '.salary' }
      : { item: '.joblist-box__item', title: '.joblist-box__iteminfo__title', company: '.company_name', salary: '.salary' };

    const cards = await page.$$(selectors.item);
    const items: any[] = [];
    for (const card of cards.slice(0, max)) {
      const read = async (sel: string): Promise<string> => {
        const el = await card.$(sel).catch(() => null);
        return (el ? (await el.textContent().catch(() => '') || '') : '').trim();
      };
      items.push({
        source: platform,
        sourceType: 'job',
        title: await read(selectors.title),
        company: await read(selectors.company),
        salary: await read(selectors.salary),
        sourceUrl: page.url(),
      });
    }
    return items;
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
    for (const session of this.sessions.values()) {
      await session.context.close().catch(() => {});
    }
    this.sessions.clear();

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

  // ─── Cookie 管理 ────────────────────────────────

  /**
   * 加载平台Cookie(带过期检测：7天过期 或 所有cookie均失效)
   */
  private loadCookies(fileName: string): any[] {
    const filePath = path.join(this.cookieDir, fileName);
    if (!fs.existsSync(filePath)) return [];

    try {
      const data: CookieData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (!this.cookiesValid(data)) {
        console.log(`[PlaywrightService] ${fileName} 已过期，忽略`);
        return [];
      }
      return data.cookies || [];
    } catch {
      return [];
    }
  }

  /**
   * Cookie 有效性检查：存储时间未超7天 且 至少存在一个未过期cookie
   */
  private cookiesValid(data: CookieData): boolean {
    if (!data.savedAt) return false;
    const savedAt = new Date(data.savedAt).getTime();
    if (Number.isNaN(savedAt)) return false;
    if (Date.now() - savedAt > PlaywrightService.COOKIE_MAX_AGE_MS) return false;
    return (data.cookies || []).some(c => !c.expires || c.expires === -1 || c.expires * 1000 > Date.now());
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
    postComment: (cfg: any) => playwrightService.postComment(platform, cfg),
    startLogin: () => playwrightService.startLogin(platform),
    getLoginStatus: (sessionId: string) => playwrightService.getLoginStatus(sessionId),
    cancelLogin: (sessionId: string) => playwrightService.cancelLogin(sessionId),
    getPage: () => playwrightService.getPage(platform),
    close: () => playwrightService.closeContext(platform),
  };
}

/**
 * 平台配置导出(兼容旧代码)
 */
export const PLATFORM_CONFIGS = PLATFORM_LOGIN_CONFIGS;
