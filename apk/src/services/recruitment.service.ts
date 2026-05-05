// 招聘助手服务
import { apiClient } from './api.client';

export interface RecruitmentPost {
  id: string;
  title: string;
  salary: string;
  requirements: string;
  benefits: string;
  department: string;
  location: string;
  headcount: number;
  status: 'recruiting' | 'paused' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  phone: string;
  email?: string;
  position: string;
  resume?: string;
  status: 'pending' | 'interviewing' | 'hired' | 'rejected';
  source: string;
  createdAt: string;
}

class RecruitmentService {
  // 获取岗位列表
  async getPosts(): Promise<RecruitmentPost[]> {
    const response = await apiClient.get<RecruitmentPost[]>('/recruitment/posts');
    return response;
  }

  // 创建岗位
  async createPost(data: Partial<RecruitmentPost>): Promise<RecruitmentPost> {
    const response = await apiClient.post<RecruitmentPost>('/recruitment/posts', data);
    return response;
  }

  // 更新岗位
  async updatePost(id: string, data: Partial<RecruitmentPost>): Promise<RecruitmentPost> {
    const response = await apiClient.put<RecruitmentPost>(`/recruitment/posts/${id}`, data);
    return response;
  }

  // 删除岗位
  async deletePost(id: string): Promise<void> {
    await apiClient.delete(`/recruitment/posts/${id}`);
  }

  // 获取候选人列表
  async getCandidates(): Promise<Candidate[]> {
    const response = await apiClient.get<Candidate[]>('/recruitment/candidates');
    return response;
  }

  // 更新候选人状态
  async updateCandidateStatus(id: string, status: Candidate['status']): Promise<Candidate> {
    const response = await apiClient.put<Candidate>(`/recruitment/candidates/${id}`, { status });
    return response;
  }

  // 获取统计信息
  async getStatistics(): Promise<any> {
    const response = await apiClient.get('/recruitment/statistics');
    return response;
  }
}

export const recruitmentService = new RecruitmentService();
