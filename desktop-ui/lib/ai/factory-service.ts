/**
 * AI创作工厂 — 统一AI服务层（v2.0）
 *
 * 基于【智枢AI创作工厂——AI模型配置总蓝皮书 v1.0】完整实现
 * 10 个创作类目的多模型协作流水线配置
 *
 * API Key 由客户自行在阿里云百炼 / 腾讯云 TokenHub 申请并配置
 * Tokens 消耗由客户承担，平台不代付
 */

import { absUrl } from '@/utils/env';
import {
  // Provider / Model 元数据
  PROVIDER_INFO, MODEL_INFO,
  // 10 个类目的完整流水线配置
  CATEGORY_PIPELINES,
  getCategoryConfig, hasApiKey, getCategoryKeyCoverage,
  buildPhaseParams,
  type AiProvider, type CategoryPipeline, type PhaseConfig, type PipelinePhase, type ModelInfo,
} from './category-config';

/** 兼容旧名：阶段处理函数使用的模型信息类型 */
type ModelInfoType = ModelInfo;

import {
  HUMAN_TEXT_SYSTEM_PROMPT,
  XIAOHONGSHU_HUMAN_PROMPT,
  ECOMMERCE_HUMAN_PROMPT,
  enhanceImagePrompt,
  buildNegativePrompt,
  buildVideoRealismPrompt,
  qualityScore,
  injectHumanStyle,
} from './anti-ai-flavor';
import request from '@/lib/request';

// ─── 违禁内容零逃逸扫描（P0-1）────────────────

export interface BlockedHit {
  category: string;
}

const BLOCKED_PATTERNS: Array<{ regex: RegExp; category: string }> = [
  { regex: /色情|淫秽|裸体|性行为|性交易|卖淫|嫖娼/i, category: '色情' },
  { regex: /赌博|赌场|博彩|六合彩|押注/i, category: '赌博' },
  { regex: /毒品|大麻|海洛因|冰毒|摇头丸|吸毒/i, category: '毒品' },
  { regex: /枪支|弹药|爆炸物|管制刀具/i, category: '管制武器' },
  { regex: /恐怖主义|恐怖分子|ISIS|圣战/i, category: '恐怖主义' },
  { regex: /贩卖人口|器官买卖|人体器官/i, category: '人口贩卖' },
  { regex: /洗钱|非法集资|传销|庞氏骗局/i, category: '非法金融' },
  { regex: /诈骗|钓鱼|木马|黑客.*攻击|DDoS|入侵.*系统/i, category: '网络犯罪' },
  { regex: /自杀|自残|割腕|跳楼.*方法/i, category: '自残风险' },
  { regex: /暴恐|血腥|分尸|残肢|虐杀/i, category: '暴力血腥' },
];

/** 对文本做本地违禁词硬扫描（不依赖 LLM，保证零逃逸） */
export function scanBlockedContent(text: string): BlockedHit[] {
  if (!text) return [];
  const hits: BlockedHit[] = [];
  for (const p of BLOCKED_PATTERNS) {
    if (p.regex.test(text)) hits.push({ category: p.category });
  }
  return hits;
}

// ─── 类型定义 ────────────────────────────────

export interface GenerateTextParams {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface GenerateImageParams {
  prompt: string;
  negativePrompt?: string;
  size?: string;
  n?: number;
  referenceImage?: string;
  imageType?: 'portrait' | 'product' | 'scene' | 'general';
}

export interface GenerateVideoParams {
  prompt: string;
  images?: string[];
  imageUrl?: string;
  duration?: number;
  size?: string;
  voiceover?: string;
  subtitle?: string;
  bgm?: string;
  /** 横幅/贴片叠加层ID列表，传 ['auto'] 使用推荐组合 */
  overlayBanners?: string[];
  /** 横幅/贴片视觉样式（蓝皮书 11.4.4：8 种预设 + auto 自动推荐） */
  bannerStyle?: string;
  videoType?: 'portrait' | 'product' | 'scene' | 'digital-human' | 'mv' | 'enterprise';
  /** 智能剪辑：素材视频URL列表（服务端 FFmpeg 拼接成片） */
  clips?: string[];
  /** 智能剪辑：字幕文案 */
  subtitleText?: string;
  /** 智能剪辑：BGM 音频URL */
  bgmUrl?: string;
}

export interface GenerateResult {
  success: boolean;
  data?: string | string[];
  error?: string;
  provider: string;
  model: string;
}

export type ContentTypeSlug =
  | 'xiaohongshu' | 'image' | 'ecommerce' | 'shortVideo'
  | 'smartEdit' | 'enterpriseVideo' | 'productVideo'
  | 'storeTour' | 'personMv' | 'cartoonVideo' | 'digitalHuman';

// ─── API Key 管理 ────────────────────────────

function getUserApiKeys(): Record<AiProvider, string> {
  const keys: Record<AiProvider, string> = { tencent: '', alibaba: '', volcano: '' };
  if (typeof window === 'undefined') return keys;
  try {
    keys.tencent = localStorage.getItem(PROVIDER_INFO.tencent.storageKey) || '';
    keys.alibaba = localStorage.getItem(PROVIDER_INFO.alibaba.storageKey) || '';
    keys.volcano = localStorage.getItem(PROVIDER_INFO.volcano.storageKey) || '';
  } catch { /* ignore */ }
  return keys;
}

function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  try { return localStorage.getItem('token') || ''; } catch { return ''; }
}

/**
 * 服务端 provider（数据库存储值）→ 前端 AiProvider 的映射。
 * 兼容归一化值（dashscope/tokenhub/ark）与历史原始值（tencent/alibaba/volcano），
 * 避免因 provider 命名不匹配导致 Key 同步不上。
 */
const PROVIDER_ALIAS_TO_KEY: Record<string, 'tencent' | 'alibaba' | 'volcano'> = {
  tokenhub: 'tencent',
  tencent: 'tencent',
  dashscope: 'alibaba',
  alibaba: 'alibaba',
  ark: 'volcano',
  volcano: 'volcano',
};

let effectiveKeysCache: Record<AiProvider, string> | null = null;
let effectiveKeysCacheTime = 0;

/**
 * 获取有效的 API Keys：优先从服务端拉取（用户数据库配置，3/3 已就绪），
 * 失败时回退 localStorage 缓存。
 * 彻底解决「服务端已配置、本地不同步导致生成报未配置」的问题。
 */
async function getEffectiveApiKeys(): Promise<Record<AiProvider, string>> {
  const localKeys = getUserApiKeys();
  if (typeof window === 'undefined') return localKeys;

  // 5 分钟内使用缓存，避免每次生成都请求
  if (effectiveKeysCache && Date.now() - effectiveKeysCacheTime < 5 * 60 * 1000) {
    return effectiveKeysCache;
  }

  try {
    const token = getAuthToken();
    if (!token) return localKeys;
    const res = await fetch(absUrl('/api/ai-config/keys?raw=1'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      const keys: Record<AiProvider, string> = { tencent: '', alibaba: '', volcano: '' };
      for (const item of json.data) {
        const provider = PROVIDER_ALIAS_TO_KEY[item.provider];
        if (!provider || !item.apiKey) continue;
        keys[provider] = item.apiKey;
        try {
          localStorage.setItem(PROVIDER_INFO[provider].storageKey, item.apiKey);
        } catch { /* ignore */ }
      }
      effectiveKeysCache = keys;
      effectiveKeysCacheTime = Date.now();
      return keys;
    }
  } catch { /* ignore */ }
  return localKeys;
}

/**
 * 从服务端同步用户已配置的 API Key 到 localStorage。
 * 解决「服务端已保存 Key、测试通过，但当前环境 localStorage 缺失（换环境/清缓存）导致生成失败」的问题。
 */
export async function syncApiKeysFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(absUrl('/api/ai-config/keys?raw=1'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) return;
    for (const item of json.data) {
      const provider = PROVIDER_ALIAS_TO_KEY[item.provider];
      if (provider && item.apiKey) localStorage.setItem(PROVIDER_INFO[provider].storageKey, item.apiKey);
    }
  } catch { /* 同步失败不阻塞生成流程 */ }
}

// ─── 底层 HTTP 调用 ─────────────────────────

const CHAT_TIMEOUT_MS = 30000; // 30s（文本对话）
const IMAGE_TIMEOUT_MS = 300000; // 300s = 5min（图片生成火山方舟/腾讯云/阿里云平均需 1-3 分钟）

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number = IMAGE_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...init, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

async function callChatAPI(
  provider: AiProvider, modelId: string, messages: any[],
  params: { temperature?: number; maxTokens?: number; topP?: number;
            frequencyPenalty?: number; presencePenalty?: number } = {},
  _apiKey: string
): Promise<string> {
  // v4.1：改为后端代理调用 /api/ai-chat/chat，后端从数据库读取用户配置的 API Key。
  // 旧实现从 localStorage 读 Key 直连第三方，服务端 Key 不同步时导致「已配置却报未配置」。
  const token = getAuthToken();
  if (!token) throw new Error('未登录，请先登录');

  const resp = await fetchWithTimeout(absUrl('/api/ai-chat/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messages,
      stream: false,
      modelKey: 'auto',
      preferProvider: provider === 'alibaba' ? 'aliyun' : provider === 'tencent' ? 'tencent' : undefined,
    }),
  }, CHAT_TIMEOUT_MS);

  if (!resp.ok) {
    let errMsg = `AI服务调用失败（HTTP ${resp.status}）`;
    try { const j = await resp.json(); errMsg = j.error || j.message || errMsg; } catch { /* ignore */ }
    throw new Error(errMsg);
  }
  const json = await resp.json();
  const content = json.data?.message || '';
  if (!content) throw new Error('AI服务未返回内容，请稍后重试');
  return content;
}

async function callImageAPI(
  provider: AiProvider, modelId: string, prompt: string,
  params: { negativePrompt?: string; n?: number; size?: string },
  _apiKey: string
): Promise<string[]> {
  // v4.1：统一走后端代理 /api/ai-chat/image，后端从数据库读取用户配置的 API Key，
  // 并按「火山方舟 → 腾讯云 → 阿里云」自动择优与降级。彻底解决前端 Key 同步问题。
  const token = getAuthToken();
  if (!token) throw new Error('未登录，请先登录');

  const resp = await fetchWithTimeout(absUrl('/api/ai-chat/image'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      prompt,
      size: params.size,
    }),
  }, IMAGE_TIMEOUT_MS);

  if (!resp.ok) {
    let errMsg = `图片生成失败（HTTP ${resp.status}）`;
    try { const j = await resp.json(); errMsg = j.error || j.message || errMsg; } catch { /* ignore */ }
    throw new Error(errMsg);
  }
  const json = await resp.json();
  const urls = json.data?.urls || (json.data?.imageUrl ? [json.data.imageUrl] : []);
  if (Array.isArray(urls) && urls.length) return urls;
  throw new Error('图片生成未返回图片 URL，请稍后重试');
}

async function callVideoAPI(
  provider: AiProvider, modelId: string, prompt: string,
  params: { duration?: number; size?: string; images?: string[]; text?: string; imageUrl?: string; voice?: string },
  apiKey: string
): Promise<string> {
  const info = PROVIDER_INFO[provider];

  if (provider === 'alibaba') {
    const url = `${info.baseUrl}${info.videoEndpoint}`;
    // 将 1280*720 格式转为 HappyHorse 的 resolution + ratio
    const sizeMap: Record<string, [string, string]> = {
      '1280*720': ['720P', '16:9'], '1280x720': ['720P', '16:9'],
      '1920*1080': ['1080P', '16:9'], '1920x1080': ['1080P', '16:9'],
      '720*1280': ['720P', '9:16'], '720x1280': ['720P', '9:16'],
      '1080*1920': ['1080P', '9:16'], '1080x1920': ['1080P', '9:16'],
      '1024*1024': ['720P', '1:1'], '1024x1024': ['720P', '1:1'],
    };
    const rawSize = params.size || '1280x720';
    const [resolution, ratio] = sizeMap[rawSize] || ['720P', '16:9'];
    const body = {
      model: modelId,
      input: { prompt },
      parameters: { resolution, ratio, duration: params.duration || 5 },
    };
    const resp = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`${info.label} (${resp.status}): ${await resp.text()}`);
    const submitJson = await resp.json();
    const taskId = submitJson.output?.task_id || submitJson.request_id || '';
    if (!taskId) {
      // 少数模型可能同步返回
      return submitJson.output?.video_url || submitJson.output?.results?.[0]?.url || '';
    }
    // 异步轮询（最多 5 分钟）
    const pollUrl = `${info.baseUrl}/api/v1/tasks/${taskId}`;
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const pollResp = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!pollResp.ok) throw new Error(`${info.label} poll (${pollResp.status}): ${await pollResp.text()}`);
      const pollJson = await pollResp.json();
      const status = pollJson.output?.task_status || pollJson.status || '';
      if (status === 'SUCCEEDED' || status === 'succeeded' || status === 'completed' || status === 'success') {
        return pollJson.output?.video_url || pollJson.output?.results?.[0]?.url || '';
      }
      if (status === 'FAILED' || status === 'failed' || status === 'error') {
        throw new Error(`${info.label} task failed: ${pollJson.output?.message || pollJson.message || JSON.stringify(pollJson).slice(0, 300)}`);
      }
    }
    throw new Error(`${info.label} 视频生成超时（5分钟）`);
  }

  if (provider === 'tencent') {
    // TokenHub 视频使用原生 submit+poll 模式
    const submitUrl = `${info.baseUrl}${info.videoEndpoint}`;
    const baseUrl = info.baseUrl;

    // Step 1: 提交任务
    const submitBody: any = {
      model: modelId,
      prompt,
      duration: params.duration || 5,
      size: params.size || '1280x720',
    };
    if (params.images && params.images.length > 0) {
      submitBody.image_url = params.images[0];
    }

    // 数字人模型：TokenHub 要求提供音频 URL，不直接支持 text 驱动。
    // 先用阿里云百炼 TTS 生成音频，再把音频 URL 传给数字人接口。
    if (modelId === 'yt-video-humanactor') {
      // TokenHub 数字人是"图片+音频"驱动，必须提供 image_url + audio_url。
      const imageUrl = params.imageUrl || params.images?.[0];
      if (!imageUrl) {
        throw new Error('数字人需要上传一张人物照片作为形象');
      }
      const aliKey = (await getEffectiveApiKeys()).alibaba || '';
      if (!aliKey) {
        throw new Error('数字人需要阿里云百炼 API Key 先合成配音音频');
      }
      const ttsModel = 'qwen-tts';
      const ttsUrl = `${PROVIDER_INFO.alibaba.baseUrl}${PROVIDER_INFO.alibaba.multimodalImageEndpoint}`;
      const ttsResp = await fetch(ttsUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${aliKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ttsModel,
          input: { text: (params.text || prompt).slice(0, 500) },
          parameters: { voice: params.voice || 'zhixiaobai', language_type: 'Chinese', format: 'mp3' },
        }),
      });
      if (!ttsResp.ok) throw new Error(`数字人TTS (${ttsResp.status}): ${await ttsResp.text()}`);
      const ttsJson = await ttsResp.json();
      const audioUrl = ttsJson.output?.audio?.url || ttsJson.output?.audio_url || ttsJson.output?.url || '';
      if (!audioUrl) throw new Error('数字人TTS未返回音频URL');
      submitBody.image_url = imageUrl;
      submitBody.audio_url = audioUrl;
      // 数字人不需要 duration/size/text
      delete submitBody.duration;
      delete submitBody.size;
      delete submitBody.text;
    }

    const submitResp = await fetch(submitUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(submitBody),
    });
    if (!submitResp.ok) throw new Error(`${info.label} submit (${submitResp.status}): ${await submitResp.text()}`);
    const submitJson = await submitResp.json();
    const taskId = submitJson.task_id || submitJson.id || submitJson.request_id;
    if (!taskId) {
      console.log('[callVideoAPI] submit response:', JSON.stringify(submitJson));
      return submitJson.video_url || submitJson.url || '';
    }

    // Step 2: 轮询任务状态
    const pollUrl = `${baseUrl}/v1/api/video/query`;
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const pollResp = await fetch(pollUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      });
      if (!pollResp.ok) throw new Error(`${info.label} poll (${pollResp.status}): ${await pollResp.text()}`);
      const pollJson = await pollResp.json();
      const status = pollJson.status || pollJson.state;
      if (status === 'succeeded' || status === 'completed' || status === 'success') {
        return pollJson.video_url || pollJson.url || pollJson.output?.video_url || '';
      }
      if (status === 'failed' || status === 'error') {
        throw new Error(`${info.label} task failed: ${pollJson.error || pollJson.message || JSON.stringify(pollJson)}`);
      }
    }
    throw new Error(`${info.label} 视频生成超时（3分钟）`);
  }

  if (provider === 'volcano') {
    // 火山方舟：Seedance 视频生成，提交任务 + 轮询（OpenAI 兼容异步）
    const submitUrl = `${info.baseUrl}${info.videoEndpoint}`;
    const submitBody: any = {
      model: modelId,
      content: [{ type: 'text', text: prompt }],
    };
    if (params.images && params.images.length > 0) {
      submitBody.content.push({ type: 'image_url', image_url: { url: params.images[0] } });
    } else if (params.imageUrl) {
      submitBody.content.push({ type: 'image_url', image_url: { url: params.imageUrl } });
    }
    const submitResp = await fetch(submitUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(submitBody),
    });
    if (!submitResp.ok) throw new Error(`${info.label} submit (${submitResp.status}): ${await submitResp.text()}`);
    const submitJson = await submitResp.json();
    const taskId = submitJson.id || submitJson.task_id;
    if (!taskId) {
      // 可能同步返回
      const videoUrl = submitJson.output?.video_url || submitJson.video_url || submitJson.url || '';
      if (videoUrl) return videoUrl;
      throw new Error(`${info.label}: 视频任务提交未返回 task id`);
    }

    // 轮询任务状态（最多 5 分钟）
    const pollUrl = `${info.baseUrl}${info.videoEndpoint}/${taskId}`;
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const pollResp = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!pollResp.ok) throw new Error(`${info.label} poll (${pollResp.status}): ${await pollResp.text()}`);
      const pollJson = await pollResp.json();
      const status = pollJson.status || pollJson.state || pollJson.output?.status || '';
      if (status === 'succeeded' || status === 'completed' || status === 'success') {
        return pollJson.output?.video_url || pollJson.video_url || pollJson.url || pollJson.output?.url || '';
      }
      if (status === 'failed' || status === 'error' || status === 'cancelled') {
        throw new Error(`${info.label} task failed: ${pollJson.error?.message || pollJson.message || JSON.stringify(pollJson).slice(0, 300)}`);
      }
    }
    throw new Error(`${info.label} 视频生成超时（5分钟）`);
  }

  throw new Error(`不支持的 provider: ${provider}`);
}

// ─── 反 AI 化系统提示词映射 ─────────────────

const ANTI_AI_SYSTEM_PROMPTS: Record<string, string> = {
  xiaohongshu: XIAOHONGSHU_HUMAN_PROMPT,
  ecommerce: ECOMMERCE_HUMAN_PROMPT,
  video_script: `你是一个抖音/快手短视频创作者，你的脚本风格口语化、接地气，有节奏感。不用"首先其次最后"，像朋友聊天一样写。`,
  enterprise: `你是一个真实的企业品牌策划，你的文案专业但不八股。用真实的企业案例和员工视角来写，避免假大空。`,
  product: `你是一个实际的带货主播/电商运营，你的文案直接、接地气、有说服力。不用套话，用真实使用感受打动用户。`,
  review: `你是一个真实的探店博主。你的文案有现场感、有细节，好就说好，不好的地方也会客观提一下。用第一人称写。`,
  creative: `你是一个独立音乐人/导演。你的文案有艺术感但不矫情。用创作人的真实视角来表达，避免空洞的文艺腔。`,
  cute: `你是一个萌宠博主/动画师。你的文案温暖、可爱但不做作。用日常相处的真实细节来打动人。`,
  talk: `你是一个真实的口播博主。你的话术语速自然、有停顿、有口头禅。用日常聊天的语气，不是背稿子的感觉。`,
};

function getAntiAiPrompt(phase: string): string {
  return ANTI_AI_SYSTEM_PROMPTS[phase] || HUMAN_TEXT_SYSTEM_PROMPT;
}

// ─── 核心：多阶段流水线执行 ─────────────────

export interface PipelineTaskResult {
  phase: string;
  label: string;
  success: boolean;
  modelName: string;
  provider: string;
  duration: number;
  outputPreview: string;
  output?: string;
  error?: string;
}

export interface PipelineResponse {
  success: boolean;
  data: {
    totalDuration?: number;
    successCount?: number;
    totalCount?: number;
    finalOutput?: string;
    tasks?: PipelineTaskResult[];
    // backward compat
    taskType?: string;
    modelKey?: string;
    modelId?: string;
    modelName?: string;
    provider?: string;
    message?: string;
  };
}

/** 将 Blob 转为 base64 Data URL（用于火山方舟 TTS 二进制音频返回） */
async function blobToDataUrl(blob: Blob): Promise<string | null> {
  try {
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return `data:${blob.type || 'audio/mpeg'};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

/**
 * 前端直连多阶段流水线（不经过服务端）
 * 客户自己的 API Key 驱动，不消耗平台 Token
 */
export async function generateWithLocalPipeline(
  slug: ContentTypeSlug,
  userInput: string
): Promise<PipelineResponse> {
  const config = getCategoryConfig(slug);
  if (!config) {
    return { success: false, data: { message: `未知类目: ${slug}` } };
  }

  const apiKeys = await getEffectiveApiKeys();
  const tasks: PipelineTaskResult[] = [];
  let accumulatedText = userInput;
  const startTime = Date.now();

  for (const phase of config.phases) {
    if (!phase.enabled) continue;
    const phaseStart = Date.now();
    const modelInfo = MODEL_INFO[phase.primaryModel];
    if (!modelInfo) {
      tasks.push({ phase: phase.phase, label: phase.label, success: false, modelName: 'unknown', provider: '-', duration: 0, outputPreview: '', error: `未知模型: ${phase.primaryModel}` });
      continue;
    }

    const key = apiKeys[modelInfo.provider];
    if (!key) {
      // 尝试降级
      if (phase.fallbackModel) {
        const fbInfo = MODEL_INFO[phase.fallbackModel];
        if (fbInfo && apiKeys[fbInfo.provider]) {
          const result = await executePhase(phase, fbInfo, apiKeys[fbInfo.provider]!, accumulatedText, userInput);
          if (!result) {
            tasks.push({ phase: phase.phase, label: phase.label, success: false, modelName: fbInfo.displayName, provider: PROVIDER_INFO[fbInfo.provider].label, duration: Date.now() - phaseStart, outputPreview: '', error: '降级调用失败' });
            continue;
          }
          tasks.push({
            phase: phase.phase, label: phase.label,
            success: true, modelName: fbInfo.displayName,
            provider: PROVIDER_INFO[fbInfo.provider].label,
            duration: Date.now() - phaseStart,
            outputPreview: (result.data || '').slice(0, 120),
            output: result.data,
          });
          if (result.data) accumulatedText = result.data;
          continue;
        }
      }
      tasks.push({ phase: phase.phase, label: phase.label, success: false, modelName: modelInfo.displayName, provider: PROVIDER_INFO[modelInfo.provider].label, duration: 0, outputPreview: '', error: `缺少 ${PROVIDER_INFO[modelInfo.provider].label} API Key，请在设置中配置` });
      continue;
    }

    try {
      const result = await executePhase(phase, modelInfo, key, accumulatedText, userInput);
      tasks.push({
        phase: phase.phase, label: phase.label,
        success: true, modelName: modelInfo.displayName,
        provider: PROVIDER_INFO[modelInfo.provider].label,
        duration: Date.now() - phaseStart,
        outputPreview: (result.data || '').slice(0, 120),
        output: result.data,
      });
      if (result.data) accumulatedText = result.data;
    } catch (e: any) {
      // 尝试降级
      if (phase.fallbackModel) {
        const fbInfo = MODEL_INFO[phase.fallbackModel];
        if (fbInfo && apiKeys[fbInfo.provider]) {
          try {
            const result = await executePhase(phase, fbInfo, apiKeys[fbInfo.provider]!, accumulatedText, userInput);
            tasks.push({
              phase: phase.phase, label: phase.label,
              success: true, modelName: `[降级] ${fbInfo.displayName}`,
              provider: PROVIDER_INFO[fbInfo.provider].label,
              duration: Date.now() - phaseStart,
              outputPreview: (result.data || '').slice(0, 120),
              output: result.data,
            });
            if (result.data) accumulatedText = result.data;
            continue;
          } catch { /* double fail, fall through */ }
        }
      }
      tasks.push({ phase: phase.phase, label: phase.label, success: false, modelName: modelInfo.displayName, provider: PROVIDER_INFO[modelInfo.provider].label, duration: Date.now() - phaseStart, outputPreview: '', error: e.message });
    }
  }

  const successCount = tasks.filter(t => t.success).length;
  // P0-1 零逃逸收口：最终输出再次硬扫描，命中则整单判为失败并置空 finalOutput
  const finalBlockedHits = scanBlockedContent(accumulatedText);
  if (finalBlockedHits.length > 0) {
    tasks.push({
      phase: 'final_safety', label: '最终安全校验',
      success: false, modelName: 'local-scan', provider: '本地规则',
      duration: 0, outputPreview: '',
      error: `最终输出命中违禁内容（${finalBlockedHits.map(h => h.category).join('、')}），已拦截`,
    });
    return {
      success: false,
      data: {
        totalDuration: Date.now() - startTime,
        successCount, totalCount: tasks.length,
        finalOutput: '',
        tasks,
        message: `生成内容未通过安全校验（命中：${finalBlockedHits.map(h => h.category).join('、')}），已拦截展示`,
      },
    };
  }
  return {
    success: successCount > 0,
    data: {
      totalDuration: Date.now() - startTime,
      successCount, totalCount: tasks.length,
      finalOutput: accumulatedText,
      tasks,
    },
  };
}

async function executePhase(
  phase: PhaseConfig, modelInfo: any, apiKey: string,
  accumulatedText: string, originalInput: string
): Promise<Record<string, unknown> & { data?: string }> {
  const params = phase.params || {};
  const phaseParams = { temperature: params.temperature, maxTokens: params.maxOutput || 2000, topP: params.top_p, frequencyPenalty: params.frequency_penalty, presencePenalty: params.presence_penalty };

  switch (phase.phase) {
    case 'viral_analysis': {
      const sysPrompt = `你是一个爆款内容分析师。分析用户输入的主题，找出其爆款基因：信息差、情绪价值、身份认同、行动诱因。输出结构化的分析结果。`;
      const prompt = `请分析以下主题的爆款潜力，输出情绪切入点、目标人群画像、核心信息差、推荐标题方向：\n\n${accumulatedText}`;
      const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: prompt }], phaseParams, apiKey);
      return { data: `【爆款分析】\n${content}\n\n【用户原始需求】\n${originalInput}` };
    }

    case 'outline': {
      const sysPrompt = `你是一个专业内容策划。根据爆款分析结果，输出结构化的创作大纲。`;
      const prompText = `根据以下分析结果，生成一个详细的创作大纲（包括标题、开头钩子、主体段落、结尾CTA）：\n\n${accumulatedText}`;
      const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: prompText }], phaseParams, apiKey);
      return { data: content };
    }

    case 'draft': {
      const sysPrompt = `你是一个经验丰富的创作者。根据大纲写出完整初稿。发挥创意，不要拘谨。`;
      const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: accumulatedText }], phaseParams, apiKey);
      return { data: content };
    }

    case 'anti_ai_rewrite': {
      const sysPrompt = getAntiAiPrompt(params.systemPrompt || 'general');
      const rewritePrompt = `请将以下内容按真人创作者的风格完全重写一遍。要求：口语化、自然、有趣、去AI味。不使用"首先其次最后""综上所述""值得注意的是"等AI标志性词汇。直接输出重写后的完整内容：\n\n${accumulatedText}`;
      const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: rewritePrompt }], { ...phaseParams, temperature: params.temperature ?? 0.75 }, apiKey);
      return { data: content };
    }

    case 'quality_review': {
      const sysPrompt = `你是一个严苛的内容质量审查员。对比初稿和改写稿，检查是否有AI味残留、是否自然、是否有逻辑错误。输出评审意见和改进建议。`;
      const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: accumulatedText }], { ...phaseParams, temperature: params.temperature ?? 0.2 }, apiKey);
      return { data: content };
    }

    case 'style_calibration': {
      const sysPrompt = `你是一个内容风格校准专家。请根据质量评审意见，对内容进行最终润色和风格校准。目标是让内容达到"专业编辑审校定稿"的质量标准——语言表达精准、风格调性统一、节奏张弛有度、无任何AI残留痕迹。请直接输出校准后的完整定稿内容：`;
      const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: `质量评审意见：\n${accumulatedText}\n\n请根据以上评审意见，输出风格校准后的最终定稿。` }], { ...phaseParams, temperature: params.temperature ?? 0.65 }, apiKey);
      return { data: content };
    }

    case 'platform_adapt': {
      const platform = params.platform || 'xiaohongshu';
      const sysPrompt = `你是一个多平台内容运营。根据目标平台的风格要求，将内容裁剪适配为适合${platform}发布的格式。`;
      const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: `请将此内容适配为${platform}平台风格：\n\n${accumulatedText}` }], phaseParams, apiKey);
      return { data: content };
    }

    case 'visual_strategy': {
      const sysPrompt = `你是一个视觉策略师。根据内容描述，为图片/视频生成详细的视觉设计策略，包括色调、构图、光影、风格建议。`;
      const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: accumulatedText }], phaseParams, apiKey);
      return { data: content };
    }

    case 'image_prompt': {
      const sysPrompt = `你是一个AI绘图Prompt工程师。根据内容和视觉策略，生成高质量的中文绘画提示词。要求详细、具体、有画面感。输出正向prompt和负向prompt两份。`;
      const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: accumulatedText }], phaseParams, apiKey);
      return { data: content };
    }

    case 'script_generate': {
      const sysPrompt = `你是一个短视频导演。根据主题生成详细的分镜脚本，包括镜头类型、时长、画面描述、旁白/字幕。`;
      const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: accumulatedText }], phaseParams, apiKey);
      return { data: content };
    }

    // ─── v4.0 智能剪辑产线阶段（蓝皮书 §4.1）───
    case 'edit_plan': {
      // 阶段1：需求解析 / 剪辑脚本
      const sysPrompt = `你是一个专业视频剪辑导演。根据用户上传的多个视频素材和剪辑需求，输出完整的剪辑脚本：1)剪辑目标与成片结构 2)素材挑选策略（哪个片段讲什么）3)开头钩子设计（前3秒）4)节奏风格（卡点/叙事/混剪/剧情）5)预期时长与镜头数。`;
      const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: `素材清单：${originalInput}\n剪辑需求：${accumulatedText}` }], { ...phaseParams, temperature: params.temperature ?? 0.7 }, apiKey);
      return { data: `【剪辑脚本】\n${content}\n\n【素材清单】\n${originalInput}` };
    }

    case 'clip_analysis': {
      // 阶段2：素材理解 / 剪辑点识别（视频理解模型，结构化 JSON 输出）
      const sysPrompt = `你是一个视频理解引擎。逐段分析用户提供的视频素材，识别每个片段的内容：场景、主体动作、镜头质量、可用的剪辑点（入点/出点）、精彩瞬间（表情/动作/转折）。按素材编号结构化输出，供后续镜头排序使用。`;
      const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: `请分析以下素材并输出每段的剪辑点建议：\n${accumulatedText}` }], { ...phaseParams, temperature: params.temperature ?? 0.3 }, apiKey);
      return { data: `【素材理解与剪辑点】\n${content}` };
    }

    case 'shot_order': {
      // 阶段3：镜头排序 / 卡点编排
      const sysPrompt = `你是一个视频节奏剪辑师。根据剪辑脚本和素材剪辑点分析结果，编排镜头顺序：钩子（前3秒）→ 主体叙事 → 高潮 → 结尾CTA。每个镜头标注：素材编号、入点/出点、镜头时长、转场方式（硬切/叠化/缩放）、与BGM卡点对齐的节奏。输出结构化镜头编排表。`;
      const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: `请根据剪辑脚本和素材分析，输出镜头编排表：\n${accumulatedText}` }], { ...phaseParams, temperature: params.temperature ?? 0.6 }, apiKey);
      return { data: `【镜头排序与卡点编排】\n${content}` };
    }

    case 'color_grading': {
      // 阶段7：调色 / 滤镜策略
      const sysPrompt = `你是一个专业调色师。根据成片风格输出 FFmpeg 可执行的调色/滤镜策略：色温、对比度、饱和度、HSL调整、LUT风格（电影感/日系清新/高对比商业/复古胶片）、字幕与片头的字体风格。输出结构化调色指令表。`;
      const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: `请根据剪辑脚本和内容风格输出调色策略：\n${accumulatedText}` }], { ...phaseParams, temperature: params.temperature ?? 0.5 }, apiKey);
      return { data: `【调色与滤镜策略】\n${content}` };
    }

    case 'local_compose': {
      // 阶段8：本地 FFmpeg 合成（无模型，生成合成指令供桌面端执行）
      const sysPrompt = `你是一个 FFmpeg 合成指令生成器。根据镜头编排表、调色策略、字幕文本，生成一份完整的本地 FFmpeg 合成清单（JSON）：包含 concat 滤镜、trim 段、xfade 转场、subtitles 滤镜、colorbalance/curves 调色滤镜、scale/pad 分辨率归一化。注意：只输出指令清单，不输出执行结果。`;
      try {
        const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: `请生成 FFmpeg 合成指令清单：\n${accumulatedText}` }], { ...phaseParams, temperature: params.temperature ?? 0.3 }, apiKey);
        return { data: `【本地FFmpeg合成指令】\n${content}\n\n⚠️ 请在智枢AI桌面端执行 FFmpeg 合成（本地执行，不上传素材）` };
      } catch {
        return { data: `${accumulatedText}\n\n【本地FFmpeg合成】请在智枢AI桌面端执行合成（AI已完成脚本/剪辑点/卡点/调色，桌面FFmpeg合成成片）` };
      }
    }

    case 'compliance_check': {
      // P0-1 零逃逸：先做本地违禁词硬拦截，命中直接中断流水线，不依赖 LLM 判定
      const blockedHits = scanBlockedContent(accumulatedText);
      if (blockedHits.length > 0) {
        throw new Error(`内容安全审查未通过（命中：${blockedHits.map(h => h.category).join('、')}），本次生成已拦截`);
      }
      const sysPrompt = `你是一个内容合规审核员。检查内容是否违反广告法、是否涉及敏感话题、是否存在虚假宣传。如果是智能剪辑成片，还需输出 AIGC 标识文案（蓝皮书要求：成片包含"本视频由AI辅助剪辑"标识）与合规报告。`;
      const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [{ role: 'system', content: sysPrompt }, { role: 'user', content: accumulatedText }], { ...phaseParams, temperature: 0.1 }, apiKey);
      return { data: content };
    }

    case 'tts_generate': {
      // 阿里云百炼 TTS：使用 multimodal-generation 端点 + qwen-tts 模型
      // 使用 input.text 格式（非 input.messages），同步返回 audio URL
      if (modelInfo.provider === 'alibaba') {
        const ttsUrl = `${PROVIDER_INFO.alibaba.baseUrl}${PROVIDER_INFO.alibaba.multimodalImageEndpoint}`;
        const ttsBody = {
          model: modelInfo.modelId,
          input: { text: accumulatedText.slice(0, 500) },
          parameters: { voice: params.style || 'default', format: 'mp3' },
        };
        const ttsResp = await fetch(ttsUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(ttsBody),
        });
        if (!ttsResp.ok) throw new Error(`TTS (${ttsResp.status}): ${await ttsResp.text()}`);
        const ttsJson = await ttsResp.json();
        const audioUrl = ttsJson.output?.audio?.url || ttsJson.output?.audio_url || ttsJson.output?.url || '';
        if (audioUrl) {
          return { data: `[配音完成] ${audioUrl}` };
        }
      }
      // Tencent TTS 尝试
      if (modelInfo.provider === 'tencent') {
        const ttsUrl = `${PROVIDER_INFO.tencent.baseUrl}${PROVIDER_INFO.tencent.multimodalImageEndpoint}`;
        try {
          const ttsResp = await fetch(ttsUrl, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelInfo.modelId, prompt: accumulatedText.slice(0, 500) }),
          });
          if (ttsResp.ok) {
            const ttsJson = await ttsResp.json();
            const audioUrl = ttsJson.data?.[0]?.url || ttsJson.url || '';
            if (audioUrl) return { data: `[配音完成] ${audioUrl}` };
          }
        } catch { /* fall through */ }
      }
      // 火山方舟 TTS（OpenAI 兼容 /audio/speech 端点，返回二进制音频）
      if (modelInfo.provider === 'volcano') {
        const ttsUrl = `${PROVIDER_INFO.volcano.baseUrl}/audio/speech`;
        try {
          const ttsResp = await fetch(ttsUrl, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: modelInfo.modelId,
              input: accumulatedText.slice(0, 500),
              voice: params.voice || 'zh_female_shuangkuaisoprano_moon_bigtts',
              response_format: 'mp3',
            }),
          });
          if (ttsResp.ok) {
            const blob = await ttsResp.blob();
            const dataUrl = await blobToDataUrl(blob);
            if (dataUrl) return { data: `[配音完成] ${dataUrl}` };
          }
        } catch { /* fall through */ }
      }
      // Fallback: 返回文本
      return { data: `[配音文本] ${accumulatedText.slice(0, 200)}...` };
    }

    case 'bgm_generate': {
      // v3.2：BGM 配乐选曲建议 — 改用 LLM 分析文案情绪，输出专业免版权 BGM 选曲方案
      const dur = Number(phase.params?.duration) || 30;
      const bgmResult = await callBGMSuggestionForPhase(accumulatedText, dur, modelInfo, phaseParams, apiKey);
      return { data: bgmResult };
    }

    case 'brand_voice_clone': {
      // v3.0：品牌配音克隆 — Alibaba qwen-tts / MiniMax TTS
      const voiceText = extractVoiceText(accumulatedText);
      if (modelInfo.provider === 'alibaba') {
        try {
          const ttsUrl = `${PROVIDER_INFO.alibaba.baseUrl}${PROVIDER_INFO.alibaba.multimodalImageEndpoint}`;
          const ttsParams: Record<string, unknown> = { voice: phase.params?.voiceId || 'zhixiaobai', language_type: 'Chinese', format: 'mp3' };
          // 注意: qwen-tts 不支持 emotion 参数，已移除
          const ttsResp = await fetch(ttsUrl, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelInfo.modelId, input: { text: voiceText }, parameters: ttsParams }),
          });
          if (ttsResp.ok) {
            const ttsJson = await ttsResp.json();
            const audioUrl = ttsJson.output?.audio?.url || ttsJson.output?.audio_url || ttsJson.output?.url || '';
            if (audioUrl) return { data: `${accumulatedText}\n\n[品牌配音音频] ${audioUrl}` };
          }
        } catch { /* fall through */ }
      }
      return { data: `${accumulatedText}\n\n[品牌配音] 配音文本: ${voiceText.slice(0, 100)}... (需上传品牌声音样本完成克隆)` };
    }

    case 'subtitle_generate': {
      // v3.1：中英双语字幕生成
      return await generateSubtitles(accumulatedText, modelInfo, phaseParams, apiKey);
    }

    case 'video_edit': {
      // v3.1：视频瑕疵修复
      return await callVideoEdit(accumulatedText, modelInfo, phaseParams, apiKey);
    }

    case 'image_enhance': {
      // v3.1：图片质量增强 — 调用多模态端点做 refiner 处理
      const imgUrls = extractImageUrls(accumulatedText);
      const targetUrl = imgUrls[0];
      if (targetUrl && modelInfo.provider === 'alibaba') {
        try {
          const enhanceUrl = `${PROVIDER_INFO.alibaba.baseUrl}${PROVIDER_INFO.alibaba.multimodalImageEndpoint}`;
          const opType = phase.params?.operation || 'refine';
          const enhanceBody = {
            model: modelInfo.modelId,
            input: { messages: [{ role: 'user', content: [{ image: targetUrl }, { text: opType === 'refine' ? 'Enhance this image: sharpen details, remove AI artifacts and distortion, refine textures and edges, keep composition and subject unchanged.' : 'Improve image quality with higher resolution and cleaner details.' }] }] },
            parameters: { size: phase.params?.size || '1664x1664', n: 1 },
          };
          const enhanceResp = await fetch(enhanceUrl, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(enhanceBody),
          });
          if (enhanceResp.ok) {
            const enhanceJson = await enhanceResp.json();
            const contents = enhanceJson.output?.choices?.[0]?.message?.content || [];
            const newUrls = contents.filter((c: any) => c.image).map((c: any) => c.image);
            if (newUrls.length > 0) return { data: `[增强图片] ${newUrls[0]}\n\n${accumulatedText}` };
            const fbUrls = (enhanceJson.output?.results || []).map((r: any) => r.url);
            if (fbUrls.length > 0) return { data: `[增强图片] ${fbUrls[0]}\n\n${accumulatedText}` };
          }
        } catch { /* fallback */ }
      }
      return { data: accumulatedText, _imageEnhance: true };
    }

    case 'dialect_voiceover': {
      // v3.1：方言配音
      return await callDialectVoiceover(accumulatedText, modelInfo, phaseParams, apiKey);
    }

    case 'image_generate': {
      // 从 accumulatedText 提取图片 prompt，调用 callImageAPI 实际出图
      const imagePrompt = extractImagePrompt(accumulatedText);
      const n = Number(phase.params?.n) || 1;
      const size = String(phase.params?.size || '1024x1024');
      const style = String(phase.params?.style || 'general');
      const enhanced = enhanceImagePrompt(imagePrompt, style as any);
      const negative = buildNegativePrompt(style as any);
      const urls = await callImageAPI(modelInfo.provider, modelInfo.modelId, enhanced, { negativePrompt: negative, n, size }, apiKey);
      const urlLines = urls.map((u, i) => `[图片${i + 1}] ${u}`).join('\n');
      return { data: `${accumulatedText}\n\n【生成图片 ${urls.length} 张】\n${urlLines}` };
    }

    case 'image_select': {
      // 从 accumulatedText 解析所有图片 URL，用 LLM 评审择优
      const allUrls = extractImageUrls(accumulatedText);
      if (allUrls.length === 0) return { data: accumulatedText };
      if (allUrls.length === 1) return { data: `${accumulatedText}\n\n【择优结果】唯一图片: ${allUrls[0]}` };
      try {
        const selectPrompt = `从以下 ${allUrls.length} 张图片中挑选最优的一张，输出格式：\n选中的图片编号：X\n理由：一句话说明\n\n${allUrls.map((u, i) => `图片${i + 1}: ${u}`).join('\n')}\n\n内容主题：${accumulatedText.slice(0, 300)}`;
        const selection = await callChatAPI(modelInfo.provider, modelInfo.modelId, [
          { role: 'system', content: '你是专业视觉评审，请从多张图片中挑选质量最优的一张。只输出编号和简短理由。' },
          { role: 'user', content: selectPrompt },
        ], { temperature: 0.2, maxTokens: 500 }, apiKey);
        const match = selection.match(/图片(\d+)/);
        const idx = match ? Math.min(parseInt(match[1], 10) - 1, allUrls.length - 1) : 0;
        return { data: `${accumulatedText}\n\n【择优结果】选中图片${idx + 1}: ${allUrls[idx]}\n评审: ${selection.slice(0, 120)}` };
      } catch {
        return { data: `${accumulatedText}\n\n【择优结果】默认选图1: ${allUrls[0]}` };
      }
    }

    case 'video_generate': {
      // 从 accumulatedText 提取视频脚本，调用 callVideoAPI 生成视频
      const videoPrompt = extractVideoPrompt(accumulatedText);
      const duration = Number(phase.params?.duration) || 10;
      const size = String(phase.params?.size || '1280x720');
      const refImages = extractImageUrls(accumulatedText);
      const videoUrl = await callVideoAPI(modelInfo.provider, modelInfo.modelId, videoPrompt, { duration, size, images: refImages.length > 0 ? refImages.slice(0, 1) : undefined, text: accumulatedText.slice(0, 500) }, apiKey);
      return { data: `${accumulatedText}\n\n【生成视频】${videoUrl}` };
    }

    case 'digital_human': {
      // 数字人出镜：图片+音频合成
      const scriptText = extractVoiceText(accumulatedText);
      const imgUrls = extractImageUrls(accumulatedText);
      const videoUrl = await callVideoAPI(modelInfo.provider, modelInfo.modelId, `数字人口播: ${scriptText.slice(0, 300)}`, { duration: Number(phase.params?.duration) || 30, size: String(phase.params?.size || '1280x720'), images: imgUrls.length > 0 ? imgUrls.slice(0, 1) : undefined, imageUrl: imgUrls[0] || undefined, text: scriptText }, apiKey);
      return { data: `${accumulatedText}\n\n【数字人视频】${videoUrl}` };
    }

    default:
      return { data: accumulatedText };
  }
}

// ─── v3.1 新增阶段：字幕生成 ─────────────────

/**
 * 中英双语字幕生成
 * 从文案脚本中提取对白/旁白，生成标准SRT格式双语字幕
 * 整合去AI味：对白口语化、俚语方言化、情感标记
 */
async function generateSubtitles(
  script: string,
  modelInfo: ModelInfoType,
  params: Record<string, unknown>,
  apiKey: string,
  aiContext?: string
): Promise<{ data: string; _subtitles?: Record<string, unknown> }> {
  const subtitlePrompt = getSubtitlePrompt(params);
  const payload: Record<string, unknown> = {
    model: modelInfo.modelId,
    messages: [
      {
        role: 'system',
        content: `你是一个专业的视频字幕制作专家。请从以下脚本中提取需要字幕标注的对白和旁白，生成标准SRT格式的中英双语字幕。

规则：
1. 每个字幕条目包含：序号 → 时间戳（根据脚本中标注的时长估算） → 中文原文 → 英文翻译
2. 口语化处理：将书面语转为自然口语（"非常"→"超"/"特别"，"进行"去掉，感叹词自然化）
3. 方言色彩：如果脚本自带方言风格（如东北话/四川话），英文翻译保留那股"味儿"
4. 情感标记：标注说话语气（惊讶/感动/幽默/急迫），帮助配音演员理解
5. 去AI味：对白必须有"人味"，禁用"让我们"、"值得注意的是"等AI腔

输出格式示例：
1
00:00:01,000 --> 00:00:03,500
[热情] 家人们，今天这个地方真绝了！
[Enthusiastic] Guys, this place is absolutely insane!

2
00:00:03,500 --> 00:00:06,000
[感叹] 你看看这风景，我跟你说绝了呀
[Amazed] Look at this view - I'm telling you, it's breathtaking!

请严格按照SRT格式输出，确保时间戳递增，无重叠。`,
      },
      { role: 'user', content: subtitlePrompt.replace('{script}', script).replace('{context}', aiContext || '') },
    ],
    temperature: 0.3,
    max_tokens: 16384,
  };

  const baseUrl = PROVIDER_INFO[modelInfo.provider].baseUrl;
  const endpoint = baseUrl + '/chat/completions';

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      const json = await resp.json();
      const content = json.choices?.[0]?.message?.content || '';
      return {
        data: script,
        _subtitles: { format: 'srt', content, language: 'bilingual' },
      };
    }
  } catch { /* fallback */ }

  // 降级：返回脚本原文
  return { data: script, _subtitles: { format: 'srt', content: '[需要手动生成字幕]', language: 'bilingual' } };
}

function getSubtitlePrompt(params: Record<string, unknown>): string {
  const lang = (params.language as string) || 'bilingual';
  const style = (params.style as string) || 'professional';

  const styleMap: Record<string, string> = {
    social_short: '短视频风格：节奏快、口语化强、感叹词多、有"人味儿"',
    corporate: '企业宣传风格：专业但不生硬、温暖但不油腻、国际化用词',
    product_sales: '产品带货风格：情绪饱满、节奏激昂但不夸张、有信任感',
    vlog: '探店Vlog风格：第一人称、生活气、临场感、"家人们"式亲近',
    music_video: 'MV歌词风格：韵律感、画面感、情感起伏',
    cartoon: '卡通萌趣风格：可爱语气词（"咕噜"、"嘿嘿"）、简单直接',
    talk_show: '口播讲谈风格：自然语流、适当停顿、强调表达',
  };

  return `请为以下视频脚本生成${lang === 'bilingual' ? '中英双语' : lang === 'english' ? '英文' : '中文'}SRT字幕。

风格要求：${styleMap[style] || '专业自然，有"人味儿"'}

脚本内容：
{script}

脚本上下文：
{context}`;
}

// ─── v3.1 新增阶段：视频编辑 ─────────────────

/**
 * 视频瑕疵修复
 * 使用 happyhorse 视频编辑模型修复产品形态不一致、画面异常物体等AI生成视频常见问题
 */
async function callVideoEdit(
  videoRef: string,
  modelInfo: ModelInfoType,
  params: Record<string, unknown>,
  apiKey: string
): Promise<{ data: string; _videoEdited: boolean }> {
  // happyhorse-1.0 在阿里云百炼，是视频编辑API
  const baseUrl = PROVIDER_INFO[modelInfo.provider]?.baseUrl || PROVIDER_INFO.alibaba.baseUrl;

  try {
    const resp = await fetch(`${baseUrl}/v1/videos/edits`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelInfo.modelId,
        video_url: videoRef,
        operation: params.operation || 'repair',
        detect: params.detect || 'morph_artifacts',
        quality: 'high',
      }),
    });

    if (resp.ok) {
      const json = await resp.json();
      return { data: json.data?.url || videoRef, _videoEdited: true };
    }
  } catch { /* fallback */ }

  // 降级：返回原视频引用
  return { data: videoRef, _videoEdited: false };
}

// ─── v3.1 新增阶段：方言配音 ─────────────────

/**
 * 方言配音处理
 * 将标准普通话/英语脚本转为指定方言版本，用于TTS配音
 * 整合去AI味：方言口语音频应听起来像真人而非机器合成
 */
async function callDialectVoiceover(
  script: string,
  modelInfo: ModelInfoType,
  params: Record<string, unknown>,
  apiKey: string
): Promise<{ data: string; _dialect?: string }> {
  const dialects = (params.dialects as string[]) || [];
  const dialect = dialects[0] || 'normal';

  if (dialect === 'normal') {
    return { data: script };
  }

  // 方言转换：使用模型将普通话转为方言口语
  const dialectMap: Record<string, { region: string; prompt: string }> = {
    sichuan: {
      region: '四川',
      prompt: `将以下内容转为四川话（川普/正宗四川话）。要求：
1. 保留原意的同时让用词充满川味（如"啥子"、"安逸"、"巴适"、"啷个"）
2. 语法自然，不要生硬转换
3. 保持口语化，避免书面感
4. 适合TTS配音，保留自然停顿和语气词`,
    },
    dongbei: {
      region: '东北',
      prompt: `将以下内容转为东北话。要求：
1. 加入东北味儿的词（如"整"、"瞅"、"嘎哈"、"老鼻子"、"咋地"）
2. 语气自然豪爽，不要刻意
3. 保持口语化，避免书面感
4. 适合TTS配音，保留自然停顿和语气词`,
    },
    cantonese: {
      region: '广东',
      prompt: `将以下内容转为粤语口语。要求：
1. 用粤语口语表达（如"系咩"、"唔该"、"好正"、"食饱未"）
2. 保留粤语特有的语序和语气
3. 保持口语化，避免书面感
4. 适合TTS配音，保留自然停顿和语气词`,
    },
    shanghai: {
      region: '上海',
      prompt: `将以下内容转为上海话口语。要求：
1. 用上海话口语表达（如"老好"、"灵光"、"适意"、"老多"）
2. 保留上海话特有的语序和语气
3. 保持口语化，避免书面感
4. 适合TTS配音，保留自然停顿和语气词`,
    },
    minnan: {
      region: '闽南',
      prompt: `将以下内容转为闽南话/台语口语。要求：
1. 用闽南话口语表达
2. 保留闽南话特有的语序和语气
3. 保持口语化，避免书面感
4. 适合TTS配音，保留自然停顿和语气词`,
    },
    henan: {
      region: '河南',
      prompt: `将以下内容转为河南话口语。要求：
1. 加入河南味儿（如"中"、"弄啥嘞"、"可得劲"、"恁"）
2. 语气自然朴实
3. 保持口语化，避免书面感
4. 适合TTS配音，保留自然停顿和语气词`,
    },
  };

  const config = dialectMap[dialect];
  if (!config) return { data: script };

  const baseUrl = PROVIDER_INFO[modelInfo.provider]?.baseUrl || PROVIDER_INFO.alibaba.baseUrl;

  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelInfo.modelId,
        messages: [
          { role: 'system', content: `你是一个方言转换专家，擅长将普通话转为你指定的方言口语。` },
          { role: 'user', content: `${config.prompt}\n\n原文：\n${script}` },
        ],
        temperature: 0.7,
        max_tokens: 8192,
      }),
    });

    if (resp.ok) {
      const json = await resp.json();
      return { data: json.choices?.[0]?.message?.content || script, _dialect: dialect };
    }
  } catch { /* fallback */ }

  return { data: script, _dialect: dialect };
}

// ─── 单模型直连模式 ─────────────────────────

/**
 * 生成文本（走后端代理，后端从数据库读取用户配置的 API Key 并自动择优/降级）
 */
export async function generateText(
  params: GenerateTextParams,
  slug?: ContentTypeSlug
): Promise<GenerateResult> {
  const token = getAuthToken();
  if (!token) {
    return { success: false, error: '未登录，请先登录', provider: '', model: '' };
  }

  const messages: { role: 'system' | 'user'; content: string }[] = [
    ...(params.systemPrompt ? [{ role: 'system' as const, content: params.systemPrompt }] : []),
    { role: 'user' as const, content: params.prompt },
  ];

  try {
    const resp = await fetchWithTimeout(absUrl('/api/ai-chat/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messages,
        stream: false,
        modelKey: 'auto',
        preferProvider: undefined,
      }),
    }, CHAT_TIMEOUT_MS);

    if (!resp.ok) {
      let errMsg = `AI服务调用失败（HTTP ${resp.status}）`;
      try { const j = await resp.json(); errMsg = j.error || j.message || errMsg; } catch { /* ignore */ }
      return { success: false, error: errMsg, provider: '', model: '' };
    }

    const json = await resp.json();
    const content = json.data?.message || '';
    if (!content) {
      return { success: false, error: 'AI服务未返回内容，请稍后重试', provider: '', model: '' };
    }
    return {
      success: true,
      data: content,
      provider: json.data?.provider === 'aliyun' ? '阿里云百炼' : json.data?.provider === 'tencent' ? '腾讯云TokenHub' : 'AI',
      model: json.data?.modelName || 'auto',
    };
  } catch (error: any) {
    return { success: false, error: `AI服务调用失败：${error.message || '网络错误'}`, provider: '', model: '' };
  }
}

/**
 * v3.2：BGM 配乐选曲建议（管线阶段用）
 * 使用 LLM 深度分析文案情绪曲线，输出专业免版权 BGM 选曲方案
 */
async function callBGMSuggestionForPhase(
  textContext: string, duration: number,
  modelInfo: any, phaseParams: any, apiKey: string
): Promise<string> {
  const dur = duration || 30;
  const mood = detectMood(textContext);

  // 裁剪文案上下文，避免超出 LLM 输入限制
  const scriptSnippet = textContext.slice(0, 2500);

  const sysPrompt = `你是一位专业的影视配乐顾问（Music Supervisor），精通视频配乐的情绪节奏设计。
你的任务是根据创意短片的分镜脚本，为每个镜头推荐最合适的免版权背景音乐（BGM），并提供具体的曲库搜索关键词。

## 输出要求
请按以下结构输出，简洁专业：

### 整体情绪弧线
用一句话概括全片的情感走向（如：从悬念渐进 → 高潮激昂 → 结尾温暖余韵）

### 分镜头 BGM 选曲方案
| 镜头 | 时间 | 情绪 | 推荐曲风 | BPM | 参考曲库关键词 | 推荐平台 |
|------|------|------|----------|-----|----------------|----------|

### 免版权曲库推荐
列出 3-5 个获取免版权 BGM 的平台，每个平台说明适合的曲风类型和使用注意事项。

### 配乐制作建议
- 如果后期需要定制化配乐，提供制作方向建议（如：需要渐强弦乐铺垫、电子鼓点切入时机等）
- 给剪辑师的操作提示：如何做音频淡入淡出、关键帧音量自动化

## 注意事项
- 所有推荐必须适配免版权需求（CC0 / CC BY / Royalty-Free）
- BPM 范围要具体（如 90-110 BPM，不要写"中速"）
- 关键词要能在 Epidemic Sound / Artlist / Pixabay Music / 剪映曲库 中直接搜索`;

  const prompt = `以下是一部${dur}秒创意短片的完整分镜脚本，请为其设计专业的 BGM 配乐方案：\n\n${scriptSnippet}`;

  try {
    const content = await callChatAPI(modelInfo.provider, modelInfo.modelId, [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: prompt },
    ], { temperature: 0.6, maxTokens: 2000, topP: phaseParams?.topP }, apiKey);

    return `${textContext}\n\n---\n## BGM 配乐选曲方案\n\n${content}`;
  } catch {
    // LLM 调用失败时的降级方案：基于关键词规则给出快速建议
    return `${textContext}\n\n---\n## BGM 配乐选曲方案（自动匹配）\n\n` +
      `整体情绪基调：${mood} | 时长：${dur}秒\n\n` +
      `推荐曲风：${getMoodStyleRecommendation(mood)}\n` +
      `推荐平台：Pixabay Music (免费CC0) / 剪映曲库 (内置) / Epidemic Sound (付费高质量)\n` +
      `搜索关键词：${getMoodSearchKeywords(mood)}\n\n` +
      `提示：以上为自动规则匹配结果。配置 API Key 后可获得 LLM 深度分析的专业选曲方案。`;
  }
}

/**
 * 基于关键词的情绪检测（LLM 降级方案 + 辅助标签）
 */
function detectMood(text: string): string {
  const m = text.toLowerCase();
  if (m.includes('热血') || m.includes('燃') || m.includes('激') || m.includes('奋') || m.includes('战斗')) return 'energetic';
  if (m.includes('感人') || m.includes('泪') || m.includes('温') || m.includes('爱') || m.includes('治愈')) return 'emotional';
  if (m.includes('科技') || m.includes('未来') || m.includes('赛博') || m.includes('AI') || m.includes('数字')) return 'futuristic';
  if (m.includes('轻松') || m.includes('快乐') || m.includes('欢') || m.includes('阳光') || m.includes('活力')) return 'upbeat';
  if (m.includes('安静') || m.includes('宁静') || m.includes('慢') || m.includes('冥想') || m.includes('禅')) return 'calm';
  if (m.includes('悬疑') || m.includes('紧张') || m.includes('暗') || m.includes('恐怖') || m.includes('惊悚')) return 'suspense';
  if (m.includes('宏大') || m.includes('史诗') || m.includes('壮') || m.includes('磅礴')) return 'epic';
  if (m.includes('复古') || m.includes('怀旧') || m.includes('老') || m.includes('经典')) return 'vintage';
  if (m.includes('自然') || m.includes('田园') || m.includes('森林') || m.includes('海洋')) return 'nature';
  return 'cinematic';
}

function getMoodStyleRecommendation(mood: string): string {
  const map: Record<string, string> = {
    energetic: '摇滚 / 电子 / 快节奏打击乐 (120-140 BPM)',
    emotional: '钢琴独奏 / 弦乐四重奏 / 氛围后摇 (60-90 BPM)',
    futuristic: 'Synthwave / Cyberpunk 电子 / Glitch Hop (100-120 BPM)',
    upbeat: '独立流行 / Lo-fi Hip Hop / 清新木吉他 (90-110 BPM)',
    calm: '环境音乐 / 极简钢琴 / 自然白噪音 (50-70 BPM)',
    suspense: '黑暗氛围 / 脉冲合成器 / 弦乐渐强 (70-90 BPM)',
    epic: '管弦乐 / 电影配乐 / 合唱+打击乐 (100-130 BPM)',
    vintage: '爵士 / Swing / 胶片质感Lo-fi (80-100 BPM)',
    nature: '世界音乐 / 民谣吉他 / 环境音景 (60-90 BPM)',
    cinematic: '电影管弦乐 / 后摇 / 氛围电子 (80-110 BPM)',
  };
  return map[mood] || map.cinematic;
}

function getMoodSearchKeywords(mood: string): string {
  const map: Record<string, string> = {
    energetic: 'energetic rock, driving beat, action background, intense drums',
    emotional: 'emotional piano, sad strings, heartfelt, cinematic slow',
    futuristic: 'synthwave, cyberpunk, futuristic electronic, sci-fi ambient',
    upbeat: 'happy upbeat, cheerful pop, bright acoustic, feel good',
    calm: 'ambient calm, meditation, peaceful nature, soft piano',
    suspense: 'suspense thriller, dark ambient, tension building, horror drone',
    epic: 'epic orchestral, heroic, grand cinematic, powerful choir',
    vintage: 'vintage jazz, retro swing, nostalgic, old film',
    nature: 'nature ambient, folk acoustic, world music, forest sounds',
    cinematic: 'cinematic film score, orchestral, dramatic, trailer music',
  };
  return map[mood] || map.cinematic;
}

// ─── 管线辅助函数 ────────────────────────────

/** 从累计文本中提取图片生成 Prompt */
function extractImagePrompt(text: string): string {
  const posMatch = text.match(/(?:正向prompt|正向提示词|Prompt)[:：]\s*(.+?)(?:\n|$)/i);
  if (posMatch) return posMatch[1].trim().slice(0, 800);
  const descMatch = text.match(/(?:图片描述|画面描述|视觉描述)[:：]\s*(.+?)(?:\n\n|\n(?=[^\n]{0,3}$)|$)/is);
  if (descMatch) return descMatch[1].trim().slice(0, 800);
  const clean = text.replace(/https?:\/\/\S+/g, '').replace(/\[图片\d+\]/g, '').replace(/\[视频\]/g, '');
  return clean.trim().slice(-500) || text.slice(0, 500);
}

/** 从累计文本中提取视频生成 Prompt（支持分镜脚本/镜头描述） */
function extractVideoPrompt(text: string): string {
  const scriptMatch = text.match(/(?:分镜脚本|视频脚本|Video Script)[:：]\s*(.+?)(?:\n\n###|\n\n---|\n\n(?=【)|$)/is);
  if (scriptMatch) return scriptMatch[1].trim().slice(0, 1000);
  const shotMatch = text.match(/【镜头[\d]+[^】]*】[^\n]*(?:\n[^\n【]*){0,3}/g);
  if (shotMatch && shotMatch.length > 0) return shotMatch.slice(0, 6).join('\n').slice(0, 1000);
  const clean = text.replace(/https?:\/\/\S+/g, '').replace(/\[图片\d+\]/g, '').replace(/\[视频\]/g, '').replace(/【生成图片[\s\S]*?】/g, '').trim();
  return clean.slice(0, 800) || text.slice(0, 500);
}

/** 从累计文本中提取所有图片 URL（支持多种标记格式） */
function extractImageUrls(text: string): string[] {
  const urls: string[] = [];
  const mr = /\[图片(\d+)\]\s*(https?:\/\/[^\s\n]+)/g;
  let m;
  while ((m = mr.exec(text)) !== null) urls.push(m[2]);
  const gb = text.match(/【生成图片[\s\S]*?】(.*?)(?:\n\n|$)/);
  if (gb) {
    const ur = /https?:\/\/[^\s\n)]+/g;
    let um;
    while ((um = ur.exec(gb[1])) !== null) { if (!urls.includes(um[0])) urls.push(um[0]); }
  }
  const sm = text.match(/选中图片\d+:\s*(https?:\/\/[^\s\n]+)/);
  if (sm && !urls.includes(sm[1])) urls.push(sm[1]);
  const em = text.match(/\[增强图片\]\s*(https?:\/\/[^\s\n]+)/);
  if (em && !urls.includes(em[1])) urls.unshift(em[1]);
  return urls;
}

/** 从累计文本中提取配音文字（去除 URL 和元数据标记） */
function extractVoiceText(text: string): string {
  let clean = text.replace(/https?:\/\/\S+/g, '');
  clean = clean.replace(/\[(?:图片|视频|数字人视频|生成图片|择优结果|增强图片)[^\]]*\]/g, '');
  clean = clean.replace(/【[^】]*】/g, '');
  const lines = clean.split('\n').filter(l => l.trim().length > 0);
  return lines.join(' ').trim().slice(0, 500) || '暂无配音文本';
}

/**
 * 生成图片（走后端代理，避免前端直连第三方 API 的 CORS/密钥暴露问题）
 * 后端会自动在火山方舟 → 腾讯云 → 阿里云之间择优降级
 */
export async function generateImage(
  params: GenerateImageParams,
  slug?: ContentTypeSlug
): Promise<GenerateResult> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('图片生成失败：未登录，请先登录');
  }

  const negative = params.negativePrompt || buildNegativePrompt(params.imageType || 'general');
  const enhancedPrompt = enhanceImagePrompt(params.prompt, params.imageType || 'general');
  // 将负向提示词拼入最终 prompt，后端接口目前只接收 prompt/size
  const finalPrompt = negative ? `${enhancedPrompt}\n\n排除：${negative}` : enhancedPrompt;

  try {
    const resp = await fetchWithTimeout(absUrl('/api/ai-chat/image'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        size: params.size || '1024x1024',
        n: params.n || 1,
      }),
    }, IMAGE_TIMEOUT_MS);

    const json = await resp.json().catch(() => ({ error: '服务端返回格式异常' }));
    if (!resp.ok || json.success === false || json.error) {
      throw new Error(json.error || json.message || `图片生成失败（HTTP ${resp.status}）`);
    }

    const imageUrl = json.data?.imageUrl || json.data?.url;
    const urls = json.data?.urls || (imageUrl ? [imageUrl] : []);
    if (!imageUrl && urls.length === 0) {
      throw new Error('图片生成失败：服务端未返回图片 URL');
    }

    return {
      success: true,
      data: urls.length === 1 ? urls[0] : urls,
      provider: json.data?.provider || '后端代理',
      model: json.data?.model || '多引擎自动择优',
    };
  } catch (error: any) {
    const msg = error.message || '未知错误';
    if (msg.includes('未配置') || msg.includes('API Key')) {
      throw new Error(`图片生成失败：${msg}，请在「设置-API设置」中配置可用的图片生成 API Key（腾讯混元/阿里通义/火山方舟）`);
    }
    throw new Error(`图片生成失败：${msg}`);
  }
}

/**
 * 生成视频（单模型直连）
 */
export async function generateVideo(
  params: GenerateVideoParams,
  slug?: ContentTypeSlug
): Promise<GenerateResult> {
  const apiKeys = await getEffectiveApiKeys();

  // 智能剪辑：优先服务端 FFmpeg 拼接成片（交付最终 MP4），无素材时走多阶段流水线方案
  if (slug === 'smartEdit') {
    // 1. 有素材视频 URL 时，调用服务端成片接口
    const materialVideos = (params.clips || []).filter(Boolean);
    const token = getAuthToken();
    if (materialVideos.length > 0 && token) {
      try {
        const resp = await fetch(absUrl('/api/video-edit/compose'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            clips: materialVideos,
            subtitleText: params.subtitleText,
            bgmUrl: params.bgmUrl,
            size: params.size || '1080x1920',
          }),
        });
        const json = await resp.json();
        if (json.success && json.data?.videoUrl) {
          return {
            success: true,
            data: json.data.videoUrl,
            provider: '智能剪辑成片',
            model: '服务端 FFmpeg 合成',
          };
        }
        console.warn('[smartEdit] 服务端成片失败，降级流水线方案:', json.error?.message);
      } catch (e) {
        console.warn('[smartEdit] 服务端成片不可用，降级流水线方案:', (e as Error).message);
      }
    }
    // 2. 降级：多阶段流水线（脚本→素材理解→镜头编排→配音→字幕→BGM→调色→FFmpeg合成→合规）
    const materialList = [...(params.images || []), params.imageUrl].filter(Boolean);
    const inputWithMaterials = materialList.length > 0
      ? `【视频素材清单】\n${materialList.join('\n')}\n\n${params.prompt}`
      : params.prompt;
    const pipeline = await generateWithLocalPipeline('smartEdit', inputWithMaterials);
    if (pipeline.success && pipeline.data.finalOutput) {
      return {
        success: true,
        data: pipeline.data.finalOutput,
        provider: '智能剪辑流水线',
        model: `多模型协同 (${pipeline.data.successCount || 0}/${pipeline.data.totalCount || 0} 阶段完成)`,
      };
    }
    const failed = (pipeline.data.tasks || []).filter(t => !t.success).map(t => `${t.label}:${t.error || '失败'}`).join('；');
    throw new Error(`智能剪辑未完成：${failed || pipeline.data.message || '未知错误'}`);
  }

  // 构建增强 prompt（注入字幕/配音/横幅配置）
  const enhancedPrompt = buildVideoPrompt(params);

  // 真实配音合成：数字人在 API 层已用 audio_url 驱动配音，这里跳过
  const withVoiceover = async (url: string) =>
    params.voiceover && params.voiceover !== 'none' && slug !== 'digitalHuman'
      ? attachRealVoiceover(url, params, apiKeys)
      : url;

  if (slug) {
    const config = getCategoryConfig(slug);
    if (config) {
      const vidPhase = config.phases.find(p =>
        ['video_generate', 'digital_human'].includes(p.phase));
      if (vidPhase) {
        const modelInfo = MODEL_INFO[vidPhase.primaryModel];
        if (modelInfo && apiKeys[modelInfo.provider]) {
          try {
            const url = await callVideoAPI(modelInfo.provider, modelInfo.modelId, enhancedPrompt, { duration: params.duration, size: params.size }, apiKeys[modelInfo.provider]);
            return { success: true, data: await withVoiceover(url), provider: PROVIDER_INFO[modelInfo.provider].label, model: modelInfo.displayName };
          } catch {
            if (vidPhase.fallbackModel) {
              const fbInfo = MODEL_INFO[vidPhase.fallbackModel];
              if (fbInfo && apiKeys[fbInfo.provider]) {
                try {
                  const url = await callVideoAPI(fbInfo.provider, fbInfo.modelId, enhancedPrompt, { duration: params.duration, size: params.size }, apiKeys[fbInfo.provider]);
                  return { success: true, data: await withVoiceover(url), provider: PROVIDER_INFO[fbInfo.provider].label, model: fbInfo.displayName };
                } catch { /* fall through */ }
              }
            }
          }
        }
      }
    }
  }

  // 通用回退（2026-08-31 实测：Seedance 2.5 返回 404 不存在，改用 1.0 Pro）
  const pref: { p: AiProvider; model: string; name: string }[] = [
    { p: 'volcano', model: 'doubao-seedance-1-0-pro-250528', name: 'Doubao Seedance 1.0 Pro' },
    { p: 'tencent', model: 'hy-video-1.5', name: '混元视频 1.5' },
    { p: 'tencent', model: 'kl-video-v3', name: '可灵 KLING 3.0' },
  ];
  for (const { p, model, name } of pref) {
    if (!apiKeys[p]) continue;
    try {
      const url = await callVideoAPI(p, model, enhancedPrompt, { duration: params.duration, size: params.size }, apiKeys[p]);
      return { success: true, data: await withVoiceover(url), provider: PROVIDER_INFO[p].label, model: name };
    } catch { continue; }
  }

  throw new Error('视频生成失败：未配置可用的视频生成 API Key（可灵/混元/火山方舟），请在设置中配置');
}

/**
 * 构建增强视频生成 prompt，注入配音/字幕/横幅/背景音乐配置
 */
function buildVideoPrompt(params: GenerateVideoParams): string {
  const parts = [params.prompt];

  // 字幕配置
  if (params.subtitle && params.subtitle !== 'none') {
    const labelMap: Record<string, string> = {
      chinese: '添加中文字幕，白色文字带半透明黑底，底部居中',
      english: '添加英文字幕，白色文字带半透明黑底，底部居中',
      bilingual: '添加中英文双语字幕，中文在上英文在下，白色文字带半透明黑底',
    };
    parts.push(labelMap[params.subtitle] || '');
  }

  // 配音配置
  if (params.voiceover && params.voiceover !== 'none') {
    const voiceMap: Record<string, string> = {
      'male-mandarin': '使用男声普通话配音',
      'female-mandarin': '使用女声普通话配音',
      'male-sichuan': '使用男声四川话方言配音',
      'female-sichuan': '使用女声四川话方言配音',
      'male-cantonese': '使用男声粤语配音',
      'female-cantonese': '使用女声粤语配音',
      'male-english': '使用男声英语配音',
      'female-english': '使用女声英语配音',
      shanghai: '使用上海话方言配音',
      beijing: '使用北京话方言配音',
      nanjing: '使用南京话方言配音',
      shaanxi: '使用陕西话方言配音',
      minnan: '使用闽南语方言配音',
      tianjin: '使用天津话方言配音',
    };
    parts.push(voiceMap[params.voiceover] || '');
  }

  // 背景音乐
  if (params.bgm && params.bgm !== 'none') {
    const bgmMap: Record<string, string> = {
      happy: '添加欢快背景音乐',
      relaxing: '添加舒缓背景音乐',
      dynamic: '添加动感背景音乐',
      sad: '添加悲伤背景音乐',
      suspense: '添加悬疑背景音乐',
      tech: '添加科技感背景音乐',
      classical: '添加古典背景音乐',
      business: '添加商务背景音乐',
      cheerful: '添加清新欢快背景音乐',
      lyrical: '添加抒情背景音乐',
    };
    parts.push(bgmMap[params.bgm] || '');
  }

  // 横幅/贴片配置
  if (params.overlayBanners && params.overlayBanners.length > 0) {
    const bannerMap: Record<string, string> = {
      'opening-title': '视频开头居中显示大字标题，渐变蓝紫背景，持续3秒',
      'lower-third': '画面底部有人名/职位信息标注条，深色半透明背景，约出现5秒',
      'closing-credits': '视频结尾底部显示品牌落款和口号，淡入淡出效果',
      'call-to-action': '底部显示醒目红色行动号召按钮，引导用户点击',
      watermark: '右下角半透明品牌水印"@智枢AI"，全程显示',
      'scene-divider': '场景切换时显示章节过渡提示文字',
      'speech-bubble': '底部左侧显示对话气泡框，模拟角色说话',
      'bullet-comment': '画面顶部有弹幕文字从右到左飘过',
      'brand-logo': '右上角显示品牌Logo角标，全程显示',
      'progress-hint': '显示"接下来"的进度提示文字',
    };
    const bannerDescs = params.overlayBanners.map(b => bannerMap[b] || b).filter(Boolean);
    if (bannerDescs.length > 0) {
      parts.push(`视频叠加元素：${bannerDescs.join('；')}`);
    }
  }

  // 横幅视觉样式（蓝皮书 11.4.4：8 种预设；auto 时交由模型自动匹配）
  const bannerStyleMap: Record<string, string> = {
    'minimal-white': '简约白：白底黑字、留白多、高级简约',
    'corporate-blue': '商务蓝：深蓝底白字、沉稳专业',
    'gradient-pop': '潮流渐变：蓝紫/粉橙渐变、年轻潮流',
    cyberpunk: '赛博朋克：霓虹粉青、故障风科技感',
    handwritten: '文艺手写：米黄底手写体、文艺清新',
    'retro-newsprint': '复古报刊：报纸黄底衬线字、复古质感',
    'neon-night': '霓虹夜店：深黑底霓虹字、夜店氛围',
    'fresh-nature': '清新自然：淡绿底圆润字、清新自然',
  };
  if (params.bannerStyle && bannerStyleMap[params.bannerStyle]) {
    parts.push(`叠加元素视觉风格：${bannerStyleMap[params.bannerStyle]}`);
  }

  return parts.filter(Boolean).join('。');
}

// ─── 兼容旧接口：服务端流水线尝试后降级到本地流水线 ──

export async function generateWithPipeline(
  contentType: string,
  userInput: string
): Promise<PipelineResponse & { fallbackUsed: boolean }> {
  // v4.1：服务端流水线端点不存在，直接使用本地流水线（多阶段协同 + 后端 AI 代理）
  const localResult = await generateWithLocalPipeline(contentType as ContentTypeSlug, userInput);
  return { ...localResult, fallbackUsed: true };
}

// ─── 便捷：获取某个类目的模型信息 ──────────

export function getModelsForCategory(slug: ContentTypeSlug) {
  const config = getCategoryConfig(slug);
  if (!config) return null;
  return {
    category: config,
    models: config.requiredModels.map(k => MODEL_INFO[k]).filter(Boolean),
    coverage: getCategoryKeyCoverage(slug),
  };
}

export { hasApiKey, getCategoryKeyCoverage, PROVIDER_INFO, MODEL_INFO, CATEGORY_PIPELINES, getCategoryConfig };

// ─── 方言配音映射 ────────────────────────────

/**
 * 方言配音映射 → 阿里云百炼 Qwen3-TTS-Flash 真实音色
 * （Qwen3-TTS-Flash 2025-11-27 快照支持 51 种音色，含 北京/上海/四川/南京/陕西/闽南/天津/粤语 等方言）
 */
export const dialectVoiceMap: Record<string, { provider: string; voiceId: string; label: string }> = {
  'male-mandarin': { provider: 'alibaba', voiceId: 'Ethan', label: '男声-普通话' },
  'female-mandarin': { provider: 'alibaba', voiceId: 'Cherry', label: '女声-普通话' },
  'male-sichuan': { provider: 'alibaba', voiceId: 'Eric', label: '男声-四川话' },
  'female-sichuan': { provider: 'alibaba', voiceId: 'Sunny', label: '女声-四川话' },
  'male-cantonese': { provider: 'alibaba', voiceId: 'Rocky', label: '男声-粤语' },
  'female-cantonese': { provider: 'alibaba', voiceId: 'Kiki', label: '女声-粤语' },
  'male-english': { provider: 'alibaba', voiceId: 'Aiden', label: '男声-英语' },
  'female-english': { provider: 'alibaba', voiceId: 'Jennifer', label: '女声-英语' },
  shanghai: { provider: 'alibaba', voiceId: 'Jada', label: '上海话(女)' },
  beijing: { provider: 'alibaba', voiceId: 'Dylan', label: '北京话(男)' },
  nanjing: { provider: 'alibaba', voiceId: 'Li', label: '南京话(男)' },
  shaanxi: { provider: 'alibaba', voiceId: 'Marcus', label: '陕西话(男)' },
  minnan: { provider: 'alibaba', voiceId: 'Roy', label: '闽南语(男)' },
  tianjin: { provider: 'alibaba', voiceId: 'Peter', label: '天津话(男)' },
};

/** 配音合成使用的 TTS 模型 */
const VOICEOVER_TTS_MODEL = 'qwen3-tts-flash';

/**
 * 真实配音合成链路（解决"配音只进 prompt、音色不可控"问题）：
 * 口播文案生成 → 阿里云 Qwen3-TTS-Flash 合成音频 → 服务端 FFmpeg 合入视频。
 * 任一步失败均静默回退原视频，不影响成片交付。
 */

/** 根据视频 prompt 生成 120-220 字自然口语化口播文案 */
async function generateVoiceoverScript(prompt: string, apiKeys: Record<string, string>): Promise<string> {
  const candidates: { provider: AiProvider; modelId: string }[] = [
    { provider: 'alibaba', modelId: 'qwen3.7-max' },
    { provider: 'tencent', modelId: 'deepseek-v4-pro-202606' },
  ];
  for (const { provider, modelId } of candidates) {
    if (!apiKeys[provider]) continue;
    try {
      const script = await callChatAPI(provider, modelId, [
        { role: 'system', content: '你是一名短视频口播文案编剧。根据主题写一段自然、口语化、有感染力的口播旁白文案。直接输出文案本身，不要标题、不要序号、不要任何解释，控制在 120-220 字。' },
        { role: 'user', content: `主题与要求：\n${prompt.slice(0, 1500)}\n\n请输出口播旁白文案：` },
      ], { temperature: 0.8, maxTokens: 500 }, apiKeys[provider]);
      const cleaned = (script || '').replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '').trim();
      if (cleaned.length >= 20) return cleaned;
    } catch {
      /* 尝试下一个 provider */
    }
  }
  return '';
}

/** 阿里云百炼 Qwen3-TTS-Flash 语音合成，返回音频 URL */
async function synthesizeTTSAudio(text: string, voiceId: string, apiKey: string): Promise<string> {
  if (!apiKey) return '';
  const ttsUrl = `${PROVIDER_INFO.alibaba.baseUrl}${PROVIDER_INFO.alibaba.multimodalImageEndpoint}`;
  const resp = await fetch(ttsUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: VOICEOVER_TTS_MODEL,
      input: { text: text.slice(0, 500) },
      parameters: { voice: voiceId, format: 'mp3' },
    }),
  });
  if (!resp.ok) throw new Error(`TTS (${resp.status}): ${await resp.text()}`);
  const json = await resp.json();
  return json.output?.audio?.url || json.output?.audio_url || json.output?.url || '';
}

/** 调服务端 FFmpeg 将配音音频合入视频，返回带配音的成片 URL */
async function muxVoiceover(videoUrl: string, audioUrl: string): Promise<string> {
  // request 拦截器已解包 { success, data }，此处 resp.data 即 { videoUrl }
  // 注意：request baseURL 已含 /api，路径不能再带 /api 前缀，否则会拼成 /api/api/...
  const resp: any = await request.post('/video-voice/synthesize', { videoUrl, audioUrl }, { timeout: 300000 });
  const result = resp?.data || {};
  if (!result.videoUrl) return '';
  const base = (request.defaults.baseURL || '') as string;
  try {
    if (base.startsWith('http')) return new URL(result.videoUrl, base).href;
  } catch {
    /* 继续按页面 origin 拼接 */
  }
  if (typeof window !== 'undefined') return new URL(result.videoUrl, window.location.origin).href;
  return result.videoUrl;
}

/** 主入口：生成视频后附加真实配音；任一步失败静默回退原视频 */
async function attachRealVoiceover(
  videoUrl: string,
  params: GenerateVideoParams,
  apiKeys: Record<string, string>
): Promise<string> {
  const voice = params.voiceover ? dialectVoiceMap[params.voiceover] : undefined;
  if (!voice) return videoUrl;
  try {
    const script = await generateVoiceoverScript(params.prompt, apiKeys);
    if (!script) return videoUrl;
    const audioUrl = await synthesizeTTSAudio(script, voice.voiceId, apiKeys.alibaba);
    if (!audioUrl) return videoUrl;
    const muxed = await muxVoiceover(videoUrl, audioUrl);
    return muxed || videoUrl;
  } catch {
    return videoUrl;
  }
}

// ─── 内容创意增强 API ──────────────────────

export interface ViralAnalysisResult { topic: string; platform: string; geneAnalysis: any; viralScore: any; rating: string; }

/** 从 LLM 输出中稳健提取 JSON 对象 */
function extractJsonFromText(text: string): Record<string, unknown> | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function analyzeViralTopic(topic: string, platform = 'douyin', targetAudience?: string): Promise<{ success: boolean; data?: ViralAnalysisResult }> {
  // P0-3：改为本地 LLM 爆款基因分析（原实现请求的 /api/content-creativity/analyze 服务端端点不存在）
  const apiKeys = await getEffectiveApiKeys();
  const providers: AiProvider[] = ['tencent', 'alibaba', 'volcano'];
  const modelIds: Record<AiProvider, string> = {
    tencent: 'deepseek-v4-pro-202606',
    alibaba: 'qwen3.8-max',
    volcano: 'doubao-seed-2-1-pro-260628',
  };
  for (const p of providers) {
    if (!apiKeys[p]) continue;
    try {
      const sysPrompt = `你是一位顶级爆款内容分析师，擅长从传播学与用户心理学拆解内容的爆款基因。
针对给定主题与平台，只输出严格的 JSON（禁止输出 JSON 以外的任何文字），结构如下：
{
  "geneAnalysis": {
    "hooks": ["3个可落地的前3秒钩子"],
    "emotions": ["3个情绪切入点"],
    "structure": "一句话的内容结构建议（如：悬念开头→层层递进→反差结尾）",
    "keywords": ["6个SEO与流量关键词"]
  },
  "viralScore": { "total": 0到40的整数，越接近40爆款潜力越高 },
  "rating": "一句话评级结论"
}`;
      const userPrompt = `主题：${topic}\n平台：${platform}${targetAudience ? `\n目标人群：${targetAudience}` : ''}`;
      const content = await callChatAPI(p, modelIds[p], [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userPrompt },
      ], { temperature: 0.5, maxTokens: 2000 }, apiKeys[p]);
      const parsed = extractJsonFromText(content);
      if (parsed) {
        return {
          success: true,
          data: {
            topic, platform,
            geneAnalysis: (parsed as any).geneAnalysis || {},
            viralScore: (parsed as any).viralScore || { total: 0 },
            rating: String((parsed as any).rating || ''),
          },
        };
      }
    } catch (e: any) {
      console.error('[ViralAnalyze] provider error:', e?.message);
    }
  }
  return { success: false };
}
