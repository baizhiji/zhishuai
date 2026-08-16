/**
 * 招聘服务 API
 */
import request from '@/utils/request';

// 获取岗位列表
export async function getJobs(params?: { status?: string; page?: number; pageSize?: number }) {
  return request.get('/api/recruitment/jobs', { params });
}

// 创建岗位
export async function createJob(data: {
  title: string;
  salaryMin?: number;
  salaryMax?: number;
  education?: string;
  experience?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
}) {
  return request.post('/api/recruitment/jobs', data);
}

// 更新岗位
export async function updateJob(id: string, data: any) {
  return request.put(`/api/recruitment/jobs/${id}`, data);
}

// 删除岗位
export async function deleteJob(id: string) {
  return request.delete(`/api/recruitment/jobs/${id}`);
}

// 获取简历列表
export async function getResumes(params?: { status?: string; jobId?: string; page?: number; pageSize?: number }) {
  return request.get('/api/recruitment/resumes', { params });
}

// 创建简历
export async function createResume(data: {
  jobId: string;
  name: string;
  phone: string;
  email?: string;
  education?: string;
  experience?: string;
  resumeUrl?: string;
}) {
  return request.post('/api/recruitment/resumes', data);
}

// 更新简历状态
export async function updateResumeStatus(id: string, status: string) {
  return request.put(`/api/recruitment/resumes/${id}`, { status });
}

// 获取统计数据
export async function getRecruitmentStats() {
  return request.get('/api/recruitment/stats');
}

// AI 解析简历
export async function parseResume(resumeText: string) {
  return request.post('/api/recruitment/ai/parse-resume', { resumeText });
}

// AI 匹配岗位
export async function matchJob(resumeId: string, jobId: string) {
  return request.post('/api/recruitment/ai/match-job', { resumeId, jobId });
}

// AI 生成面试问题
export async function generateInterviewQuestions(resumeId: string, jobId: string) {
  return request.post('/api/recruitment/ai/interview-questions', { resumeId, jobId });
}

// 批量智能筛选
export async function batchScreen(jobId: string) {
  return request.post(`/api/recruitment/ai/batch-screen/${jobId}`);
}

// 获取招聘流程
export async function getRecruitmentProcesses(resumeId?: string) {
  return request.get('/api/recruitment/process', { params: { resumeId } });
}

// 更新招聘流程
export async function updateRecruitmentProcess(id: string, data: {
  stage?: string;
  notes?: string;
  scheduledAt?: string;
}) {
  return request.put(`/api/recruitment/process/${id}`, data);
}
