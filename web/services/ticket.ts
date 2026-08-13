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
    return request.get<any>('/api/tickets', { params });
  },

  // 获取工单详情
  detail: (id: string) => {
    return request.get<{ data: Ticket }>(`/api/tickets/${id}`);
  },

  // 创建工单
  create: (data: CreateTicketParams) => {
    return request.post<any>('/api/tickets', data);
  },

  // 回复工单
  reply: (ticketId: string, data: ReplyParams) => {
    return request.post<any>(`/api/tickets/${ticketId}/responses`, data);
  },

  // 更新工单状态
  updateStatus: (ticketId: string, data: { status: string; assigneeId?: string; assigneeName?: string }) => {
    return request.put<any>(`/api/tickets/${ticketId}/status`, data);
  },

  // 获取工单统计
  stats: (agentId?: string) => {
    return request.get<any>('/api/tickets/stats/summary', { params: { agentId } });
  },
};

// 工单类别选项 - 系统功能申请（按功能模块分类，方便代理商处理权限开通）
export const ticketCategories = [
  // ===== 功能开通申请 =====
  { value: 'recruitment', label: '招聘助手', description: '职位发布、简历筛选、面试管理、智能沟通' },
  { value: 'acquisition', label: '智能获客', description: '获客任务、获客看板、数据统计' },
  { value: 'media', label: 'AI创作工厂', description: 'AI图文、图片、视频创作' },
  { value: 'digital_human', label: '数字人', description: '数字人视频、口型同步' },
  { value: 'customer_service', label: '智能客服', description: '客服机器人、常见问题、自动回复' },
  { value: 'knowledge', label: '知识库', description: '知识库管理、智能问答' },
  { value: 'material', label: '物料管理', description: '企业物料、图片视频素材' },
  { value: 'referral', label: '推荐分享', description: '推荐奖励、佣金结算' },
  { value: 'api_access', label: 'API接入', description: 'API Key管理、服务商配置' },
  // ===== 其他问题 =====
  { value: 'complaint', label: '投诉建议', description: '产品或服务投诉、功能建议' },
  { value: 'other', label: '其他问题', description: '其他问题或咨询' },
];

// 客户端（客户后台）工单类别：与客户端 4 大功能统一
export const customerTicketCategories = [
  { value: 'media', label: 'AI创作工厂', description: 'AI图文、图片、视频创作' },
  { value: 'customer_service', label: '智能客服', description: '客服机器人、常见问题、自动回复' },
  { value: 'acquisition', label: '智能获客', description: '获客任务、获客看板、数据统计' },
  { value: 'referral', label: '推荐分享', description: '推荐奖励、佣金结算' },
];

// 工单优先级选项
export const ticketPriorities = [
  { value: 'low', label: '低', color: 'green' },
  { value: 'medium', label: '中', color: 'orange' },
  { value: 'high', label: '高', color: 'red' },
];

// 工单状态选项（与后端 Prisma Schema 一致：pending, processing, resolved, closed, rejected）
export const ticketStatuses = [
  { value: 'pending', label: '待处理', color: 'blue' },
  { value: 'processing', label: '处理中', color: 'orange' },
  { value: 'resolved', label: '已解决', color: 'green' },
  { value: 'closed', label: '已关闭', color: 'gray' },
  { value: 'rejected', label: '已驳回', color: 'red' },
];

