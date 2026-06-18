/**
 * 编程助手服务
 * 智枢 AI SaaS 系统 - WEB 前端
 */

export interface CodeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CodeAssistantRequest {
  messages: CodeMessage[];
  taskType: 'generate' | 'explain' | 'debug' | 'testgen' | 'review' | 'nl2code' | 'lowcode';
  language?: string;
  userMode?: 'developer' | 'non-developer';
  stream?: boolean;
  model?: string;
}

export interface CodeAssistantResponse {
  success: boolean;
  data?: {
    content: string;
    modelKey: string;
    modelId: string;
    taskType: string;
    language?: string;
    userMode?: string;
  };
  error?: string;
}

export interface ModelOption {
  key: string;
  id: string;
  name: string;
  provider: string;
  providerName: string;
  type: string;
  description: string;
  maxTokens: number;
}

export interface ConversationSummary {
  id: string;
  title: string;
  taskType: string;
  language: string;
  userMode: string;
  modelKey: string | null;
  messageCount: number;
  lastMessage: string | null;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  taskType: string;
  language: string;
  userMode: string;
  modelKey: string | null;
  messageCount: number;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  role: string;
  content: string;
  model: string | null;
  createdAt: string;
}

/**
 * 发送编程助手请求（非流式）
 */
export async function sendCodeRequest(
  taskType: 'generate' | 'explain' | 'debug' | 'testgen' | 'review' | 'nl2code' | 'lowcode',
  messages: CodeMessage[],
  options?: {
    language?: string;
    userMode?: 'developer' | 'non-developer';
    model?: string;
  }
): Promise<CodeAssistantResponse> {
  try {
    const response = await fetch(`/api/code-assistant/${taskType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        language: options?.language || 'javascript',
        userMode: options?.userMode || 'developer',
        stream: false,
        model: options?.model || 'auto',
      }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '请求失败',
    };
  }
}

/**
 * 发送编程助手请求（流式 SSE）
 */
export function sendCodeRequestStream(
  taskType: 'generate' | 'explain' | 'debug' | 'testgen' | 'review' | 'nl2code' | 'lowcode',
  messages: CodeMessage[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  options?: {
    language?: string;
    userMode?: 'developer' | 'non-developer';
    model?: string;
  }
): { abort: () => void } {
  const abortController = new AbortController();
  let lastChunkTime = Date.now();
  const CHUNK_TIMEOUT = 15000; // 15 秒 chunk 间隔超时

  // chunk 超时检测
  const chunkTimeoutId = setInterval(() => {
    if (Date.now() - lastChunkTime > CHUNK_TIMEOUT) {
      clearInterval(chunkTimeoutId);
      onError('响应超时，请稍后重试');
      abortController.abort();
    }
  }, 5000);

  (async () => {
    try {
      const response = await fetch(`/api/code-assistant/${taskType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          language: options?.language || 'javascript',
          userMode: options?.userMode || 'developer',
          stream: true,
          model: options?.model || 'auto',
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        onError(errorData.error || `请求失败: ${response.status}`);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        lastChunkTime = Date.now();
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              clearInterval(chunkTimeoutId);
              onDone();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                clearInterval(chunkTimeoutId);
                onError(parsed.error);
                return;
              }
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch {}
          }
        }
      }

      clearInterval(chunkTimeoutId);
      onDone();
    } catch (error: any) {
      clearInterval(chunkTimeoutId);
      if (error.name !== 'AbortError') {
        onError(error.message || '流式请求失败');
      }
    }
  })();

  return {
    abort: () => {
      clearInterval(chunkTimeoutId);
      abortController.abort();
    },
  };
}

/**
 * 获取模型列表
 */
export async function getCodeModels(): Promise<ModelOption[]> {
  try {
    const response = await fetch('/api/ai-chat/models');
    const result = await response.json();

    if (result.success) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error('获取模型列表失败:', error);
    return [];
  }
}

/**
 * 获取对话列表
 */
export async function getConversations(params?: {
  page?: number;
  pageSize?: number;
  taskType?: string;
}): Promise<{ conversations: ConversationSummary[]; total: number }> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.taskType) query.set('taskType', params.taskType);

    const response = await fetch(`/api/code-assistant/conversations?${query.toString()}`);
    const result = await response.json();

    if (result.success) {
      return result.data;
    }

    return { conversations: [], total: 0 };
  } catch {
    return { conversations: [], total: 0 };
  }
}

/**
 * 获取对话详情
 */
export async function getConversationDetail(id: string): Promise<ConversationDetail | null> {
  try {
    const response = await fetch(`/api/code-assistant/conversations/${id}`);
    const result = await response.json();

    if (result.success) {
      return result.data;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 删除对话
 */
export async function deleteConversation(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/code-assistant/conversations/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();

    return result.success;
  } catch {
    return false;
  }
}
