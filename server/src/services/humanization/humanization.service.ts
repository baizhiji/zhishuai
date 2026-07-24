/**
 * AI 去AI味 - 拟人化服务
 *
 * 三层拟人化：
 * 1. 文本层 - 文案口吻、情感、句式自然化
 * 2. 语音层 - TTS情感参数、后期处理
 * 3. 视觉层 - 真实摄影/电影感运镜/胶片质感
 *
 * 设计原则：
 * - 不追求"完美"，追求"自然"
 * - 引入可控的"瑕疵"：轻微抖动、胶片颗粒、呼吸声
 * - 模拟真实拍摄工作流
 */

// ─── 类型 ───
export type HumanizeLevel = 'subtle' | 'natural' | 'strong';

export interface VoiceHumanizeOptions {
  /** 拟人化强度 */
  level?: HumanizeLevel;
  /** 目标平台 */
  platform?: 'short_video' | 'live' | 'podcast' | 'mv';
  /** 是否需要情感 */
  emotional?: boolean;
  /** 音色预设 */
  voicePreset?: 'young_male' | 'young_female' | 'mature_male' | 'mature_female' | 'child' | 'elder';
}

export interface VoiceHumanizeResult {
  /** 调整后的TTS参数 */
  ttsParams: {
    voice: string;
    speed: number;        // 语速 0.8-1.2
    pitch: number;        // 音调 -5 ~ +5
    volume: number;       // 音量 0.8-1.0
    emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'fear' | 'surprise' | 'calm';
  };
  /** 后期处理参数（FFmpeg） */
  postProcess: {
    /** 添加呼吸声间隔（秒） */
    breathInterval: number;
    /** 添加背景噪音强度 (0-1) */
    noiseLevel: number;
    /** 添加回响强度 (0-1) */
    reverbLevel: number;
    /** 添加停顿/口吃 (0-1) */
    pauseProbability: number;
  };
  /** 拟人化提示 */
  tips: string[];
}

export interface ImageHumanizeOptions {
  level?: HumanizeLevel;
  style?: 'photography' | 'cinematic' | 'documentary' | 'commercial' | 'portrait';
  scenario?: 'product' | 'person' | 'scenery' | 'food' | 'fashion' | 'business';
}

export interface ImageHumanizeResult {
  /** 增强后的提示词 */
  enhancedPrompt: string;
  /** 负面提示词（避免AI典型缺陷） */
  negativePrompt: string;
  /** 后期处理参数 */
  postProcess: {
    /** 添加胶片颗粒强度 (0-1) */
    filmGrain: number;
    /** 镜头光晕 (0-1) */
    lensFlare: number;
    /** 色彩饱和度调整 (-0.3 ~ +0.3) */
    saturation: number;
    /** 添加噪点 (0-1) */
    noiseLevel: number;
    /** 锐化 (0-1) */
    sharpness: number;
  };
  /** 推荐模型（如果支持） */
  recommendedModel?: string;
  tips: string[];
}

export interface PortraitHumanizeOptions {
  level?: HumanizeLevel;
  sourceImage?: string; // base64
  /** 性别 */
  gender?: 'male' | 'female';
  /** 年龄段 */
  ageRange?: 'child' | 'young' | 'middle' | 'elder';
  /** 场景 */
  scenario?: 'speaking' | 'walking' | 'gesturing' | 'sitting' | 'standing';
}

export interface PortraitHumanizeResult {
  /** 推荐数字人服务商 */
  recommendedProvider: string;
  /** 推荐模型 */
  recommendedModel: string;
  /** 后期处理参数 */
  postProcess: {
    /** 口型同步精度提升 (0-1) */
    lipSyncBoost: number;
    /** 皮肤纹理增强 (0-1) */
    skinTextureEnhance: number;
    /** 动作自然度 (0-1) */
    motionNaturalness: number;
    /** 衣物细节 (0-1) */
    clothingDetail: number;
  };
  /** 配置参数 */
  config: {
    fps: number;
    resolution: string;
    backgroundBlur: number;
    lightDirection: string;
  };
  tips: string[];
}

// ─── 语音拟人化服务 ───
export class VoiceHumanizer {
  humanize(options: VoiceHumanizeOptions = {}): VoiceHumanizeResult {
    const { level = 'natural', platform = 'short_video', voicePreset = 'young_female' } = options;

    // 基础TTS参数
    const baseParams = {
      voice: this.getVoiceByPreset(voicePreset),
      speed: 1.0,
      pitch: 0,
      volume: 1.0,
      emotion: 'neutral' as 'happy' | 'calm' | 'neutral' | 'sad',
    };

    // 后期处理
    const basePost = {
      breathInterval: 8.0,
      noiseLevel: 0.0,
      reverbLevel: 0.0,
      pauseProbability: 0.0,
    };

    let ttsParams = { ...baseParams };
    let postProcess = { ...basePost };
    const tips: string[] = [];

    // 平台差异化
    if (platform === 'short_video') {
      // 短视频：稍快、有活力、带呼吸声
      ttsParams.speed = 1.05;
      ttsParams.emotion = 'happy';
      postProcess.breathInterval = 6.0;
      postProcess.noiseLevel = 0.05;
      tips.push('短视频场景：语速略快、情感积极、加入轻呼吸声模拟真实主播');
    } else if (platform === 'live') {
      ttsParams.speed = 1.1;
      ttsParams.emotion = 'happy';
      postProcess.breathInterval = 5.0;
      postProcess.noiseLevel = 0.08;
      tips.push('直播场景：语速更快、有激情、加入明显呼吸和停顿');
    } else if (platform === 'podcast') {
      ttsParams.speed = 0.95;
      ttsParams.emotion = 'calm';
      postProcess.breathInterval = 12.0;
      postProcess.reverbLevel = 0.1;
      tips.push('播客场景：语速较慢、平静、有磁性感、加入轻微回响');
    } else if (platform === 'mv') {
      ttsParams.speed = 0.9;
      ttsParams.emotion = 'neutral';
      postProcess.breathInterval = 10.0;
      postProcess.reverbLevel = 0.15;
      tips.push('MV场景：跟随音乐节拍、加入回响营造氛围');
    }

    // 强度调节
    if (level === 'subtle') {
      // 轻度：保持参数，加一点呼吸
      postProcess.breathInterval = Math.max(6, postProcess.breathInterval - 2);
      postProcess.noiseLevel = Math.min(0.1, postProcess.noiseLevel + 0.03);
      tips.push('轻度拟人化：仅添加呼吸声和轻微背景音');
    } else if (level === 'natural') {
      // 自然：默认
      tips.push('自然拟人化：呼吸声 + 背景噪音 + 情感参数');
    } else if (level === 'strong') {
      // 强烈：极致拟人
      postProcess.breathInterval = Math.max(3, postProcess.breathInterval - 3);
      postProcess.noiseLevel = Math.min(0.2, postProcess.noiseLevel + 0.1);
      postProcess.pauseProbability = 0.15;
      tips.push('深度拟人化：频繁呼吸 + 明显背景音 + 随机停顿/口吃');
    }

    return { ttsParams, postProcess, tips };
  }

  private getVoiceByPreset(preset: string): string {
    const map: Record<string, string> = {
      young_male: 'zhimi_emo / xiaoyu',
      young_female: 'xiaoyun / zhimi_emo',
      mature_male: 'aisheng / xiaoyu',
      mature_female: 'aitong / xiaoyun',
      child: 'aitong_child / xiaomeng',
      elder: 'old_man_voice / aijian',
    };
    return map[preset] || 'xiaoyun';
  }
}

// ─── 画面拟人化服务 ───
export class VisualHumanizer {
  humanize(prompt: string, options: ImageHumanizeOptions = {}): ImageHumanizeResult {
    const { level = 'natural', style = 'photography', scenario } = options;

    // 真实摄影风格的修饰词
    const styleEnhancements: Record<string, string> = {
      photography: 'photorealistic, captured with Sony A7M4, 85mm lens, f/1.8 aperture, shallow depth of field, natural skin texture, candid moment',
      cinematic: 'cinematic shot, anamorphic lens, 24fps, color graded like a Hollywood film, dramatic lighting, 2.39:1 aspect ratio',
      documentary: 'documentary style, available light, hand-held camera feel, authentic moment, real life, photojournalism',
      commercial: 'professional commercial photography, studio lighting, product hero shot, clean composition',
      portrait: 'natural portrait, soft window light, bokeh background, real skin texture, authentic expression, no makeup retouching',
    };

    // 场景差异化
    const scenarioEnhancements: Record<string, string> = {
      product: 'product photography, soft box lighting, white seamless background, slight reflection, commercial quality',
      person: 'candid portrait, natural pose, eye contact, real skin, no retouching, environmental background',
      scenery: 'landscape photography, golden hour lighting, wide angle, rule of thirds, atmospheric perspective',
      food: 'food photography, natural daylight, 45-degree angle, fresh ingredients visible, restaurant quality',
      fashion: 'editorial fashion, street style, natural movement, soft shadows, magazine quality',
      business: 'corporate photography, professional lighting, confident expression, business attire, office environment',
    };

    let styleSuffix = styleEnhancements[style] || styleEnhancements.photography;
    if (scenario && scenarioEnhancements[scenario]) {
      styleSuffix = scenarioEnhancements[scenario] + ', ' + styleSuffix;
    }

    // 反向提示词：避免AI典型缺陷
    let negativePrompt = 'cartoon, anime, illustration, painting, artificial, plastic, fake, oversaturated, HDR overprocessed, ' +
      'symmetrical face, perfect skin without texture, dead eyes, blurred face, deformed, bad anatomy, ' +
      'extra fingers, mutated, watermark, text, logo, signature, low quality, blurry, jpeg artifacts';

    // 强度调整
    if (level === 'subtle') {
      styleSuffix = 'natural, ' + styleSuffix;
      this.tipsAdd('轻度拟人化：保留基本自然光，添加轻微胶片质感');
    } else if (level === 'strong') {
      styleSuffix += ', film grain, Kodak Portra 400 film emulation, slight chromatic aberration, lens vignetting';
      negativePrompt += ', digital, clean, perfect';
      this.tipsAdd('深度拟人化：胶片颗粒 + 镜头光晕 + 色彩偏移');
    } else {
      styleSuffix += ', slight film grain, natural color';
      this.tipsAdd('自然拟人化：轻微胶片质感 + 自然色彩');
    }

    // 后期处理参数
    const postProcess = {
      filmGrain: level === 'strong' ? 0.25 : level === 'natural' ? 0.15 : 0.08,
      lensFlare: level === 'strong' ? 0.1 : 0.05,
      saturation: level === 'strong' ? -0.1 : 0,
      noiseLevel: level === 'strong' ? 0.05 : 0.02,
      sharpness: 0.7,
    };

    return {
      enhancedPrompt: `${prompt}, ${styleSuffix}`,
      negativePrompt,
      postProcess,
      tips: this.tips,
      recommendedModel: this.recommendModel(scenario),
    };
  }

  private tips: string[] = [];
  private tipsAdd(tip: string) {
    this.tips.push(tip);
  }

  private recommendModel(scenario?: string): string {
    if (scenario === 'portrait' || scenario === 'person') {
      return 'aliyun:wanx-v1 / tencent:hunyuan-image';
    }
    if (scenario === 'product') {
      return 'aliyun:wan2.7-image-pro';
    }
    if (scenario === 'scenery') {
      return 'midjourney:photorealistic / aliyun:flux-dev';
    }
    return 'aliyun:wan2.7-image-pro';
  }
}

// ─── 人物拟真服务 ───
export class PortraitHumanizer {
  humanize(options: PortraitHumanizeOptions = {}): PortraitHumanizeResult {
    const { level = 'natural', gender = 'female', ageRange = 'young', scenario = 'speaking' } = options;

    // 推荐服务商和模型
    const providerModels = this.recommendProvider(gender, ageRange);

    // 后期处理参数
    let basePost = {
      lipSyncBoost: 0.7,
      skinTextureEnhance: 0.6,
      motionNaturalness: 0.7,
      clothingDetail: 0.5,
    };

    const tips: string[] = [];

    if (level === 'subtle') {
      tips.push('轻度拟真：保持基础数字人，仅做口型同步');
    } else if (level === 'natural') {
      basePost.lipSyncBoost = 0.85;
      basePost.skinTextureEnhance = 0.75;
      basePost.motionNaturalness = 0.8;
      basePost.clothingDetail = 0.7;
      tips.push('自然拟真：口型精度+皮肤纹理+动作自然度全面提升');
    } else if (level === 'strong') {
      basePost.lipSyncBoost = 0.95;
      basePost.skinTextureEnhance = 0.9;
      basePost.motionNaturalness = 0.9;
      basePost.clothingDetail = 0.85;
      tips.push('深度拟真：极致口型同步 + 真实皮肤毛孔 + 自然动作 + 衣物细节');
    }

    // 场景调整
    if (scenario === 'speaking') {
      basePost.lipSyncBoost = Math.min(1, basePost.lipSyncBoost + 0.1);
      tips.push('口播场景：口型同步是核心，已强化处理');
    } else if (scenario === 'walking' || scenario === 'gesturing') {
      basePost.motionNaturalness = Math.min(1, basePost.motionNaturalness + 0.1);
      basePost.clothingDetail = Math.min(1, basePost.clothingDetail + 0.1);
      tips.push('动态场景：动作自然度和衣物物理模拟强化');
    }

    return {
      recommendedProvider: providerModels.provider,
      recommendedModel: providerModels.model,
      postProcess: basePost,
      config: {
        fps: 30,
        resolution: '1920x1080',
        backgroundBlur: 0.2,
        lightDirection: 'soft-front',
      },
      tips,
    };
  }

  private recommendProvider(gender: string, ageRange: string): { provider: string; model: string } {
    // 优先级：硅基智能 > 腾讯智影 > HeyGen > D-ID
    return {
      provider: '硅基智能',
      model: ageRange === 'child' ? 'silicon-child' : ageRange === 'elder' ? 'silicon-elder' :
        gender === 'male' ? 'silicon-male-v2' : 'silicon-female-v2',
    };
  }
}

// ─── 导出单例 ───
export const voiceHumanizer = new VoiceHumanizer();
export const visualHumanizer = new VisualHumanizer();
export const portraitHumanizer = new PortraitHumanizer();
