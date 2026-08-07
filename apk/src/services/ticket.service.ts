// 工单服务
import { apiClient } from './api.client';

export type TicketStatus = 'pending' | 'processing' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'question' | 'bug' | 'feature' | 'complaint' | 'other';

export interface Ticket {
  id: string;
  title: string;
  content: string;
  userId: string;
  agentId?: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId?: string;
  assigneeName?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  responses?: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: 'customer' | 'agent' | 'admin';
  content: string;
  attachments?: string[];
  isInternal: boolean;
  createdAt: string;
}

export interface TicketStats {
  total: number;
  pending: number;
  processing: number;
  resolved: number;
  closed: number;
}

export interface TicketListParams {
  page?: number;
  pageSize?: number;
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
}

class TicketService {
  // 获取工单列表
  async getList(params?: TicketListParams): Promise<{ items: Ticket[]; total: number }> {
    try {
      const response = await apiClient.get<{ items: Ticket[]; total: number }>('/tickets', params as any);
      return response || { items: [], total: 0 };
    } catch {
      return { items: [], total: 0 };
    }
  }

  // 获取工单详情
  async getDetail(id: string): Promise<Ticket> {
    const response = await apiClient.get<Ticket>(`/tickets/${id}`);
    return response;
  }

  // 创建工单
  async create(data: {
    category: TicketCategory;
    priority: TicketPriority;
    title: string;
    content: string;
    attachments?: string[];
  }): Promise<Ticket> {
    const response = await apiClient.post<Ticket>('/tickets', data);
    return response;
  }

  // 回复工单
  async reply(ticketId: string, data: {
    content: string;
    attachments?: string[];
  }): Promise<TicketResponse> {
    const response = await apiClient.post<TicketResponse>(`/tickets/${ticketId}/responses`, {
      ...data,
      userRole: 'customer',
    });
    return response;
  }

  // 更新工单状态
  async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    const response = await apiClient.put<Ticket>(`/tickets/${id}/status`, { status });
    return response;
  }

  // 获取工单统计
  async getStats(): Promise<TicketStats> {
    try {
      const response = await apiClient.get<TicketStats>('/tickets/stats/summary');
      return response || { total: 0, pending: 0, processing: 0, resolved: 0, closed: 0 };
    } catch {
      return { total: 0, pending: 0, processing: 0, resolved: 0, closed: 0 };
    }
  }
}

export const ticketService = new TicketService();
