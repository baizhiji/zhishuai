/**
 * 获客服务 API
 */
import request from '@/utils/request';

// 获取线索列表
export async function getLeads(params?: { status?: string; page?: number; pageSize?: number }) {
  return request.get('/api/acquisition/leads', { params });
}

// 创建线索
export async function createLead(data: {
  name?: string;
  phone: string;
  email?: string;
  source?: string;
  notes?: string;
}) {
  return request.post('/api/acquisition/leads', data);
}

// 更新线索状态
export async function updateLead(id: string, data: { status?: string; notes?: string }) {
  return request.put(`/api/acquisition/leads/${id}`, data);
}

// 获取获客任务
export async function getTasks(params?: { status?: string; page?: number; pageSize?: number }) {
  return request.get('/api/acquisition/tasks', { params });
}

// 创建获客任务
export async function createTask(data: {
  name: string;
  platform: string;
  targetCount?: number;
  content?: string;
}) {
  return request.post('/api/acquisition/tasks', data);
}

// 获取统计数据
export async function getAcquisitionStats() {
  return request.get('/api/acquisition/stats');
}

// AI 生成获客策略
export async function generateAcquisitionStrategy(productInfo: string, targetAudience: string) {
  return request.post('/api/acquisition/ai/strategy', { productInfo, targetAudience });
}

// AI 生成内容创意
export async function generateContentIdeas(productInfo: string, platform?: string) {
  return request.post('/api/acquisition/ai/content-ideas', { productInfo, platform });
}

// AI 分析线索
export async function analyzeLead(id: string, targetProfile?: any) {
  return request.post(`/api/acquisition/ai/analyze-lead/${id}`, { targetProfile });
}

// AI 生成跟进话术
export async function generateFollowupMessage(id: string, productInfo?: string) {
  return request.post(`/api/acquisition/ai/followup-message/${id}`, { productInfo });
}

// 创建自动化任务
export async function createAutomation(data: {
  name: string;
  platform: string;
  targetCount?: number;
  productInfo: string;
  targetAudience?: string;
  schedule?: string;
}) {
  return request.post('/api/acquisition/ai/automation', data);
}

// 获取自动化列表
export async function getAutomations(status?: string) {
  return request.get('/api/acquisition/ai/automations', { params: { status } });
}

// 更新自动化状态
export async function updateAutomation(id: string, data: {
  status?: string;
  currentLeads?: number;
  notes?: string;
}) {
  return request.put(`/api/acquisition/ai/automation/${id}`, data);
}

// 批量分析线索
export async function batchAnalyzeLeads(targetProfile?: any) {
  return request.post('/api/acquisition/ai/batch-analyze', { targetProfile });
}
