// 招聘助手服务
import { apiClient } from './api.client';

export interface RecruitmentStats {
  totalJobs: number;
  activeJobs: number;
  totalResumes: number;
  newResumes: number;
  totalInterviews: number;
  pendingInterviews: number;
}

export interface RecruitmentPost {
  id: string;
  title: string;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  requirements: string;
  benefits: string;
  department: string;
  location: string;
  headcount: number;
  experience?: string;
  education?: string;
  description?: string;
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
    try {
      const response = await apiClient.get<RecruitmentPost[]>('/recruitment/posts');
      return response || [];
    } catch {
      // 如果API未配置，返回空数组
      return [];
    }
  }

  // 创建岗位
  async createPost(data: Partial<RecruitmentPost>): Promise<RecruitmentPost> {
    try {
      const response = await apiClient.post<RecruitmentPost>('/recruitment/posts', data);
      return response;
    } catch {
      // Mock返回
      return {
        id: Date.now().toString(),
        title: data.title || '',
        salary: `${data.salaryMin || 0}k-${data.salaryMax || 0}k`,
        requirements: data.requirements || '',
        benefits: '',
        department: data.department || '',
        location: data.location || '',
        headcount: 1,
        status: 'recruiting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
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
    try {
      const response = await apiClient.get<Candidate[]>('/recruitment/candidates');
      return response || [];
    } catch {
      return [];
    }
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

  // 获取统计数据（别名方法）
  async getStats(): Promise<RecruitmentStats> {
    try {
      const response = await apiClient.get<RecruitmentStats>('/recruitment/stats');
      return response;
    } catch {
      // 如果API未配置，返回默认数据
      return {
        totalJobs: 0,
        activeJobs: 0,
        totalResumes: 0,
        newResumes: 0,
        totalInterviews: 0,
        pendingInterviews: 0,
      };
    }
  }
}

export const recruitmentService = new RecruitmentService();
