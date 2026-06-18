// 转介绍服务
import { apiClient } from './api.client';
import { API_ENDPOINTS } from './api.config';

// 推荐码
export interface ReferralCode {
  code: string;        // 推荐码
  shareUrl: string;    // 分享链接
  qrCodeUrl?: string;  // 二维码
  createdAt: string;
}

// 推荐记录
export interface ReferralRecord {
  id: string;
  inviteeName: string;    // 被邀请人昵称
  inviteePhone: string;   // 被邀请人手机号（脱敏）
  status: 'pending' | 'activated' | 'expired';  // 状态
  invitedAt: string;      // 邀请时间
  activatedAt?: string;   // 激活时间
}

// 转介绍统计
export interface ReferralStats {
  totalInvites: number;    // 累计邀请人数
  activeInvites: number;   // 有效邀请人数
}

class ReferralService {
  // 生成推荐码
  async generateCode(): Promise<ReferralCode> {
    const data = await apiClient.post<ReferralCode>(API_ENDPOINTS.REFERRAL_CODE);
    return data;
  }

  // 获取推荐记录
  async getRecords(page: number = 1, pageSize: number = 20): Promise<{
    list: ReferralRecord[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const data = await apiClient.get<any>(API_ENDPOINTS.REFERRAL_RECORDS, {
      page,
      pageSize,
    });
    return {
      list: data.list || [],
      total: data.total || 0,
      page,
      pageSize,
    };
  }

  // 获取转介绍统计
  async getStats(): Promise<ReferralStats> {
    const data = await apiClient.get<ReferralStats>(API_ENDPOINTS.REFERRAL_STATS);
    return data;
  }

  // 分享推荐码
  async shareCode(platform: 'wechat' | 'sms' | 'copy'): Promise<boolean> {
    try {
      // 根据平台分享 - 目前仅返回成功
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const referralService = new ReferralService();
