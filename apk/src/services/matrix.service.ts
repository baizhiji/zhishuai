// 媒体/矩阵账号服务
import { apiClient } from './api.client';

export interface MatrixAccount {
  id: string;
  platform: 'douyin' | 'xiaohongshu' | 'kuaishou' | 'bilibili' | 'wechat' | 'video';
  accountName: string;
  avatar?: string;
  status: 'active' | 'inactive';
  autoPublish: boolean;
  createdAt: string;
}

class MatrixService {
  // 获取矩阵账号列表
  async getAccounts(): Promise<MatrixAccount[]> {
    const response = await apiClient.get<MatrixAccount[]>('/media/matrix');
    return response;
  }

  // 添加矩阵账号
  async addAccount(data: Partial<MatrixAccount>): Promise<MatrixAccount> {
    const response = await apiClient.post<MatrixAccount>('/media/matrix', data);
    return response;
  }

  // 更新矩阵账号
  async updateAccount(id: string, data: Partial<MatrixAccount>): Promise<MatrixAccount> {
    const response = await apiClient.put<MatrixAccount>(`/media/matrix/${id}`, data);
    return response;
  }

  // 删除矩阵账号
  async deleteAccount(id: string): Promise<void> {
    await apiClient.delete(`/media/matrix/${id}`);
  }

  // 更新自动发布状态
  async updateAutoPublish(id: string, autoPublish: boolean): Promise<MatrixAccount> {
    const response = await apiClient.put<MatrixAccount>(`/media/matrix/${id}/auto-publish`, { autoPublish });
    return response;
  }

  // 获取平台账号
  async getAccountsByPlatform(platform: MatrixAccount['platform']): Promise<MatrixAccount[]> {
    const response = await apiClient.get<MatrixAccount[]>(`/media/matrix/platform/${platform}`);
    return response;
  }
}

export const matrixService = new MatrixService();
