/**
 * AI 模型服务 - 阿里云百炼 & 腾讯云TokenHub
 * 
 * 支持的模型：
 * - 阿里云百炼 (dashscope)：通义千问系列、文生图、视频生成等
 * - 腾讯云TokenHub：混元系列、图像、语音等
 */

// 模型列表定义
export const AI_PROVIDERS = {
  dashscope: {
    name: '阿里云百炼',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    models: {
      // 文本生成
      'qwen-turbo': { name: '通义千问-Turbo', type: 'chat', inputLimit: 8 * 1024, outputLimit: 8 * 1024 },
      'qwen-plus': { name: '通义千问-Plus', type: 'chat', inputLimit: 32 * 1024, outputLimit: 8 * 1024 },
      'qwen-max': { name: '通义千问-Max', type: 'chat', inputLimit: 8 * 1024, outputLimit: 8 * 1024 },
      'qwen-max-longcontext': { name: '通义千问-长文本', type: 'chat', inputLimit: 100 * 1024, outputLimit: 8 * 1024 },
      'qwen-2-72b': { name: '通义千问2-72B', type: 'chat', inputLimit: 32 * 1024, outputLimit: 8 * 1024 },
      'qwen-2.5-72b-instruct': { name: '通义千问2.5-72B', type: 'chat', inputLimit: 32 * 1024, outputLimit: 8 * 1024 },
      'qwen-2.5-7b-instruct': { name: '通义千问2.5-7B', type: 'chat', inputLimit: 8 * 1024, outputLimit: 8 * 1024 },
      'qwen-2.5-14b-instruct': { name: '通义千问2.5-14B', type: 'chat', inputLimit: 8 * 1024, outputLimit: 8 * 1024 },
      'qwen-2.5-32b-instruct': { name: '通义千问2.5-32B', type: 'chat', inputLimit: 8 * 1024, outputLimit: 8 * 1024 },
      
      // 图像生成
      'wanx2.1-t2i-turbo': { name: '图像生成-快速', type: 'image', inputLimit: 2 * 1024 },
      'wanx2.1-t2i-pro': { name: '图像生成-专业', type: 'image', inputLimit: 2 * 1024 },
      'wanx2.1-i2v-turbo': { name: '图生视频', type: 'video', inputLimit: 2 * 1024 },
      'wanx2.1-i2v-pro': { name: '图生视频-专业', type: 'video', inputLimit: 2 * 1024 },
      
      // 语音合成
      'cosyvoice-v1': { name: '语音合成-CosyVoice', type: 'audio', inputLimit: 2 * 1024 },
      'sambert-1': { name: '语音合成-Sambert', type: 'audio', inputLimit: 2 * 1024 },
      
      // Embedding
      'text-embedding-v3': { name: '文本向量-v3', type: 'embedding', inputLimit: 8 * 1024 },
      'text-embedding-v4': { name: '文本向量-v4', type: 'embedding', inputLimit: 8 * 1024 },
      
      // 函数调用
      'qwen-functioncalling': { name: '函数调用', type: 'chat', inputLimit: 32 * 1024, outputLimit: 8 * 1024 },
    }
  },
  tokenhub: {
    name: '腾讯云TokenHub',
    baseUrl: 'https://tokenhub.cloud.tencent.com/api/v1',
    models: {
      // 混元系列
      'hunyuan': { name: '混元-基础', type: 'chat', inputLimit: 32 * 1024, outputLimit: 8 * 1024 },
      'hunyuan-pro': { name: '混元-Pro', type: 'chat', inputLimit: 128 * 1024, outputLimit: 8 * 1024 },
      'hunyuan-flash': { name: '混元-Flash', type: 'chat', inputLimit: 32 * 1024, outputLimit: 8 * 1024 },
      'hunyuan-standard': { name: '混元-标准', type: 'chat', inputLimit: 32 * 1024, outputLimit: 8 * 1024 },
      'hunyuan-code': { name: '混元-Code', type: 'chat', inputLimit: 32 * 1024, outputLimit: 8 * 1024 },
      
      // 图像生成
      'hunyuan-image': { name: '混元-图像', type: 'image', inputLimit: 4 * 1024 },
      'hunyuan-image-v2': { name: '混元-图像v2', type: 'image', inputLimit: 4 * 1024 },
      
      // 视频生成
      'hunyuan-video': { name: '混元-视频', type: 'video', inputLimit: 2 * 1024 },
      
      // 语音合成
      'hunyuan-tts': { name: '混元-TTS', type: 'audio', inputLimit: 2 * 1024 },
      'hunyuan-tts-pro': { name: '混元-TTS专业', type: 'audio', inputLimit: 2 * 1024 },
      
      // 语音识别
      'hunyuan-asr': { name: '混元-ASR', type: 'asr', inputLimit: 60 * 1024 },
    }
  }
};

// 获取服务商信息
export function getProviderInfo(provider: string) {
  const p = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS];
  if (!p) {
    throw new Error(`不支持的服务商: ${provider}`);
  }
  return p;
}

// 获取模型列表
export function getModelList(provider?: string) {
  if (provider) {
    const p = getProviderInfo(provider);
    return Object.entries(p.models).map(([id, config]) => ({
      id,
      name: config.name,
      type: config.type,
      provider: provider,
      providerName: p.name
    }));
  }
  
  // 返回所有服务商的模型
  const allModels: any[] = [];
  for (const [providerId, providerInfo] of Object.entries(AI_PROVIDERS)) {
    for (const [modelId, config] of Object.entries(providerInfo.models)) {
      allModels.push({
        id: modelId,
        name: config.name,
        type: config.type,
        provider: providerId,
        providerName: providerInfo.name
      });
    }
  }
  return allModels;
}

// 获取模型信息
export function getModelInfo(provider: string, modelId: string) {
  const providerInfo = getProviderInfo(provider);
  const models = providerInfo.models as Record<string, any>;
  const model = models[modelId];
  if (!model) {
    throw new Error(`不支持的模型: ${modelId}`);
  }
  return {
    id: modelId,
    name: model.name,
    type: model.type,
    provider: provider,
    providerName: providerInfo.name
  };
}

// 聊天补全请求参数
export interface ChatCompletionParams {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop?: string[];
  max_tokens?: number;
  stream?: boolean;
  functions?: any[];
}

// 聊天补全响应
export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
}

// 图像生成请求
export interface ImageGenerationParams {
  model: string;
  prompt: string;
  negative_prompt?: string;
  image_size?: '512x512' | '768x768' | '1024x1024' | '720p' | '1080p';
  n?: number;
  seed?: number;
}

// 视频生成请求
export interface VideoGenerationParams {
  model: string;
  prompt?: string;
  image_url?: string;
  duration?: number;
  resolution?: '540p' | '720p' | '1080p';
}

// 语音合成请求
export interface TTSParams {
  model: string;
  text: string;
  voice?: string;
  speed?: number;
  volume?: number;
  format?: 'mp3' | 'wav' | 'pcm';
}

export { Router } from 'express';
