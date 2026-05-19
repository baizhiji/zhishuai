import request from '@/utils/request';

export interface Ticket {
  id: string;
  ticketNo: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  responses?: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  userName: string;
  userRole: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
}

export interface CreateTicketParams {
  userId: string;
  agentId?: string;
  category: string;
  priority: string;
  title: string;
  content: string;
  attachments?: any[];
}

export interface ReplyParams {
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  attachments?: any[];
  isInternal?: boolean;
}

export const TicketAPI = {
  // 获取工单列表
  list: (params: {
    userId?: string;
    agentId?: string;
    status?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  }) => {
    return request.get<any, any>('/api/tickets', { params });
  },

  // 获取工单详情
  detail: (id: string) => {
    return request.get<any, { data: Ticket }>(`/api/tickets/${id}`);
  },

  // 创建工单
  create: (data: CreateTicketParams) => {
    return request.post<any, any>('/api/tickets', data);
  },

  // 回复工单
  reply: (ticketId: string, data: ReplyParams) => {
    return request.post<any, any>(`/api/tickets/${ticketId}/responses`, data);
  },

  // 更新工单状态
  updateStatus: (ticketId: string, data: { status: string; assigneeId?: string; assigneeName?: string }) => {
    return request.put<any, any>(`/api/tickets/${ticketId}/status`, data);
  },

  // 获取工单统计
  stats: (agentId?: string) => {
    return request.get<any, any>('/api/tickets/stats/summary', { params: { agentId } });
  },
};

// 工单类别选项 - 仅保留投诉建议
export const ticketCategories = [
  { value: 'complaint', label: '投诉建议' },
];

// 工单优先级选项
export const ticketPriorities = [
  { value: 'low', label: '低', color: 'green' },
  { value: 'normal', label: '普通', color: 'blue' },
  { value: 'high', label: '高', color: 'orange' },
  { value: 'urgent', label: '紧急', color: 'red' },
];

// 工单状态选项
export const ticketStatuses = [
  { value: 'pending', label: '待处理', color: 'orange' },
  { value: 'processing', label: '处理中', color: 'blue' },
  { value: 'resolved', label: '已解决', color: 'green' },
  { value: 'closed', label: '已关闭', color: 'gray' },
  { value: 'rejected', label: '已拒绝', color: 'red' },
];
