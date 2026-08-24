// 推荐分享服务
import { apiClient } from './api.client';

export interface ShareCode {
  id: string;
  title: string;
  videoUrl?: string;
  platforms: string[];
  scanCount: number;
  publishCount: number;
  activeCount: number;
  status: 'active' | 'paused' | 'expired';
  qrCode?: string;
  qrContent?: string;
  qrCodeImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareRecord {
  id: string;
  shareCodeId: string;
  scannerName?: string;
  scannerPhone?: string;
  platform: string;
  status: 'pending' | 'published' | 'failed';
  createdAt: string;
}

export interface ShareStatistics {
  totalScans: number;
  totalPublish: number;
  activeCodes: number;
  conversionRate: string;
}

class ShareService {
  // ===== 推荐码管理 =====

  // 获取分享码列表（分页）
  async getShareCodes(page = 1, pageSize = 50): Promise<ShareCode[]> {
    const response = await apiClient.get<{ list: ShareCode[]; total: number }>(
      `/share/codes?page=${page}&pageSize=${pageSize}`
    );
    const list = response.list || response || [];
    // 为每个分享码添加衍生字段（code = id 前8位）
    return list.map((item: any) => ({
      ...item,
      code: item.code || (item.id ? item.id.slice(0, 8).toUpperCase() : ''),
      // 确保 platforms 是数组
      platforms: Array.isArray(item.platforms) ? item.platforms : [],
    }));
  }

  // 屏幕别名：getReferralCodes
  async getReferralCodes(): Promise<ShareCode[]> {
    return this.getShareCodes(1, 50);
  }

  // 创建分享码
  async createShareCode(data: { title: string; videoUrl: string; platforms: string[]; type?: string }): Promise<ShareCode> {
    const response = await apiClient.post<ShareCode>('/share/codes', data);
    return response;
  }

  // 屏幕别名：createReferralCode
  async createReferralCode(data: { title: string; videoUrl: string; platforms: string[] }): Promise<ShareCode> {
    return this.createShareCode(data);
  }

  // 删除分享码
  async deleteShareCode(id: string): Promise<void> {
    await apiClient.delete(`/share/codes/${id}`);
  }

  // 获取分享码详情
  async getShareCodeDetail(id: string): Promise<ShareCode> {
    const response = await apiClient.get<ShareCode>(`/share/codes/${id}`);
    return response;
  }

  // ===== 推荐记录 =====

  // 获取分享记录（分页）
  async getShareRecords(codeId?: string): Promise<ShareRecord[]> {
    const params = codeId ? `?codeId=${codeId}` : '';
    const response = await apiClient.get<{ list: ShareRecord[] }>(`/share/records${params}`);
    return response.list || response || [];
  }

  // ===== 统计数据 =====

  // 获取统计概览
  async getStatistics(): Promise<ShareStatistics> {
    const response = await apiClient.get<ShareStatistics>('/share/statistics');
    return response;
  }

  // 获取详细统计(含佣金钱)
  async getStats(): Promise<any> {
    const response = await apiClient.get('/share/stats');
    return response;
  }

  // 获取信息流看板
  async getDashboard(period = 'week'): Promise<any> {
    const response = await apiClient.get(`/share/dashboard?period=${period}`);
    return response;
  }

  // ===== 我的信息 =====

  // 获取我的推荐码
  async getMyReferralCode(): Promise<{ code: string }> {
    const response = await apiClient.get<{ code: string }>('/share/my-code');
    return response;
  }

  // ===== 分享码操作 =====

  // 扫码
  async scanCode(codeId: string, platform?: string): Promise<any> {
    const response = await apiClient.post(`/share/scan/${codeId}`, { platform });
    return response;
  }
}

export const shareService = new ShareService();
