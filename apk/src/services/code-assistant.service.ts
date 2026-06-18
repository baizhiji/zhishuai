/**
 * 编程助手服务
 * 智枢 AI SaaS 系统 - APK 端
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

import { API_CONFIG, API_ENDPOINTS } from './api.config';

// 使用统一的 API 配置
const API_BASE_URL = API_CONFIG.BASE_URL;

const CHUNK_TIMEOUT_MS = 15000; // 15 秒 chunk 间隔超时

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
    const response = await fetch(`${API_BASE_URL}/code-assistant/${taskType}`, {
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
 * 发送编程助手请求（流式）
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

  // chunk 超时检测
  const chunkTimeoutId = setInterval(() => {
    if (Date.now() - lastChunkTime > CHUNK_TIMEOUT_MS) {
      clearInterval(chunkTimeoutId);
      onError('响应超时，请稍后重试');
      abortController.abort();
    }
  }, 5000);

  (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/code-assistant/${taskType}`, {
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
        clearInterval(chunkTimeoutId);
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
