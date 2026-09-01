/**
 * AI对话服务 - 支持多轮对话
 */
import { apiClient } from './api.client';
import { API_CONFIG } from './api.config';
import TokenStorage from '../utils/tokenStorage';

// 消息类型
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  thinking?: string;
}

// 对话请求
export interface ChatRequest {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  model?: string;
  stream?: boolean;
}

// 模型信息
export interface ModelInfo {
  id: string;
  name: string;
  provider: 'aliyun' | 'tencent' | 'volcano';
  providerName: string;
  type: 'text' | 'vision' | 'video' | 'reasoning' | 'agent';
  description: string;
}

// 响应类型
export interface ChatResponse {
  message: string;
  model: string;
  provider: string;
  thinking?: string;
}

// 图片理解请求
export interface VisionRequest {
  imageUrl: string;
  question?: string;
}

// 视频理解请求
export interface VideoUnderstandRequest {
  videoUrl: string;
  question?: string;
}

// 诊断分析请求
export interface DiagnosisRequest {
  request: string;          // 诊断请求描述
  industry?: string;        // 行业类型
  data?: any;               // 业务数据
  analysisType?: 'comprehensive' | 'strategic' | 'financial' | 'market' | 'operation';
}

// 诊断响应
export interface DiagnosisResponse {
  message: string;
  type: string;
  analysisType: string;
  industry: string;
}

// 诊断能力说明
export interface DiagnosisCapabilities {
  overview: string;
  categories: {
    id: string;
    name: string;
    items: string[];
  }[];
  analysisTypes: {
    id: string;
    name: string;
    description: string;
  }[];
  supportedIndustries: string;
  model: string;
}

class AIChatService {
  /**
   * 获取诊断能力说明
   */
  async getDiagnosisCapabilities(): Promise<DiagnosisCapabilities> {
    const response = await apiClient.get<DiagnosisCapabilities>('/ai-chat/diagnosis/capabilities');
    return response;
  }

  /**
   * 发起诊断分析
   */
  async diagnose(request: DiagnosisRequest): Promise<DiagnosisResponse> {
    const response = await apiClient.post<DiagnosisResponse>('/ai-chat/diagnosis', {
      request: request.request,
      industry: request.industry,
      data: request.data,
      analysisType: request.analysisType,
    });
    return response;
  }

  /**
   * 发送对话消息
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/ai-chat/chat', {
      messages: request.messages,
      model: request.model,
      stream: request.stream || false,
    });
    return response;
  }

  /**
   * 流式对话
   */
  async chatStream(
    request: ChatRequest,
    onChunk: (content: string) => void
  ): Promise<void> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/ai-chat/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TokenStorage.getToken()}`,
      },
      body: JSON.stringify({
        messages: request.messages,
        model: request.model,
        stream: true,
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onChunk(parsed.content);
            }
          } catch (e) {}
        }
      }
    }
  }

  /**
   * 获取支持的模型列表
   */
  async getModels(): Promise<ModelInfo[]> {
    const response = await apiClient.get<ModelInfo[]>('/ai-chat/models');
    return response;
  }

  /**
   * 图片理解
   */
  async vision(request: VisionRequest): Promise<{ description: string }> {
    const response = await apiClient.post<{ description: string }>('/ai-chat/vision', {
      imageUrl: request.imageUrl,
      question: request.question,
    });
    return response;
  }

  /**
   * 视频理解
   */
  async videoUnderstand(request: VideoUnderstandRequest): Promise<{ analysis: string }> {
    const response = await apiClient.post<{ analysis: string }>('/ai-chat/video', {
      videoUrl: request.videoUrl,
      question: request.question,
    });
    return response;
  }
}

export const aiChatService = new AIChatService();

// ============ 模型选择辅助函数 ============

// 推荐的模型类型（对齐实测版《AI模型配置最终版》统一标准）
export const RECOMMENDED_MODELS = {
  // 日常对话 - 腾讯云 Kimi K3
  daily: {
    model: 'kimi-k3',
    provider: 'tencent',
    name: 'Kimi K3 长文',
    description: '日常对话、智能问答、长文本',
  },
  // 专业文案 - 阿里云 Qwen3.8 Max
  copywriting: {
    model: 'qwen3.8-max',
    provider: 'aliyun',
    name: 'Qwen3.8 Max',
    description: '专业文案、长文本生成、复杂推理',
  },
  // 长文本 - Kimi
  longText: {
    model: 'kimi-k3',
    provider: 'tencent',
    name: 'Kimi K3 长文',
    description: '超长文本、报告生成',
  },
  // 深度推理 - 腾讯 DeepSeek V4 Pro（实测版归属腾讯 TokenHub）
  reasoning: {
    model: 'deepseek-v4-pro-202606',
    provider: 'tencent',
    name: 'DeepSeek V4 Pro',
    description: '深度思考、复杂推理、结构化分析',
  },
  // 图片理解 - 混元视觉
  vision: {
    model: 'hy-vision-2.0-instruct',
    provider: 'tencent',
    name: '混元视觉2.0',
    description: '图片理解、图表分析',
  },
  // 视频理解 - 腾讯 YT-VITA 1.5
  video: {
    model: 'yt-vita-1-5',
    provider: 'tencent',
    name: 'YT-VITA 视频理解',
    description: '视频理解、内容提取',
  },
};

// 根据任务类型推荐模型
export function getRecommendedModel(taskType: keyof typeof RECOMMENDED_MODELS) {
  return RECOMMENDED_MODELS[taskType];
}

// 所有可用模型列表（对齐实测版《AI模型配置最终版》统一标准）
export const ALL_MODELS: ModelInfo[] = [
  // 阿里云百炼
  {
    id: 'qwen3.8-max',
    name: 'Qwen3.8 Max',
    provider: 'aliyun',
    providerName: '阿里云百炼',
    type: 'reasoning',
    description: '高质量创作/复杂推理 — 实测质量优先',
  },
  {
    id: 'qwen-long',
    name: '千问长文',
    provider: 'aliyun',
    providerName: '阿里云百炼',
    type: 'text',
    description: '超长文本处理、长文档分析',
  },
  // 腾讯云TokenHub
  {
    id: 'kimi-k3',
    name: 'Kimi K3 长文',
    provider: 'tencent',
    providerName: '腾讯云TokenHub',
    type: 'text',
    description: '超长文本、报告生成',
  },
  {
    id: 'deepseek-v4-pro-202606',
    name: 'DeepSeek V4 Pro',
    provider: 'tencent',
    providerName: '腾讯云TokenHub',
    type: 'reasoning',
    description: '结构化分析/大纲/评审/合规 — 实测质量优先',
  },
  {
    id: 'hy-vision-2.0-instruct',
    name: '混元视觉2.0',
    provider: 'tencent',
    providerName: '腾讯云TokenHub',
    type: 'vision',
    description: '图片理解、多模态',
  },
  {
    id: 'yt-vita-1-5',
    name: 'YT-VITA 视频理解',
    provider: 'tencent',
    providerName: '腾讯云TokenHub',
    type: 'video',
    description: '视频理解、视频分析',
  },
  // 火山方舟
  {
    id: 'glm-5-2',
    name: 'GLM-5.2（方舟）',
    provider: 'volcano',
    providerName: '火山方舟',
    type: 'agent',
    description: '字幕/去AI化/中英双语（1M上下文）+ Agent/代码 — 实测质量优先',
  },
  {
    id: 'doubao-seed-2-1-pro-260628',
    name: 'Doubao Seed 2.1 Pro',
    provider: 'volcano',
    providerName: '火山方舟',
    type: 'reasoning',
    description: '创作/推理/视频理解/多模态 — 实测质量优先',
  },
];
