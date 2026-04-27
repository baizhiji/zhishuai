/**
 * 阿里云百炼 AI 服务
 * 文档: https://help.aliyun.com/zh/dashscope/
 */

export interface TextGenerationRequest {
  prompt: string
  model?: string
  maxTokens?: number
  temperature?: number
  topP?: number
}

export interface TextGenerationResponse {
  output: {
    text: string
    finishReason: string
  }
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  requestId: string
}

export interface ImageGenerationRequest {
  prompt: string
  size?: string
  n?: number
  model?: string
}

export interface ImageGenerationResponse {
  output: {
    results: Array<{
      url: string
    }>
  }
  usage: {
    imageCount: number
  }
  requestId: string
}

/**
 * 阿里云百炼 API 客户端
 */
class AliyunBailianClient {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_ALIYUN_API_KEY || ''

    if (!this.apiKey) {
      console.warn('阿里云百炼 API Key 未配置，将使用模拟数据')
    }
  }

  /**
   * 生成文本内容
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    // 如果没有配置 API Key，返回模拟数据
    if (!this.apiKey || process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      return this.mockTextGeneration(request.prompt)
    }

    try {
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || 'qwen-plus',
          input: {
            messages: [
              {
                role: 'system',
                content: '你是一个专业的内容创作助手，擅长创作吸引人的短视频文案、社交媒体帖子等内容。'
              },
              {
                role: 'user',
                content: request.prompt
              }
            ]
          },
          parameters: {
            max_tokens: request.maxTokens || 2000,
            temperature: request.temperature || 0.7,
            top_p: request.topP || 0.8,
          }
        })
      })

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('阿里云百炼 API 调用失败:', error)
      // 降级到模拟数据
      return this.mockTextGeneration(request.prompt)
    }
  }

  /**
   * 生成图片
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    // 如果没有配置 API Key，返回模拟数据
    if (!this.apiKey || process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      return this.mockImageGeneration(request.prompt)
    }

    try {
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || 'wanx-v1',
          input: {
            prompt: request.prompt
          },
          parameters: {
            size: request.size || '1024*1024',
            n: request.n || 1,
          }
        })
      })

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('阿里云百炼 API 调用失败:', error)
      // 降级到模拟数据
      return this.mockImageGeneration(request.prompt)
    }
  }

  /**
   * 模拟文本生成（用于开发测试）
   */
  private mockTextGeneration(prompt: string): TextGenerationResponse {
    const mockContents = [
      '【智枢AI：让内容创作更简单】\n\n在这个信息爆炸的时代，如何高效地创作出优质内容？智枢AI为您解答！\n\n✨ AI智能写作：一键生成爆款文案\n🎨 AI绘画：秒变专业设计师\n🤖 数字人视频：解放真人出镜\n\n现在注册，免费试用30天！\n\n#AI #人工智能 #内容创作 #智枢AI',
      '🔥 爆款标题：3天涨粉10万的秘密武器！\n\n内容框架：\n1️⃣ 痛点开场：你是否也经历过...\n2️⃣ 解决方案：只需这样...\n3️⃣ 效果展示：我的成果是...\n4️⃣ 行动号召：现在就...\n\n记住：好的内容永远是价值+情感的结合！\n\n#内容创作 #涨粉技巧 #自媒体运营',
      '✨ 今日分享：如何写出让人忍不住转发的文案？\n\n核心公式：\n📌 情感共鸣 + 利益相关 + 行动引导\n\n实操技巧：\n• 开头3秒抓住眼球\n• 用数据和案例支撑观点\n• 结尾提供明确的行动步骤\n\n试试看，效果惊人！\n\n#文案技巧 #写作方法 #营销策略'
    ]

    const randomContent = mockContents[Math.floor(Math.random() * mockContents.length)]

    return {
      output: {
        text: randomContent,
        finishReason: 'stop'
      },
      usage: {
        inputTokens: prompt.length,
        outputTokens: randomContent.length,
        totalTokens: prompt.length + randomContent.length
      },
      requestId: `mock_${Date.now()}`
    }
  }

  /**
   * 模拟图片生成（用于开发测试）
   */
  private mockImageGeneration(prompt: string): ImageGenerationResponse {
    // 使用占位图服务
    const placeholderImages = [
      'https://via.placeholder.com/1024x1024/667eea/ffffff?text=AI+Generated+Image+1',
      'https://via.placeholder.com/1024x1024/764ba2/ffffff?text=AI+Generated+Image+2',
      'https://via.placeholder.com/1024x1024/f093fb/ffffff?text=AI+Generated+Image+3'
    ]

    const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)]

    return {
      output: {
        results: [
          {
            url: randomImage
          }
        ]
      },
      usage: {
        imageCount: 1
      },
      requestId: `mock_${Date.now()}`
    }
  }
}

// 导出单例实例
export const aliyunBailian = new AliyunBailianClient()

// 便捷函数
export async function generateText(prompt: string, options?: Partial<TextGenerationRequest>) {
  return aliyunBailian.generateText({ prompt, ...options })
}

export async function generateImage(prompt: string, options?: Partial<ImageGenerationRequest>) {
  return aliyunBailian.generateImage({ prompt, ...options })
}
