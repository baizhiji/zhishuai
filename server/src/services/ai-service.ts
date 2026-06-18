/**
 * AI Service - 腾讯云TokenHub + 阿里云百炼 双通道
 * 智枢 AI SaaS 系统 - 核心AI调用引擎
 *
 * 功能：
 * 1. 聊天补全 - 支持所有文本生成模型
 * 2. 图像生成 - HY-Image / 通义万相
 * 3. 视频生成 - HY-Video / 数字人口播
 * 4. 图像理解 - GLM-5V / Qwen-VL
 * 5. 视频理解 - youtu-vita
 * 6. 语音合成 - TTS
 * 7. 自动降级 - 主Key失败切备用Key，腾讯失败切阿里云
 * 8. 用量统计 - 记录每次调用的token和耗时
 */

import axios, { AxiosRequestConfig } from 'axios';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../utils/db';
import {
  getPrimaryApiKey,
  getSecondaryApiKey,
  updateApiKeyUsage,
  PROVIDER_CONFIG,
} from './user-api-key.service';
import { aiModelRouter, analyzeAndSelectModel } from './ai-model-router';

// ==================== 类型定义 ====================

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentPart[];
}

interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface ChatCompletionParams {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ImageGenerationParams {
  prompt: string;
  size?: string;
  n?: number;
}

interface VideoGenerationParams {
  prompt: string;
  model?: string;
  duration?: number;
  resolution?: string;
  digitalHumanId?: string;
  audioUrl?: string;
}

interface TTSParams {
  text: string;
  voice?: string;
  speed?: number;
}

interface AICallResult {
  success: boolean;
  data?: any;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency?: number;
  model?: string;
  provider?: string;
}

// ==================== 腾讯云TokenHub 调用 ====================

/**
 * 调用腾讯云TokenHub API
 * 文档: https://cloud.tencent.com/document/product/1729
 */
async function callTencentAPI(
  apiKey: string,
  endpoint: string,
  body: any,
  method: string = 'POST'
): Promise<AICallResult> {
  const startTime = Date.now();
  const baseUrl = PROVIDER_CONFIG.tokenhub.baseUrl;

  try {
    const config: AxiosRequestConfig = {
      method,
      url: `${baseUrl}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      data: body,
      timeout: 120000, // 视频生成可能耗时较长
    };

    const response = await axios(config);
    const latency = Date.now() - startTime;

    // 解析usage
    const usage = response.data.usage || {};

    return {
      success: true,
      data: response.data,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      },
      latency,
      model: body.model || response.data.model,
      provider: 'tencent',
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message;
    console.error(`[TokenHub] API调用失败: ${errorMsg}`, { endpoint, latency });
    return {
      success: false,
      error: errorMsg,
      latency,
      provider: 'tencent',
    };
  }
}

// ==================== 阿里云百炼 调用 ====================

/**
 * 调用阿里云百炼 API (兼容OpenAI格式)
 * 文档: https://help.aliyun.com/zh/model-studio/
 */
async function callAliyunAPI(
  apiKey: string,
  endpoint: string,
  body: any,
  method: string = 'POST'
): Promise<AICallResult> {
  const startTime = Date.now();
  const baseUrl = PROVIDER_CONFIG.dashscope.baseUrl;

  try {
    const config: AxiosRequestConfig = {
      method,
      url: `${baseUrl}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      data: body,
      timeout: 120000,
    };

    const response = await axios(config);
    const latency = Date.now() - startTime;

    const usage = response.data.usage || {};

    return {
      success: true,
      data: response.data,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      },
      latency,
      model: body.model || response.data.model,
      provider: 'aliyun',
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message;
    console.error(`[百炼] API调用失败: ${errorMsg}`, { endpoint, latency });
    return {
      success: false,
      error: errorMsg,
      latency,
      provider: 'aliyun',
    };
  }
}

// ==================== 统一调用入口 ====================

/**
 * 智能调用AI API - 自动选择服务商、自动降级
 * @param userId 用户ID（用于获取API Key）
 * @param taskType 任务类型（chat/reasoning/vision/image/video/digital_human等）
 * @param endpoint API端点
 * @param body 请求体
 * @param preferProvider 优先服务商
 */
async function smartCall(
  userId: string,
  taskType: string,
  endpoint: string,
  body: any,
  preferProvider?: 'tencent' | 'aliyun'
): Promise<AICallResult> {
  // 选择模型
  const modelSelection = analyzeAndSelectModel(
    body.messages?.[body.messages.length - 1]?.content || body.prompt || '',
    preferProvider
  );

  // 注入模型ID
  if (!body.model) {
    body.model = modelSelection.modelId;
  }

  // 确定尝试顺序
  const providers: Array<'tokenhub' | 'dashscope'> = [];
  if (modelSelection.provider === 'tencent' || preferProvider === 'tencent') {
    providers.push('tokenhub', 'dashscope');
  } else if (modelSelection.provider === 'aliyun' || preferProvider === 'aliyun') {
    providers.push('dashscope', 'tokenhub');
  } else {
    providers.push('tokenhub', 'dashscope'); // 默认优先腾讯
  }

  let lastError = '';

  for (const provider of providers) {
    // 获取主Key
    const primary = await getPrimaryApiKey(userId, provider);
    if (primary) {
      const callFn = provider === 'tokenhub' ? callTencentAPI : callAliyunAPI;
      let result = await callFn(primary.apiKey, endpoint, body);

      if (result.success) {
        // 记录用量
        await recordUsage(userId, provider, result);
        return result;
      }

      lastError = result.error || '未知错误';

      // 主Key失败，尝试备用Key
      const secondary = await getSecondaryApiKey(userId, provider);
      if (secondary) {
        result = await callFn(secondary.apiKey, endpoint, body);
        if (result.success) {
          await recordUsage(userId, provider, result);
          return result;
        }
        lastError = result.error || '未知错误';
      }
    }
  }

  // 所有尝试都失败
  return {
    success: false,
    error: `AI服务暂时不可用: ${lastError}。请在"账号与配置 > API服务商配置"中检查您的API Key是否正确配置。`,
  };
}

// ==================== 用量记录 ====================

async function recordUsage(userId: string, provider: string, result: AICallResult) {
  try {
    await prisma.aIUsageStats.create({
      data: {
        userId,
        providerId: provider,
        providerName: provider === 'tokenhub' ? '腾讯云TokenHub' : '阿里云百炼',
        feature: 'ai_call',
        model: result.model || 'unknown',
        tokens: result.usage?.totalTokens || 0,
        cost: 0, // 费用由API服务商计费，此处仅记录
        successCount: 1,
        failCount: 0,
        periodStart: new Date(),
      },
    });
  } catch (e) {
    // 用量记录失败不影响主流程
    console.error('[AI Service] 记录用量失败:', e);
  }
}

// ==================== 公开接口 ====================

/**
 * 聊天补全 - 核心文本生成接口
 * 支持所有文本类模型：混元/千问/DeepSeek/Kimi/GLM等
 */
export async function chatCompletion(
  userId: string,
  params: ChatCompletionParams
): Promise<string> {
  const result = await smartCall(userId, 'chat', '/chat/completions', {
    model: params.model,
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.max_tokens ?? 4096,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  // 解析OpenAI兼容格式的响应
  const content = result.data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI返回内容为空');
  }

  return content;
}

/**
 * 聊天补全（带完整结果）
 */
export async function chatCompletionFull(
  userId: string,
  params: ChatCompletionParams
): Promise<AICallResult> {
  const result = await smartCall(userId, 'chat', '/chat/completions', {
    model: params.model,
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.max_tokens ?? 4096,
  });

  if (!result.success) {
    return result;
  }

  const content = result.data?.choices?.[0]?.message?.content;
  result.data = {
    content,
    usage: result.usage,
    model: result.model,
    latency: result.latency,
  };

  return result;
}

/**
 * 图像生成 - 调用 HY-Image 或 通义万相
 */
export async function generateImage(
  userId: string,
  params: ImageGenerationParams
): Promise<{ urls: string[] }> {
  const result = await smartCall(
    userId,
    'image',
    '/images/generations',
    {
      prompt: params.prompt,
      size: params.size || '1024x1024',
      n: params.n || 1,
      model: 'HY-Image-V3.0',
    },
    'tencent' // 图像生成优先腾讯云
  );

  if (!result.success) {
    // 降级到阿里云通义万相
    const fallback = await smartCall(
      userId,
      'image',
      '/images/generations',
      {
        prompt: params.prompt,
        size: params.size || '1024*1024',
        n: params.n || 1,
        model: 'wanx-v1',
      },
      'aliyun'
    );

    if (!fallback.success) {
      throw new Error(fallback.error);
    }

    const urls = (fallback.data?.data || []).map((item: any) => item.url).filter(Boolean);
    return { urls };
  }

  const urls = (result.data?.data || []).map((item: any) => item.url).filter(Boolean);
  return { urls };
}

/**
 * 视频生成 - 调用 HY-Video
 */
export async function generateVideo(
  userId: string,
  params: VideoGenerationParams
): Promise<{ taskId: string; status: string }> {
  // 视频生成是异步任务，先提交获取taskId
  const result = await smartCall(
    userId,
    'digital_human',
    '/video/generations',
    {
      model: params.model || 'YT-Video-2.0',
      prompt: params.prompt,
      duration: params.duration || 10,
      resolution: params.resolution || '1080p',
    },
    'tencent'
  );

  if (!result.success) {
    throw new Error(result.error);
  }

  return {
    taskId: result.data?.id || result.data?.task_id || '',
    status: result.data?.status || 'processing',
  };
}

/**
 * 数字人口播视频生成
 */
export async function generateDigitalHumanVideo(
  userId: string,
  params: {
    script: string;
    digitalHumanId?: string;
    audioUrl?: string;
    resolution?: string;
  }
): Promise<{ taskId: string; status: string }> {
  const result = await smartCall(
    userId,
    'digital_human',
    '/video/generations',
    {
      model: 'YT-Video-HumanActor',
      prompt: params.script,
      audio_url: params.audioUrl,
      resolution: params.resolution || '1080p',
    },
    'tencent'
  );

  if (!result.success) {
    throw new Error(result.error);
  }

  return {
    taskId: result.data?.id || result.data?.task_id || '',
    status: result.data?.status || 'processing',
  };
}

/**
 * 图像理解 - 调用 GLM-5V / Qwen-VL
 */
export async function analyzeImage(
  userId: string,
  params: {
    imageUrl: string;
    prompt?: string;
  }
): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: params.imageUrl } },
        { type: 'text', text: params.prompt || '请描述这张图片的内容' },
      ],
    },
  ];

  return chatCompletion(userId, {
    model: 'glm-5v-turbo',
    messages,
    max_tokens: 2048,
  });
}

/**
 * 视频理解 - 调用 youtu-vita
 */
export async function analyzeVideo(
  userId: string,
  params: {
    videoUrl: string;
    prompt?: string;
  }
): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: params.videoUrl } },
        { type: 'text', text: params.prompt || '请分析这个视频的内容' },
      ],
    },
  ];

  return chatCompletion(userId, {
    model: 'youtu-vita',
    messages,
    max_tokens: 4096,
  });
}

/**
 * 语音合成 - TTS
 */
export async function textToSpeech(
  userId: string,
  params: TTSParams
): Promise<{ audioUrl: string }> {
  // 优先使用腾讯云TTS
  const result = await smartCall(userId, 'chat', '/audio/speech', {
    model: 'tts-1',
    input: params.text,
    voice: params.voice || 'alloy',
    speed: params.speed || 1.0,
  }, 'tencent');

  if (!result.success) {
    throw new Error(result.error);
  }

  return {
    audioUrl: result.data?.url || result.data?.audio_url || '',
  };
}

/**
 * 查询异步任务状态（视频生成等）
 */
export async function getTaskStatus(
  userId: string,
  taskId: string,
  provider: 'tokenhub' | 'dashscope' = 'tokenhub'
): Promise<{ status: string; resultUrl?: string; progress?: number }> {
  const apiKey = await getPrimaryApiKey(userId, provider);
  if (!apiKey) {
    throw new Error(`未配置${provider === 'tokenhub' ? '腾讯云TokenHub' : '阿里云百炼'}的API Key`);
  }

  const callFn = provider === 'tokenhub' ? callTencentAPI : callAliyunAPI;
  const result = await callFn(apiKey.apiKey, `/tasks/${taskId}`, {}, 'GET');

  if (!result.success) {
    throw new Error(result.error);
  }

  const data = result.data;
  return {
    status: data.status || 'unknown',
    resultUrl: data.result?.url || data.output?.video_url || data.video_url,
    progress: data.progress || data.result?.progress,
  };
}

/**
 * 获取可用模型列表
 */
export async function getAvailableModels(
  userId: string,
  provider?: 'tokenhub' | 'dashscope'
): Promise<any[]> {
  const providers: Array<'tokenhub' | 'dashscope'> = provider ? [provider] : ['tokenhub', 'dashscope'];
  const models: any[] = [];

  for (const p of providers) {
    const apiKey = await getPrimaryApiKey(userId, p);
    if (apiKey) {
      try {
        const callFn = p === 'tokenhub' ? callTencentAPI : callAliyunAPI;
        const result = await callFn(apiKey.apiKey, '/models', {}, 'GET');
        if (result.success && result.data?.data) {
          models.push(...result.data.data.map((m: any) => ({
            ...m,
            provider: p,
            providerName: p === 'tokenhub' ? '腾讯云TokenHub' : '阿里云百炼',
          })));
        }
      } catch {
        // 获取模型列表失败不影响主流程
      }
    }
  }

  return models;
}

/**
 * 检查用户是否有可用的AI服务配置
 */
export async function checkAIServiceAvailability(userId: string): Promise<{
  available: boolean;
  providers: Array<{
    provider: string;
    name: string;
    hasKey: boolean;
  }>;
}> {
  const providers = [];

  for (const [key, config] of Object.entries(PROVIDER_CONFIG)) {
    const apiKey = await getPrimaryApiKey(userId, key as 'tokenhub' | 'dashscope');
    providers.push({
      provider: key,
      name: config.name,
      hasKey: !!apiKey,
    });
  }

  return {
    available: providers.some(p => p.hasKey),
    providers,
  };
}

export default {
  chatCompletion,
  chatCompletionFull,
  generateImage,
  generateVideo,
  generateDigitalHumanVideo,
  analyzeImage,
  analyzeVideo,
  textToSpeech,
  getTaskStatus,
  getAvailableModels,
  checkAIServiceAvailability,
};
