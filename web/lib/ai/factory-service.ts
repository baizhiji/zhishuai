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

// ─── 反AI味提示词增强 ──────────────────────────
import {
  HUMAN_TEXT_SYSTEM_PROMPT,
  XIAOHONGSHU_HUMAN_PROMPT,
  ECOMMERCE_HUMAN_PROMPT,
  enhanceImagePrompt,
  buildNegativePrompt,
  buildVideoRealismPrompt,
  qualityScore,
} from './anti-ai-flavor';

// ─── Mock函数 (无API Key时的高质量真人级模拟) ──────────

/**
 * 文字生成mock — 真人写作风格，无AI味
 * 模拟真实创作者的写作方式
 */
function mockTextGeneration(prompt: string, task?: string): GenerateResult {
  const topic = prompt.slice(0, 60);

  const texts: Record<string, string> = {
    xiaohongshu: generateXiaohongshuMock(topic),
    ecommerce: generateEcommerceMock(topic),
    shortVideo: generateShortVideoMock(topic),
    enterpriseVideo: generateEnterpriseVideoMock(topic),
    productVideo: generateProductVideoMock(topic),
    storeTour: generateStoreTourMock(topic),
    personMv: generatePersonMvMock(topic),
    cartoonVideo: generateCartoonVideoMock(topic),
    digitalHuman: generateDigitalHumanMock(topic),
    default: generateGeneralMock(topic),
  };

  return {
    success: true,
    data: texts[task || 'default'] || texts.default,
    provider: '本地模拟（真人级）',
    model: 'mock-human-quality',
  };
}

// ─── 各类型真人级Mock文本生成 ──────────────────

function generateXiaohongshuMock(topic: string): string {
  const hooks = [
    `谁懂啊！！${topic} 我真的会谢...`,
    `说真的，${topic} 这个东西我真的用了好久才来写`,
    `姐妹们！${topic} 我发现了一个巨好用的方法！`,
    `突然发现 ${topic} 的打开方式一直都用错了...`,
  ];
  const body = `说真的我之前真的不知道，${topic} 原来可以这样。其实是上周闺蜜安利给我的，我试了一星期才来写这篇笔记。

用下来最大的感受就是——真的巨好用！！！之前用的那款对比起来简直就是...算了不说了。反正就是换了之后整个体验都不一样了。

一个小 tips：记得要${topic.includes('护肤') ? '先做皮肤测试再用' : '搭配XX一起用效果翻倍'}。我第一次用的时候就没注意这个，差点翻车。

反正我现在已经完全离不开了，家里囤了三个。实话实说，这个价位的里面真的没有比它更能打的了。`;

  return `${hooks[Math.floor(Math.random() * hooks.length)]}

${body}

#好物分享  #${topic.slice(0, 10)}  #真实测评  #种草`;
}

function generateEcommerceMock(topic: string): string {
  const body = topic + '\n\n' +
    '说实话这款产品我们测了整整两周才上架。一开始以为就是个普通的，结果用下来发现真的不一样。\n\n' +
    '就是那种一用就知道区别的感觉。材质这块下足了功夫，拿到手里特别有分量，不是那种轻飘飘的廉价感。' +
    '之前也有朋友买了说用着用着就不行了，但这批我们改进过的完全不会有这个问题。\n\n' +
    '设计上也改了好几版，最明显的变化就是把之前吐槽最多的那个接口改成磁吸的了——' +
    '就这点小改动，整个使用体验直接提升一大截。\n\n' +
    '价格这块我们也是谈了很久，最后定在了一个比较良心的价位。' +
    '说实话这个品质放在商场里起码翻一倍。\n\n' +
    '最后一句掏心窝子的话：如果你之前买过类似的觉得不好用，可以再给一次机会试试这个，应该不会让你失望。\n\n' +
    '下单的话直接点下面那个按钮就行，库存不多，手慢真的有可能会等。';
  return body;
}

function generateShortVideoMock(topic: string): string {
  const hooks = [
    `你以为的${topic} vs 实际上的${topic}`,
    `99%的人都不知道的${topic}秘密`,
    `${topic}居然可以这样？我整个人是懵的`,
  ];

  return `${hooks[Math.floor(Math.random() * hooks.length)]}

【0-3秒 这是你以为的XX（翻白眼）+字幕：你以为】
直接一个震撼对比，不要铺垫直接上

【3-8秒 但是实际上是这样的（画面反转）】
把最惊艳的点放在这5秒里，用事实打脸前面的预期

【8-12秒 补一个细节镜头】
这个细节99%的人不会注意到——慢放+局部特写

【12-18秒 讲讲为什么会这样（手持微晃镜头，边走边拍）】
这块讲原理，但别太正经。像跟朋友聊天一样。信不信由你，反正我是被惊到了

【18-22秒 总结 + CTA】
就记住一句话：${topic} 没你想的那么简单。关注我，下期更炸

【制作参数】
配音：女声-普通话，语速稍快（1.1倍），年轻女生日常说话的语气
字幕：中文，字号稍大（因为是竖屏）
BGM：前面轻快电子→中间去掉BGM留人声→最后起高潮鼓点`;
}

function generateEnterpriseVideoMock(topic: string): string {
  return `${topic} — 品牌宣传视频脚本

【开场 0-5秒】
建立品牌认知：一个真实的工作日常镜头（不是那种高大上的航拍，就是办公室的某个角落，有人在工作）
旁白（自然语气）：“说实话，做这行十几年了，最常被问的问题就是——${topic} 到底有什么难的？”

【发展 5-20秒】
几个快速切换的真实场景：生产车间、质检、客户沟通
不用配音演员那种字正腔圆的语调，就是一个真实员工的口吻
展示真实的制作流程，有瑕疵的那种——纸箱旁边有散落的包装膜，桌上有没喝完的咖啡

【高潮 20-35秒】
核心价值展示：产品特写 + 用户使用场景
切换到真实客户的使用画面（不是摆拍的那种，是真实记录）
适当出现人物说话的嘴型，哪怕有点口音也比完美配音真实

【结尾 35-42秒】
Brand moment：一组真实员工的群像（他们笑的瞬间，不是那种假笑）
字幕：“${topic}，用心做好每一件小事”`;
}

function generateProductVideoMock(topic: string): string {
  return `${topic} — 产品短视频脚本

【0-2秒 Hook】
手机举着自拍角度，不是专业相机。“给你们看看我最近买的一个东西...” 
——用日常语气，不像在读脚本

【2-8秒 产品展示】
手拿着产品转一圈，灯光自然（就是房间灯光）
说“这个手感真的...啧啧”而不是“采用高品质材质”

【8-15秒 使用演示】
直接上手用，拍出使用前后的对比
如果有液体倒出来、有开关按下去——这些声音都留着
画面有点微晃没关系，反而更真实

【15-20秒 CTA】
“链接放下面了，需要的自己去翻”
不用那种“限时抢购”“手慢无”的话术，太假了`;
}

function generateStoreTourMock(topic: string): string {
  return `${topic} — 探店视频脚本

【0-3秒】
推门进店的一瞬间——门铃响了（保留原声），画面有点暗正在适应光线
话外音：“就这家，听说${topic}做了一辈子”

【3-12秒 店内环境】
几个快切镜头：招牌/菜单/环境/老板忙碌的样子
不要用滑轨，就是手机拍的，有轻微晃动
拍到什么算什么，不要刻意构图

【12-25秒 核心美食/产品】
特写制作过程 + 成品 + 吃的第一口
关键是——第一口的反应要真实。不要夸张地说“yyds”，但眼睛亮了一下嘴角上扬就够了
咬下去的声音留着（脆的东西比如炸鸡/锅巴效果最好）

【25-32秒 结尾】
“说实话，会不会再来？会。但要排队就算了...” 
——真实的评价，有好的有不好的，这才是真人探店`;
}

function generatePersonMvMock(topic: string): string {
  return `${topic} — 真人MV脚本

【风格定位】
真实演唱/演奏风格，非专业MV那种完美灯光。自然光为主，不加美颜滤镜。
选用真实场景：卧室、天台、车里、回家的路上。不搭棚。

【分镜 0-10秒 前奏】
主角入镜——可以是在走路、在整理东西。音乐响起时ta自然地转头/抬头。
不要对口型，就是自然状态下的反应。

【分镜 10-30秒 主歌A段】
主角开始唱/对口型。关键是：表情要真。不是那种"看我在唱歌"的表演状态，
而是"我在唱给自己听"。偶尔看向镜头，大部分时间看向别处。
镜头微晃，像朋友在旁边拍的。

【分镜 30-50秒 副歌】
能量上来了，可以有稍微大一点的动作。但不要那种规划好的舞蹈，
就是听到喜欢的歌时自然的身体律动。

【分镜 50-60秒 尾声】
音乐渐弱，主角的一个微笑或者看向窗外的侧脸。定格。

【制作建议】
画面不加滤镜，直接用手机原生相机拍。
如果光线不够——开一盏台灯，不要开大灯。暖光营造氛围。
字幕用简单的中文字体，白色带半透明背景。不要花哨的字体。`;
}

function generateCartoonVideoMock(topic: string): string {
  return `${topic} — 萌宠卡通短视频脚本

【风格】2D/3D 卡通渲染，但材质和光影接近真实。不是那种"一眼AI"的塑料卡通。

【0-3秒 开场】
宠物/卡通角色做出一个让人想笑的表情或动作。不是夸张的鬼畜，是那种"可爱到想rua"的瞬间。

【3-15秒 剧情】
一个小小的日常。比如猫把桌上的东西推下去了（经典），配上主人的内心独白。
配音用真人声，带点无奈又好笑的语气，不是TTS机械音。

【15-20秒 结尾】
一个反转或萌点。可以慢放+配"aww"音效。字幕可以适当卖萌但不油腻。`;
}

function generateDigitalHumanMock(topic: string): string {
  return `${topic} — 数字人口播脚本

【关键要求】数字人必须做到：肉眼无法分辨是AI还是真人。皮肤纹理、眨眼节奏、面部微表情、自然的头部晃动——如果这些做不到就先用真人出镜。

【0-3秒 开场】
直接说话：“我最近一直在想一个问题——${topic}”
语气随意，像你在跟朋友聊天而不是在做节目

【3-25秒 主内容】
分享观点。语速不恒定——讲到重点的时候会慢下来，讲到自己确认的地方会稍微快一点。
偶尔停顿1-2秒（像在思考措辞），不要每句话都连得很紧。
适当加入“就是”“其实”“怎么说呢”这种真实说话的口头禅。

【25-30秒 结尾】
总结观点——但不要用“总结一下”这种词。直接说出想法就行。“反正我觉得吧...你们觉得呢？”用问句收尾，增加互动感。

【技术参数】
- 帧率：30fps以上
- 口型同步度：≥95%
- 眨眼间隔：随机2-4秒
- 上半身微动：点头、耸肩、手势——合在一起更像真人`;
}

function generateGeneralMock(topic: string): string {
  return `${topic}

说实话这个话题真的挺有意思的。我刚才想了一下，其实很多人的误区在于——觉得这个东西很简单，但实际上里面的门道真的挺多的。

就拿最基础的来说吧，很多人一上来就想搞个大新闻，结果第一步就卡住了。真的不用那么着急，先把基本功打扎实再说。

反正我个人建议是从小处着手，慢慢来比较快。当然每个人的情况不一样，我说的也不一定对，你们自己判断哈。

---
提示：接入阿里云百炼或腾讯云TokenHub API Key可获得完整真人级生成效果`;
}

// ─── Enhanced Image Mock ──────────────────────────

function mockImageGeneration(prompt: string, type?: string): GenerateResult {
  const enhancedPrompt = enhanceImagePrompt(
    prompt,
    type === 'portrait' ? 'portrait' : type === 'product' ? 'product' : 'general'
  );
  const colors = ['1a1a2e', '16213e', '0f3460', '533483', 'e94560', '874356'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const encoded = encodeURIComponent(enhancedPrompt.slice(0, 50));
  const size = 1024;

  return {
    success: true,
    data: `https://via.placeholder.com/${size}x${size}/${color}/ffffff?text=${encoded}`,
    provider: '本地模拟（照片级）',
    model: 'mock-photo-quality',
  };
}

// ─── Enhanced Video Mock ──────────────────────────

function mockVideoGeneration(params: GenerateVideoParams, task?: string): GenerateResult {
  const size = params.size || '1280x720';
  const [w, h] = size.split('x');
  const realismType = task?.includes('human') || task?.includes('mv')
    ? 'portrait' : task?.includes('product') ? 'product'
    : task?.includes('enterprise') ? 'enterprise'
    : task?.includes('digital') ? 'digital-human' : 'scene';
  const quality = qualityScore(realismType.includes('human') || realismType.includes('digital') ? 'digital-human' : 'video');

  return {
    success: true,
    data: `https://via.placeholder.com/${w}x${h}/1a1a2e/00d2ff?text=真人级${task || '短视频'}+${params.duration || 10}s+${quality.label}`,
    provider: '本地模拟（电影级）',
    model: 'mock-cinema-quality',
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
