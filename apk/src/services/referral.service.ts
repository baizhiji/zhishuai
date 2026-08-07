// 转介绍服务
import { apiClient } from './api.client';
import { API_ENDPOINTS } from './api.config';

// 推荐码
export interface ReferralCode {
  code: string;
  shareUrl: string;
  qrCodeUrl?: string;
  createdAt: string;
}

// 推荐记录
export interface ReferralRecord {
  id: string;
  inviteeName: string;
  inviteePhone: string;
  status: 'pending' | 'activated' | 'expired';
  invitedAt: string;
  activatedAt?: string;
}

// 转介绍统计
export interface ReferralStats {
  totalInvites: number;
  activeInvites: number;
}

class ReferralService {
  // 生成推荐码
  async generateCode(): Promise<ReferralCode | null> {
    try {
      const data = await apiClient.post<ReferralCode>(API_ENDPOINTS.REFERRAL_CODE);
      return data;
    } catch {
      return null;
    }
  }

  // 获取推荐记录
  async getRecords(page: number = 1, pageSize: number = 20): Promise<{
    list: ReferralRecord[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const data = await apiClient.get<any>(API_ENDPOINTS.REFERRAL_RECORDS, { page, pageSize });
      return { list: data.list || [], total: data.total || 0, page, pageSize };
    } catch {
      return { list: [], total: 0, page, pageSize };
    }
  }

  // 获取转介绍统计
  async getStats(): Promise<ReferralStats | null> {
    try {
      const data = await apiClient.get<ReferralStats>(API_ENDPOINTS.REFERRAL_STATS);
      return data;
    } catch {
      return null;
    }
  }

  // 分享推荐码
  async shareCode(platform: 'wechat' | 'sms' | 'copy'): Promise<boolean> {
    try {
      return true;
    } catch {
      return false;
    }
  }
}

export const referralService = new ReferralService();
