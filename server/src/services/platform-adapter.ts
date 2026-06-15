/**
 * 平台登录适配器
 * 每个平台的扫码登录实现
 */

import { Page, BrowserContext } from 'playwright';

export interface PlatformAdapter {
  // 平台标识
  platform: string;
  platformName: string;
<<<<<<< HEAD
=======
  name: string; // 兼容性别名
  
  // 能力
  capabilities: {
    canPublish: boolean;
    canReply: boolean;
    canFetchStats: boolean;
  };
>>>>>>> 962968886be726cd434c792933b5515366d34518
  
  // 登录相关
  getLoginUrl(): string;
  getQrContainerSelector(): string;
  getLoginSuccessSelectors(): string[];
  
  // 提取账号信息
  extractAccountInfo(page: Page): Promise<{
    id?: string;
    name?: string;
    avatar?: string;
    fans?: number;
    verified?: boolean;
  }>;
  
  // 获取额外信息（如粉丝数等）
  fetchExtraInfo?(page: Page): Promise<Record<string, any>>;
}

// 抖音创作者平台适配器
export const DouyinAdapter: PlatformAdapter = {
  platform: 'douyin',
  platformName: '抖音',
<<<<<<< HEAD
=======
  name: '抖音',
  capabilities: { canPublish: true, canReply: true, canFetchStats: true },
>>>>>>> 962968886be726cd434c792933b5515366d34518
  
  getLoginUrl() {
    return 'https://creator.douyin.com/creator-micro/home';
  },
  
  getQrContainerSelector() {
    return '.qrcode-img-container, .login-qrcode';
  },
  
  getLoginSuccessSelectors() {
    return [
      '.creator-left-menu',
      '.left-menu',
      '[class*="nav"]',
      '.user-info',
      '.user-avatar'
    ];
  },
  
  async extractAccountInfo(page: Page) {
    const info: any = {};
    
    try {
      // 等待页面加载完成
      await page.waitForTimeout(2000);
      
      // 尝试获取用户名
      const nameSelectors = [
        '.user-nickname',
        '.nick-name',
        '[class*="nickname"]',
        '[class*="name"]'
      ];
      
      for (const selector of nameSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            info.name = await el.textContent();
            break;
          }
        } catch (e) {}
      }
      
      // 尝试获取头像
      const avatarSelectors = [
        'img.avatar',
        '[class*="avatar"] img',
        '[class*="user"] img'
      ];
      
      for (const selector of avatarSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            const src = await el.getAttribute('src');
            if (src && !src.includes('data:')) {
              info.avatar = src;
              break;
            }
          }
        } catch (e) {}
      }
      
      // 尝试获取用户ID
      const url = page.url();
      const match = url.match(/\/user\/(\w+)/);
      if (match) {
        info.id = match[1];
      }
      
    } catch (e) {
      console.error('提取抖音账号信息失败:', e);
    }
    
    return info;
  },
  
  async fetchExtraInfo(page: Page) {
    const extra: any = {};
    
    try {
      // 获取粉丝数
      const fansSelectors = [
        '[class*="fans"]',
        '[class*="follower"]',
        '[class*="subscriber"]'
      ];
      
      for (const selector of fansSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            const text = await el.textContent();
            if (text) {
              extra.fans = parseFansCount(text);
            }
            break;
          }
        } catch (e) {}
      }
      
      // 获取作品数
      const worksSelectors = [
        '[class*="works"]',
        '[class*="video"]',
        '[class*="post"]'
      ];
      
      for (const selector of worksSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            const text = await el.textContent();
            if (text) {
              extra.works = parseNumber(text);
            }
            break;
          }
        } catch (e) {}
      }
      
    } catch (e) {
      console.error('获取抖音额外信息失败:', e);
    }
    
    return extra;
  }
};

// 快手创作者平台适配器
export const KuaishouAdapter: PlatformAdapter = {
  platform: 'kuaishou',
  platformName: '快手',
<<<<<<< HEAD
=======
  name: '快手',
  capabilities: { canPublish: true, canReply: true, canFetchStats: true },
>>>>>>> 962968886be726cd434c792933b5515366d34518
  
  getLoginUrl() {
    return 'https://creator.kuaishou.com/profile';
  },
  
  getQrContainerSelector() {
    return '.qrcode-img, .qr-code';
  },
  
  getLoginSuccessSelectors() {
    return [
      '.profile-header',
      '.user-profile',
      '.user-info',
      '[class*="profile"]'
    ];
  },
  
  async extractAccountInfo(page: Page) {
    const info: any = {};
    
    try {
      await page.waitForTimeout(2000);
      
      // 获取用户名
      const nameSelectors = [
        '.user-name',
        '.profile-name',
        '[class*="name"]'
      ];
      
      for (const selector of nameSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            info.name = await el.textContent();
            break;
          }
        } catch (e) {}
      }
      
      // 获取头像
      const avatarSelectors = [
        'img.avatar',
        '[class*="avatar"] img'
      ];
      
      for (const selector of avatarSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            info.avatar = await el.getAttribute('src');
            break;
          }
        } catch (e) {}
      }
      
    } catch (e) {
      console.error('提取快手账号信息失败:', e);
    }
    
    return info;
  }
};

// 小红书创作者平台适配器
export const XiaohongshuAdapter: PlatformAdapter = {
  platform: 'xiaohongshu',
  platformName: '小红书',
<<<<<<< HEAD
=======
  name: '小红书',
  capabilities: { canPublish: true, canReply: true, canFetchStats: true },
>>>>>>> 962968886be726cd434c792933b5515366d34518
  
  getLoginUrl() {
    return 'https://creator.xiaohongshu.com/creator/post';
  },
  
  getQrContainerSelector() {
    return '.login-qrcode, .qrcode-img';
  },
  
  getLoginSuccessSelectors() {
    return [
      '.user-info',
      '.creator-header',
      '[class*="header"]',
      '[class*="user"]'
    ];
  },
  
  async extractAccountInfo(page: Page) {
    const info: any = {};
    
    try {
      await page.waitForTimeout(2000);
      
      // 获取用户名
      const nameSelectors = [
        '.user-name',
        '.nickname',
        '[class*="name"]'
      ];
      
      for (const selector of nameSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            info.name = await el.textContent();
            break;
          }
        } catch (e) {}
      }
      
      // 获取头像
      for (const selector of ['img.avatar', '[class*="avatar"] img']) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            info.avatar = await el.getAttribute('src');
            break;
          }
        } catch (e) {}
      }
      
    } catch (e) {
      console.error('提取小红书账号信息失败:', e);
    }
    
    return info;
  }
};

// 微博适配器
export const WeiboAdapter: PlatformAdapter = {
  platform: 'weibo',
  platformName: '微博',
<<<<<<< HEAD
=======
  name: '微博',
  capabilities: { canPublish: true, canReply: true, canFetchStats: true },
>>>>>>> 962968886be726cd434c792933b5515366d34518
  
  getLoginUrl() {
    return 'https://weibo.com/';
  },
  
  getQrContainerSelector() {
    return '.qrcode';
  },
  
  getLoginSuccessSelectors() {
    return [
      '.WB_frame',
      '[class*="user"]',
      '[class*="avatar"]'
    ];
  },
  
  async extractAccountInfo(page: Page) {
    const info: any = {};
    
    try {
      await page.waitForTimeout(2000);
      
      // 微博用户信息在脚本标签中
      const html = await page.content();
      const match = html.match(/"nick_name"\s*:\s*"([^"]+)"/);
      if (match) {
        info.name = match[1];
      }
      
      // 获取头像
      const avatarMatch = html.match(/"avatar"\s*:\s*"([^"]+)"/);
      if (avatarMatch) {
        info.avatar = avatarMatch[1];
      }
      
    } catch (e) {
      console.error('提取微博账号信息失败:', e);
    }
    
    return info;
  }
};

// BOSS直聘适配器
export const BossAdapter: PlatformAdapter = {
  platform: 'boss',
  platformName: 'BOSS直聘',
<<<<<<< HEAD
=======
  name: 'BOSS直聘',
  capabilities: { canPublish: true, canReply: true, canFetchStats: true },
>>>>>>> 962968886be726cd434c792933b5515366d34518
  
  getLoginUrl() {
    return 'https://www.zhipin.com/web/geek/index';
  },
  
  getQrContainerSelector() {
    return '.qrcode-img, .qrcode';
  },
  
  getLoginSuccessSelectors() {
    return [
      '.boss-header',
      '.user-info',
      '[class*="header"]'
    ];
  },
  
  async extractAccountInfo(page: Page) {
    const info: any = {};
    
    try {
      await page.waitForTimeout(2000);
      
      const nameSelectors = [
        '.user-name',
        '.nick-name',
        '[class*="name"]'
      ];
      
      for (const selector of nameSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            info.name = await el.textContent();
            break;
          }
        } catch (e) {}
      }
      
    } catch (e) {
      console.error('提取BOSS账号信息失败:', e);
    }
    
    return info;
  }
};

<<<<<<< HEAD
// 平台适配器注册表
export const platformAdapters: Record<string, PlatformAdapter> = {
  douyin: DouyinAdapter,
  kuaishou: KuaishouAdapter,
  xiaohongshu: XiaohongshuAdapter,
  weibo: WeiboAdapter,
  boss: BossAdapter
};

// 获取平台适配器
export function getAdapter(platform: string): PlatformAdapter | undefined {
  return platformAdapters[platform];
}

=======
>>>>>>> 962968886be726cd434c792933b5515366d34518
// 辅助函数：解析粉丝数
function parseFansCount(text: string): number {
  const cleaned = text.replace(/[,，\s]/g, '');
  const match = cleaned.match(/(\d+\.?\d*)/);
  if (!match) return 0;
  
  let num = parseFloat(match[1]);
  if (cleaned.includes('万')) {
    num *= 10000;
  } else if (cleaned.includes('亿')) {
    num *= 100000000;
  }
  
  return Math.floor(num);
}

// 辅助函数：解析数字
function parseNumber(text: string): number {
  const match = text.replace(/[,，\s]/g, '').match(/(\d+\.?\d*)/);
  return match ? parseInt(match[1]) : 0;
}
<<<<<<< HEAD
=======

// 视频号适配器
export const ChannelsAdapter: PlatformAdapter = {
  platform: 'channels',
  platformName: '视频号',
  name: '视频号',
  capabilities: { canPublish: true, canReply: true, canFetchStats: true },
  
  getLoginUrl() {
    return 'https://channels.weixin.qq.com/login';
  },
  
  getQrContainerSelector() {
    return '.qrcode-img, .login-qrcode';
  },
  
  getLoginSuccessSelectors() {
    return [
      '.user-info',
      '[class*="header"]',
      '[class*="user"]'
    ];
  },
  
  async extractAccountInfo(page: Page) {
    const info: any = {};
    try {
      await page.waitForTimeout(2000);
      const nameSelectors = ['.nickname', '[class*="name"]'];
      for (const selector of nameSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            info.name = await el.textContent();
            break;
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error('提取视频号账号信息失败:', e);
    }
    return info;
  }
};

// 知乎适配器
export const ZhihuAdapter: PlatformAdapter = {
  platform: 'zhihu',
  platformName: '知乎',
  name: '知乎',
  capabilities: { canPublish: true, canReply: true, canFetchStats: true },
  
  getLoginUrl() {
    return 'https://www.zhihu.com/';
  },
  
  getQrContainerSelector() {
    return '.qrcode, .SignContainer-qrcode';
  },
  
  getLoginSuccessSelectors() {
    return [
      '.AppHeader',
      '[class*="user"]'
    ];
  },
  
  async extractAccountInfo(page: Page) {
    const info: any = {};
    try {
      await page.waitForTimeout(2000);
      const nameSelectors = ['.AppHeader-profile-name', '[class*="name"]'];
      for (const selector of nameSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            info.name = await el.textContent();
            break;
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error('提取知乎账号信息失败:', e);
    }
    return info;
  }
};

// 百家号适配器
export const BaijiahaoAdapter: PlatformAdapter = {
  platform: 'baijiahao',
  platformName: '百家号',
  name: '百家号',
  capabilities: { canPublish: true, canReply: true, canFetchStats: true },
  
  getLoginUrl() {
    return 'https://baijiahao.baidu.com/';
  },
  
  getQrContainerSelector() {
    return '.qrcode, .login-qrcode';
  },
  
  getLoginSuccessSelectors() {
    return [
      '.user-info',
      '[class*="header"]'
    ];
  },
  
  async extractAccountInfo(page: Page) {
    const info: any = {};
    try {
      await page.waitForTimeout(2000);
      const nameSelectors = ['.user-name', '[class*="name"]'];
      for (const selector of nameSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            info.name = await el.textContent();
            break;
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error('提取百家号账号信息失败:', e);
    }
    return info;
  }
};

// 今日头条适配器
export const ToutiaoAdapter: PlatformAdapter = {
  platform: 'toutiao',
  platformName: '今日头条',
  name: '今日头条',
  capabilities: { canPublish: true, canReply: true, canFetchStats: true },
  
  getLoginUrl() {
    return 'https://mp.toutiao.com/';
  },
  
  getQrContainerSelector() {
    return '.qrcode, .login-qrcode';
  },
  
  getLoginSuccessSelectors() {
    return [
      '.header-user',
      '[class*="user"]'
    ];
  },
  
  async extractAccountInfo(page: Page) {
    const info: any = {};
    try {
      await page.waitForTimeout(2000);
      const nameSelectors = ['.user-name', '[class*="name"]'];
      for (const selector of nameSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            info.name = await el.textContent();
            break;
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error('提取今日头条账号信息失败:', e);
    }
    return info;
  }
};

// 前程无忧适配器
export const LiepinAdapter: PlatformAdapter = {
  platform: 'liepin',
  platformName: '前程无忧',
  name: '前程无忧',
  capabilities: { canPublish: true, canReply: true, canFetchStats: true },
  
  getLoginUrl() {
    return 'https://www.liepin.com/';
  },
  
  getQrContainerSelector() {
    return '.qrcode, .login-qrcode';
  },
  
  getLoginSuccessSelectors() {
    return [
      '.user-info',
      '[class*="header"]'
    ];
  },
  
  async extractAccountInfo(page: Page) {
    const info: any = {};
    try {
      await page.waitForTimeout(2000);
      const nameSelectors = ['.user-name', '[class*="name"]'];
      for (const selector of nameSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            info.name = await el.textContent();
            break;
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error('提取前程无忧账号信息失败:', e);
    }
    return info;
  }
};

// 智联招聘适配器
export const ZhilianAdapter: PlatformAdapter = {
  platform: 'zhilian',
  platformName: '智联招聘',
  name: '智联招聘',
  capabilities: { canPublish: true, canReply: true, canFetchStats: true },
  
  getLoginUrl() {
    return 'https://www.zhaopin.com/';
  },
  
  getQrContainerSelector() {
    return '.qrcode, .login-qrcode';
  },
  
  getLoginSuccessSelectors() {
    return [
      '.user-info',
      '[class*="header"]'
    ];
  },
  
  async extractAccountInfo(page: Page) {
    const info: any = {};
    try {
      await page.waitForTimeout(2000);
      const nameSelectors = ['.user-name', '[class*="name"]'];
      for (const selector of nameSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            info.name = await el.textContent();
            break;
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error('提取智联招聘账号信息失败:', e);
    }
    return info;
  }
};

// 平台适配器注册表
export const platformAdapters: Record<string, PlatformAdapter> = {
  douyin: DouyinAdapter,
  kuaishou: KuaishouAdapter,
  xiaohongshu: XiaohongshuAdapter,
  weibo: WeiboAdapter,
  boss: BossAdapter,
  channels: ChannelsAdapter,
  zhihu: ZhihuAdapter,
  baijiahao: BaijiahaoAdapter,
  toutiao: ToutiaoAdapter,
  liepin: LiepinAdapter,
  zhilian: ZhilianAdapter
};

// 获取平台适配器
export function getAdapter(platform: string): PlatformAdapter | undefined {
  return platformAdapters[platform];
}
>>>>>>> 962968886be726cd434c792933b5515366d34518
