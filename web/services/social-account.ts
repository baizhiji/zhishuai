/**
 * 社交账号 API 服务
 */

import request from '@/utils/request';

export interface Platform {
  id: string;
  name: string;
  icon: string;
}

export interface SocialAccount {
  id: string;
  platform: string;
  platformName: string;
  accountId: string;
  accountName: string;
  avatar?: string;
  fans?: number;
  status: 'active' | 'expired' | 'error';
  lastSyncTime?: string;
  expiresAt?: string;
}

export interface AccountStats {
  total: number;
  active: number;
  expired: number;
  byPlatform: Record<string, number>;
}

export interface SessionResult {
  sessionId: string;
  qrcodeImage: string;
  expiresIn: number;
}

/**
 * 获取支持的平台列表
 */
export async function getPlatforms(): Promise<Platform[]> {
  const res = await request.get('/social/platforms');
  return res.code === 0 ? res.data : [];
}

/**
 * 获取用户账号列表
 */
export async function getAccounts(userId: string): Promise<SocialAccount[]> {
  const res = await request.get('/social/accounts', {
    params: { userId }
  });
  return res.code === 0 ? res.data : [];
}

/**
 * 获取账号统计
 */
export async function getAccountStats(userId: string): Promise<AccountStats> {
  const res = await request.get('/social/accounts/stats', {
    params: { userId }
  });
  return res.code === 0 ? res.data : { total: 0, active: 0, expired: 0, byPlatform: {} };
}

/**
 * 创建授权会话
 */
export async function createSession(platform: string, userId: string): Promise<SessionResult> {
  const res = await request.post('/social/session/create', {
    platform,
    userId
  });
  
  if (res.code !== 0) {
    throw new Error(res.message || '创建会话失败');
  }
  
  return res.data;
}

/**
 * 获取会话状态
 */
export async function getSessionStatus(sessionId: string): Promise<{ status: string }> {
  const res = await request.get(`/social/session/${sessionId}/status`);
  return res.code === 0 ? res.data : { status: 'unknown' };
}

/**
 * 解绑账号
 */
export async function unbindAccount(accountId: string): Promise<void> {
  const res = await request.delete(`/social/accounts/${accountId}`);
  if (res.code !== 0) {
    throw new Error(res.message || '解绑失败');
  }
}

/**
 * 刷新账号Cookie
 */
export async function refreshAccount(accountId: string): Promise<void> {
  const res = await request.post(`/social/accounts/${accountId}/refresh`);
  if (res.code !== 0) {
    throw new Error(res.message || '刷新失败');
  }
}

/**
 * 获取可用的发布账号
 */
export async function getAvailableAccounts(userId: string, platforms: string[]): Promise<SocialAccount[]> {
  const accounts = await getAccounts(userId);
  return accounts.filter(acc => 
    acc.status === 'active' && platforms.includes(acc.platform)
  );
}
