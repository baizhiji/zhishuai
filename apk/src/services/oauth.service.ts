/**
 * OAuth 扫码授权服务
 * 对接服务端 /oauth 接口，实现平台扫码授权流程
 */
import { apiClient } from './api.client';

export interface OAuthPlatform {
  code: string;
  name: string;
  icon?: string;
  color?: string;
  status: 'available' | 'coming';
}

export interface OAuthSession {
  sessionId: string;
  platform: string;
  platformName: string;
  qrcodeUrl: string;
  expiresAt: string;
}

export interface OAuthSessionStatus {
  sessionId: string;
  platform: string;
  status: 'pending' | 'scanning' | 'confirmed' | 'expired' | 'error';
  accountInfo?: {
    id?: string;
    name?: string;
    avatar?: string;
  };
}

export interface OAuthAccount {
  id: string;
  platform: string;
  platformName: string;
  accountId?: string;
  accountName?: string;
  avatar?: string;
  status: string;
  lastSyncAt?: string;
  createdAt: string;
}

class OAuthService {
  // 获取支持的平台列表
  async getPlatforms(): Promise<OAuthPlatform[]> {
    const response = await apiClient.get<{ success: boolean; data: OAuthPlatform[] }>('/oauth/platforms');
    return response.data || [];
  }

  // 创建授权会话（获取二维码）
  async createSession(platform: string): Promise<OAuthSession> {
    const response = await apiClient.post<{ success: boolean; data: OAuthSession }>('/oauth/sessions', { platform });
    return response.data;
  }

  // 查询授权状态（轮询）
  async getSessionStatus(sessionId: string): Promise<OAuthSessionStatus> {
    const response = await apiClient.get<{ success: boolean; data: OAuthSessionStatus }>(`/oauth/sessions/${sessionId}`);
    return response.data;
  }

  // 取消授权会话
  async cancelSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/oauth/sessions/${sessionId}`);
  }

  // 获取已授权账号列表
  async getAccounts(platform?: string): Promise<OAuthAccount[]> {
    const params = platform ? `?platform=${platform}` : '';
    const response = await apiClient.get<{ success: boolean; data: OAuthAccount[] }>(`/oauth/accounts${params}`);
    return response.data || [];
  }

  // 删除授权账号
  async deleteAccount(id: string): Promise<void> {
    await apiClient.delete(`/oauth/accounts/${id}`);
  }

  // 轮询授权状态直到完成或超时
  async pollSessionStatus(
    sessionId: string,
    onStatusChange?: (status: OAuthSessionStatus) => void,
    intervalMs: number = 2000,
    timeoutMs: number = 120000
  ): Promise<OAuthSessionStatus> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          if (Date.now() - startTime > timeoutMs) {
            reject(new Error('授权超时'));
            return;
          }

          const status = await this.getSessionStatus(sessionId);
          onStatusChange?.(status);

          if (status.status === 'confirmed') {
            resolve(status);
            return;
          }

          if (status.status === 'expired' || status.status === 'error') {
            reject(new Error(status.status === 'expired' ? '二维码已过期' : '授权失败'));
            return;
          }

          // 继续轮询
          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

export const oauthService = new OAuthService();
