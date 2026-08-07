// 通知服务
import { apiClient } from './api.client';

export interface Notification {
  id: string;
  type: 'system' | 'acquisition' | 'share' | 'ticket' | 'announcement';
  title: string;
  content: string;
  read: boolean;
  data?: any;
  createdAt: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unreadCount: number;
}

class NotificationsService {
  // 获取通知列表
  async getList(params?: {
    type?: string;
    page?: number;
    pageSize?: number;
  }): Promise<NotificationListResponse> {
    try {
      const response = await apiClient.get<NotificationListResponse>('/notifications', params as any);
      return response || { items: [], total: 0, unreadCount: 0 };
    } catch {
      return { items: [], total: 0, unreadCount: 0 };
    }
  }

  // 获取未读通知数量
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
      return response?.count || 0;
    } catch {
      return 0;
    }
  }

  // 标记已读
  async markRead(id: string): Promise<void> {
    await apiClient.put(`/notifications/${id}/read`);
  }

  // 全部已读
  async markAllRead(): Promise<void> {
    await apiClient.put('/notifications/read-all');
  }

  // 删除通知
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  }
}

export const notificationsService = new NotificationsService();
