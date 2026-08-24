// 智能招聘服务
import { apiClient } from './api.client';

// 统计数据（对齐后端 /recruitment/stats）
export interface RecruitmentStats {
  posts: number;
  applications: number;
  interviews: number;
  totalJobs: number;
  activeJobs: number;
  totalResumes: number;
  newResumes: number;
  totalInterviews: number;
  pendingInterviews: number;
}

// 岗位（对齐后端 RecruitmentPost 模型）
export interface RecruitmentPost {
  id: string;
  title: string;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  requirements: string;
  benefits?: string;
  department: string;
  location: string;
  headcount?: number;
  candidateCount?: number;
  experience?: string;
  education?: string;
  description?: string;
  recruiterName?: string;
  recruiterPhone?: string;
  status: 'recruiting' | 'paused' | 'closed';
  createdAt: string;
  updatedAt: string;
}

// 后端候选人状态枚举
export type CandidateStatus =
  | 'screening'
  | 'matched'
  | 'contacted'
  | 'replied'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offered'
  | 'hired'
  | 'rejected'
  | 'expired';

// 候选人（对齐后端 Candidate 模型）
export interface Candidate {
  id: string;
  postId: string;
  name: string;
  phone: string;
  email?: string;
  education?: string;
  experience?: string;
  matchScore?: number;
  skills?: string; // 逗号分隔
  location?: string;
  source?: string;
  status: CandidateStatus;
  remark?: string;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
  // 关联数据
  RecruitmentPost?: { title: string };
  // 前端友好字段（计算属性）
  jobTitle?: string;
  skillsList?: string[];
}

// 前端展示状态映射
export const CANDIDATE_STATUS_MAP: Record<CandidateStatus, { label: string; color: { bg: string; text: string } }> = {
  screening: { label: '筛选中', color: { bg: '#fef3c7', text: '#92400e' } },
  matched: { label: '已匹配', color: { bg: '#EDE9FE', text: '#4C1D95' } },
  contacted: { label: '已联系', color: { bg: '#EDE9FE', text: '#3730a3' } },
  replied: { label: '已回复', color: { bg: '#dcfce7', text: '#166534' } },
  interview_scheduled: { label: '待面试', color: { bg: '#fce7f3', text: '#9d174d' } },
  interview_completed: { label: '面试完成', color: { bg: '#e0f2fe', text: '#0c4a6e' } },
  offered: { label: '已发Offer', color: { bg: '#d1fae5', text: '#065f46' } },
  hired: { label: '已入职', color: { bg: '#c7d2fe', text: '#312e81' } },
  rejected: { label: '不合适', color: { bg: '#f1f5f9', text: '#64748b' } },
  expired: { label: '已失效', color: { bg: '#fee2e2', text: '#991b1b' } },
};

// 岗位状态映射
export const JOB_STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  recruiting: { label: '招聘中', bg: '#dcfce7', text: '#166534' },
  paused: { label: '已暂停', bg: '#fef3c7', text: '#92400e' },
  closed: { label: '已关闭', bg: '#f1f5f9', text: '#64748b' },
};

class RecruitmentService {
  // 映射后端候选人到前端友好格式
  private mapCandidate(c: any): Candidate {
    return {
      ...c,
      jobTitle: c.RecruitmentPost?.title || '',
      skillsList: c.skills ? c.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    };
  }

  // 获取岗位列表
  async getPosts(params?: { status?: string; page?: number; pageSize?: number }): Promise<{ posts: RecruitmentPost[]; total: number }> {
    try {
      const response = await apiClient.get<{ jobs: RecruitmentPost[]; total: number }>('/recruitment/posts', params);
      if (response && Array.isArray(response.jobs)) {
        return { posts: response.jobs, total: response.total || 0 };
      }
      // 兼容直接返回数组的情况
      if (Array.isArray(response)) {
        return { posts: response as RecruitmentPost[], total: (response as RecruitmentPost[]).length };
      }
      return { posts: [], total: 0 };
    } catch {
      return { posts: [], total: 0 };
    }
  }

  // 创建岗位
  async createPost(data: Partial<RecruitmentPost>): Promise<RecruitmentPost> {
    const response = await apiClient.post<RecruitmentPost>('/recruitment/jobs', data);
    return response;
  }

  // 更新岗位
  async updatePost(id: string, data: Partial<RecruitmentPost>): Promise<RecruitmentPost> {
    const response = await apiClient.put<RecruitmentPost>(`/recruitment/jobs/${id}`, data);
    return response;
  }

  // 删除岗位
  async deletePost(id: string): Promise<void> {
    await apiClient.delete(`/recruitment/jobs/${id}`);
  }

  // 获取候选人列表
  async getCandidates(params?: { status?: string; jobId?: string; page?: number; pageSize?: number }): Promise<{ candidates: Candidate[]; total: number }> {
    try {
      const response = await apiClient.get<{ candidates: any[]; total: number }>('/recruitment/candidates', params);
      if (response && Array.isArray(response.candidates)) {
        return {
          candidates: response.candidates.map((c: any) => this.mapCandidate(c)),
          total: response.total || 0,
        };
      }
      if (Array.isArray(response)) {
        return {
          candidates: (response as any[]).map((c: any) => this.mapCandidate(c)),
          total: (response as any[]).length,
        };
      }
      return { candidates: [], total: 0 };
    } catch {
      return { candidates: [], total: 0 };
    }
  }

  // AI 匹配候选人（触发后台 AI 搜索）
  async matchCandidates(jobId: string, searchConfigId?: string): Promise<{ candidates: Candidate[]; count: number }> {
    const response = await apiClient.post<{ success: boolean; data: { candidates: any[]; count: number } }>(
      `/recruitment/jobs/${jobId}/match`,
      { searchConfigId }
    );
    return {
      candidates: (response.data?.candidates || []).map((c: any) => this.mapCandidate(c)),
      count: response.data?.count || 0,
    };
  }

  // 更新候选人状态（使用后端状态机）
  async updateCandidateStatus(id: string, status: CandidateStatus, notes?: string): Promise<any> {
    const response = await apiClient.put(`/recruitment/candidates/${id}/status`, { status, notes });
    return response;
  }

  // 获取统计信息
  async getStats(): Promise<RecruitmentStats> {
    try {
      const response = await apiClient.get<any>('/recruitment/stats');
      // 后端返回 { posts, applications, interviews }
      const posts = response?.posts || response?.totalJobs || 0;
      const applications = response?.applications || response?.totalResumes || 0;
      const interviews = response?.interviews || response?.totalInterviews || 0;
      return {
        posts,
        applications,
        interviews,
        totalJobs: posts,
        activeJobs: posts, // 默认全算在招
        totalResumes: applications,
        newResumes: 0,
        totalInterviews: interviews,
        pendingInterviews: 0,
      };
    } catch {
      return {
        posts: 0,
        applications: 0,
        interviews: 0,
        totalJobs: 0,
        activeJobs: 0,
        totalResumes: 0,
        newResumes: 0,
        totalInterviews: 0,
        pendingInterviews: 0,
      };
    }
  }

  // 获取面试列表
  async getInterviews(params?: { page?: number; pageSize?: number }): Promise<{ interviews: any[]; total: number }> {
    try {
      const response = await apiClient.get<{ interviews: any[]; total: number }>('/recruitment/interviews', params);
      if (response && Array.isArray(response.interviews)) {
        return { interviews: response.interviews, total: response.total || 0 };
      }
      return { interviews: [], total: 0 };
    } catch {
      return { interviews: [], total: 0 };
    }
  }

  // 获取管线统计
  async getPipelineStats(): Promise<any> {
    try {
      const response = await apiClient.get('/recruitment/pipeline/stats');
      return response?.data || response || null;
    } catch {
      return null;
    }
  }
}

export const recruitmentService = new RecruitmentService();
