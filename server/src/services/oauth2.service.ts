/**
 * OAuth 2.0 平台配置
 * 各平台的 OAuth 2.0 授权配置
 */

export interface OAuthPlatformConfig {
  code: string;
  name: string;
  icon: string;
  color: string;
  
  // OAuth 2.0 配置
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  
  // API 配置
  apiBaseUrl: string;
  
  // 权限范围
  scope: string;
  
  // 状态
  status: 'available' | 'coming';
  description?: string;
}

// 从环境变量获取通用配置
const APP_URL = process.env.APP_URL || 'http://localhost:3001';
const REDIRECT_URI = `${APP_URL}/api/oauth/callback`;

/**
 * 各平台 OAuth 2.0 配置
 * 实际使用时需要在环境变量中配置各平台的 clientId 和 clientSecret
 */
export const OAUTH_PLATFORMS: Record<string, OAuthPlatformConfig> = {
  douyin: {
    code: 'douyin',
    name: '抖音',
    icon: '🎵',
    color: '#fe2c55',
    clientId: process.env.DOUYIN_CLIENT_ID || '',
    clientSecret: process.env.DOUYIN_CLIENT_SECRET || '',
    authorizationUrl: 'https://open.douyin.com/oauth/authorize',
    tokenUrl: 'https://open.douyin.com/oauth/access_token',
    redirectUri: `${REDIRECT_URI}?platform=douyin`,
    apiBaseUrl: 'https://open.douyin.com',
    scope: 'user_info,video.create,video.data',
    status: 'coming', // 需要申请开放平台资质
    description: '需要抖音开放平台开发者资质'
  },
  
  kuaishou: {
    code: 'kuaishou',
    name: '快手',
    icon: '📹',
    color: '#ff4906',
    clientId: process.env.KUAISHOU_CLIENT_ID || '',
    clientSecret: process.env.KUAISHOU_CLIENT_SECRET || '',
    authorizationUrl: 'https://open.kuaishou.com/oauth2/authorize',
    tokenUrl: 'https://open.kuaishou.com/oauth2/access_token',
    redirectUri: `${REDIRECT_URI}?platform=kuaishou`,
    apiBaseUrl: 'https://open.kuaishou.com',
    scope: 'user_info',
    status: 'coming', // 需要申请
    description: '需要快手开放平台开发者资质'
  },
  
  xiaohongshu: {
    code: 'xiaohongshu',
    name: '小红书',
    icon: '📕',
    color: '#ff2442',
    clientId: process.env.XIAOHONGSHU_CLIENT_ID || '',
    clientSecret: process.env.XIAOHONGSHU_CLIENT_SECRET || '',
    authorizationUrl: 'https://creator.xiaohongshu.com/oauth2/authorize',
    tokenUrl: 'https://creator.xiaohongshu.com/oauth2/access_token',
    redirectUri: `${REDIRECT_URI}?platform=xiaohongshu`,
    apiBaseUrl: 'https://creator.xiaohongshu.com',
    scope: 'user_info,content.publish',
    status: 'coming', // 需要申请
    description: '需要小红书创作者平台资质'
  },
  
  weibo: {
    code: 'weibo',
    name: '微博',
    icon: '🌐',
    color: '#e6162d',
    clientId: process.env.WEIBO_CLIENT_ID || '',
    clientSecret: process.env.WEIBO_CLIENT_SECRET || '',
    authorizationUrl: 'https://api.weibo.com/oauth2/authorize',
    tokenUrl: 'https://api.weibo.com/oauth2/access_token',
    redirectUri: `${REDIRECT_URI}?platform=weibo`,
    apiBaseUrl: 'https://api.weibo.com/2',
    scope: 'friendships_groups_read,statuses_read',
    status: 'available',
    description: '新浪微博开放平台'
  },
  
  bilibili: {
    code: 'bilibili',
    name: '哔哩哔哩',
    icon: '📺',
    color: '#00a1d6',
    clientId: process.env.BILIBILI_CLIENT_ID || '',
    clientSecret: process.env.BILIBILI_CLIENT_SECRET || '',
    authorizationUrl: 'https://api.bilibili.com/oauth2/authorize',
    tokenUrl: 'https://api.bilibili.com/oauth2/access_token',
    redirectUri: `${REDIRECT_URI}?platform=bilibili`,
    apiBaseUrl: 'https://api.bilibili.com',
    scope: 'user_info,video_play',
    status: 'available',
    description: 'B站开放平台'
  },
  
  zhihu: {
    code: 'zhihu',
    name: '知乎',
    icon: '💬',
    color: '#0084ff',
    clientId: process.env.ZHIHU_CLIENT_ID || '',
    clientSecret: process.env.ZHIHU_CLIENT_SECRET || '',
    authorizationUrl: 'https://api.zhihu.com/oauth/v3/authorize',
    tokenUrl: 'https://api.zhihu.com/oauth/v3/access_token',
    redirectUri: `${REDIRECT_URI}?platform=zhihu`,
    apiBaseUrl: 'https://api.zhihu.com',
    scope: 'email,phone',
    status: 'coming', // 知乎 API 限制较多
    description: '知乎开放平台（需申请）'
  },
  
  toutiao: {
    code: 'toutiao',
    name: '今日头条',
    icon: '📰',
    color: '#ff6900',
    clientId: process.env.TOUTIAO_CLIENT_ID || '',
    clientSecret: process.env.TOUTIAO_CLIENT_SECRET || '',
    authorizationUrl: 'https://open.toutiao.com/oauth/authorize',
    tokenUrl: 'https://open.toutiao.com/oauth/access_token',
    redirectUri: `${REDIRECT_URI}?platform=toutiao`,
    apiBaseUrl: 'https://open.toutiao.com',
    scope: 'user_info',
    status: 'coming',
    description: '字节跳动开放平台'
  }
};

/**
 * 检查平台是否已配置
 */
export function isPlatformConfigured(platform: string): boolean {
  const config = OAUTH_PLATFORMS[platform];
  if (!config) return false;
  return !!(config.clientId && config.clientSecret);
}

/**
 * 获取平台配置
 */
export function getPlatformConfig(platform: string): OAuthPlatformConfig | null {
  return OAUTH_PLATFORMS[platform] || null;
}

/**
 * 生成授权 URL
 */
export function generateAuthorizationUrl(platform: string, state: string): string {
  const config = OAUTH_PLATFORMS[platform];
  if (!config) return '';
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope,
    state
  });
  
  return `${config.authorizationUrl}?${params.toString()}`;
}

/**
 * 获取访问令牌
 */
export async function exchangeCodeForToken(
  platform: string, 
  code: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number; openid?: string } | null> {
  const config = OAUTH_PLATFORMS[platform];
  if (!config) return null;
  
  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
        code
      })
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        openid: data.openid || data.uid
      };
    }
    
    return null;
  } catch (error) {
    console.error(`获取 ${platform} 访问令牌失败:`, error);
    return null;
  }
}

/**
 * 获取用户信息
 */
export async function getUserInfo(
  platform: string, 
  accessToken: string
): Promise<{ id: string; name: string; avatar?: string } | null> {
  const config = OAUTH_PLATFORMS[platform];
  if (!config) return null;
  
  try {
    let url = '';
    let params: Record<string, string> = { access_token: accessToken };
    
    switch (platform) {
      case 'weibo':
        url = `${config.apiBaseUrl}/users/show.json`;
        params.uid = '';
        break;
      case 'bilibili':
        url = `${config.apiBaseUrl}/user/info.json`;
        break;
      default:
        url = `${config.apiBaseUrl}/user/info`;
    }
    
    const response = await fetch(`${url}?${new URLSearchParams(params)}`);
    const data = await response.json();
    
    // 各平台返回格式不同
    switch (platform) {
      case 'weibo':
        return {
          id: String(data.idstr || data.id),
          name: data.screen_name,
          avatar: data.avatar_hd || data.profile_image_url
        };
      case 'bilibili':
        return {
          id: String(data.mid),
          name: data.uname,
          avatar: data.face
        };
      default:
        return data.id ? {
          id: String(data.id),
          name: data.name || data.nickname,
          avatar: data.avatar || data.avatar_url
        } : null;
    }
  } catch (error) {
    console.error(`获取 ${platform} 用户信息失败:`, error);
    return null;
  }
}
