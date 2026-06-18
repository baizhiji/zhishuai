// 招聘助手服务 - 支持主动搜索、沟通、面试
import { apiClient } from './api.client';

export interface RecruitmentStats {
  totalJobs: number;
  activeJobs: number;
  totalCandidates: number;
  newCandidates: number;
  contactedCandidates: number;
  interviewingCandidates: number;
  hiredCandidates: number;
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
  candidateCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  phone: string;
  email?: string;
  position?: string;
  resume?: string;
  education?: string;
  experience?: string;
  skills?: string;
  source?: string;
  matchScore: number;
  location?: string;
  status: 'pending' | 'contacted' | 'communicating' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  remark?: string;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
  post?: { title: string; id: string };
  _count?: { communications: number; interviews: number };
}

export interface Communication {
  id: string;
  candidateId: string;
  postId?: string;
  channel: string;
  direction: 'outbound' | 'inbound';
  content: string;
  aiGenerated: boolean;
  readByCandidate: boolean;
  createdAt: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  postId: string;
  round: number;
  type: 'video' | 'phone' | 'onsite';
  scheduledAt: string;
  duration: number;
  location?: string;
  interviewer?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  feedback?: string;
  score?: number;
  createdAt: string;
  candidate?: { name: string; phone: string; email?: string };
  post?: { title: string };
}

class RecruitmentService {
  // 获取岗位列表
  async getPosts(): Promise<RecruitmentPost[]> {
    try {
      const response = await apiClient.get<{ jobs: RecruitmentPost[] }>('/recruitment/posts');
      return response?.jobs || [];
    } catch {
      return [];
    }
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
  async getCandidates(postId?: string): Promise<Candidate[]> {
    try {
      const params: any = {};
      if (postId) params.postId = postId;
      const response = await apiClient.get<{ candidates: Candidate[] }>('/recruitment/candidates', params);
      return response?.candidates || [];
    } catch {
      return [];
    }
  }

  // 添加候选人
  async addCandidate(data: {
    postId: string;
    name: string;
    phone: string;
    email?: string;
    skills?: string;
    experience?: string;
    education?: string;
    source?: string;
    location?: string;
  }): Promise<{ candidate: Candidate; matchAnalysis: string }> {
    const response = await apiClient.post<{ candidate: Candidate; matchAnalysis: string }>('/recruitment/candidates', data);
    return response;
  }

  // 批量导入候选人
  async batchImportCandidates(postId: string, candidates: any[]): Promise<any> {
    const response = await apiClient.post('/recruitment/candidates/batch', { postId, candidates });
    return response;
  }

  // 更新候选人状态
  async updateCandidateStatus(id: string, status: Candidate['status']): Promise<Candidate> {
    const response = await apiClient.put<Candidate>(`/recruitment/candidates/${id}`, { status });
    return response;
  }

  // AI生成搜索关键词
  async generateSearchKeywords(postId: string): Promise<string[]> {
    try {
      const response = await apiClient.post<{ keywords: string[] }>(`/recruitment/jobs/${postId}/generate-keywords`);
      return response?.keywords || [];
    } catch {
      return [];
    }
  }

  // 主动联系候选人
  async contactCandidate(candidateId: string, channel?: string, customMessage?: string): Promise<{ communication: Communication; message: string }> {
    const response = await apiClient.post<{ communication: Communication; message: string }>(`/recruitment/candidates/${candidateId}/contact`, {
      channel: channel || 'platform',
      customMessage,
    });
    return response;
  }

  // 发送消息给候选人
  async sendMessage(candidateId: string, content: string, channel?: string): Promise<Communication> {
    const response = await apiClient.post<Communication>(`/recruitment/candidates/${candidateId}/message`, {
      content,
      channel: channel || 'platform',
    });
    return response;
  }

  // 记录候选人回复
  async recordReply(candidateId: string, content: string, channel?: string): Promise<Communication> {
    const response = await apiClient.post<Communication>(`/recruitment/candidates/${candidateId}/reply`, {
      content,
      channel: channel || 'platform',
    });
    return response;
  }

  // AI自动回复
  async autoReply(candidateId: string, candidateMessage: string): Promise<{ reply: Communication }> {
    const response = await apiClient.post<{ reply: Communication }>(`/recruitment/candidates/${candidateId}/auto-reply`, {
      candidateMessage,
    });
    return response;
  }

  // 获取沟通记录
  async getCommunications(candidateId: string): Promise<Communication[]> {
    try {
      const response = await apiClient.get<Communication[]>(`/recruitment/candidates/${candidateId}/communications`);
      return response || [];
    } catch {
      return [];
    }
  }

  // 安排面试
  async scheduleInterview(data: {
    candidateId: string;
    postId: string;
    round?: number;
    type?: string;
    scheduledAt: string;
    duration?: number;
    location?: string;
    interviewer?: string;
  }): Promise<{ interview: Interview; invitationMessage: string }> {
    const response = await apiClient.post<{ interview: Interview; invitationMessage: string }>('/recruitment/interviews', data);
    return response;
  }

  // 获取面试列表
  async getInterviews(postId?: string, status?: string): Promise<Interview[]> {
    try {
      const params: any = {};
      if (postId) params.postId = postId;
      if (status) params.status = status;
      const response = await apiClient.get<{ interviews: Interview[] }>('/recruitment/interviews', params);
      return response?.interviews || [];
    } catch {
      return [];
    }
  }

  // 更新面试状态
  async updateInterview(id: string, data: Partial<Interview>): Promise<Interview> {
    const response = await apiClient.put<Interview>(`/recruitment/interviews/${id}`, data);
    return response;
  }

  // 提交面试反馈
  async submitInterviewFeedback(id: string, data: { feedback: string; score: number; status?: string }): Promise<Interview> {
    const response = await apiClient.post<Interview>(`/recruitment/interviews/${id}/feedback`, data);
    return response;
  }

  // 获取面试问题
  async getInterviewQuestions(postId: string, round?: number): Promise<string[]> {
    try {
      const response = await apiClient.get<{ questions: string[] }>('/recruitment/interviews/questions', { postId, round: round || 1 });
      return response?.questions || [];
    } catch {
      return [];
    }
  }

  // AI重新评分
  async rescoreCandidate(candidateId: string): Promise<{ score: number; analysis: string }> {
    const response = await apiClient.post<{ score: number; analysis: string }>(`/recruitment/candidates/${candidateId}/rescore`);
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
      return {
        totalJobs: 0,
        activeJobs: 0,
        totalCandidates: 0,
        newCandidates: 0,
        contactedCandidates: 0,
        interviewingCandidates: 0,
        hiredCandidates: 0,
        totalInterviews: 0,
        pendingInterviews: 0,
      };
    }
  }
}

export const recruitmentService = new RecruitmentService();
