/**
 * 阿里云百炼 AI 服务
 * 文档: https://help.aliyun.com/zh/dashscope/
 */

export interface TextGenerationRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export interface TextGenerationResponse {
  output: {
    text: string;
    finishReason: string;
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  requestId: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  size?: string;
  n?: number;
  model?: string;
}

export interface ImageGenerationResponse {
  output: {
    results: Array<{
      url: string;
    }>;
  };
  usage: {
    imageCount: number;
  };
  requestId: string;
}

/**
 * 阿里云百炼 API 客户端
 */
class AliyunBailianClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_ALIYUN_API_KEY || '';

    if (!this.apiKey) {
      console.warn('阿里云百炼 API Key 未配置，AI 功能不可用');
    }
  }

  /**
   * 生成文本内容
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    if (!this.apiKey) {
      throw new Error('阿里云百炼 API Key 未配置，请在系统设置中配置后使用');
    }

    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || 'qwen-plus',
          input: {
            messages: [
              {
                role: 'system',
                content:
                  '你是一个专业的内容创作助手，擅长创作吸引人的短视频文案、社交媒体帖子等内容。',
              },
              {
                role: 'user',
                content: request.prompt,
              },
            ],
          },
          parameters: {
            max_tokens: request.maxTokens || 2000,
            temperature: request.temperature || 0.7,
            top_p: request.topP || 0.8,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 生成图片
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.apiKey) {
      throw new Error('阿里云百炼 API Key 未配置，请在系统设置中配置后使用');
    }

    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || 'wanx-v1',
          input: {
            prompt: request.prompt,
          },
          parameters: {
            size: request.size || '1024*1024',
            n: request.n || 1,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.statusText}`);
    }

    return response.json();
  }
}

// 导出单例实例
export const aliyunBailian = new AliyunBailianClient();

// 便捷函数
export async function generateText(prompt: string, options?: Partial<TextGenerationRequest>) {
  return aliyunBailian.generateText({ prompt, ...options });
}

export async function generateImage(prompt: string, options?: Partial<ImageGenerationRequest>) {
  return aliyunBailian.generateImage({ prompt, ...options });
}
