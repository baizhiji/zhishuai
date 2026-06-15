/**
 * 扫码授权服务
 * 核心流程：
 * 1. 生成授权页面 URL
 * 2. 检测登录状态
 * 3. 提取凭证
 */

import { chromium, Browser, Page } from 'playwright';
import * as qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

// 会话存储
const authSessions: Map<string, AuthSession> = new Map();

export interface AuthSession {
  id: string;
  platform: string;
  status: 'pending' | 'scanning' | 'authorized' | 'expired' | 'failed';
  cookies?: any[];
  accountInfo?: {
    id?: string;
    name?: string;
    avatar?: string;
  };
  error?: string;
  createdAt: Date;
  expiresAt: Date;
  browserPage?: Page;
}

/**
 * 平台配置
 */
export const PLATFORM_CONFIGS: Record<string, {
  name: string;
  icon: string;
  color: string;
  
  // 登录页面 URL
  loginUrl: string;
  
  // 登录成功检测选择器
  successSelectors: string[];
  
  // 用户信息选择器
  userInfoSelectors: {
    name?: string;
    avatar?: string;
    id?: string;
  };
  
  // 状态
  status: 'available' | 'coming';
  description?: string;
}> = {
  douyin: {
    name: '抖音',
    icon: '🎵',
    color: '#fe2c55',
    loginUrl: 'https://www.douyin.com/',
    successSelectors: ['.login-mode', '.header-user-avatar', '[data-e2e="user-avatar"]'],
    userInfoSelectors: {
      name: '.user-name, .nickname, [class*="name"]',
      avatar: 'img[src*="avatar"], .avatar img'
    },
    status: 'available',
    description: '抖音创作服务平台'
  },
  
  kuaishou: {
    name: '快手',
    icon: '📹',
    color: '#ff4906',
    loginUrl: 'https://www.kuaishou.com/',
    successSelectors: ['.profile-user-avatar', '.user-avatar', '.header-avatar'],
    userInfoSelectors: {
      name: '.user-name, .nick-name',
      avatar: 'img[class*="avatar"]'
    },
    status: 'available'
  },
  
  xiaohongshu: {
    name: '小红书',
    icon: '📕',
    color: '#ff2442',
    loginUrl: 'https://www.xiaohongshu.com/',
    successSelectors: ['.user-info', '.creator-info', '.login-success'],
    userInfoSelectors: {
      name: '.name, .nick-name',
      avatar: 'img[class*="avatar"]'
    },
    status: 'available'
  },
  
  weibo: {
    name: '微博',
    icon: '🌐',
    color: '#e6162d',
    loginUrl: 'https://weibo.com/',
    successSelectors: ['.WB_frame', '.user-avatar', '.me_header'],
    userInfoSelectors: {
      name: '.nickname, .username',
      avatar: 'img[class*="avatar"]'
    },
    status: 'available'
  },
  
  bilibili: {
    name: '哔哩哔哩',
    icon: '📺',
    color: '#00a1d6',
    loginUrl: 'https://www.bilibili.com/',
    successSelectors: ['.user-info', '.header-avatar', '.mini-avatar'],
    userInfoSelectors: {
      name: '.username, .nick-name',
      avatar: 'img[class*="avatar"]'
    },
    status: 'available'
  },
  
  zhihu: {
    name: '知乎',
    icon: '💬',
    color: '#0084ff',
    loginUrl: 'https://www.zhihu.com/',
    successSelectors: ['.AppHeader-profile', '.SignFlow'],
    userInfoSelectors: {
      name: '.ProfileHeader-name, .AppHeader-name',
      avatar: 'img[class*="Avatar"]'
    },
    status: 'available'
  },
  
  toutiao: {
    name: '今日头条',
    icon: '📰',
    color: '#ff6900',
    loginUrl: 'https://www.toutiao.com/',
    successSelectors: ['.user-info', '.login-success'],
    userInfoSelectors: {
      name: '.name',
      avatar: 'img[class*="avatar"]'
    },
    status: 'available'
  }
};

/**
 * 创建授权会话
 */
export async function createAuthSession(platform: string, userId: string): Promise<{
  sessionId: string;
  qrcodeUrl: string;
  platform: string;
  platformName: string;
  expiresAt: Date;
} | null> {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) return null;
  
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟过期
  
  // 生成登录页 URL（带标记参数，便于检测）
  const loginUrl = `${config.loginUrl}?_auth_session=${sessionId}&_auth_platform=${platform}`;
  
  // 生成二维码
  const qrcodeUrl = await qrcode.toDataURL(loginUrl, {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
  
  // 存储会话
  authSessions.set(sessionId, {
    id: sessionId,
    platform,
    status: 'pending',
    createdAt: new Date(),
    expiresAt
  });
  
  return {
    sessionId,
    qrcodeUrl,
    platform,
    platformName: config.name,
    expiresAt
  };
}

/**
 * 检查登录状态
 */
export async function checkAuthStatus(sessionId: string): Promise<{
  status: string;
  cookies?: any[];
  accountInfo?: any;
  error?: string;
}> {
  const session = authSessions.get(sessionId);
  if (!session) {
    return { status: 'not_found' };
  }
  
  // 检查是否过期
  if (new Date() > session.expiresAt) {
    session.status = 'expired';
    return { status: 'expired' };
  }
  
  return {
    status: session.status,
    cookies: session.cookies,
    accountInfo: session.accountInfo,
    error: session.error
  };
}

/**
 * 更新会话状态（登录成功）
 */
export function updateSessionStatus(sessionId: string, data: {
  status: 'authorized';
  cookies?: any[];
  accountInfo?: any;
}): boolean {
  const session = authSessions.get(sessionId);
  if (!session) return false;
  
  session.status = data.status;
  session.cookies = data.cookies;
  session.accountInfo = data.accountInfo;
  
  return true;
}

/**
 * 清理过期会话
 */
export function cleanupExpiredSessions(): void {
  const now = new Date();
  for (const [id, session] of authSessions.entries()) {
    if (now > session.expiresAt) {
      authSessions.delete(id);
    }
  }
}

// 每5分钟清理一次
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

/**
 * 获取平台列表
 */
export function getPlatformList(): any[] {
  return Object.entries(PLATFORM_CONFIGS).map(([key, config]) => ({
    code: key,
    name: config.name,
    icon: config.icon,
    color: config.color,
    status: config.status,
    description: config.description
  }));
}
