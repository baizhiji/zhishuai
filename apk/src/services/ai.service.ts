// AI创作服务
import { apiClient } from './api.client';

export interface GenerateRequest {
  type: string;
  description?: string;
  style?: string;
  wordCount?: number;
  extraRequirements?: string;
  uploadedFiles?: string[];
}

export interface GenerateResponse {
  id: string;
  content: string;
  type: string;
  createdAt: string;
}

class AIService {
  // AI创作
  async generate(data: GenerateRequest): Promise<GenerateResponse> {
    const response = await apiClient.post<GenerateResponse>('/ai/generate', data);
    return response;
  }

  // 视频解析
  async parseVideo(url: string): Promise<{
    title: string;
    description: string;
    downloadUrl: string;
  }> {
    const response = await apiClient.post<{
      title: string;
      description: string;
      downloadUrl: string;
    }>('/ai/parse-video', { url });
    return response;
  }

  // 下载视频
  async downloadVideo(url: string): Promise<{ localPath: string }> {
    const response = await apiClient.post<{ localPath: string }>('/ai/download-video', { url });
    return response;
  }

  // AI生成类似视频
  async generateSimilarVideo(videoUrl: string, description: string): Promise<{ videoUrl: string }> {
    const response = await apiClient.post<{ videoUrl: string }>('/ai/generate-similar-video', {
      videoUrl,
      description,
    });
    return response;
  }

  // 获取创作历史
  async getHistory(params?: {
    page?: number;
    pageSize?: number;
    type?: string;
  }): Promise<{ items: GenerateResponse[]; total: number }> {
    const response = await apiClient.get<{ items: GenerateResponse[]; total: number }>('/ai/history', params);
    return response;
  }
}

export const aiService = new AIService();
