/**
 * 反爬虫/反检测增强模块
 * 提供浏览器指纹伪装、人类行为模拟、代理IP管理、Cookie持久化等能力
 * 
 * 核心策略：
 * 1. 浏览器指纹伪装 - 隐藏自动化特征，模拟真实浏览器指纹
 * 2. 人类行为模拟 - 鼠标移动、滚动、打字等行为符合真人特征
 * 3. 代理IP轮换 - 支持代理池，避免单IP被限流
 * 4. Cookie/Session持久化 - 登录状态不丢失，减少重复登录
 * 5. 请求频率控制 - 自适应请求间隔，避免触发限流
 */

import { Browser, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// ============ 配置 ============

const STEALTH_CONFIG = {
  // Cookie持久化目录
  cookieDir: path.join(process.cwd(), 'data', 'browser-cookies'),
  // 代理IP配置
  proxy: {
    enabled: false,
    pool: [] as string[],  // 代理URL列表，格式: http://user:pass@host:port
    currentIndex: 0,
    rotationStrategy: 'round-robin' as 'round-robin' | 'random' | 'least-used',
    usageCount: new Map<string, number>(),
  },
  // 请求频率控制
  rateLimit: {
    minInterval: 2000,     // 最小请求间隔(ms)
    maxInterval: 8000,     // 最大请求间隔(ms)
    lastRequestTime: 0,    // 上次请求时间
    adaptiveMode: true,    // 自适应模式（根据响应调整间隔）
    currentInterval: 3000, // 当前间隔
  },
  // 指纹配置
  fingerprint: {
    webglVendor: 'Google Inc. (NVIDIA)',
    webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)',
    platform: 'Win32',
    vendor: 'Google Inc.',
    maxTouchPoints: 0,
    hardwareConcurrency: 8,
    deviceMemory: 8,
  },
};

// ============ 浏览器指纹伪装 ============

/**
 * 完整的反检测注入脚本
 * 覆盖所有常见自动化检测点
 */
export const STEALTH_INJECTION_SCRIPT = `
// === 1. 隐藏 WebDriver 特征 ===
Object.defineProperty(navigator, 'webdriver', {
  get: () => false,
  configurable: true,
});

// 删除 chrome.csi 和 chrome.loadTimes（仅自动化浏览器有）
if (window.chrome) {
  delete window.chrome.csi;
  delete window.chrome.loadTimes;
}

// 确保 chrome.runtime 存在（正常浏览器有，自动化浏览器可能没有）
if (!window.chrome) {
  window.chrome = {};
}
if (!window.chrome.runtime) {
  window.chrome.runtime = {
    connect: function() {},
    sendMessage: function() {},
  };
}

// === 2. 伪装 Navigator 属性 ===
Object.defineProperty(navigator, 'plugins', {
  get: () => {
    const plugins = [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
      { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
    ];
    plugins.length = 3;
    return plugins;
  },
  configurable: true,
});

Object.defineProperty(navigator, 'languages', {
  get: () => ['zh-CN', 'zh', 'en-US', 'en'],
  configurable: true,
});

Object.defineProperty(navigator, 'platform', {
  get: () => 'Win32',
  configurable: true,
});

Object.defineProperty(navigator, 'maxTouchPoints', {
  get: () => 0,
  configurable: true,
});

Object.defineProperty(navigator, 'hardwareConcurrency', {
  get: () => 8,
  configurable: true,
});

Object.defineProperty(navigator, 'deviceMemory', {
  get: () => 8,
  configurable: true,
});

Object.defineProperty(navigator, 'vendor', {
  get: () => 'Google Inc.',
  configurable: true,
});

// === 3. 修复 iframe contentWindow 检测 ===
// 自动化浏览器的 iframe contentWindow 检测不一致
const originalContentWindow = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow');
Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
  get: function() {
    const result = originalContentWindow?.get?.call(this);
    if (result) {
      try {
        // 递归隐藏 webdriver
        Object.defineProperty(result.navigator, 'webdriver', {
          get: () => false,
          configurable: true,
        });
      } catch (e) {
        // 跨域 iframe 无法修改
      }
    }
    return result;
  },
  configurable: true,
});

// === 4. WebGL 指纹伪装 ===
const getParameter = WebGLRenderingContext.prototype.getParameter;
WebGLRenderingContext.prototype.getParameter = function(param) {
  // UNMASKED_VENDOR_WEBGL
  if (param === 0x9245) return 'Google Inc. (NVIDIA)';
  // UNMASKED_RENDERER_WEBGL
  if (param === 0x9246) return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)';
  return getParameter.call(this, param);
};

// WebGL2 同样处理
if (typeof WebGL2RenderingContext !== 'undefined') {
  const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
  WebGL2RenderingContext.prototype.getParameter = function(param) {
    if (param === 0x9245) return 'Google Inc. (NVIDIA)';
    if (param === 0x9246) return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)';
    return getParameter2.call(this, param);
  };
}

// === 5. Canvas 指纹噪声 ===
const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
HTMLCanvasElement.prototype.toDataURL = function(type) {
  // 添加微小噪声，使每次指纹不同但看起来正常
  const ctx = this.getContext('2d');
  if (ctx) {
    const imageData = ctx.getImageData(0, 0, 1, 1);
    if (imageData.data[3] > 0) {
      imageData.data[0] += Math.random() < 0.5 ? 1 : -1;
      ctx.putImageData(imageData, 0, 0);
    }
  }
  return originalToDataURL.apply(this, arguments as any);
};

// === 6. AudioContext 指纹噪声 ===
const originalGetChannelData = AudioBuffer.prototype.getChannelData;
AudioBuffer.prototype.getChannelData = function(channel) {
  const data = originalGetChannelData.call(this, channel);
  if (data.length > 0) {
    // 添加微小噪声
    data[0] += Math.random() * 0.0000001;
  }
  return data;
};

// === 7. 隐藏 Automation 相关属性 ===
// 删除 __nightmare, _phantom, callPhantom 等
delete (window as any).__nightmare;
delete (window as any)._phantom;
delete (window as any).__phantomas;
delete (window as any).callPhantom;
delete (window as any)._selenium;
delete (window as any).__selenium_unwrapped;
delete (window as any).__webdriver_evaluate;
delete (window as any).__driver_evaluate;
delete (window as any).__webdriver_unwrapped;
delete (window as any).__driver_unwrapped;
delete (window as any).__fxdriver_evaluate;
delete (window as any).__fxdriver_unwrapped;

// === 8. 修复 Permissions API ===
const originalQuery = window.navigator.permissions?.query;
if (originalQuery) {
  window.navigator.permissions.query = function(parameters) {
    if (parameters.name === 'notifications') {
      return Promise.resolve({ state: Notification.permission } as PermissionStatus);
    }
    return originalQuery.call(this, parameters);
  };
}

// === 9. 隐藏 Headless 特征 ===
// Headless Chrome 的 user-agent 包含 "HeadlessChrome"
Object.defineProperty(navigator, 'userAgent', {
  get: () => {
    const ua = navigator.userAgent;
    return ua.replace('HeadlessChrome', 'Chrome');
  },
  configurable: true,
});

// === 10. 模拟真实的 connection 信息 ===
if (!navigator.connection) {
  Object.defineProperty(navigator, 'connection', {
    get: () => ({
      effectiveType: '4g',
      rtt: 100,
      downlink: 10,
      saveData: false,
      onchange: null,
      addEventListener: function() {},
      removeEventListener: function() {},
    }),
    configurable: true,
  });
}

console.log('[Stealth] Anti-detection scripts injected successfully');
`;

/**
 * 创建带有反检测配置的浏览器上下文
 */
export async function createStealthContext(
  browser: Browser,
  options?: {
    userId?: string;
    proxyUrl?: string;
    viewport?: { width: number; height: number };
    locale?: string;
    timezoneId?: string;
  }
): Promise<BrowserContext> {
  const proxyUrl = options?.proxyUrl || getNextProxy();
  
  const contextOptions: any = {
    viewport: options?.viewport || { width: 1920, height: 1080 },
    userAgent: getRandomUserAgent(),
    locale: options?.locale || 'zh-CN',
    timezoneId: options?.timezoneId || 'Asia/Shanghai',
    ignoreHTTPSErrors: true,
    permissions: ['geolocation'],
    geolocation: { latitude: 39.9042, longitude: 116.4074 }, // 北京坐标
    colorScheme: 'light',
    deviceScaleFactor: 1,
    hasTouch: false,
    javaScriptEnabled: true,
    bypassCSP: true,
    extraHTTPHeaders: {
      'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
  };

  // 代理配置
  if (proxyUrl) {
    try {
      const proxyUrlObj = new URL(proxyUrl);
      contextOptions.proxy = {
        server: `${proxyUrlObj.protocol}//${proxyUrlObj.host}`,
        username: proxyUrlObj.username || undefined,
        password: proxyUrlObj.password || undefined,
      };
    } catch (e) {
      console.warn('[Stealth] Invalid proxy URL:', proxyUrl);
    }
  }

  const context = await browser.newContext(contextOptions);

  // 注入反检测脚本（在每个页面创建前执行）
  await context.addInitScript(STEALTH_INJECTION_SCRIPT);

  // 如果有持久化的 Cookie，恢复
  if (options?.userId) {
    await restoreCookies(context, options.userId);
  }

  return context;
}

// ============ User-Agent 池 ============

const USER_AGENT_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
];

/**
 * 获取随机 User-Agent
 */
export function getRandomUserAgent(): string {
  return USER_AGENT_POOL[Math.floor(Math.random() * USER_AGENT_POOL.length)];
}

// ============ 人类行为模拟 ============

/**
 * 模拟人类鼠标移动到元素
 * 不是直接跳转，而是沿着贝塞尔曲线移动
 */
export async function humanMouseMove(page: Page, targetX: number, targetY: number): Promise<void> {
  const viewport = page.viewportSize();
  if (!viewport) return;

  // 随机起点
  const startX = Math.floor(Math.random() * viewport.width * 0.3);
  const startY = Math.floor(Math.random() * viewport.height * 0.3);

  const steps = 15 + Math.floor(Math.random() * 15); // 15-30步
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // 贝塞尔曲线 + 微小随机偏移
    const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad
    const x = startX + (targetX - startX) * easeT + (Math.random() - 0.5) * 3;
    const y = startY + (targetY - startY) * easeT + (Math.random() - 0.5) * 3;
    await page.mouse.move(x, y);
    await sleep(5 + Math.random() * 15);
  }
}

/**
 * 模拟人类点击元素（先移动到元素，再点击）
 */
export async function humanClick(page: Page, selector: string): Promise<boolean> {
  try {
    const element = await page.$(selector);
    if (!element) return false;

    const box = await element.boundingBox();
    if (!box) return false;

    // 移动到元素中心（加微小偏移）
    const targetX = box.x + box.width / 2 + (Math.random() - 0.5) * box.width * 0.3;
    const targetY = box.y + box.height / 2 + (Math.random() - 0.5) * box.height * 0.3;

    await humanMouseMove(page, targetX, targetY);
    await sleep(100 + Math.random() * 200); // 停顿一下

    await page.mouse.click(targetX, targetY, {
      delay: 50 + Math.random() * 100, // 按下和释放之间的延迟
    });

    return true;
  } catch (e) {
    console.warn('[Stealth] Human click failed:', (e as Error).message);
    return false;
  }
}

/**
 * 模拟人类滚动页面
 */
export async function humanScroll(page: Page, distance: number = 300): Promise<void> {
  const steps = 5 + Math.floor(Math.random() * 5);
  const stepDistance = distance / steps;

  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, stepDistance + (Math.random() - 0.5) * 20);
    await sleep(50 + Math.random() * 150);
  }
  // 滚动后停顿
  await sleep(300 + Math.random() * 700);
}

/**
 * 模拟人类输入文本（增强版 - 更真实的打字节奏）
 */
export async function humanType(page: Page, selector: string, text: string): Promise<void> {
  const element = await page.$(selector);
  if (!element) return;

  // 先点击输入框
  await humanClick(page, selector);
  await sleep(200 + Math.random() * 300);

  // 清空现有内容
  await page.keyboard.press('Control+a');
  await sleep(50 + Math.random() * 50);
  await page.keyboard.press('Backspace');
  await sleep(100 + Math.random() * 100);

  // 逐字符输入
  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // 中文字符通常一次性输入（通过输入法）
    // 英文字符逐个键入
    if (/[\u4e00-\u9fff]/.test(char)) {
      // 中文：直接 fill 一次（模拟输入法确认）
      await page.keyboard.type(char, { delay: 0 });
      await sleep(80 + Math.random() * 200);
    } else if (char === ' ') {
      await page.keyboard.type(' ', { delay: 30 });
      await sleep(100 + Math.random() * 200);
    } else if (char === '\n') {
      await page.keyboard.press('Enter');
      await sleep(200 + Math.random() * 300);
    } else {
      // 英文字符：随机打字速度
      const typingSpeed = 40 + Math.random() * 80; // 40-120ms，接近真人打字速度
      await page.keyboard.type(char, { delay: typingSpeed });

      // 偶尔停顿（模拟思考）
      if (Math.random() < 0.05) {
        await sleep(300 + Math.random() * 700);
      }
    }
  }
}

/**
 * 模拟人类浏览页面的行为
 * 随机滚动、停顿、偶尔移动鼠标
 */
export async function humanBrowse(page: Page, durationMs: number = 5000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < durationMs) {
    const action = Math.random();

    if (action < 0.4) {
      // 滚动页面
      const scrollDistance = 100 + Math.random() * 400;
      const direction = Math.random() < 0.8 ? 1 : -1; // 80%向下，20%向上
      await humanScroll(page, scrollDistance * direction);
    } else if (action < 0.6) {
      // 随机移动鼠标
      const viewport = page.viewportSize();
      if (viewport) {
        const x = Math.random() * viewport.width;
        const y = Math.random() * viewport.height;
        await humanMouseMove(page, x, y);
      }
    } else {
      // 停顿（模拟阅读）
      await sleep(500 + Math.random() * 2000);
    }

    await sleep(200 + Math.random() * 500);
  }
}

/**
 * 随机延迟（考虑请求频率控制）
 */
export async function adaptiveDelay(): Promise<void> {
  const config = STEALTH_CONFIG.rateLimit;
  const now = Date.now();
  const elapsed = now - config.lastRequestTime;
  const required = config.currentInterval;

  if (elapsed < required) {
    const waitTime = required - elapsed + Math.random() * 1000;
    await sleep(waitTime);
  }

  config.lastRequestTime = Date.now();
}

/**
 * 根据响应调整请求间隔
 * 如果被限流，增加间隔；如果正常，逐渐减少
 */
export function adjustRateLimit(wasRateLimited: boolean): void {
  const config = STEALTH_CONFIG.rateLimit;
  if (!config.adaptiveMode) return;

  if (wasRateLimited) {
    // 被限流，翻倍间隔（最多60秒）
    config.currentInterval = Math.min(config.currentInterval * 2, 60000);
  } else {
    // 正常，缓慢减少间隔（最少2秒）
    config.currentInterval = Math.max(config.currentInterval * 0.95, config.minInterval);
  }
}

// ============ 代理IP管理 ============

/**
 * 配置代理池
 */
export function configureProxyPool(proxies: string[], strategy: 'round-robin' | 'random' | 'least-used' = 'round-robin'): void {
  STEALTH_CONFIG.proxy.enabled = proxies.length > 0;
  STEALTH_CONFIG.proxy.pool = proxies;
  STEALTH_CONFIG.proxy.rotationStrategy = strategy;
  STEALTH_CONFIG.proxy.usageCount.clear();
  proxies.forEach(p => STEALTH_CONFIG.proxy.usageCount.set(p, 0));
}

/**
 * 获取下一个代理
 */
export function getNextProxy(): string | null {
  const { proxy } = STEALTH_CONFIG;
  if (!proxy.enabled || proxy.pool.length === 0) return null;

  switch (proxy.rotationStrategy) {
    case 'round-robin': {
      const proxyUrl = proxy.pool[proxy.currentIndex % proxy.pool.length];
      proxy.currentIndex++;
      const count = proxy.usageCount.get(proxyUrl) || 0;
      proxy.usageCount.set(proxyUrl, count + 1);
      return proxyUrl;
    }
    case 'random': {
      const proxyUrl = proxy.pool[Math.floor(Math.random() * proxy.pool.length)];
      const count = proxy.usageCount.get(proxyUrl) || 0;
      proxy.usageCount.set(proxyUrl, count + 1);
      return proxyUrl;
    }
    case 'least-used': {
      let minUsage = Infinity;
      let selectedProxy = proxy.pool[0];
      for (const p of proxy.pool) {
        const usage = proxy.usageCount.get(p) || 0;
        if (usage < minUsage) {
          minUsage = usage;
          selectedProxy = p;
        }
      }
      const count = proxy.usageCount.get(selectedProxy) || 0;
      proxy.usageCount.set(selectedProxy, count + 1);
      return selectedProxy;
    }
    default:
      return null;
  }
}

/**
 * 标记代理为失败（从池中移除）
 */
export function markProxyFailed(proxyUrl: string): void {
  const index = STEALTH_CONFIG.proxy.pool.indexOf(proxyUrl);
  if (index !== -1) {
    STEALTH_CONFIG.proxy.pool.splice(index, 1);
    STEALTH_CONFIG.proxy.usageCount.delete(proxyUrl);
    if (STEALTH_CONFIG.proxy.pool.length === 0) {
      STEALTH_CONFIG.proxy.enabled = false;
    }
  }
}

// ============ Cookie/Session 持久化 ============

/**
 * 保存浏览器 Cookie 到磁盘
 */
export async function saveCookies(context: BrowserContext, userId: string, platform: string): Promise<void> {
  try {
    const dir = path.join(STEALTH_CONFIG.cookieDir, userId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const cookies = await context.cookies();
    const filePath = path.join(dir, `${platform}.json`);
    fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2), 'utf-8');
    console.log(`[Stealth] Cookies saved for ${userId}/${platform}, count: ${cookies.length}`);
  } catch (e) {
    console.warn('[Stealth] Failed to save cookies:', (e as Error).message);
  }
}

/**
 * 恢复浏览器 Cookie
 */
export async function restoreCookies(context: BrowserContext, userId: string, platform?: string): Promise<boolean> {
  try {
    const dir = path.join(STEALTH_CONFIG.cookieDir, userId);
    if (!fs.existsSync(dir)) return false;

    if (platform) {
      // 恢复指定平台的 Cookie
      const filePath = path.join(dir, `${platform}.json`);
      if (!fs.existsSync(filePath)) return false;

      const cookies = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      await context.addCookies(cookies);
      console.log(`[Stealth] Cookies restored for ${userId}/${platform}, count: ${cookies.length}`);
      return true;
    } else {
      // 恢复所有平台的 Cookie
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const cookies = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
        await context.addCookies(cookies);
      }
      if (files.length > 0) {
        console.log(`[Stealth] All cookies restored for ${userId}, platforms: ${files.length}`);
      }
      return files.length > 0;
    }
  } catch (e) {
    console.warn('[Stealth] Failed to restore cookies:', (e as Error).message);
    return false;
  }
}

/**
 * 删除指定平台的 Cookie
 */
export function clearCookies(userId: string, platform: string): boolean {
  try {
    const filePath = path.join(STEALTH_CONFIG.cookieDir, userId, `${platform}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

// ============ 反检测浏览器启动参数 ============

/**
 * 获取反检测的浏览器启动参数
 */
export function getStealthLaunchArgs(): string[] {
  return [
    // 禁用自动化特征
    '--disable-blink-features=AutomationControlled',
    // 禁用各种检测
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    // 安全相关
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    '--allow-running-insecure-content',
    '--ignore-certificate-errors',
    // 防止被检测
    '--disable-infobars',
    '--disable-extensions',
    '--no-first-run',
    '--no-zygote',
    // 性能优化
    '--disable-gpu',
    '--disable-software-rasterizer',
    // 语言和时区
    '--lang=zh-CN',
    // 窗口大小
    '--window-size=1920,1080',
    // 禁用各种无用功能
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-component-extensions-with-background-pages',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-popup-blocking',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-sync',
    '--metrics-recording-only',
    '--no-default-browser-check',
  ];
}

// ============ 工具函数 ============

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取反检测配置状态
 */
export function getStealthStatus() {
  return {
    proxy: {
      enabled: STEALTH_CONFIG.proxy.enabled,
      poolSize: STEALTH_CONFIG.proxy.pool.length,
      strategy: STEALTH_CONFIG.proxy.rotationStrategy,
    },
    rateLimit: {
      currentInterval: STEALTH_CONFIG.rateLimit.currentInterval,
      adaptiveMode: STEALTH_CONFIG.rateLimit.adaptiveMode,
    },
    userAgentPoolSize: USER_AGENT_POOL.length,
    cookieDir: STEALTH_CONFIG.cookieDir,
  };
}
