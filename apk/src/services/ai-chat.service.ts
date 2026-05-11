/**
 * AI对话服务 - 支持多轮对话
 */
import { apiClient } from './api.client';

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
  provider: 'aliyun' | 'tencent';
  providerName: string;
  type: 'text' | 'vision' | 'video' | 'image' | 'reasoning' | 'agent' | 'digital_human';
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

// 图像生成请求
export interface ImageGenerateRequest {
  prompt: string;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
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
    const response = await apiClient.get<{ success: boolean; data: DiagnosisCapabilities }>('/ai-chat/diagnosis/capabilities');
    return response.data;
  }

  /**
   * 发起诊断分析
   */
  async diagnose(request: DiagnosisRequest): Promise<DiagnosisResponse> {
    const response = await apiClient.post<{ success: boolean; data: DiagnosisResponse }>('/ai-chat/diagnosis', {
      request: request.request,
      industry: request.industry,
      data: request.data,
      analysisType: request.analysisType,
    });
    return response.data;
  }

  /**
   * 发送对话消息
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post<{ success: boolean; data: ChatResponse }>('/ai-chat/chat', {
      messages: request.messages,
      model: request.model,
      stream: request.stream || false,
    });
    return response.data;
  }

  /**
   * 流式对话
   */
  async chatStream(
    request: ChatRequest,
    onChunk: (content: string) => void
  ): Promise<void> {
    const response = await fetch(`${apiClient.baseUrl}/ai-chat/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiClient.getToken()}`,
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
    const response = await apiClient.get<{ success: boolean; data: ModelInfo[] }>('/ai-chat/models');
    return response.data;
  }

  /**
   * 图片理解
   */
  async vision(request: VisionRequest): Promise<{ description: string }> {
    const response = await apiClient.post<{ success: boolean; data: { description: string } }>('/ai-chat/vision', {
      imageUrl: request.imageUrl,
      question: request.question,
    });
    return response.data;
  }

  /**
   * 图像生成
   */
  async generateImage(request: ImageGenerateRequest): Promise<{ imageUrl: string; revisedPrompt?: string }> {
    const response = await apiClient.post<{ success: boolean; data: { imageUrl: string; revisedPrompt?: string } }>('/ai-chat/image', {
      prompt: request.prompt,
      size: request.size || '1024x1024',
      quality: request.quality || 'standard',
    });
    return response.data;
  }

  /**
   * 视频理解
   */
  async videoUnderstand(request: VideoUnderstandRequest): Promise<{ analysis: string }> {
    const response = await apiClient.post<{ success: boolean; data: { analysis: string } }>('/ai-chat/video', {
      videoUrl: request.videoUrl,
      question: request.question,
    });
    return response.data;
  }
}

export const aiChatService = new AIChatService();

// ============ 模型选择辅助函数 ============

// 推荐的模型类型
export const RECOMMENDED_MODELS = {
  // 日常对话 - 腾讯云混元
  daily: {
    model: 'hunyuan-2.0-instruct-20251111',
    provider: 'tencent',
    name: '混元日常',
    description: '日常对话、智能问答',
  },
  // 专业文案 - 阿里云千问
  copywriting: {
    model: 'qwen-plus',
    provider: 'aliyun',
    name: '千问专业',
    description: '专业文案、长文本生成',
  },
  // 长文本 - Kimi
  longText: {
    model: 'kimi-k2.6',
    provider: 'tencent',
    name: 'Kimi长文',
    description: '超长文本、报告生成',
  },
  // 深度推理 - DeepSeek R1
  reasoning: {
    model: 'deepseek-r1-0528',
    provider: 'aliyun',
    name: 'DeepSeek思考',
    description: '深度思考、复杂推理',
  },
  // 图片理解 - GLM多模态
  vision: {
    model: 'glm-5v-turbo',
    provider: 'tencent',
    name: 'GLM视觉',
    description: '图片理解、图表分析',
  },
  // 视频理解 - 腾讯视频理解
  video: {
    model: 'youtu-vita',
    provider: 'tencent',
    name: '视频解析',
    description: '视频理解、内容提取',
  },
  // 图像生成 - 腾讯云
  image: {
    model: 'HY-Image-V3.0',
    provider: 'tencent',
    name: 'HY-Image-V3.0',
    description: '高质量图像生成',
  },
  // 数字人 - 腾讯云
  digitalHuman: {
    model: 'YT-Video-HumanActor',
    provider: 'tencent',
    name: '数字人视频',
    description: '数字人口播视频',
  },
};

// 根据任务类型推荐模型
export function getRecommendedModel(taskType: keyof typeof RECOMMENDED_MODELS) {
  return RECOMMENDED_MODELS[taskType];
}

// 所有可用模型列表
export const ALL_MODELS: ModelInfo[] = [
  // 阿里云百炼
  {
    id: 'qwen-turbo',
    name: 'qwen-turbo',
    provider: 'aliyun',
    providerName: '阿里云百炼',
    type: 'text',
    description: '日常对话、快速响应',
  },
  {
    id: 'qwen-plus',
    name: 'qwen-plus',
    provider: 'aliyun',
    providerName: '阿里云百炼',
    type: 'text',
    description: '专业文案、长文本生成',
  },
  {
    id: 'deepseek-r1-0528',
    name: 'DeepSeek R1',
    provider: 'aliyun',
    providerName: '阿里云百炼',
    type: 'reasoning',
    description: '深度思考、复杂推理',
  },
  // 腾讯云TokenHub
  {
    id: 'hunyuan-2.0-instruct-20251111',
    name: '混元指令版',
    provider: 'tencent',
    providerName: '腾讯云TokenHub',
    type: 'text',
    description: '日常对话、智能问答',
  },
  {
    id: 'hunyuan-2.0-thinking-20251109',
    name: '混元思考版',
    provider: 'tencent',
    providerName: '腾讯云TokenHub',
    type: 'reasoning',
    description: '复杂推理、数学问题',
  },
  {
    id: 'kimi-k2.6',
    name: 'Kimi K2.6',
    provider: 'tencent',
    providerName: '腾讯云TokenHub',
    type: 'text',
    description: '超长文本、报告生成',
  },
  {
    id: 'glm-5',
    name: 'GLM-5',
    provider: 'tencent',
    providerName: '腾讯云TokenHub',
    type: 'agent',
    description: 'Agent任务、代码生成',
  },
  {
    id: 'glm-5v-turbo',
    name: 'GLM-5V Turbo',
    provider: 'tencent',
    providerName: '腾讯云TokenHub',
    type: 'vision',
    description: '图片理解、多模态',
  },
  {
    id: 'youtu-vita',
    name: 'youtu-vita',
    provider: 'tencent',
    providerName: '腾讯云TokenHub',
    type: 'video',
    description: '视频理解、视频分析',
  },
  {
    id: 'HY-Image-V3.0',
    name: 'HY-Image-V3.0',
    provider: 'tencent',
    providerName: '腾讯云TokenHub',
    type: 'image',
    description: '高质量图像生成',
  },
  {
    id: 'YT-Video-HumanActor',
    name: '数字人视频',
    provider: 'tencent',
    providerName: '腾讯云TokenHub',
    type: 'digital_human',
    description: '数字人口播视频',
  },
];
