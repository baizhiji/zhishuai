// 公告服务
import { apiClient } from './api.client';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'notice' | 'news' | 'maintenance' | 'feature';
  audience: 'all' | 'agent' | 'user';
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

class AnnouncementService {
  // 获取已发布公告列表
  async getList(params?: {
    audience?: 'all' | 'agent' | 'user';
    limit?: number;
  }): Promise<Announcement[]> {
    try {
      const response = await apiClient.get<Announcement[]>('/announcements', params as any);
      return response || [];
    } catch {
      return [];
    }
  }

  // 获取公告详情 —— 后端无 /announcements/:id 路由，从缓存列表匹配
  async getDetail(id: string): Promise<Announcement | null> {
    try {
      const list = await this.getList({ limit: 100 });
      return list.find((a) => a.id === id) || null;
    } catch {
      return null;
    }
  }
}

export const announcementService = new AnnouncementService();
