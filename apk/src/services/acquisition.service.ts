import { apiClient } from './api.client';

// ─── 类型定义（对齐后端 Prisma Schema）─────────────────────────────

export type TaskStatus = 'pending' | 'running' | 'completed' | 'paused';
export type TaskChannel = 'douyin' | 'kuaishou' | 'xiaohongshu' | 'weibo' | 'bosszhipin' | 'zhilian' | string;

export interface AcquisitionTask {
  id: string;
  userId: string;
  title: string;
  channel: string;
  targetCount: number;
  leadsCount: number;
  progress: number;
  status: TaskStatus;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'invalid' | 'blacklisted';

export interface AcquisitionLead {
  id: string;
  userId: string;
  taskId?: string;
  taskName?: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: LeadStatus;
  notes?: string;
  aiScore?: number;
  aiQuality?: string;
  aiInsights?: string;
  aiFollowup?: string;
  lastContact?: string;
  convertedAt?: string;
  followupCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StatsData {
  totalTasks: number;
  runningTasks: number;
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  convertedLeads: number;
  invalidLeads: number;
  conversionRate: number;
}

export interface DashboardData {
  totalLeads: number;
  newLeads: number;
  conversionRate: number;
  totalTasks: number;
  convertedLeads: number;
  trend: { label: string; leads: number; conversions: number }[];
  channelBreakdown: { channel: string; count: number }[];
  aiScoreDist: { range: string; count: number }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DiscoveredLead {
  name: string;
  phone: string;
  source: string;
  aiScore: number;
  aiQuality: string;
  aiInsights: string;
  aiFollowup: string;
}

// ─── API 方法 ─────────────────────────────────────────────────────

class AcquisitionService {
  // 获取获客任务列表
  async getTasks(params?: { page?: number; pageSize?: number; status?: string; channel?: string }) {
    const query: Record<string, string | number | boolean> = {};
    if (params?.page !== undefined) query.page = params.page;
    if (params?.pageSize !== undefined) query.pageSize = params.pageSize;
    if (params?.status) query.status = params.status;
    if (params?.channel) query.channel = params.channel;
    const res = await apiClient.get<{
      tasks: AcquisitionTask[];
      total: number;
      page: number;
      pageSize: number;
    }>('/acquisition/tasks', query);
    return res;
  }

  // 获取单个获客任务
  async getTask(id: string) {
    const res = await apiClient.get<AcquisitionTask>(`/acquisition/tasks/${id}`);
    return res;
  }

  // 创建获客任务
  async createTask(data: { name: string; channel: string; content?: string; targetCount?: number }) {
    const res = await apiClient.post<AcquisitionTask>('/acquisition/tasks', {
      name: data.name,
      channel: data.channel,
      targetCount: data.targetCount || 100,
    });
    return res;
  }

  // 更新获客任务
  async updateTask(id: string, data: Partial<AcquisitionTask>) {
    const res = await apiClient.put<AcquisitionTask>(`/acquisition/tasks/${id}`, data);
    return res;
  }

  // 启动获客任务
  async startTask(id: string) {
    const res = await apiClient.put<AcquisitionTask>(`/acquisition/tasks/${id}/start`);
    return res;
  }

  // 删除获客任务
  async deleteTask(id: string) {
    const res = await apiClient.delete<{ message: string }>(`/acquisition/tasks/${id}`);
    return res;
  }

  // 获取潜客列表
  async getLeads(params?: { page?: number; pageSize?: number; taskId?: string; status?: string; source?: string }) {
    const query: Record<string, string | number | boolean> = {};
    if (params?.page !== undefined) query.page = params.page;
    if (params?.pageSize !== undefined) query.pageSize = params.pageSize;
    if (params?.taskId) query.taskId = params.taskId;
    if (params?.status) query.status = params.status;
    if (params?.source) query.source = params.source;
    const res = await apiClient.get<{
      leads: AcquisitionLead[];
      total: number;
      page: number;
      pageSize: number;
    }>('/acquisition/leads', query);
    return res;
  }

  // 更新潜客状态
  async updateLead(id: string, data: Partial<AcquisitionLead>) {
    const res = await apiClient.put<AcquisitionLead>(`/acquisition/leads/${id}`, data);
    return res;
  }

  // 删除潜客
  async deleteLead(id: string) {
    const res = await apiClient.delete<{ message: string }>(`/acquisition/leads/${id}`);
    return res;
  }

  // AI 潜客发现
  async discoverLeads(taskId: string, count: number = 5) {
    const res = await apiClient.post<{ leads: DiscoveredLead[]; count: number }>(
      `/acquisition/tasks/${taskId}/discover`,
      { count }
    );
    return res;
  }

  // 获取统计信息
  async getStats() {
    const res = await apiClient.get<StatsData>('/acquisition/statistics');
    return res;
  }

  // 获取看板数据
  async getDashboard(period: string = 'week') {
    const res = await apiClient.get<DashboardData>('/acquisition/dashboard', { period });
    return res;
  }

  // 向潜客发送联系消息
  async contactLead(leadId: string, message?: string) {
    const res = await apiClient.post<{ success: boolean; content: string }>(
      `/acquisition/leads/${leadId}/contact`,
      { message }
    );
    return res;
  }
}

export const acquisitionService = new AcquisitionService();
