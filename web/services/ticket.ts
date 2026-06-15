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
<<<<<<< HEAD
    return request.get<any, any>('/api/tickets', { params });
=======
    return request.get<any>('/api/tickets', { params });
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },

  // 获取工单详情
  detail: (id: string) => {
<<<<<<< HEAD
    return request.get<any, { data: Ticket }>(`/api/tickets/${id}`);
=======
    return request.get<{ data: Ticket }>(`/api/tickets/${id}`);
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },

  // 创建工单
  create: (data: CreateTicketParams) => {
<<<<<<< HEAD
    return request.post<any, any>('/api/tickets', data);
=======
    return request.post<any>('/api/tickets', data);
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },

  // 回复工单
  reply: (ticketId: string, data: ReplyParams) => {
<<<<<<< HEAD
    return request.post<any, any>(`/api/tickets/${ticketId}/responses`, data);
=======
    return request.post<any>(`/api/tickets/${ticketId}/responses`, data);
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },

  // 更新工单状态
  updateStatus: (ticketId: string, data: { status: string; assigneeId?: string; assigneeName?: string }) => {
<<<<<<< HEAD
    return request.put<any, any>(`/api/tickets/${ticketId}/status`, data);
=======
    return request.put<any>(`/api/tickets/${ticketId}/status`, data);
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },

  // 获取工单统计
  stats: (agentId?: string) => {
<<<<<<< HEAD
    return request.get<any, any>('/api/tickets/stats/summary', { params: { agentId } });
=======
    return request.get<any>('/api/tickets/stats/summary', { params: { agentId } });
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },
};

// 工单类别选项 - 系统功能申请（按功能模块分类，方便代理商处理权限开通）
export const ticketCategories = [
  // ===== 功能开通申请 =====
  { value: 'recruitment', label: '招聘助手', description: '职位发布、简历筛选、面试管理、智能沟通' },
  { value: 'acquisition', label: '智能获客', description: '获客任务、获客看板、数据统计' },
  { value: 'media', label: '自媒体矩阵', description: '矩阵管理、账号授权、内容发布、自动化运营' },
  { value: 'digital_human', label: '数字人', description: '数字人视频、口型同步' },
  { value: 'customer_service', label: '智能客服', description: '客服机器人、常见问题、自动回复' },
  { value: 'knowledge', label: '知识库', description: '知识库管理、智能问答' },
  { value: 'material', label: '物料管理', description: '企业物料、图片视频素材' },
  { value: 'referral', label: '推荐有礼', description: '推荐奖励、佣金结算' },
  { value: 'api_access', label: 'API接入', description: 'API Key管理、服务商配置' },
  // ===== 其他问题 =====
  { value: 'complaint', label: '投诉建议', description: '产品或服务投诉、功能建议' },
  { value: 'other', label: '其他问题', description: '其他问题或咨询' },
];

// 工单优先级选项
export const ticketPriorities = [
  { value: 'low', label: '低', color: 'green' },
<<<<<<< HEAD
  { value: 'normal', label: '普通', color: 'blue' },
  { value: 'high', label: '高', color: 'orange' },
  { value: 'urgent', label: '紧急', color: 'red' },
=======
  { value: 'medium', label: '中', color: 'orange' },
  { value: 'high', label: '高', color: 'red' },
>>>>>>> 962968886be726cd434c792933b5515366d34518
];

// 工单状态选项
export const ticketStatuses = [
<<<<<<< HEAD
  { value: 'pending', label: '待处理', color: 'orange' },
  { value: 'processing', label: '处理中', color: 'blue' },
  { value: 'resolved', label: '已解决', color: 'green' },
  { value: 'closed', label: '已关闭', color: 'gray' },
  { value: 'rejected', label: '已拒绝', color: 'red' },
];
=======
  { value: 'open', label: '待处理', color: 'blue' },
  { value: 'in_progress', label: '处理中', color: 'orange' },
  { value: 'resolved', label: '已解决', color: 'green' },
  { value: 'closed', label: '已关闭', color: 'gray' },
];

>>>>>>> 962968886be726cd434c792933b5515366d34518
