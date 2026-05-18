/**
 * AI对话服务
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  modelKey?: string
  stream?: boolean
  preferProvider?: string
}

export interface ChatResponse {
  success: boolean
  data?: {
    message: string
    modelKey: string
    modelId: string
    modelName: string
    provider: string
    isFallback?: boolean
  }
  error?: string
}

export interface ModelInfo {
  key: string
  id: string
  name: string
  provider: 'aliyun' | 'tencent'
  providerName: string
  type: string
  description: string
  maxTokens: number
  priority: number
  cost: string
}

/**
 * 发送对话消息
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  options?: {
    modelKey?: string
    stream?: boolean
    preferProvider?: string
  }
): Promise<ChatResponse> {
  try {
    const response = await fetch('/api/ai-chat/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        modelKey: options?.modelKey || 'auto',
        stream: options?.stream || false,
        preferProvider: options?.preferProvider,
      }),
    })

    const result = await response.json()
    return result
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '请求失败',
    }
  }
}

/**
 * 获取模型列表
 */
export async function getModelList(): Promise<ModelInfo[]> {
  try {
    const response = await fetch('/api/ai-chat/models')
    const result = await response.json()
    
    if (result.success) {
      return result.data
    }
    
    return []
  } catch (error) {
    console.error('获取模型列表失败:', error)
    return []
  }
}

/**
 * 获取模型统计
 */
export async function getModelStats() {
  try {
    const response = await fetch('/api/ai-chat/models/stats')
    const result = await response.json()
    
    if (result.success) {
      return result.data
    }
    
    return null
  } catch (error) {
    console.error('获取模型统计失败:', error)
    return null
  }
}
