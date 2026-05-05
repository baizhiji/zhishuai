// 智能获客服务
import { apiClient } from './api.client';

export interface AcquisitionTask {
  id: string;
  title: string;
  platform: 'douyin' | 'xiaohongshu' | 'wechat' | 'weibo';
  content: string;
  targetCount: number;
  currentCount: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: 'new' | 'contacted' | 'converted' | 'invalid';
  tags?: string[];
  createdAt: string;
}

class AcquisitionService {
  // 获取获客任务列表
  async getTasks(): Promise<AcquisitionTask[]> {
    const response = await apiClient.get<AcquisitionTask[]>('/acquisition/tasks');
    return response;
  }

  // 创建获客任务
  async createTask(data: Partial<AcquisitionTask>): Promise<AcquisitionTask> {
    const response = await apiClient.post<AcquisitionTask>('/acquisition/tasks', data);
    return response;
  }

  // 更新任务状态
  async updateTaskStatus(id: string, status: AcquisitionTask['status']): Promise<AcquisitionTask> {
    const response = await apiClient.put<AcquisitionTask>(`/acquisition/tasks/${id}`, { status });
    return response;
  }

  // 删除任务
  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/acquisition/tasks/${id}`);
  }

  // 获取线索列表
  async getLeads(): Promise<Lead[]> {
    const response = await apiClient.get<Lead[]>('/acquisition/leads');
    return response;
  }

  // 更新线索状态
  async updateLeadStatus(id: string, status: Lead['status']): Promise<Lead> {
    const response = await apiClient.put<Lead>(`/acquisition/leads/${id}`, { status });
    return response;
  }

  // 获取统计数据
  async getStatistics(): Promise<any> {
    const response = await apiClient.get('/acquisition/statistics');
    return response;
  }
}

export const acquisitionService = new AcquisitionService();
