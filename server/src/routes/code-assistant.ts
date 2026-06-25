/**
 * 编程助手路由
 * 智枢 AI SaaS 系统 - 后端
 *
 * 功能：
 * 1. 代码生成 — POST /api/code-assistant/generate
 * 2. 代码解释 — POST /api/code-assistant/explain
 * 3. 代码调试 — POST /api/code-assistant/debug
 * 4. 单元测试生成 — POST /api/code-assistant/testgen
 * 5. 代码 Review — POST /api/code-assistant/review
 * 6. 自然语言转代码 — POST /api/code-assistant/nl2code
 * 7. 低代码搭建 — POST /api/code-assistant/lowcode
 * 8. 对话历史 — GET  /api/code-assistant/conversations
 * 9. 对话详情 — GET  /api/code-assistant/conversations/:id
 * 10. 删除对话 — DELETE /api/code-assistant/conversations/:id
 */

import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { aiModelRouter } from '../services/ai-model-router';
import { CODE_PROMPTS, getCodePrompt } from '../services/ai-prompts';
import { getPrimaryApiKey } from '../services/user-api-key.service';
import { prisma } from '../utils/db';


const router = Router();

// 获取用户API Key（优先使用用户自己配置的Key，仅管理员可fallback到环境变量）
async function getUserApiKey(userId: string, provider: 'aliyun' | 'tencent', userRole?: string): Promise<string | null> {
  const providerKey = provider === 'aliyun' ? 'dashscope' : 'tokenhub';
  const userKey = await getPrimaryApiKey(userId, providerKey);
  if (userKey?.apiKey) {
    return userKey.apiKey;
  }
  // 仅管理员可使用平台全局Key（环境变量），普通用户必须自己配置API Key
  if (userRole !== 'admin') {
    return null;
  }
  return provider === 'aliyun' 
    ? process.env.DASHSCOPE_API_KEY || null
    : process.env.TENCENT_TOKENHUB_API_KEY || null;
}

// ============ 流式响应超时配置 ============
const STREAM_TIMEOUT_MS = 120000; // 2 分钟
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;

// ============ 系统提示词 ============

function buildSystemPrompt(taskType: string, language: string = 'javascript', userMode: string = 'developer'): string {
  return getCodePrompt(taskType, language, userMode === 'developer');
}

// ============ AI 调用函数（复用 ai-chat.ts 的逻辑）============

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ModelConfig {
  baseUrl: string;
  apiKeyEnv: string;
  models: Record<string, { id: string; name: string; type: string }>;
}

const MODEL_CONFIG: { [key: string]: ModelConfig } = {
  aliyun: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyEnv: 'DASHSCOPE_API_KEY',
    models: {
      daily: { id: 'qwen-turbo', name: 'qwen-turbo', type: 'text' },
      copywriting: { id: 'qwen-plus', name: 'qwen-plus', type: 'text' },
      longText: { id: 'qwen-long', name: 'qwen-long', type: 'text' },
      reasoning: { id: 'deepseek-r1-0528', name: 'deepseek-r1', type: 'reasoning' },
    }
  },
  tencent: {
    baseUrl: 'https://tokenhub.tencentmaas.com/v1',
    apiKeyEnv: 'TENCENT_TOKENHUB_API_KEY',
    models: {
      daily: { id: 'hunyuan-2.0-instruct-20251111', name: 'hunyuan-instruct', type: 'text' },
      thinking: { id: 'hunyuan-2.0-thinking-20251109', name: 'hunyuan-thinking', type: 'reasoning' },
      longText: { id: 'kimi-k2.6', name: 'kimi-k2.6', type: 'text' },
      agent: { id: 'glm-5', name: 'glm-5', type: 'agent' },
    }
  }
};

// ============ Token 用量记录 ============

async function logApiUsage(params: {
  userId: string;
  providerId: string;
  providerName: string;
  model: string;
  requestTokens?: number;
  responseTokens?: number;
  cost?: number;
  duration: number;
  status: string;
  errorMsg?: string;
}) {
  try {
    await prisma.apiUsageLog.create({
      data: {
        userId: params.userId,
        providerId: params.providerId,
        providerName: params.providerName,
        endpoint: '/api/code-assistant',
        model: params.model,
        requestTokens: params.requestTokens,
        responseTokens: params.responseTokens,
        cost: params.cost ?? 0,
        duration: params.duration,
        status: params.status,
        errorMsg: params.errorMsg,
      },
    });
  } catch (err) {
    console.error('[编程助手] API用量记录失败:', err);
  }
}

// ============ 对话历史管理 ============

async function saveConversation(
  userId: string,
  taskType: string,
  userMessage: string,
  assistantMessage: string,
  modelKey: string,
  language: string,
  userMode: string
) {
  try {
    // 查找或创建对话
    const existing = await prisma.codeAssistantConversation.findFirst({
      where: { userId, taskType, language, userMode },
      orderBy: { updatedAt: 'desc' },
    });

    if (existing && existing.messageCount < 50) {
      // 追加到现有对话
      await prisma.codeAssistantMessage.create({
        data: {
          conversationId: existing.id,
          role: 'user',
          content: userMessage,
          model: modelKey,
        },
      });
      await prisma.codeAssistantMessage.create({
        data: {
          conversationId: existing.id,
          role: 'assistant',
          content: assistantMessage,
          model: modelKey,
        },
      });
      await prisma.codeAssistantConversation.update({
        where: { id: existing.id },
        data: {
          messageCount: { increment: 2 },
          lastMessage: assistantMessage.substring(0, 200),
          updatedAt: new Date(),
        },
      });
      return existing.id;
    } else {
      // 创建新对话
      const conversation = await prisma.codeAssistantConversation.create({
        data: {
          userId,
          taskType,
          language,
          userMode,
          title: userMessage.substring(0, 100),
          modelKey,
          messageCount: 2,
          lastMessage: assistantMessage.substring(0, 200),
        },
      });
      await prisma.codeAssistantMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: userMessage,
          model: modelKey,
        },
      });
      await prisma.codeAssistantMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: assistantMessage,
          model: modelKey,
        },
      });
      return conversation.id;
    }
  } catch (err) {
    console.error('[编程助手] 保存对话失败:', err);
    return null;
  }
}

// ============ 带重试的 AI 调用 ============

async function callAIProviderWithRetry(
  userId: string,
  userRole: string,
  provider: 'aliyun' | 'tencent',
  modelId: string,
  messages: ChatMessage[],
  apiKey: string,
  stream: boolean = false
): Promise<string | AsyncIterable<string>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      // 如果是重试，尝试降级到备用模型
      if (attempt > 0 && lastError) {
        const fallback = aiModelRouter.getFallbackModel(modelId);
        if (fallback) {
          modelId = aiModelRouter.getModelInfo(fallback.modelKey)?.id || modelId;
          provider = fallback.provider as 'aliyun' | 'tencent';
          // 使用 getUserApiKey 获取 API Key（仅admin可fallback到平台Key）
          apiKey = await getUserApiKey(userId || 'system', provider, userRole) || apiKey;
          console.log(`[编程助手] 重试降级到模型: ${modelId} (${provider})`);
        }
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }

      const result = await callAIProvider(provider, modelId, messages, apiKey, stream);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`[编程助手] 调用失败 (尝试 ${attempt + 1}/${MAX_RETRY_ATTEMPTS + 1}):`, error.message);
      if (attempt === MAX_RETRY_ATTEMPTS) throw lastError;
    }
  }

  throw lastError || new Error('AI调用失败');
}

async function callAIProvider(
  provider: 'aliyun' | 'tencent',
  modelId: string,
  messages: ChatMessage[],
  apiKey: string,
  stream: boolean = false
): Promise<string | AsyncIterable<string>> {
  const config = MODEL_CONFIG[provider];

  const requestBody: any = {
    model: modelId,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    stream: stream,
  };

  if (provider === 'aliyun') {
    requestBody.max_tokens = 4096;
    requestBody.temperature = 0.7;
    requestBody.top_p = 0.95;
  } else if (provider === 'tencent') {
    requestBody.max_tokens = 4096;
    requestBody.temperature = 0.7;
  }

  // 添加超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(errorData.error?.message || `API调用失败: ${response.status}`);
    }

    if (stream) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      return {
        async *[Symbol.asyncIterator]() {
          try {
            while (true) {
              const { done, value } = await reader!.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') return;

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) yield content;
                  } catch {}
                }
              }
            }
          } finally {
            clearTimeout(timeoutId);
          }
        }
      };
    } else {
      clearTimeout(timeoutId);
      const data: any = await response.json();
      return data.choices?.[0]?.message?.content || '';
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }
    throw error;
  }
}

// ============ 路由定义 ============

/**
 * 代码生成
 * POST /api/code-assistant/generate
 */
router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  await handleCodeRequest(req, res, 'generate');
});

/**
 * 代码解释
 * POST /api/code-assistant/explain
 */
router.post('/explain', authMiddleware, async (req: Request, res: Response) => {
  await handleCodeRequest(req, res, 'explain');
});

/**
 * 代码调试
 * POST /api/code-assistant/debug
 */
router.post('/debug', authMiddleware, async (req: Request, res: Response) => {
  await handleCodeRequest(req, res, 'debug');
});

/**
 * 单元测试生成
 * POST /api/code-assistant/testgen
 */
router.post('/testgen', authMiddleware, async (req: Request, res: Response) => {
  await handleCodeRequest(req, res, 'testgen');
});

/**
 * 代码 Review
 * POST /api/code-assistant/review
 */
router.post('/review', authMiddleware, async (req: Request, res: Response) => {
  await handleCodeRequest(req, res, 'review');
});

/**
 * 自然语言转代码
 * POST /api/code-assistant/nl2code
 */
router.post('/nl2code', authMiddleware, async (req: Request, res: Response) => {
  await handleCodeRequest(req, res, 'nl2code');
});

/**
 * 低代码搭建
 * POST /api/code-assistant/lowcode
 */
router.post('/lowcode', authMiddleware, async (req: Request, res: Response) => {
  await handleCodeRequest(req, res, 'lowcode');
});

// ============ 对话历史路由 ============

/**
 * 获取对话列表
 * GET /api/code-assistant/conversations
 */
router.get('/conversations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { page = '1', pageSize = '20', taskType } = req.query;

    const where: any = { userId };
    if (taskType) where.taskType = taskType as string;

    const [conversations, total] = await Promise.all([
      prisma.codeAssistantConversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      prisma.codeAssistantConversation.count({ where }),
    ]);

    res.json({
      success: true,
      data: { conversations, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    console.error('[编程助手] 获取对话列表错误:', error);
    res.status(500).json({ success: false, error: error.message || '服务器错误' });
  }
});

/**
 * 获取对话详情（含消息）
 * GET /api/code-assistant/conversations/:id
 */
router.get('/conversations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { id } = req.params;

    const conversation = await prisma.codeAssistantConversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      res.status(404).json({ success: false, error: '对话不存在' });
      return;
    }

    res.json({ success: true, data: conversation });
  } catch (error: any) {
    console.error('[编程助手] 获取对话详情错误:', error);
    res.status(500).json({ success: false, error: error.message || '服务器错误' });
  }
});

/**
 * 删除对话
 * DELETE /api/code-assistant/conversations/:id
 */
router.delete('/conversations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { id } = req.params;

    const existing = await prisma.codeAssistantConversation.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: '对话不存在' });
      return;
    }

    await prisma.codeAssistantConversation.delete({
      where: { id },
    });

    res.json({ success: true, data: { id } });
  } catch (error: any) {
    console.error('[编程助手] 删除对话错误:', error);
    res.status(500).json({ success: false, error: error.message || '服务器错误' });
  }
});

// ============ 通用请求处理 ============

async function handleCodeRequest(req: Request, res: Response, taskType: string) {
  const startTime = Date.now();

  try {
    const userId = (req as AuthRequest).userId!;
    const userRole = (req as AuthRequest).userRole!;
    const {
      messages,
      language = 'javascript',
      userMode = 'developer',
      stream = false,
      model,
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ success: false, error: '消息不能为空' });
      return;
    }

    // 构建系统提示词
    const systemPrompt = buildSystemPrompt(taskType, language, userMode);
    const processedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages,
    ];

    // 选择模型（优先使用用户指定的，否则自动选择）
    let provider: 'aliyun' | 'tencent' = 'aliyun';
    let modelId = '';
    let modelKey = '';

    if (model && model !== 'auto') {
      const modelInfo = aiModelRouter.getModelInfo(model);
      if (modelInfo) {
        modelKey = model;
        provider = modelInfo.provider as 'aliyun' | 'tencent';
        modelId = modelInfo.id;
      }
    }

    if (!modelId) {
      const analysis = aiModelRouter.analyzeTask(messages[messages.length - 1]?.content || '');
      const selection = aiModelRouter.selectModel(analysis === 'chat' ? 'agent' : analysis);
      modelKey = selection.modelKey;
      provider = selection.provider as 'aliyun' | 'tencent';
      const modelInfo = aiModelRouter.getModelInfo(modelKey);
      modelId = modelInfo?.id || 'glm-5';
    }

    // 获取 API Key（优先使用用户自己配置的Key，仅admin可fallback到平台Key）
    const apiKey = await getUserApiKey(userId, provider, userRole);


    if (!apiKey) {
      res.status(400).json({
        success: false,
        error: 'API Key未配置',
        message: '请在「API服务商配置」页面配置API Key',
        provider: provider === 'aliyun' ? '阿里云百炼' : '腾讯云TokenHub'
      });
      return;
    }

    // 并发计数
    aiModelRouter.incrementConcurrent(modelKey);

    if (stream) {
      // 流式响应
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      let fullContent = '';
      const userMessage = messages[messages.length - 1]?.content || '';

      try {
        const streamResponse = await callAIProviderWithRetry(userId, userRole, provider, modelId, processedMessages, apiKey, true) as AsyncIterable<string>;

        // 设置流式超时
        const streamTimeout = setTimeout(() => {
          res.write(`data: ${JSON.stringify({ error: '响应超时，请稍后重试' })}\n\n`);
          res.end();
        }, STREAM_TIMEOUT_MS);

        for await (const chunk of streamResponse) {
          fullContent += chunk;
          res.write(`data: ${JSON.stringify({ content: chunk, modelKey, taskType })}\n\n`);
        }

        clearTimeout(streamTimeout);
        res.write(`data: ${JSON.stringify({ done: true, modelKey, taskType })}\n\n`);
        res.end();

        // 异步保存对话和记录用量
        const duration = Date.now() - startTime;
        saveConversation(userId, taskType, userMessage, fullContent, modelKey, language, userMode).catch(() => {});
        logApiUsage({
          userId,
          providerId: provider,
          providerName: provider === 'aliyun' ? '阿里云百炼' : '腾讯云TokenHub',
          model: modelKey,
          duration,
          status: 'success',
          responseTokens: Math.ceil(fullContent.length / 4),
        }).catch(() => {});
      } catch (error: any) {
        console.error(`[编程助手] 流式调用错误:`, error);
        const duration = Date.now() - startTime;

        if (!res.headersSent) {
          res.status(500).json({ success: false, error: error.message || 'AI服务调用失败' });
        } else {
          res.write(`data: ${JSON.stringify({ error: error.message || 'AI服务调用失败' })}\n\n`);
          res.end();
        }

        logApiUsage({
          userId,
          providerId: provider,
          providerName: provider === 'aliyun' ? '阿里云百炼' : '腾讯云TokenHub',
          model: modelKey,
          duration,
          status: 'error',
          errorMsg: error.message,
        }).catch(() => {});
      } finally {
        aiModelRouter.decrementConcurrent(modelKey);
      }
    } else {
      // 非流式响应
      try {
        const content = await callAIProviderWithRetry(userId, userRole, provider, modelId, processedMessages, apiKey, false) as string;
        const duration = Date.now() - startTime;
        const userMessage = messages[messages.length - 1]?.content || '';

        res.json({
          success: true,
          data: {
            content,
            modelKey,
            modelId,
            taskType,
            language,
            userMode,
          }
        });

        // 异步保存对话和记录用量
        saveConversation(userId, taskType, userMessage, content, modelKey, language, userMode).catch(() => {});
        logApiUsage({
          userId,
          providerId: provider,
          providerName: provider === 'aliyun' ? '阿里云百炼' : '腾讯云TokenHub',
          model: modelKey,
          duration,
          status: 'success',
          responseTokens: Math.ceil(content.length / 4),
        }).catch(() => {});
      } catch (error: any) {
        console.error(`[编程助手] 调用错误:`, error);
        const duration = Date.now() - startTime;

        res.status(500).json({
          success: false,
          error: error.message || 'AI服务调用失败',
        });

        logApiUsage({
          userId,
          providerId: provider,
          providerName: provider === 'aliyun' ? '阿里云百炼' : '腾讯云TokenHub',
          model: modelKey,
          duration,
          status: 'error',
          errorMsg: error.message,
        }).catch(() => {});
      } finally {
        aiModelRouter.decrementConcurrent(modelKey);
      }
    }
  } catch (error: any) {
    console.error(`[编程助手] ${taskType} 错误:`, error);
    res.status(500).json({
      success: false,
      error: error.message || '服务器错误',
    });
  }
}

export default router;
