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
  pointsEarned: number;    // 已获得积分
  pointsPending: number;   // 待生效积分
  invitedAt: string;      // 邀请时间
  activatedAt?: string;   // 激活时间
}

// 转介绍统计
export interface ReferralStats {
  totalInvites: number;    // 累计邀请人数
  activeInvites: number;   // 有效邀请人数
  pointsEarned: number;    // 已获得积分
  pointsPending: number;   // 待生效积分
  expiredPoints: number;   // 已过期积分
}

class ReferralService {
  // 生成推荐码
  async generateCode(): Promise<ReferralCode> {
    try {
      const data = await apiClient.post<ReferralCode>(API_ENDPOINTS.REFERRAL_CODE);
      return data;
    } catch (error) {
      console.log('使用Mock数据: 生成推荐码');
      return this.getMockReferralCode();
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
      const data = await apiClient.get<any>(API_ENDPOINTS.REFERRAL_RECORDS, {
        page,
        pageSize,
      });
      return {
        list: data.list || this.getMockRecords(),
        total: data.total || 10,
        page,
        pageSize,
      };
    } catch (error) {
      return {
        list: this.getMockRecords(),
        total: 10,
        page,
        pageSize,
      };
    }
  }

  // 获取转介绍统计
  async getStats(): Promise<ReferralStats> {
    try {
      const data = await apiClient.get<ReferralStats>(API_ENDPOINTS.REFERRAL_STATS);
      return data;
    } catch (error) {
      console.log('使用Mock数据: 转介绍统计');
      return this.getMockStats();
    }
  }

  // 分享推荐码
  async shareCode(platform: 'wechat' | 'sms' | 'copy'): Promise<boolean> {
    try {
      // 根据平台分享
      // 这里可以实现具体的分享逻辑
      return true;
    } catch (error) {
      return false;
    }
  }

  // ===== Mock数据 =====

  private getMockReferralCode(): ReferralCode {
    const code = `ZS${Date.now().toString(36).toUpperCase()}`;
    return {
      code,
      shareUrl: `https://zhishuai.com/register?code=${code}`,
      qrCodeUrl: undefined,
      createdAt: new Date().toISOString(),
    };
  }

  private getMockRecords(): ReferralRecord[] {
    return [
      {
        id: 'r1',
        inviteeName: '张三',
        inviteePhone: '138****8888',
        status: 'activated',
        pointsEarned: 100,
        pointsPending: 0,
        invitedAt: '2024-01-10 10:00',
        activatedAt: '2024-01-10 14:30',
      },
      {
        id: 'r2',
        inviteeName: '李四',
        inviteePhone: '139****6666',
        status: 'pending',
        pointsEarned: 0,
        pointsPending: 100,
        invitedAt: '2024-01-14 09:00',
      },
      {
        id: 'r3',
        inviteeName: '王五',
        inviteePhone: '137****5555',
        status: 'activated',
        pointsEarned: 100,
        pointsPending: 0,
        invitedAt: '2024-01-08 16:00',
        activatedAt: '2024-01-09 10:00',
      },
    ];
  }

  private getMockStats(): ReferralStats {
    return {
      totalInvites: 15,
      activeInvites: 8,
      pointsEarned: 800,
      pointsPending: 100,
      expiredPoints: 0,
    };
  }
}

export const referralService = new ReferralService();
