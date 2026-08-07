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
  // AI创作 —— 对齐 WEB 端 POST /api/ai-enhanced/post
  async generate(data: GenerateRequest): Promise<GenerateResponse> {
    const resp = await apiClient.post<any>('/ai-enhanced/post', {
      topic: data.description,
      style: data.style,
      wordCount: data.wordCount,
      requirements: data.extraRequirements,
    });
    return {
      id: Date.now().toString(),
      content: resp?.content || resp?.script || resp?.text || '',
      type: data.type,
      createdAt: new Date().toISOString(),
    };
  }

  // 视频解析 —— 对齐 WEB 端 POST /api/ai-chat/video
  async parseVideo(url: string): Promise<{
    title: string;
    description: string;
    downloadUrl: string;
  }> {
    const resp = await apiClient.post<any>('/ai-chat/video', { videoUrl: url });
    return {
      title: resp?.title || '',
      description: resp?.analysis || resp?.content || resp?.description || '',
      downloadUrl: resp?.downloadUrl || url,
    };
  }

  // 下载视频 —— 对齐 WEB 端 POST /api/ai-chat/chat（后端无直接下载端点）
  async downloadVideo(url: string): Promise<{ localPath: string }> {
    const resp = await apiClient.post<any>('/ai-chat/chat', {
      messages: [{ role: 'user', content: `请提取并分析视频链接: ${url}` }],
    });
    return { localPath: resp?.localPath || '' };
  }

  // AI生成类似视频 —— 对齐 WEB 端 POST /api/ai-enhanced/post
  async generateSimilarVideo(videoUrl: string, description: string): Promise<{ videoUrl: string }> {
    const resp = await apiClient.post<any>('/ai-enhanced/post', {
      topic: `参考视频(${videoUrl})生成类似内容: ${description}`,
      style: '创意',
    });
    return { videoUrl: resp?.videoUrl || '' };
  }

  // 获取创作历史 —— 对齐 WEB 端 GET /api/ai-enhanced/history
  async getHistory(params?: {
    page?: number;
    pageSize?: number;
    type?: string;
  }): Promise<{ items: GenerateResponse[]; total: number }> {
    const response = await apiClient.get<{ items: GenerateResponse[]; total: number }>('/ai-enhanced/history', params);
    return response;
  }
}

export const aiService = new AIService();
