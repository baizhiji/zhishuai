/**
 * AI创作工厂 — 统一AI服务层
 * 支持腾讯云TokenHub + 阿里云百炼全部模型
 * 自动选择最优模型以达到最佳生成效果
 */

// ─── 类型定义 ────────────────────────────────
export interface GenerateTextParams {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateImageParams {
  prompt: string;
  negativePrompt?: string;
  size?: string;
  n?: number;
  referenceImage?: string; // 参考图base64
}

export interface GenerateVideoParams {
  prompt: string;
  images?: string[];        // 输入图片base64数组
  duration?: number;        // 视频时长(秒)
  size?: string;            // 视频尺寸
  voiceover?: string;       // 配音风格
  subtitle?: string;        // 字幕选项
  bgm?: string;             // 背景音乐
}

export interface GenerateResult {
  success: boolean;
  data?: string | string[];  // URL或文本
  error?: string;
  provider: string;
  model: string;
}

// ─── Provider配置 ────────────────────────────────
interface ProviderConfig {
  id: string;
  name: string;
  textModels: string[];
  imageModels: string[];
  videoModels: string[];
}

const PROVIDERS: Record<string, ProviderConfig> = {
  tencent: {
    id: 'tencent',
    name: '腾讯云TokenHub',
    textModels: ['hunyuan-pro', 'hunyuan-turbo', 'hunyuan-lite', 'deepseek-r1', 'deepseek-v3'],
    imageModels: ['hunyuan-image', 'hunyuan-vision'],
    videoModels: ['hunyuan-video', 'hunyuan-video-1.5'],
  },
  alibaba: {
    id: 'alibaba',
    name: '阿里云百炼',
    textModels: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen3.6-plus', 'deepseek-r1', 'deepseek-v3'],
    imageModels: ['wan2.7-image-pro', 'wanx-v1', 'flux-dev', 'flux-schnell'],
    videoModels: ['wan2.7-t2v', 'cogvideox-v1.0'],
  },
};

// ─── 模型选择策略 ────────────────────────────────
// 根据任务类型自动选择最佳模型组合
interface ModelSelection {
  provider: string;
  text: string;
  image?: string;
  video?: string;
}

const MODEL_SELECTION: Record<string, ModelSelection> = {
  // 小红书图文 - 需要优秀的多模态理解和中文写作能力
  xiaohongshu: { provider: 'alibaba', text: 'qwen-max', image: 'wan2.7-image-pro' },
  // 图片生成 - 需要最强的文生图能力
  image: { provider: 'alibaba', text: 'qwen-plus', image: 'wan2.7-image-pro' },
  // 电商详情页 - 需要文本+图片综合能力
  ecommerce: { provider: 'alibaba', text: 'qwen-max', image: 'wan2.7-image-pro' },
  // 短视频脚本 - 需要创意文案能力
  shortVideo: { provider: 'alibaba', text: 'qwen-max', video: 'wan2.7-t2v' },
  // 企业宣传视频 - 需要视频生成能力
  enterpriseVideo: { provider: 'alibaba', text: 'qwen-plus', video: 'wan2.7-t2v' },
  // 产品宣传视频
  productVideo: { provider: 'alibaba', text: 'qwen-plus', video: 'wan2.7-t2v' },
  // 探店视频
  storeTour: { provider: 'alibaba', text: 'qwen-max', video: 'wan2.7-t2v' },
  // 真人MV
  personMv: { provider: 'alibaba', text: 'qwen-plus', video: 'wan2.7-t2v' },
  // 萌宠卡通短视频
  cartoonVideo: { provider: 'alibaba', text: 'qwen-max', video: 'wan2.7-t2v' },
  // 数字人
  digitalHuman: { provider: 'tencent', text: 'hunyuan-pro', video: 'hunyuan-video' },
};

// ─── 核心API调用 ────────────────────────────────

async function callAPI(provider: string, endpoint: string, body: any, apiKey: string): Promise<any> {
  const config = PROVIDERS[provider];
  if (!config) throw new Error(`未知Provider: ${provider}`);

  const baseUrls: Record<string, string> = {
    tencent: 'https://tokenhub.cloud.tencent.com',
    alibaba: 'https://dashscope.aliyuncs.com',
  };

  const baseUrl = baseUrls[provider];
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`${config.name} API错误 (${response.status}): ${errText}`);
  }

  return response.json();
}

// ─── 公开API ────────────────────────────────

/**
 * 获取用户API Key (从前端存储读取)
 */
function getUserApiKeys(): { tencent?: string; alibaba?: string } {
  if (typeof window === 'undefined') return {};
  const keys: any = {};
  try {
    const tencentKey = localStorage.getItem('api_key_tencent');
    const alibabaKey = localStorage.getItem('api_key_alibaba');
    if (tencentKey) keys.tencent = tencentKey;
    if (alibabaKey) keys.alibaba = alibabaKey;
  } catch (e) { /* ignore */ }
  return keys;
}

/**
 * 获取认证 token
 */
function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('token') || '';
  } catch (e) { return ''; }
}

// ─── 多模型协作流水线调用 ──────────────────────

export interface PipelineResponse {
  success: boolean;
  mode: 'pipeline' | 'single';
  data: {
    totalDuration?: number;
    successCount?: number;
    totalCount?: number;
    finalOutput?: string;
    tasks?: Array<{
      id: string;
      success: boolean;
      modelName: string;
      provider: string;
      duration: number;
      outputPreview: string;
      error?: string;
    }>;
    taskType?: string;
    modelKey?: string;
    modelId?: string;
    modelName?: string;
    provider?: string;
    message?: string;
  };
}

/**
 * 通过服务端流水线生成内容（多模型协作）
 * 优先使用此方法，可获更高质量结果
 */
export async function generateWithPipeline(
  contentType: string,
  userInput: string
): Promise<PipelineResponse & { fallbackUsed: boolean }> {
  const token = getAuthToken();
  if (!token) {
    return {
      success: false,
      mode: 'single',
      fallbackUsed: true,
      data: { message: '未登录，使用前端直连模式' },
    };
  }

  try {
    const response = await fetch('/api/ai-config/pipeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ contentType, userInput }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result: PipelineResponse = await response.json();
    return { ...result, fallbackUsed: false };
  } catch (e) {
    console.warn('[Pipeline] 服务端流水线不可用，使用前端直连模式:', e);
    return {
      success: false,
      mode: 'single',
      fallbackUsed: true,
      data: { message: '服务端流水线不可用，已切换到前端直连模式' },
    };
  }
}

/**
 * 生成文本 (自动选择最佳Provider和模型)
 */
export async function generateText(
  params: GenerateTextParams,
  task?: keyof typeof MODEL_SELECTION
): Promise<GenerateResult> {
  const apiKeys = getUserApiKeys();
  const selection = task ? MODEL_SELECTION[task] : MODEL_SELECTION.shortVideo;
  const provider = selection.provider;
  const model = selection.text;
  const apiKey = apiKeys[provider as keyof typeof apiKeys];

  if (!apiKey) {
    // 降级：尝试另一个provider
    const fallback = provider === 'alibaba' ? 'tencent' : 'alibaba';
    const fbKey = apiKeys[fallback as keyof typeof apiKeys];
    if (fbKey) {
      return generateTextWithProvider(params, fallback, PROVIDERS[fallback].textModels[0], fbKey);
    }
    // 无API Key，使用浏览器端模拟
    return mockTextGeneration(params.prompt, task);
  }

  try {
    return await generateTextWithProvider(params, provider, model, apiKey);
  } catch (e) {
    // 降级到另一个provider
    const fallback = provider === 'alibaba' ? 'tencent' : 'alibaba';
    const fbKey = apiKeys[fallback as keyof typeof apiKeys];
    if (fbKey) {
      try {
        return await generateTextWithProvider(params, fallback, PROVIDERS[fallback].textModels[0], fbKey);
      } catch (e2) {
        return mockTextGeneration(params.prompt, task);
      }
    }
    return mockTextGeneration(params.prompt, task);
  }
}

async function generateTextWithProvider(
  params: GenerateTextParams,
  provider: string,
  model: string,
  apiKey: string
): Promise<GenerateResult> {
  const config = PROVIDERS[provider];

  if (provider === 'alibaba') {
    const data = await callAPI(provider, '/compatible-mode/v1/chat/completions', {
      model,
      messages: [
        ...(params.systemPrompt ? [{ role: 'system', content: params.systemPrompt }] : []),
        { role: 'user', content: params.prompt },
      ],
      max_tokens: params.maxTokens || 2000,
      temperature: params.temperature || 0.7,
    }, apiKey);

    return {
      success: true,
      data: data.choices?.[0]?.message?.content || '',
      provider: config.name,
      model,
    };
  }

  if (provider === 'tencent') {
    const data = await callAPI(provider, '/v1/chat/completions', {
      model,
      messages: [
        ...(params.systemPrompt ? [{ role: 'system', content: params.systemPrompt }] : []),
        { role: 'user', content: params.prompt },
      ],
      max_tokens: params.maxTokens || 2000,
      temperature: params.temperature || 0.7,
    }, apiKey);

    return {
      success: true,
      data: data.choices?.[0]?.message?.content || '',
      provider: config.name,
      model,
    };
  }

  throw new Error(`不支持的provider: ${provider}`);
}

/**
 * 生成图片 (自动选择最佳Provider和模型)
 */
export async function generateImage(
  params: GenerateImageParams,
  task?: keyof typeof MODEL_SELECTION
): Promise<GenerateResult> {
  const apiKeys = getUserApiKeys();
  const selection = task ? MODEL_SELECTION[task] : MODEL_SELECTION.image;
  const provider = selection.provider;
  const model = (selection as any).image || 'wan2.7-image-pro';
  const apiKey = apiKeys[provider as keyof typeof apiKeys];

  if (!apiKey) {
    const fallback = provider === 'alibaba' ? 'tencent' : 'alibaba';
    const fbKey = apiKeys[fallback as keyof typeof apiKeys];
    if (fbKey) {
      return generateImageWithProvider(params, fallback, 'hunyuan-image', fbKey);
    }
    return mockImageGeneration(params.prompt);
  }

  try {
    return await generateImageWithProvider(params, provider, model, apiKey);
  } catch (e) {
    const fallback = provider === 'alibaba' ? 'tencent' : 'alibaba';
    const fbKey = apiKeys[fallback as keyof typeof apiKeys];
    if (fbKey) {
      try {
        return await generateImageWithProvider(params, fallback, 'hunyuan-image', fbKey);
      } catch (e2) {
        return mockImageGeneration(params.prompt);
      }
    }
    return mockImageGeneration(params.prompt);
  }
}

async function generateImageWithProvider(
  params: GenerateImageParams,
  provider: string,
  model: string,
  apiKey: string
): Promise<GenerateResult> {
  const config = PROVIDERS[provider];

  if (provider === 'alibaba') {
    const data = await callAPI(provider, '/api/v1/services/aigc/image-generation/generation', {
      model,
      input: {
        prompt: params.prompt,
        ...(params.negativePrompt ? { negative_prompt: params.negativePrompt } : {}),
        ...(params.referenceImage ? { ref_img: params.referenceImage } : {}),
      },
      parameters: {
        size: params.size || '1024*1024',
        n: params.n || 1,
      },
    }, apiKey);

    const urls = data.output?.results?.map((r: any) => r.url) || [];
    return {
      success: true,
      data: urls.length === 1 ? urls[0] : urls,
      provider: config.name,
      model,
    };
  }

  if (provider === 'tencent') {
    const data = await callAPI(provider, '/v1/images/generations', {
      model,
      prompt: params.prompt,
      n: params.n || 1,
      size: params.size || '1024x1024',
    }, apiKey);

    const urls = data.data?.map((r: any) => r.url) || [];
    return {
      success: true,
      data: urls.length === 1 ? urls[0] : urls,
      provider: config.name,
      model,
    };
  }

  throw new Error(`不支持的provider: ${provider}`);
}

/**
 * 生成视频 (自动选择最佳Provider和模型)
 */
export async function generateVideo(
  params: GenerateVideoParams,
  task?: keyof typeof MODEL_SELECTION
): Promise<GenerateResult> {
  const apiKeys = getUserApiKeys();
  const selection = task ? MODEL_SELECTION[task] : MODEL_SELECTION.shortVideo;
  const provider = selection.provider;
  const model = (selection as any).video || 'wan2.7-t2v';
  const apiKey = apiKeys[provider as keyof typeof apiKeys];

  if (!apiKey) {
    const fallback = provider === 'alibaba' ? 'tencent' : 'alibaba';
    const fbKey = apiKeys[fallback as keyof typeof apiKeys];
    if (fbKey) {
      const fbModel = fallback === 'tencent' ? 'hunyuan-video' : 'wan2.7-t2v';
      try {
        return await generateVideoWithProvider(params, fallback, fbModel, fbKey);
      } catch (e) {
        return mockVideoGeneration(params, task);
      }
    }
    return mockVideoGeneration(params, task);
  }

  try {
    return await generateVideoWithProvider(params, provider, model, apiKey);
  } catch (e) {
    const fallback = provider === 'alibaba' ? 'tencent' : 'alibaba';
    const fbKey = apiKeys[fallback as keyof typeof apiKeys];
    if (fbKey) {
      try {
        const fbModel = fallback === 'tencent' ? 'hunyuan-video' : 'wan2.7-t2v';
        return await generateVideoWithProvider(params, fallback, fbModel, fbKey);
      } catch (e2) {
        return mockVideoGeneration(params, task);
      }
    }
    return mockVideoGeneration(params, task);
  }
}

async function generateVideoWithProvider(
  params: GenerateVideoParams,
  provider: string,
  model: string,
  apiKey: string
): Promise<GenerateResult> {
  const config = PROVIDERS[provider];

  if (provider === 'alibaba') {
    const body: any = {
      model,
      input: { prompt: params.prompt },
      parameters: {
        size: params.size || '1280*720',
        duration: params.duration || 10,
      },
    };
    const data = await callAPI(provider, '/api/v1/services/aigc/video-generation/generation', body, apiKey);
    return {
      success: true,
      data: data.output?.video_url || data.output?.results?.[0]?.url || '',
      provider: config.name,
      model,
    };
  }

  if (provider === 'tencent') {
    const body: any = {
      model,
      prompt: params.prompt,
      duration: params.duration || 10,
      size: params.size || '1280x720',
    };
    const data = await callAPI(provider, '/v1/video/generations', body, apiKey);
    return {
      success: true,
      data: data.video_url || data.data?.[0]?.url || '',
      provider: config.name,
      model,
    };
  }

  throw new Error(`不支持的provider: ${provider}`);
}

// ─── Mock函数 (无API Key时的高质量模拟) ──────────

function mockTextGeneration(prompt: string, task?: string): GenerateResult {
  const texts: Record<string, string> = {
    xiaohongshu: `✨ 绝绝子！这款真的太可了！\n\n${prompt.slice(0, 30)}...\n\n姐妹们一定要冲！\n\n🏷️ #好物分享 #种草 #小红书爆款`,
    ecommerce: `【产品详情】\n\n🔥 限时热卖中\n\n📌 核心卖点：\n• 高品质材质，经久耐用\n• 人性化设计，使用便捷\n• 多场景适用，性价比超高\n\n💡 使用场景：\n在家、办公、出行都能轻松驾驭\n\n💰 限时优惠：立减50元\n\n🛒 立即购买 >`,
    shortVideo: `【短视频脚本】\n\n🎬 开头（0-3秒）：震撼画面+悬念音效\n📝 中段（3-15秒）：核心内容展示\n🎯 结尾（15-20秒）：行动号召+关注引导\n\n配音建议：热情活力风格，语速适中\n字幕：简体中文\nBGM：轻快节奏`,
    default: `【AI创作工厂生成】\n\n${prompt.slice(0, 100)}...\n\n---\n本内容由AI创作工厂智能生成\n提示：连接API Key可解锁更高质量`,
  };

  return {
    success: true,
    data: texts[task || 'default'] || texts.default,
    provider: '本地模拟',
    model: 'mock',
  };
}

function mockImageGeneration(prompt: string): GenerateResult {
  const colors = ['667eea', '764ba2', 'f093fb', '4facfe', '43e97b', 'fa709a'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const encoded = encodeURIComponent(prompt.slice(0, 50));
  const size = 1024;

  return {
    success: true,
    data: `https://via.placeholder.com/${size}x${size}/${color}/ffffff?text=${encoded}`,
    provider: '本地模拟',
    model: 'mock',
  };
}

function mockVideoGeneration(params: GenerateVideoParams, task?: string): GenerateResult {
  const size = params.size || '1280x720';
  const [w, h] = size.split('x');
  const desc = task ? `AI创作【${task}】` : 'AI生成短视频';

  return {
    success: true,
    data: `https://via.placeholder.com/${w}x${h}/000000/ffffff?text=${encodeURIComponent(desc)}+${params.duration || 10}s`,
    provider: '本地模拟',
    model: 'mock',
  };
}

// ─── 方言配音映射 ────────────────────────────────
export const dialectVoiceMap: Record<string, { provider: string; voiceId: string; label: string }> = {
  'male-mandarin': { provider: 'alibaba', voiceId: 'zhimi_emo', label: '男声-普通话' },
  'female-mandarin': { provider: 'alibaba', voiceId: 'xiaoyun', label: '女声-普通话' },
  'male-cantonese': { provider: 'tencent', voiceId: '101001', label: '男声-粤语' },
  'female-cantonese': { provider: 'tencent', voiceId: '101002', label: '女声-粤语' },
  'sichuan': { provider: 'alibaba', voiceId: 'sicuan_male', label: '四川话' },
  'dongbei': { provider: 'alibaba', voiceId: 'dongbei_male', label: '东北话' },
  'shanghai': { provider: 'tencent', voiceId: '101003', label: '上海话' },
  'minnan': { provider: 'tencent', voiceId: '101004', label: '闽南话' },
  'henan': { provider: 'alibaba', voiceId: 'henan_male', label: '河南话' },
  'hunan': { provider: 'alibaba', voiceId: 'hunan_male', label: '湖南话' },
  'shaanxi': { provider: 'tencent', voiceId: '101005', label: '陕西话' },
  'tianjin': { provider: 'tencent', voiceId: '101006', label: '天津话' },
  'male-english': { provider: 'alibaba', voiceId: 'en_male', label: '男声-英语' },
  'female-english': { provider: 'alibaba', voiceId: 'en_female', label: '女声-英语' },
};

// ─── 内容创意增强 API ────────────────────────────────

export interface ViralContentParams {
  topic: string;
  platform: 'douyin' | 'kuaishou' | 'xiaohongshu' | 'bilibili' | 'weibo';
  contentType?: 'video' | 'article' | 'image_text' | 'live_script' | 'ad_copy';
  creativity?: number;
  targetAudience?: string;
  productName?: string;
  keywords?: string[];
}

export interface ViralContentResult {
  titles: string[];
  bestTitle: string;
  outline: string[];
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  viralScore: {
    emotion: number;
    spread: number;
    uniqueness: number;
    identity: number;
    timeliness: number;
    anchor: number;
    visual: number;
    barrier: number;
    total: number;
  };
  geneAnalysis: {
    emotionDesc: string;
    infoGap: string;
    identityTag: string;
    actionTrigger: string;
    hitCount: number;
  };
  platformTips: string[];
  aiGenerated: boolean;
  _source: 'ai' | 'fallback';
}

export interface ViralAnalysisResult {
  topic: string;
  platform: string;
  geneAnalysis: any;
  viralScore: any;
  rating: string;
}

export interface PlatformTrendsResult {
  [platform: string]: {
    platform: string;
    trendingTopics: string[];
    viralFormats: string[];
    bestPostTimes: string;
    engagementTips: string[];
  };
}

/**
 * 生成爆款内容创意蓝图
 */
export async function generateViralContent(
  params: ViralContentParams
): Promise<{ success: boolean; data: ViralContentResult; rating: string }> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
    const resp = await fetch(`${API_BASE}/api/content-creativity/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: params.topic,
        platform: params.platform || 'douyin',
        contentType: params.contentType || 'video',
        creativity: params.creativity ?? 0.7,
        targetAudience: params.targetAudience,
        productName: params.productName,
        keywords: params.keywords,
      }),
    });
    const json = await resp.json();
    if (json.success && json.data) {
      return {
        success: true,
        data: json.data,
        rating: json.data.viralScore?.total >= 32 ? 'S级——极高爆款潜力'
          : json.data.viralScore?.total >= 26 ? 'A级——较强爆款潜力'
          : json.data.viralScore?.total >= 20 ? 'B级——中等潜力'
          : 'C级——需重新策划',
      };
    }
    throw new Error(json.error?.message || '生成失败');
  } catch (error: any) {
    console.error('[ViralContent] API error:', error.message);
    return { success: false, data: {} as ViralContentResult, rating: '' };
  }
}

/**
 * 分析主题爆款潜力（仅评分，不生成内容）
 */
export async function analyzeViralTopic(
  topic: string,
  platform: string = 'douyin',
  targetAudience?: string
): Promise<{ success: boolean; data?: ViralAnalysisResult }> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
    const resp = await fetch(`${API_BASE}/api/content-creativity/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, platform, targetAudience }),
    });
    const json = await resp.json();
    if (json.success) return { success: true, data: json.data };
    throw new Error(json.error?.message || '分析失败');
  } catch (error: any) {
    console.error('[ViralAnalyze] API error:', error.message);
    return { success: false };
  }
}

/**
 * 获取平台趋势数据
 */
export async function getPlatformTrends(
  platform?: string
): Promise<{ success: boolean; data?: PlatformTrendsResult | any }> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
    const path = platform
      ? `/api/content-creativity/trends/${platform}`
      : '/api/content-creativity/trends';
    const resp = await fetch(`${API_BASE}${path}`);
    const json = await resp.json();
    if (json.success) return { success: true, data: json.data };
    throw new Error(json.error?.message || '获取失败');
  } catch (error: any) {
    console.error('[PlatformTrends] API error:', error.message);
    return { success: false };
  }
}
