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

class ShareService {
  // 获取推荐码列表
  async getShareCodes(): Promise<ShareCode[]> {
    const response = await apiClient.get<ShareCode[]>('/share/codes');
    return response;
  }

  // 创建推荐码
  async createShareCode(data: Partial<ShareCode>): Promise<ShareCode> {
    const response = await apiClient.post<ShareCode>('/share/codes', data);
    return response;
  }

  // 删除推荐码
  async deleteShareCode(id: string): Promise<void> {
    await apiClient.delete(`/share/codes/${id}`);
  }

  // 获取推荐码详情（包含二维码）
  async getShareCodeDetail(id: string): Promise<ShareCode> {
    const response = await apiClient.get<ShareCode>(`/share/codes/${id}`);
    return response;
  }

  // 获取推荐记录
  async getShareRecords(shareCodeId?: string): Promise<ShareRecord[]> {
    const params = shareCodeId ? `?shareCodeId=${shareCodeId}` : '';
    const response = await apiClient.get<ShareRecord[]>(`/share/records${params}`);
    return response;
  }

  // 获取统计数据
  async getStatistics(): Promise<any> {
    const response = await apiClient.get('/share/statistics');
    return response;
  }

  // 获取我的推荐码
  async getMyReferralCode(): Promise<{ code: string }> {
    const response = await apiClient.get<{ code: string }>('/share/my-code');
    return response;
  }
}

export const shareService = new ShareService();
