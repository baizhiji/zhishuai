/**
 * 商业助手 API Service
 * 智枢 AI APK - 移动端
 */

import { apiClient } from './api.client';
import { API_CONFIG } from './api.config';

export interface BusinessScenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  prompts: {
    system: string;
    initial: string;
    refinements: Record<string, string>;
  };
}

export interface BusinessPlanSection {
  title: string;
  content: string;
  order: number;
}

export interface BusinessPlan {
  id: string;
  scenarioId: string;
  scenarioName: string;
  businessName: string;
  createdAt: string;
  sections: BusinessPlanSection[];
  summary: string;
}

export interface BusinessPlanDetail extends BusinessPlan {
  fullContent: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const businessService = {
  /** 获取所有商业场景 */
  async getScenarios(): Promise<BusinessScenario[]> {
    const res = await apiClient.get('/business/scenarios');
    return res.data.data;
  },

  /** 生成商业方案 */
  async generatePlan(params: {
    scenarioId: string;
    businessName: string;
    businessDescription: string;
    targetAudience?: string;
    budget?: string;
    timeline?: string;
    additionalContext?: string;
  }): Promise<BusinessPlan> {
    const res = await apiClient.post('/business/generate-plan', params);
    return res.data.data;
  },

  /** 优化方案 */
  async refinePlan(params: {
    planId: string;
    refinementKey: string;
    scenarioId: string;
  }): Promise<{ content: string }> {
    const res = await apiClient.post('/business/refine-plan', params);
    return res.data.data;
  },

  /** 获取用户方案列表 */
  async getPlans(): Promise<BusinessPlan[]> {
    const res = await apiClient.get('/business/plans');
    return res.data.data;
  },

  /** 获取方案详情 */
  async getPlanDetail(planId: string): Promise<BusinessPlanDetail> {
    const res = await apiClient.get(`/business/plans/${planId}`);
    return res.data.data;
  },

  /** 获取导出链接 */
  getExportUrl(planId: string, format: 'ppt' | 'pdf' | 'docx'): string {
    return `${API_CONFIG.BASE_URL}/business/export/${format}/${planId}`;
  },

  /** 自由问答 */
  async chat(messages: ChatMessage[]): Promise<{ reply: string }> {
    const res = await apiClient.post('/business/chat', { messages });
    return res.data.data;
  },
};

export default businessService;
