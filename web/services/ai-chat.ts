/**
 * AI对话服务 - 支持SSE流式输出
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
 * 发送对话消息（非流式）
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
        stream: false,
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
 * 发送流式对话消息（SSE）
 * 返回 AbortController 供取消请求，通过 onChunk 回调逐块接收内容
 */
export function sendChatMessageStream(
  messages: ChatMessage[],
  onChunk: (content: string) => void,
  onDone: (meta?: { modelKey?: string; modelName?: string; provider?: string; isFallback?: boolean }) => void,
  onError: (error: string) => void,
  options?: {
    modelKey?: string
    preferProvider?: string
  }
): AbortController {
  const controller = new AbortController()

  const doStream = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch('/api/ai-chat/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages,
          modelKey: options?.modelKey || 'auto',
          stream: true,
          preferProvider: options?.preferProvider,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `请求失败: ${response.status}` }))
        onError(errData.error || `请求失败: ${response.status}`)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        onError('无法读取响应流')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // 保留最后一个可能不完整的行
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            onDone()
            return
          }

          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              onChunk(parsed.content)
            }
            // 如果SSE里带了meta信息，传给onDone
            if (parsed.modelKey || parsed.modelName || parsed.provider) {
              onDone({
                modelKey: parsed.modelKey,
                modelName: parsed.modelName,
                provider: parsed.provider,
                isFallback: parsed.isFallback || parsed.fallback,
              })
              return
            }
          } catch {
            // 忽略解析失败的行
          }
        }
      }

      onDone()
    } catch (err: any) {
      if (err.name === 'AbortError') return
      onError(err.message || '流式请求失败')
    }
  }

  doStream()
  return controller
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
