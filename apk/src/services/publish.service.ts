// 发布中心服务
import { apiClient } from './api.client';

export interface PublishRecord {
  id: string;
  contentId: string;
  contentTitle: string;
  platform: string;
  accountName: string;
  status: 'pending' | 'publishing' | 'published' | 'failed';
  publishTime?: string;
  errorMessage?: string;
  createdAt: string;
}

class PublishService {
  // 获取发布历史
  async getHistory(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<{ items: PublishRecord[]; total: number }> {
    const response = await apiClient.get<{ items: PublishRecord[]; total: number }>('/media/publish/history', params);
    return response;
  }

  // 立即发布
  async publish(data: {
    contentId: string;
    platform: string;
    accountIds: string[];
  }): Promise<PublishRecord[]> {
    const response = await apiClient.post<PublishRecord[]>('/media/publish/immediate', data);
    return response;
  }
}

export const publishService = new PublishService();
