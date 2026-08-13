/**
 * 社交账号（平台授权）API 服务
 * 支持平台：douyin / kuaishou / xiaohongshu / shipinhao
 */

import request from '@/utils/request';

export interface Platform {
  key: string;
  name: string;
}

export interface SocialAccount {
  id: string;
  platform: string;
  platformName: string;
  accountName: string;
  avatar?: string | null;
  status: string;
  cookies?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string | null;
}

export interface AccountStats {
  total: number;
  active: number;
  expired: number;
  disabled: number;
  byPlatform?: Record<string, number>;
}

export interface LoginSession {
  sessionId: string;
  qrcodeImage: string;
  platform: string;
  platformName: string;
  expiresIn: number;
}

export interface SessionStatus {
  status: string; // scanning | success | expired | failed | cancelled
  message?: string;
  platform?: string;
  platformName?: string;
  accountId?: string;
  accountName?: string;
  avatar?: string;
}

/** 业务错误统一识别：code !== 0 时抛出，携带 message/blockedReason */
function throwIfFailed<T>(res: T): T {
  if (res && typeof res === 'object' && 'code' in (res as any)) {
    const err = res as any;
    if (err.code !== 0 && err.code !== 200) {
      const msg = [err.message, err.blockedReason].filter(Boolean).join('：');
      throw new Error(msg || '请求失败');
    }
  }
  return res;
}

/** 获取支持的平台列表（仅 douyin/kuaishou/xiaohongshu/shipinhao） */
export async function getPlatforms(): Promise<Platform[]> {
  return throwIfFailed(await request.get<Platform[]>('/api/social/platforms'));
}

/** 获取当前用户已绑定的账号列表 */
export async function getAccounts(userId: string): Promise<SocialAccount[]> {
  return throwIfFailed(
    await request.get<SocialAccount[]>('/api/social/accounts', { params: { userId } })
  );
}

/** 获取账号统计 */
export async function getAccountStats(userId: string): Promise<AccountStats> {
  return throwIfFailed(
    await request.get<AccountStats>('/api/social/accounts/stats', { params: { userId } })
  );
}

/** 发起平台授权（返回真实登录页二维码截图 base64） */
export async function createSession(platform: string, userId: string): Promise<LoginSession> {
  return throwIfFailed(
    await request.post<LoginSession>('/api/social/session/create', { platform, userId })
  );
}

/** 轮询查询扫码登录状态 */
export async function getSessionStatus(sessionId: string): Promise<SessionStatus> {
  return throwIfFailed(
    await request.get<SessionStatus>(`/api/social/session/${sessionId}/status`)
  );
}

/** 取消授权会话 */
export async function cancelSession(sessionId: string): Promise<void> {
  await request.post(`/api/social/session/${sessionId}/cancel`);
}

/** 解绑账号 */
export async function unbindAccount(accountId: string): Promise<void> {
  await request.post(`/api/social/unbind/${accountId}`);
}

/** 重新授权（返回新会话用于扫码） */
export async function refreshAccount(accountId: string): Promise<LoginSession> {
  return throwIfFailed(
    await request.post<LoginSession>(`/api/social/accounts/${accountId}/refresh`)
  );
}

/** 删除账号 */
export async function deleteAccount(accountId: string): Promise<void> {
  await request.delete(`/api/social/accounts/${accountId}`);
}

/** 获取当前用户指定平台的可用（已授权）账号 */
export async function getAvailableAccounts(userId: string, platform: string): Promise<SocialAccount[]> {
  const accounts = await getAccounts(userId);
  return accounts.filter((acc) => acc.platform === platform && acc.status === 'active');
}
