/**
 * AI创作工厂 — 10 个创作类目模型配置
 *
 * 依据：智枢 AI 创作工厂——AI 模型配置总蓝皮书 V2.1
 * 设计哲学：多模型协作流水线，各取所长，反 AI 化贯穿全流程
 * 五层流水线：文案产线 → 反AI化改造 → 图像产线 → 视频产线 → 配音合成
 *
 * API Key 来源：客户自行从阿里云百炼 / 腾讯云 TokenHub 申请
 * 消耗的 Tokens 由客户自行承担，平台不代付
 */

// ─── Provider 定义 ─────────────────────────────────

export type AiProvider = 'tencent' | 'alibaba' | 'volcano';

export interface ProviderInfo {
  id: AiProvider;
  name: string;
  label: string;
  /** 平台申请入口 */
  applyUrl: string;
  /** API 基础地址 */
  baseUrl: string;
  /** 兼容 OpenAI Chat Completions 格式的端点 */
  chatEndpoint: string;
  /** 图片生成端点 (Wan 系列异步模型用) */
  imageEndpoint: string;
  /** 多模态图片生成端点 (Qwen-Image 系列同步模型用) */
  multimodalImageEndpoint: string;
  /** 视频生成端点 */
  videoEndpoint: string;
  /** localStorage 中存储 API Key 的键名 */
  storageKey: string;
}

export const PROVIDER_INFO: Record<AiProvider, ProviderInfo> = {
  tencent: {
    id: 'tencent',
    name: 'Tencent TokenHub',
    label: '腾讯云 TokenHub',
    applyUrl: 'https://console.cloud.tencent.com/tokenhub',
    baseUrl: 'https://tokenhub.tencentmaas.com',
    chatEndpoint: '/v1/chat/completions',
    imageEndpoint: '/v1/images/generations',
    multimodalImageEndpoint: '/v1/images/generations',
    // TokenHub 视频使用原生 submit+poll 模式，非 OpenAI 兼容格式
    videoEndpoint: '/v1/api/video/submit',
    storageKey: 'api_key_tencent',
  },
  alibaba: {
    id: 'alibaba',
    name: 'Alibaba Bailian',
    label: '阿里云百炼',
    applyUrl: 'https://bailian.console.aliyun.com',
    baseUrl: 'https://dashscope.aliyuncs.com',
    chatEndpoint: '/compatible-mode/v1/chat/completions',
    // Wan 系列异步模型用 image-generation
    imageEndpoint: '/api/v1/services/aigc/image-generation/generation',
    // Qwen-Image 系列同步模型用 multimodal-generation（无 X-DashScope-Async 头）
    multimodalImageEndpoint: '/api/v1/services/aigc/multimodal-generation/generation',
    videoEndpoint: '/api/v1/services/aigc/video-generation/video-synthesis',
    storageKey: 'api_key_alibaba',
  },
  volcano: {
    id: 'volcano',
    name: 'Volcano Ark',
    label: '火山方舟',
    applyUrl: 'https://console.volcengine.com/ark',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    chatEndpoint: '/chat/completions',
    imageEndpoint: '/images/generations',
    multimodalImageEndpoint: '/images/generations',
    videoEndpoint: '/contents/generations/tasks',
    storageKey: 'api_key_volcano',
  },
};

// ─── 模型定义 — 按蓝皮书第四章模型选型总表 ────────────────

export interface ModelInfo {
  /** 内部 key，对应 model-registry 中的 key */
  registryKey: string;
  /** 实际 API 调用的 model ID */
  modelId: string;
  /** 显示名 */
  displayName: string;
  /** 所属 Provider */
  provider: AiProvider;
  /** 蓝皮书中的角色 */
  role: string;
  /** 成本等级 */
  cost: 'low' | 'medium' | 'high' | 'premium';
}

/**
 * 全部参与模型的注册信息（蓝皮书提及的 15 个核心模型）
 */
/**
 * P1-7 闲置模型标注：以下 key 当前未被 CATEGORY_PIPELINES 任何阶段引用（既非 primaryModel 也非 fallbackModel），
 * 属于"备用/预留"资源。它们不参与流水线执行，但保留定义以兼容旧版本直连调用与未来扩展。
 * 如需清理瘦身，可直接删除以下 key 及其对象定义：
 * qwen3.7-max, qwen-max-aly, qwen3.7-plus, hy-image-lite, qwen-image-3.0-pro,
 * hy-video-1.5, yt-video-2.0, hy-vision-2.0, vd-video-q3-turbo, happyhorse-1.1-t2v,
 * doubao-seed-2.1-turbo, doubao-seed-2.0-pro, doubao-seed-1.6, doubao-seed-1.6-thinking,
 * doubao-seed-2.0-lite, doubao-seedream-5.0-pro, doubao-seedream-5.0-lite,
 * doubao-seedream-4.0, doubao-seededit-3.0-i2i, doubao-seedance-2.5, doubao-voice-clone-2.0,
 * deepseek-v4-volcano, kimi-k2.7, minimax-m3, minimax-music-v2.6, fun-music-v1
 */
export const MODEL_INFO: Record<string, ModelInfo> = {
  // === 文案产线模型 ===
  'deepseek-v4-pro-tc': {
    registryKey: 'deepseek-v4-pro-tc',
    modelId: 'deepseek-v4-pro-202606',
    displayName: 'DeepSeek V4 Pro',
    provider: 'tencent',
    role: '结构化分析 / 大纲规划 / 质量评审 / 合规筛查 / 方案评估',
    cost: 'medium',
  },
  'qwen3.7-max': {
    registryKey: 'qwen3.7-max',
    modelId: 'qwen3.7-max',
    displayName: 'Qwen 3.7 Max',
    provider: 'alibaba',
    role: '文案主创 / 创意重写 / 风格校准 / 最终定稿',
    cost: 'premium',
  },
  'qwen-max-aly': {
    registryKey: 'qwen-max-aly',
    modelId: 'qwen-max',
    displayName: 'Qwen Max (经典)',
    provider: 'alibaba',
    role: '辅助文案生成',
    cost: 'medium',
  },
  'qwen3.7-plus': {
    registryKey: 'qwen3.7-plus',
    modelId: 'qwen3.7-plus',
    displayName: 'Qwen 3.7 Plus',
    provider: 'alibaba',
    role: '多平台适配裁剪',
    cost: 'medium',
  },
  // === 图片产线模型 ===
  'hy-image-v3': {
    registryKey: 'hy-image-v3',
    modelId: 'hy-image-v3.0',
    displayName: '混元 Image 3.0',
    provider: 'tencent',
    role: '图片主生成引擎',
    cost: 'high',
  },
  'hy-image-lite': {
    registryKey: 'hy-image-lite',
    modelId: 'hy-image-lite',
    displayName: '混元 Image Lite',
    provider: 'tencent',
    role: '快速预览出图',
    cost: 'medium',
  },
  'wan2.7-image-pro-aly': {
    registryKey: 'wan2.7-image-pro-aly',
    modelId: 'wan2.7-image-pro',
    displayName: 'WAN 2.7 图像 Pro',
    provider: 'alibaba',
    role: '图片备选引擎 / 电商设计',
    cost: 'high',
  },
  'qwen-image-3.0-pro': {
    registryKey: 'qwen-image-3.0-pro',
    modelId: 'qwen-image-3.0-pro',
    displayName: '千问图像 3.0 Pro',
    provider: 'alibaba',
    role: '创意海报 / 品牌视觉',
    cost: 'high',
  },
  'qwen-image-max': {
    registryKey: 'qwen-image-max',
    modelId: 'qwen-image-max',
    displayName: '千问图像 Max',
    provider: 'alibaba',
    role: '创意图像主力 / MV视觉 / 卡通素材',
    cost: 'high',
  },
  'qwen-image-edit': {
    registryKey: 'qwen-image-edit',
    modelId: 'qwen-image-edit',
    displayName: '千问图像编辑',
    provider: 'alibaba',
    role: '图片质量增强 / 去AI伪影 / 细节锐化 / 图像编辑',
    cost: 'high',
  },
  'z-image-turbo': {
    registryKey: 'z-image-turbo',
    modelId: 'z-image-turbo',
    displayName: 'Z-Image Turbo',
    provider: 'alibaba',
    role: '图像备用引擎（阿里百炼渠道，替代已下线的Flux）',
    cost: 'high',
  },
  // === 视频产线模型 ===
  'kling-video-v3': {
    registryKey: 'kling-video-v3',
    modelId: 'kl-video-v3',
    displayName: '可灵 KLING 3.0',
    provider: 'tencent',
    role: '图生视频主力 / 产品形态保持',
    cost: 'premium',
  },
  'hy-video-1.5': {
    registryKey: 'hy-video-1.5',
    modelId: 'hy-video-1.5',
    displayName: '混元视频 1.5',
    provider: 'tencent',
    role: '视频备选引擎',
    cost: 'high',
  },
  'yt-video-2.0': {
    registryKey: 'yt-video-2.0',
    modelId: 'yt-video-2.0',
    displayName: '优图视频 2.0',
    provider: 'tencent',
    role: '图生视频 / 广告创意',
    cost: 'high',
  },
  // === 数字人模型 ===
  'yt-video-humanactor': {
    registryKey: 'yt-video-humanactor',
    modelId: 'yt-video-humanactor',
    displayName: '数字人（数人）',
    provider: 'tencent',
    role: '数字人口播 / 虚拟主播',
    cost: 'high',
  },
  // === 配音 TTS 模型 ===
  'qwen-audio-3.0-tts-plus': {
    registryKey: 'qwen-audio-3.0-tts-plus',
    modelId: 'qwen-tts',
    displayName: '千问 TTS Plus',
    provider: 'alibaba',
    role: '配音合成 / 情绪化语音（百炼API modelId=qwen-tts）',
    cost: 'medium',
  },
  // === 视觉理解模型 ===
  'hy-vision-2.0': {
    registryKey: 'hy-vision-2.0',
    modelId: 'hy-vision-2.0-instruct',
    displayName: '混元 Vision 2.0',
    provider: 'tencent',
    role: '产品视觉分析 / 质量评审',
    cost: 'medium',
  },

  // === v3.0 新增模型 ===

  // 千问文本旗舰
  'qwen3.8-max': {
    registryKey: 'qwen3.8-max',
    modelId: 'qwen3.8-max',
    displayName: 'Qwen 3.8 Max',
    provider: 'alibaba',
    role: '高质量创作 / 沉浸编程 / 复杂推理',
    cost: 'premium',
  },

  // 去AI化英文
  'kimi-k3': {
    registryKey: 'kimi-k3',
    modelId: 'kimi-k3',
    displayName: 'Kimi K3',
    provider: 'tencent',
    role: '英文去AI化 / 中英双语顶级 / 1M上下文',
    cost: 'premium',
  },

  // 视频 — Vidu 系列 (TokenHub)
  'vd-video-q3-pro': {
    registryKey: 'vd-video-q3-pro',
    modelId: 'Vidu-Video-q3-pro',
    displayName: 'Vidu Q3 Pro',
    provider: 'tencent',
    role: '电影级文生视频 / 复杂场景叙事',
    cost: 'premium',
  },
  'vd-video-q3-turbo': {
    registryKey: 'vd-video-q3-turbo',
    modelId: 'Vidu-Video-q3-turbo',
    displayName: 'Vidu Q3 Turbo',
    provider: 'tencent',
    role: '快速高质量视频 / 商业广告',
    cost: 'premium',
  },

  // 视频 — HappyHorse 系列 (阿里云百炼)
  'happyhorse-1.1-t2v': {
    registryKey: 'happyhorse-1.1-t2v',
    modelId: 'happyhorse-1.1-t2v',
    displayName: 'HappyHorse 1.1 T2V',
    provider: 'alibaba',
    role: '阿里侧文生视频 / 与千问生态联动',
    cost: 'high',
  },
  'happyhorse-1.0-video-edit': {
    registryKey: 'happyhorse-1.0-video-edit',
    modelId: 'happyhorse-1.0-video-edit',
    displayName: 'HappyHorse 1.0 VideoEdit',
    provider: 'alibaba',
    role: '视频编辑 / 消物修复 / 局部替换',
    cost: 'high',
  },

  // TTS
  'minimax-speech-2.8-hd': {
    registryKey: 'minimax-speech-2.8-hd',
    modelId: 'MiniMax/speech-2.8-hd',
    displayName: 'MiniMax Speech 2.8 HD',
    provider: 'alibaba',
    role: '高保真语音合成 / 品牌配音克隆 / 多情感语音',
    cost: 'medium',
  },

  // === v4.0 新增：火山方舟模型（蓝皮书附录 A.3 全文） ===
  // 文本大模型
  'doubao-seed-2.1-pro': {
    registryKey: 'doubao-seed-2.1-pro',
    modelId: 'doubao-seed-2-1-pro-260628',
    displayName: 'Doubao Seed 2.1 Pro',
    provider: 'volcano',
    role: '高质量创作 / 复杂推理 / 需求解析 / 剪辑脚本',
    cost: 'premium',
  },
  'doubao-seed-2.1-turbo': {
    registryKey: 'doubao-seed-2.1-turbo',
    modelId: 'doubao-seed-2-1-turbo-260628',
    displayName: 'Doubao Seed 2.1 Turbo',
    provider: 'volcano',
    role: '快速创作 / 长文本 / 高性价比',
    cost: 'medium',
  },
  'doubao-seed-2.0-pro': {
    registryKey: 'doubao-seed-2.0-pro',
    modelId: 'doubao-seed-2-0-pro-260215',
    displayName: 'Doubao Seed 2.0 Pro',
    provider: 'volcano',
    role: '通用创作 / 分析总结',
    cost: 'medium',
  },
  'doubao-seed-1.6': {
    registryKey: 'doubao-seed-1.6',
    modelId: 'doubao-seed-1-6-260915',
    displayName: 'Doubao Seed 1.6',
    provider: 'volcano',
    role: '通用对话 / 多场景创作',
    cost: 'low',
  },
  'doubao-seed-1.6-thinking': {
    registryKey: 'doubao-seed-1.6-thinking',
    modelId: 'doubao-seed-1-6-thinking-251015',
    displayName: 'Doubao Seed 1.6 Thinking',
    provider: 'volcano',
    role: '深度推理 / 复杂逻辑拆解',
    cost: 'medium',
  },
  'doubao-seed-2.0-lite': {
    registryKey: 'doubao-seed-2.0-lite',
    modelId: 'doubao-seed-2-0-lite-260215',
    displayName: 'Doubao Seed 2.0 Lite',
    provider: 'volcano',
    role: '轻量快速生成',
    cost: 'low',
  },
  // 图像模型
  'doubao-seedream-5.0-pro': {
    registryKey: 'doubao-seedream-5.0-pro',
    modelId: 'doubao-seedream-5-0-pro-260628',
    displayName: 'Doubao Seedream 5.0 Pro',
    provider: 'volcano',
    role: '图像生成主力（海报/电商/创意）',
    cost: 'high',
  },
  'doubao-seedream-5.0-lite': {
    registryKey: 'doubao-seedream-5.0-lite',
    modelId: 'doubao-seedream-5-0-lite-260628',
    displayName: 'Doubao Seedream 5.0 Lite',
    provider: 'volcano',
    role: '快速出图 / 高性价比',
    cost: 'medium',
  },
  'doubao-seedream-4.0': {
    registryKey: 'doubao-seedream-4.0',
    modelId: 'doubao-seedream-4-0-250828',
    displayName: 'Doubao Seedream 4.0',
    provider: 'volcano',
    role: '图像生成备选引擎',
    cost: 'high',
  },
  // 图像编辑模型
  'doubao-seededit-3.0-i2i': {
    registryKey: 'doubao-seededit-3.0-i2i',
    modelId: 'doubao-seededit-3-0-i2i-250628',
    displayName: 'Doubao SeedEdit 3.0 I2I',
    provider: 'volcano',
    role: '图像编辑 / 局部重绘 / 风格迁移',
    cost: 'high',
  },
  // 视频模型（2026-08-31 实测：doubao-seedance-2-5-pro-260628 返回 404 不存在，改用 1.0 Pro）
  'doubao-seedance-1.0-pro': {
    registryKey: 'doubao-seedance-1.0-pro',
    modelId: 'doubao-seedance-1-0-pro-250528',
    displayName: 'Doubao Seedance 1.0 Pro',
    provider: 'volcano',
    role: '文生视频 / 图生视频 / 镜头生成',
    cost: 'premium',
  },
  // 音频 TTS
  'doubao-seed-audio-1.0': {
    registryKey: 'doubao-seed-audio-1.0',
    modelId: 'doubao-seed-audio-1.0',
    displayName: 'Doubao Seed Audio 1.0',
    provider: 'volcano',
    role: '语音合成 / 多音色配音',
    cost: 'medium',
  },
  // 声音复刻
  'doubao-voice-clone-2.0': {
    registryKey: 'doubao-voice-clone-2.0',
    modelId: 'doubao-voice-clone-2-0',
    displayName: '声音复刻 2.0',
    provider: 'volcano',
    role: '声音复刻 / 品牌音色定制',
    cost: 'high',
  },
  // 视频理解模型（智能剪辑素材理解）
  'yt-vita-1.5': {
    registryKey: 'yt-vita-1.5',
    modelId: 'yt-vita-1-5',
    displayName: 'YT-VITA 视频理解',
    provider: 'tencent',
    role: '视频素材理解 / 剪辑点识别（腾讯优图开源视频理解）',
    cost: 'high',
  },

  // === v4.0 新增：火山方舟第三方模型（蓝皮书附录 A.3 第三方区） ===
  'deepseek-v4-volcano': {
    registryKey: 'deepseek-v4-volcano',
    modelId: 'deepseek-v4-260628',
    displayName: 'DeepSeek V4 (方舟)',
    provider: 'volcano',
    role: '方舟第三方 DeepSeek V4 / 结构化分析',
    cost: 'medium',
  },
  'glm-5.2': {
    registryKey: 'glm-5.2',
    modelId: 'glm-5-2',
    displayName: 'GLM 5.2 (方舟)',
    provider: 'volcano',
    role: '字幕生成 / 去AI化 / 中英双语',
    cost: 'high',
  },
  'kimi-k2.7': {
    registryKey: 'kimi-k2.7',
    modelId: 'kimi-k2-7',
    displayName: 'Kimi K2.7 (方舟)',
    provider: 'volcano',
    role: '长文本理解 / 剪辑点描述 / 字幕',
    cost: 'high',
  },
  'minimax-m3': {
    registryKey: 'minimax-m3',
    modelId: 'minimax-m3',
    displayName: 'MiniMax M3 (方舟)',
    provider: 'volcano',
    role: '创意文案 / 情感表达',
    cost: 'high',
  },
  // BGM 音乐模型（蓝皮书 §4.1 智能剪辑第6阶段）
  'minimax-music-v2.6': {
    registryKey: 'minimax-music-v2.6',
    modelId: 'MiniMax/music-v2.6',
    displayName: 'MiniMax Music V2.6',
    provider: 'alibaba',
    role: 'BGM 配乐生成 / 情绪化背景音乐',
    cost: 'high',
  },
  'fun-music-v1': {
    registryKey: 'fun-music-v1',
    modelId: 'fun-music-v1',
    displayName: 'Fun Music V1',
    provider: 'volcano',
    role: 'BGM 配乐备选 / 轻快背景音乐',
    cost: 'medium',
  },

};

// ─── 10 个创作类目 & 流水线配置 ─────────────────────

/**
 * 流水线阶段类型
 */
export type PipelinePhase =
  | 'viral_analysis'       // 爆款意图分析
  | 'outline'              // 结构化大纲
  | 'draft'                // 初稿生成（高温创意）
  | 'anti_ai_rewrite'      // 反 AI 化重写
  | 'style_calibration'    // 风格校准（V2.1 新增）
  | 'quality_review'       // 质量评审
  | 'platform_adapt'       // 多平台适配
  | 'visual_strategy'      // 视觉策略分析
  | 'image_prompt'         // Prompt 生成
  | 'image_generate'       // 图片生成
  | 'image_select'         // 择优选择
  | 'script_generate'      // 分镜脚本
  | 'video_generate'       // 视频生成
  | 'digital_human'        // 数字人出镜
  | 'tts_generate'         // 配音合成
  | 'bgm_generate'         // BGM配乐生成（v3.0 新增）
  | 'brand_voice_clone'    // 品牌配音克隆（v3.0 新增）
  | 'subtitle_generate'    // 中英双语字幕生成（v3.1 新增）
  | 'video_edit'           // 视频瑕疵修复/产品形态一致性修复（v3.1 新增）
  | 'image_enhance'        // 图片质量增强/超分/去伪影（v3.1 新增）
  | 'dialect_voiceover'    // 方言配音（v3.1 新增：四川话/东北话/上海话/闽南话/河南话/粤语）
  | 'compliance_check'     // 合规筛查
  // 智能剪辑产线阶段（v4.0 新增，蓝皮书 §4.1）
  | 'edit_plan'            // 需求解析 / 剪辑脚本（DeepSeek-V4-Pro/Qwen3.8-Max）
  | 'clip_analysis'        // 素材理解 / 剪辑点识别（YT-VITA/Doubao-Seed-2.1-Pro 视频理解）
  | 'shot_order'           // 镜头排序 / 卡点编排（DeepSeek-V4-Pro/Qwen3.8-Max）
  | 'color_grading'        // 调色 / 滤镜策略（DeepSeek-V4-Pro/Qwen3.8-Max）
  | 'local_compose';       // 本地 FFmpeg 合成（无模型，桌面端执行）

export interface PhaseConfig {
  phase: PipelinePhase;
  label: string;
  /** 主力模型 registryKey */
  primaryModel: string;
  /** 备用模型（同 provider 降级或跨 provider 降级） */
  fallbackModel?: string;
  /** 该阶段的参数覆盖 */
  params?: Record<string, any>;
  /** 启用条件 */
  enabled: boolean;
}

export interface CategoryPipeline {
  /** 类目 slug */
  slug: string;
  /** 类目中文名 */
  name: string;
  /** 类目图标 */
  icon: string;
  /** 类目描述 */
  description: string;
  /** 主要产线 */
  pipeline: 'text' | 'image' | 'video' | 'digital_human';
  /** 阶段编排 */
  phases: PhaseConfig[];
  /** 该产线涉及的模型 key 列表（供用户检查 API Key 覆盖） */
  requiredModels: string[];
  /** 需要哪些 Provider（用来提醒用户配置 API Key） */
  requiresProviders: AiProvider[];
}

// ─── 10 个类目的完整流水线配置（蓝皮书 V3.1 质量优先版）─────────────────

export const CATEGORY_PIPELINES: CategoryPipeline[] = [
  // ========== 1. 小红书图文（蓝皮书 V2.1：8阶段）==========
  {
    slug: 'xiaohongshu',
    name: '小红书图文',
    icon: 'book-open',
    description: '生成小红书风格的图文内容，包含高质量文案和配图',
    pipeline: 'text',
    phases: [
      { phase: 'viral_analysis', label: '爆款意图分析', primaryModel: 'deepseek-v4-pro-tc', params: { temperature: 0.5 }, enabled: true },
      { phase: 'outline', label: '结构化大纲', primaryModel: 'deepseek-v4-pro-tc', params: { temperature: 0.6 }, enabled: true },
      { phase: 'draft', label: '初稿生成（高温创意）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.88, top_p: 0.92, frequency_penalty: 0.3 }, enabled: true },
      { phase: 'anti_ai_rewrite', label: '反AI化重写（小红书口语化）', primaryModel: 'qwen3.8-max', fallbackModel: 'kimi-k3', params: { temperature: 0.75, systemPrompt: 'xiaohongshu' }, enabled: true },
      { phase: 'image_generate', label: '配图生成（4张选最优）', primaryModel: 'qwen-image-max', fallbackModel: 'z-image-turbo', params: { n: 4, size: '2048x2048', style: 'xhs_lifestyle' }, enabled: true },
      { phase: 'image_enhance', label: '图片质量增强（去AI伪影/细节锐化）', primaryModel: 'qwen-image-edit', fallbackModel: 'z-image-turbo', params: { operation: 'refine', sharpen: true, deartifact: true }, enabled: true },
      { phase: 'compliance_check', label: '图文合规安全审查', primaryModel: 'deepseek-v4-pro-tc', params: { checkType: 'ad_law,content_safety,copyright' }, enabled: true },
      { phase: 'quality_review', label: '质量交叉评审', primaryModel: 'deepseek-v4-pro-tc', params: { temperature: 0.2 }, enabled: true },
      { phase: 'style_calibration', label: '风格校准（定稿润色）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.65 }, enabled: true },
      { phase: 'platform_adapt', label: '小红书格式适配', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', enabled: true },
    ],
    requiredModels: ['deepseek-v4-pro-tc', 'qwen3.8-max', 'kimi-k3', 'qwen-image-max', 'z-image-turbo'],
    requiresProviders: ['tencent', 'alibaba'],
  },

  // ========== 2. 图片生成（蓝皮书 V2.1：6阶段）==========
  {
    slug: 'image',
    name: '图片生成',
    icon: 'image',
    description: '生成高质量、反AI化的商业图片和创意设计',
    pipeline: 'image',
    phases: [
      { phase: 'visual_strategy', label: '视觉策略分析', primaryModel: 'deepseek-v4-pro-tc', params: { temperature: 0.5 }, enabled: true },
      { phase: 'viral_analysis', label: '爆款视觉风格对标', primaryModel: 'deepseek-v4-pro-tc', params: { temperature: 0.6 }, enabled: true },
      { phase: 'image_prompt', label: '双轨Prompt生成（正向+负向）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.7 }, enabled: true },
      { phase: 'image_generate', label: '多模型并行出图（每模型4张）', primaryModel: 'qwen-image-max', fallbackModel: 'z-image-turbo', params: { n: 4, size: '2048x2048' }, enabled: true },
      { phase: 'image_enhance', label: '图片质量增强（去AI伪影/超分/细节锐化）', primaryModel: 'qwen-image-edit', fallbackModel: 'z-image-turbo', params: { operation: 'refine', sharpen: true, deartifact: true, upscale: true }, enabled: true },
      { phase: 'image_select', label: '质量评审 + 择优输出', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'compliance_check', label: '内容安全筛查', primaryModel: 'deepseek-v4-pro-tc', params: { checkType: 'copyright,nsfw,toxic' }, enabled: true },
    ],
    requiredModels: ['deepseek-v4-pro-tc', 'qwen3.8-max', 'qwen-image-max', 'z-image-turbo', 'hy-image-v3'],
    requiresProviders: ['tencent', 'alibaba'],
  },

  // ========== 3. 电商详情页（蓝皮书 V2.1：9阶段）==========
  {
    slug: 'ecommerce',
    name: '电商详情页',
    icon: 'shopping-cart',
    description: '生成电商商品详情页文案与主图、详情图',
    pipeline: 'text',
    phases: [
      { phase: 'viral_analysis', label: '品类爆款分析', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'outline', label: '详情页结构大纲', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'draft', label: '文案初稿生成', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.85 }, enabled: true },
      { phase: 'anti_ai_rewrite', label: '反AI化重写（电商口语化/英文国际化可用Kimi）', primaryModel: 'qwen3.8-max', fallbackModel: 'kimi-k3', params: { temperature: 0.75, systemPrompt: 'ecommerce' }, enabled: true },
      { phase: 'image_generate', label: '商品主图生成', primaryModel: 'wan2.7-image-pro-aly', fallbackModel: 'hy-image-v3', params: { style: 'product_white_bg', size: '800x800' }, enabled: true },
      { phase: 'image_generate', label: '详情图生成（场景图+卖点图）', primaryModel: 'qwen-image-max', fallbackModel: 'z-image-turbo', params: { n: 6, style: 'ecommerce' }, enabled: true },
      { phase: 'image_enhance', label: '商品图像增强（去伪影/细节锐化/色彩校准）', primaryModel: 'qwen-image-edit', fallbackModel: 'z-image-turbo', params: { operation: 'refine', sharpen: true, deartifact: true, colorCalibration: true }, enabled: true },
      { phase: 'compliance_check', label: '广告法合规筛查', primaryModel: 'deepseek-v4-pro-tc', params: { checkType: 'ad_law,false_claims' }, enabled: true },
      { phase: 'quality_review', label: '转化力评审', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'style_calibration', label: '风格校准（卖点精准化）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.65 }, enabled: true },
      { phase: 'platform_adapt', label: '平台格式裁剪', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', enabled: true },
    ],
    requiredModels: ['deepseek-v4-pro-tc', 'qwen3.8-max', 'kimi-k3', 'wan2.7-image-pro-aly', 'qwen-image-max', 'z-image-turbo'],
    requiresProviders: ['tencent', 'alibaba'],
  },

  // ========== 4. 短视频（v3.0：AI导演模式 — 原自由创意短片，唯一出口）==========
  {
    slug: 'shortVideo',
    name: '短视频',
    icon: 'clapperboard',
    description: 'AI导演模式：6镜头叙事短片(30-60s)，BGM配乐自动匹配，品牌配音克隆，端到端60s出片',
    pipeline: 'video',
    phases: [
      // 文案产线（3阶段）
      { phase: 'viral_analysis', label: '创意风格对标分析', primaryModel: 'deepseek-v4-pro-tc', params: { temperature: 0.5 }, enabled: true },
      { phase: 'draft', label: '6镜头叙事脚本生成', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.88 }, enabled: true },
      { phase: 'anti_ai_rewrite', label: '叙事节奏反AI化重写（真人创作者视角）', primaryModel: 'qwen3.8-max', fallbackModel: 'kimi-k3', params: { temperature: 0.78, systemPrompt: 'cinema' }, enabled: true },
      // 视觉产线（3阶段）
      { phase: 'script_generate', label: '6镜头分镜视觉化', primaryModel: 'qwen-image-max', fallbackModel: 'z-image-turbo', params: { n: 6 }, enabled: true },
      { phase: 'video_generate', label: '6镜头视频生成', primaryModel: 'vd-video-q3-pro', fallbackModel: 'kling-video-v3', params: { duration: 30, fps: 30, quality: '4k' }, enabled: true },
      { phase: 'image_select', label: '镜头质量评审 + 择优', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      // 音频产线（2阶段）
      { phase: 'brand_voice_clone', label: '品牌配音克隆合成', primaryModel: 'minimax-speech-2.8-hd', fallbackModel: 'qwen-audio-3.0-tts-plus', params: { emotion: 'narrative' }, enabled: true },
      { phase: 'subtitle_generate', label: '中英双语字幕生成', primaryModel: 'deepseek-v4-pro-tc', fallbackModel: 'qwen3.8-max', params: { language: 'bilingual', format: 'srt', style: 'cinema' }, enabled: true },
      { phase: 'bgm_generate', label: 'BGM配乐选曲方案', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { mood: 'auto', duration: 30 }, enabled: true },
      // 合规 + 终审（3阶段）
      { phase: 'compliance_check', label: '版权合规筛查（音乐/图像/字体）', primaryModel: 'deepseek-v4-pro-tc', params: { checkType: 'copyright,music,image,font' }, enabled: true },
      { phase: 'style_calibration', label: '叙事节奏微调', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.6 }, enabled: true },
      { phase: 'quality_review', label: '终版艺术感评审', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'platform_adapt', label: '多平台格式输出', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', enabled: true },
    ],
    requiredModels: ['deepseek-v4-pro-tc', 'qwen3.8-max', 'kimi-k3', 'vd-video-q3-pro', 'kling-video-v3', 'minimax-speech-2.8-hd', 'qwen-image-max'],
    requiresProviders: ['tencent', 'alibaba'],
  },

  // ========== 5. 智能剪辑（v4.0：蓝皮书 §4.1 九阶段 — 素材剪辑成片）==========
  {
    slug: 'smartEdit',
    name: '智能剪辑',
    icon: 'scissors',
    description: '上传多个视频素材，AI自动理解素材→识别剪辑点→卡点编排→配音/字幕/BGM/调色→本地FFmpeg合成成片',
    pipeline: 'video',
    phases: [
      // 1. 需求解析 / 剪辑脚本
      { phase: 'edit_plan', label: '需求解析 + 剪辑脚本', primaryModel: 'deepseek-v4-pro-tc', fallbackModel: 'qwen3.8-max', params: { temperature: 0.7 }, enabled: true },
      // 2. 素材理解 / 剪辑点识别（视频理解模型）
      { phase: 'clip_analysis', label: '素材理解 + 剪辑点识别', primaryModel: 'yt-vita-1.5', fallbackModel: 'doubao-seed-2.1-pro', params: { granularity: 'shot' }, enabled: true },
      // 3. 镜头排序 / 卡点编排
      { phase: 'shot_order', label: '镜头排序 + 卡点编排', primaryModel: 'deepseek-v4-pro-tc', fallbackModel: 'qwen3.8-max', params: { temperature: 0.6 }, enabled: true },
      // 4. 配音合成
      { phase: 'tts_generate', label: '配音合成', primaryModel: 'minimax-speech-2.8-hd', fallbackModel: 'doubao-seed-audio-1.0', params: { style: 'narrative_edit', emotion: 'auto' }, enabled: true },
      // 5. 字幕生成
      { phase: 'subtitle_generate', label: '字幕生成', primaryModel: 'kimi-k3', fallbackModel: 'glm-5.2', params: { language: 'bilingual', format: 'srt', style: 'edit' }, enabled: true },
      // 6. BGM 配乐
      { phase: 'bgm_generate', label: 'BGM 配乐方案', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { mood: 'auto', duration: 'auto' }, enabled: true },
      // 7. 调色 / 滤镜策略
      { phase: 'color_grading', label: '调色 + 滤镜策略', primaryModel: 'deepseek-v4-pro-tc', fallbackModel: 'qwen3.8-max', params: { temperature: 0.5 }, enabled: true },
      // 8. 本地 FFmpeg 合成（无模型，桌面端执行）
      { phase: 'local_compose', label: '本地 FFmpeg 合成成片', primaryModel: 'qwen3.8-max', params: { engine: 'desktop-ffmpeg', deliverable: 'video+srt+cover' }, enabled: true },
      // 9. 合规终审 + AIGC 标识
      { phase: 'compliance_check', label: '合规终审 + AIGC 标识', primaryModel: 'deepseek-v4-pro-tc', params: { checkType: 'copyright,music,image,font', aigcFlag: true }, enabled: true },
    ],
    requiredModels: ['deepseek-v4-pro-tc', 'qwen3.8-max', 'kimi-k3', 'minimax-speech-2.8-hd'],
    requiresProviders: ['tencent', 'alibaba', 'volcano'],
  },

  // ========== 6. 企业宣传视频（蓝皮书 V2.1：9阶段）==========
  {
    slug: 'enterpriseVideo',
    name: '企业宣传视频',
    icon: 'building-2',
    description: '生成企业品牌宣传视频的完整脚本和分镜',
    pipeline: 'text',
    phases: [
      { phase: 'viral_analysis', label: '品牌传播对标分析', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'outline', label: '品牌故事大纲', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'draft', label: '脚本初稿（理念→使命感→成就→愿景）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.8 }, enabled: true },
      { phase: 'anti_ai_rewrite', label: '真人化重写（去官方腔）', primaryModel: 'qwen3.8-max', fallbackModel: 'kimi-k3', params: { temperature: 0.72, systemPrompt: 'enterprise' }, enabled: true },
      { phase: 'video_generate', label: '品牌画面生成', primaryModel: 'kling-video-v3', params: { duration: 30, fps: 30, quality: '1080p', style: 'cinematic' }, enabled: true },
      { phase: 'compliance_check', label: '合规筛查（企业数据/荣誉/认证）', primaryModel: 'deepseek-v4-pro-tc', params: { checkType: 'corporate_data,copyright' }, enabled: true },
      { phase: 'subtitle_generate', label: '中英双语字幕生成', primaryModel: 'deepseek-v4-pro-tc', fallbackModel: 'qwen3.8-max', params: { language: 'bilingual', format: 'srt', style: 'corporate' }, enabled: true },
      { phase: 'tts_generate', label: '品牌专业配音 (MiniMax)', primaryModel: 'minimax-speech-2.8-hd', fallbackModel: 'qwen-audio-3.0-tts-plus', params: { style: 'professional_warm', emotion: 'authoritative' }, enabled: true },
      { phase: 'quality_review', label: '品牌调性评审', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'style_calibration', label: '风格校准（品牌语感统一）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.65 }, enabled: true },
      { phase: 'platform_adapt', label: '多平台版本输出（官网/视频号/LinkedIn）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', enabled: true },
    ],
    requiredModels: ['deepseek-v4-pro-tc', 'qwen3.8-max', 'kimi-k3', 'kling-video-v3', 'minimax-speech-2.8-hd', 'qwen-audio-3.0-tts-plus'],
    requiresProviders: ['tencent', 'alibaba'],
  },

  // ========== 6. 产品宣传视频（蓝皮书 V2.1：12阶段全链路）==========
  {
    slug: 'productVideo',
    name: '产品宣传视频',
    icon: 'package',
    description: '生成产品宣传视频脚本和带货方案，8镜头全流程',
    pipeline: 'text',
    phases: [
      // 文案产线（4阶段）
      { phase: 'viral_analysis', label: '带货爆款对标分析', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'outline', label: '8镜头分镜大纲', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'draft', label: '脚本初稿（钩子→展示→对比→情感→特写→CTA）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.85 }, enabled: true },
      { phase: 'anti_ai_rewrite', label: '带货口语化重写', primaryModel: 'qwen3.8-max', fallbackModel: 'kimi-k3', params: { temperature: 0.78, systemPrompt: 'product' }, enabled: true },
      // 图像产线（2阶段）
      { phase: 'image_generate', label: '产品关键帧生成', primaryModel: 'wan2.7-image-pro-aly', fallbackModel: 'qwen-image-max', params: { n: 8, style: 'product_keyframe' }, enabled: true },
      { phase: 'image_select', label: '关键帧择优', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      // 视频产线（2阶段）
      { phase: 'video_generate', label: '图生视频（8镜头生成）', primaryModel: 'kling-video-v3', params: { duration: 30, fps: 30, quality: '1080p' }, enabled: true },
      { phase: 'video_edit', label: '视频产品形态修复（形态一致性/异常物清理）', primaryModel: 'happyhorse-1.0-video-edit', params: { operation: 'repair', detect: 'morph_artifacts+object_ghosts' }, enabled: true },
      { phase: 'compliance_check', label: '帧间一致性检查（产品形态/颜色/材质）', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      // 字幕 + 配音合成（2阶段）
      { phase: 'subtitle_generate', label: '中英双语字幕生成', primaryModel: 'deepseek-v4-pro-tc', fallbackModel: 'qwen3.8-max', params: { language: 'bilingual', format: 'srt', style: 'product_sales' }, enabled: true },
      { phase: 'tts_generate', label: '带货配音合成 (MiniMax)', primaryModel: 'minimax-speech-2.8-hd', fallbackModel: 'qwen-audio-3.0-tts-plus', params: { style: 'energetic_sales', emotion: 'persuasive' }, enabled: true },
      // 终审（2阶段）
      { phase: 'quality_review', label: '转化力评审', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'style_calibration', label: '风格校准（带货感精准化）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.65 }, enabled: true },
      { phase: 'platform_adapt', label: '平台格式适配', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'compliance_check', label: '广告法终审', primaryModel: 'deepseek-v4-pro-tc', params: { checkType: 'ad_law,false_claims,copyright' }, enabled: true },
    ],
    requiredModels: ['deepseek-v4-pro-tc', 'qwen3.8-max', 'kimi-k3', 'kling-video-v3', 'minimax-speech-2.8-hd', 'qwen-audio-3.0-tts-plus', 'wan2.7-image-pro-aly', 'qwen-image-max', 'happyhorse-1.0-video-edit'],
    requiresProviders: ['tencent', 'alibaba'],
  },

  // ========== 7. 探店视频（蓝皮书 V2.1：8阶段）==========
  {
    slug: 'storeTour',
    name: '探店视频',
    icon: 'map-pin',
    description: '生成探店/探店的短视频脚本，带真实探店体验感',
    pipeline: 'text',
    phases: [
      { phase: 'viral_analysis', label: '探店爆款对标分析', primaryModel: 'deepseek-v4-pro-tc', params: { temperature: 0.6 }, enabled: true },
      { phase: 'draft', label: '探店脚本初稿（环境→招牌→体验→价格→建议）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.88 }, enabled: true },
      { phase: 'anti_ai_rewrite', label: '真人探店口语化（有好有坏才可信）', primaryModel: 'qwen3.8-max', fallbackModel: 'kimi-k3', params: { temperature: 0.82, systemPrompt: 'review' }, enabled: true },
      { phase: 'video_generate', label: '探店环境画面生成', primaryModel: 'kling-video-v3', params: { fps: 30, quality: '1080p', style: 'realistic_vlog' }, enabled: true },
      { phase: 'compliance_check', label: '帧间检查+广告标识别', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'subtitle_generate', label: '中英双语字幕生成', primaryModel: 'deepseek-v4-pro-tc', fallbackModel: 'qwen3.8-max', params: { language: 'bilingual', format: 'srt', style: 'vlog' }, enabled: true },
      { phase: 'tts_generate', label: '第一视角自然配音 (MiniMax)', primaryModel: 'minimax-speech-2.8-hd', fallbackModel: 'qwen-audio-3.0-tts-plus', params: { style: 'casual_vlog', emotion: 'lively' }, enabled: true },
      { phase: 'quality_review', label: '真实感评审', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'style_calibration', label: '风格校准（探店韵味）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.65 }, enabled: true },
      { phase: 'platform_adapt', label: '平台适配（抖音/小红书/大众点评）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', enabled: true },
    ],
    requiredModels: ['deepseek-v4-pro-tc', 'qwen3.8-max', 'kimi-k3', 'kling-video-v3', 'minimax-speech-2.8-hd', 'qwen-audio-3.0-tts-plus'],
    requiresProviders: ['tencent', 'alibaba'],
  },

  // ========== 8. 真人MV视频（蓝皮书 V2.1：10阶段）==========
  {
    slug: 'personMv',
    name: '真人MV视频',
    icon: 'music',
    description: '生成真人MV拍摄脚本、分镜和制作方案',
    pipeline: 'text',
    phases: [
      { phase: 'viral_analysis', label: '流行趋势分析', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'draft', label: 'MV创意脚本（前奏→主歌→副歌→间奏→尾奏）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.9 }, enabled: true },
      { phase: 'anti_ai_rewrite', label: '艺术表达润色', primaryModel: 'qwen3.8-max', fallbackModel: 'kimi-k3', params: { temperature: 0.78, systemPrompt: 'creative' }, enabled: true },
      { phase: 'image_generate', label: '关键帧视觉生成', primaryModel: 'qwen-image-max', fallbackModel: 'z-image-turbo', params: { n: 12, style: 'cinematic_music_video' }, enabled: true },
      { phase: 'video_generate', label: '图生视频（关键帧串联）', primaryModel: 'kling-video-v3', params: { duration: 60, fps: 30, quality: '1080p', style: 'music_video' }, enabled: true },
      { phase: 'video_edit', label: '视频镜头瑕疵修复（人物一致性/画面异常物清理）', primaryModel: 'happyhorse-1.0-video-edit', params: { operation: 'repair', detect: 'morph_artifacts+object_ghosts+face_consistency' }, enabled: true },
      { phase: 'compliance_check', label: '人物一致性检查', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'subtitle_generate', label: '中英双语字幕 + 歌词同步', primaryModel: 'deepseek-v4-pro-tc', fallbackModel: 'qwen3.8-max', params: { language: 'bilingual', format: 'srt', style: 'music_video', lyricTiming: true }, enabled: true },
      { phase: 'tts_generate', label: '人声+伴奏混音 (MiniMax)', primaryModel: 'minimax-speech-2.8-hd', fallbackModel: 'qwen-audio-3.0-tts-plus', params: { style: 'sung', emotion: 'expressive' }, enabled: true },
      { phase: 'quality_review', label: '艺术感评审', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'style_calibration', label: '风格校准（MV艺术表达优化）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.65 }, enabled: true },
      { phase: 'compliance_check', label: '版权合规终审（音乐/肖像/字体）', primaryModel: 'deepseek-v4-pro-tc', params: { checkType: 'copyright,portrait_right' }, enabled: true },
      { phase: 'platform_adapt', label: '全平台格式输出', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', enabled: true },
    ],
    requiredModels: ['deepseek-v4-pro-tc', 'qwen3.8-max', 'kimi-k3', 'kling-video-v3', 'minimax-speech-2.8-hd', 'qwen-audio-3.0-tts-plus', 'qwen-image-max', 'z-image-turbo', 'happyhorse-1.0-video-edit'],
    requiresProviders: ['tencent', 'alibaba'],
  },

  // ========== 9. 萌宠卡通短视频（蓝皮书 V2.1：8阶段）==========
  {
    slug: 'cartoonVideo',
    name: '萌宠卡通短视频',
    icon: 'heart',
    description: '生成萌宠/卡通类短视频脚本和创意策划',
    pipeline: 'text',
    phases: [
      { phase: 'viral_analysis', label: '萌宠/卡通爆款对标分析', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'draft', label: '创意脚本生成', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.92 }, enabled: true },
      { phase: 'anti_ai_rewrite', label: '可爱风润色', primaryModel: 'qwen3.8-max', fallbackModel: 'kimi-k3', params: { temperature: 0.8, systemPrompt: 'cute' }, enabled: true },
      { phase: 'image_generate', label: '卡通素材生成（角色/场景/道具）', primaryModel: 'qwen-image-max', fallbackModel: 'z-image-turbo', params: { n: 6, style: 'cute_cartoon' }, enabled: true },
      { phase: 'video_generate', label: '动画视频生成', primaryModel: 'kling-video-v3', params: { duration: 15, fps: 30, quality: '1080p', style: 'animation' }, enabled: true },
      { phase: 'subtitle_generate', label: '中英双语字幕生成', primaryModel: 'deepseek-v4-pro-tc', fallbackModel: 'qwen3.8-max', params: { language: 'bilingual', format: 'srt', style: 'cartoon' }, enabled: true },
      { phase: 'tts_generate', label: '萌趣配音+音效', primaryModel: 'qwen-audio-3.0-tts-plus', params: { style: 'cute_energetic' }, enabled: true },
      { phase: 'compliance_check', label: '内容安全（儿童适配/无虐待）', primaryModel: 'deepseek-v4-pro-tc', params: { checkType: 'child_safety,animal_cruelty' }, enabled: true },
      { phase: 'style_calibration', label: '风格校准（萌系表达优化）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.65 }, enabled: true },
      { phase: 'quality_review', label: '趣味性评审', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
    ],
    requiredModels: ['deepseek-v4-pro-tc', 'qwen3.8-max', 'kimi-k3', 'kling-video-v3', 'qwen-audio-3.0-tts-plus', 'qwen-image-max', 'z-image-turbo'],
    requiresProviders: ['tencent', 'alibaba'],
  },

  // ========== 10. 数字人短视频（蓝皮书 V2.1：9阶段）==========
  {
    slug: 'digitalHuman',
    name: '数字人',
    icon: 'user-round-pen',
    description: '配置数字人口播视频，包含脚本和出镜方案',
    pipeline: 'digital_human',
    phases: [
      // 文案产线（3阶段）
      { phase: 'viral_analysis', label: '口播爆款对标分析', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'draft', label: '口播脚本生成', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.85 }, enabled: true },
      { phase: 'anti_ai_rewrite', label: '自然口语化重写（说话而非朗读）', primaryModel: 'qwen3.8-max', fallbackModel: 'kimi-k3', params: { temperature: 0.78, systemPrompt: 'talk' }, enabled: true },
      // 情绪标注（1阶段）
      { phase: 'compliance_check', label: '情绪标记注入（[微笑][严肃][惊喜][思考]）', primaryModel: 'deepseek-v4-pro-tc', params: { task: 'emotion_tagging' }, enabled: true },
      // 数字人出镜（1阶段）
      { phase: 'digital_human', label: '数字人出镜合成（眨眼2-4s/头部微动3-8°）', primaryModel: 'yt-video-humanactor', params: { blinkRandom: true, headMovement: true }, enabled: true },
      // 配音（1阶段）
      { phase: 'subtitle_generate', label: '中英双语字幕生成', primaryModel: 'deepseek-v4-pro-tc', fallbackModel: 'qwen3.8-max', params: { language: 'bilingual', format: 'srt', style: 'talk_show' }, enabled: true },
      { phase: 'tts_generate', label: '自然配音合成 (MiniMax)', primaryModel: 'minimax-speech-2.8-hd', fallbackModel: 'qwen-audio-3.0-tts-plus', params: { speedVariation: 0.05, pitchVariation: 0.03, emotion: 'natural', subtitleSync: true }, enabled: true },
      // 合规+终审（3阶段）
      { phase: 'compliance_check', label: '合规筛查（肖像/政治/辟谣）', primaryModel: 'deepseek-v4-pro-tc', params: { checkType: 'portrait,content_safety,rumor' }, enabled: true },
      { phase: 'style_calibration', label: '风格校准（口播自然度优化）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', params: { temperature: 0.65 }, enabled: true },
      { phase: 'quality_review', label: '拟真度评审（口型/表情/恐怖谷）', primaryModel: 'deepseek-v4-pro-tc', enabled: true },
      { phase: 'platform_adapt', label: '平台标注+格式适配（AI标识/时长/分辨率）', primaryModel: 'qwen3.8-max', fallbackModel: 'deepseek-v4-pro-tc', enabled: true },
    ],
    requiredModels: ['deepseek-v4-pro-tc', 'qwen3.8-max', 'kimi-k3', 'yt-video-humanactor', 'minimax-speech-2.8-hd', 'qwen-audio-3.0-tts-plus'],
    requiresProviders: ['tencent', 'alibaba'],
  },

];

// ─── 辅助查找函数 ──────────────────────────────────

export function getCategoryConfig(slug: string): CategoryPipeline | undefined {
  return CATEGORY_PIPELINES.find(c => c.slug === slug);
}

export function getModelInfo(key: string): ModelInfo | undefined {
  return MODEL_INFO[key];
}

/**
 * 获取某个类目需要的 API Key 覆盖率
 */
export function getCategoryKeyCoverage(slug: string): {
  hasAllKeys: boolean;
  requiredKeys: string[];
  missingKeys: string[];
} {
  const config = getCategoryConfig(slug);
  if (!config) return { hasAllKeys: false, requiredKeys: [], missingKeys: [] };

  const requiredKeys: string[] = [];
  const providerSet = new Set<AiProvider>();

  for (const phase of config.phases) {
    const model = MODEL_INFO[phase.primaryModel];
    if (model) {
      providerSet.add(model.provider);
    }
    if (phase.fallbackModel) {
      const fb = MODEL_INFO[phase.fallbackModel];
      if (fb) providerSet.add(fb.provider);
    }
  }

  const missingKeys: string[] = [];
  if (typeof window !== 'undefined') {
    for (const provider of providerSet) {
      const info = PROVIDER_INFO[provider];
      try {
        const key = localStorage.getItem(info.storageKey);
        if (!key) missingKeys.push(provider);
      } catch { missingKeys.push(provider); }
    }
  }

  requiredKeys.push(...Array.from(providerSet));
  return {
    hasAllKeys: missingKeys.length === 0,
    requiredKeys,
    missingKeys,
  };
}

/**
 * 获取某个模型要求的 API Key 是否存在
 */
export function hasApiKey(provider: AiProvider): boolean {
  if (typeof window === 'undefined') return false;
  const info = PROVIDER_INFO[provider];
  try {
    return !!localStorage.getItem(info.storageKey);
  } catch {
    return false;
  }
}

/**
 * 构建完整的阶段参数（合并类目默认参数和用户参数）
 */
export function buildPhaseParams(
  slug: string,
  phase: PipelinePhase,
  userParams?: Record<string, any>
): Record<string, any> {
  const config = getCategoryConfig(slug);
  if (!config) return userParams || {};

  const phaseConfig = config.phases.find(p => p.phase === phase);
  const defaultParams = phaseConfig?.params || {};
  return { ...defaultParams, ...(userParams || {}) };
}

// ─── 类目创作提示与禁忌（依据蓝皮书 V2.1 第六章）─────────────────

export interface CategoryTip {
  /** 适用场景 */
  scenarios: string[];
  /** 目标平台 */
  platforms: string[];
  /** 输入建议 */
  inputTips: string[];
  /** 创作要求（必须遵守） */
  requirements: string[];
  /** 硬性禁忌（绝对不能碰） */
  taboos: string[];
  /** 内容发布前自查清单 */
  prePublishChecklist: string[];
  /** 常见问题 */
  faqs: { question: string; answer: string }[];
}

export const CATEGORY_TIPS: Record<string, CategoryTip> = {

  // ─── 1. 小红书图文 ───
  xiaohongshu: {
    scenarios: [
      '产品种草笔记（素人/达人视角）',
      '生活方式分享（穿搭/美食/旅行/美妆）',
      '好物测评与对比推荐',
      '教程类干货笔记',
      '探店打卡类图文',
    ],
    platforms: ['小红书', '微博图文', '绿洲'],
    inputTips: [
      '输入产品/场景名称和核心卖点，越具体越好（如"30岁干皮秋冬面霜，主打玻尿酸+神经酰胺，200元以内性价比之选"）',
      '可指定笔记风格：干货教程 / 种草推荐 / 真实测评 / Vlog式',
      '可选填目标受众画像（年龄段/消费力/痛点），帮助AI精准定位',
      '一次性最多生成4篇笔记供挑选，建议生成后择优发布',
    ],
    requirements: [
      '文案必须真人博主口语化，杜绝"AIGC味"——不用"宝子们""[标题]""众所周知"等模板句式',
      '标题控制在20字以内，有钩子感（如反问、悬念、数字对比）',
      '正文300-800字为宜，每段不超过4行，段落间有空行',
      '配图1-4张，封面决定点击率——建议用产品实拍图或场景图，不要网络素材图',
      '文中不能出现明显的品牌logo侵权图片',
      '禁止使用过度营销用语（"必买""闭眼入""天花板""绝绝子"需适度使用，避免触发广告审核）',
      '笔记结尾带互动引导（提问/投票/评论区留言），提升互动率',
    ],
    taboos: [
      '严禁伪造功效声明（美白/祛斑/瘦身等必须有合规证明）',
      '严禁虚假种草（未使用过产品却伪装真实体验）——违反《广告法》',
      '严禁提及竞品负面评价或对比贬低其他品牌',
      '严禁使用未授权肖像/网红图片作为配图',
      '严禁涉及医疗功效宣传（护肤品不能说"治疗""消炎"等）',
      '严禁笔记中嵌入外链或二维码——平台会限流或封号',
    ],
    prePublishChecklist: [
      '☐ 标题有钩子感，一眼想看',
      '☐ 正文朗读一遍，像真人在说话',
      '☐ 配图是否原创/有授权',
      '☐ 功效声明是否有依据',
      '☐ 是否含广告法禁词',
      '☐ 是否含竞品负面评价',
      '☐ 文末有无互动引导',
    ],
    faqs: [
      {
        question: '一篇小红书笔记应该多长？',
        answer: '控制在300-800字最合适。太短没信息量，太长用户划走。如果内容多，建议拆成上下篇或系列笔记。',
      },
      {
        question: '为什么我的笔记被平台判定为广告？',
        answer: '通常是因为文案出现了过度营销词汇（"最好""第一""必买"），或者配图使用了非原创的网络素材。建议用真人实拍图，文案以真实体验分享的口吻来写。',
      },
      {
        question: '种草类笔记和测评类笔记有什么写法区别？',
        answer: '种草侧重"这个真好用，推荐给你"，语气热情但不夸张；测评侧重"我用了一周，以下是真实感受"，列优缺点客观说。测评类可信度更高，适合新品牌/新产品。',
      },
    ],
  },

  // ─── 2. 图片生成 ───
  image: {
    scenarios: [
      '电商商品主图/详情图',
      '社交媒体配图（公众号/小红书封面）',
      '海报/Banner/活动图',
      '品牌视觉素材',
      '创意艺术插画',
    ],
    platforms: ['全平台通用'],
    inputTips: [
      'Prompt 公式：[主体描述] + [风格/画风] + [构图/角度] + [光影/色调] + [质量词]',
      '示例prompt: "一杯热气腾腾的拿铁咖啡，白色陶瓷杯，俯拍，自然光从左侧窗户照入，木质桌面，柔焦背景，食品摄影，高清，细节丰富"',
      '建议每次生成4张选最优，而非1张赌运气',
      '可先出小图快速预览（1024x1024），确定方向后再出高清大图（2048x2048或4K）',
      '负向prompt很重要：添加"模糊、变形、多余手指、文字乱码、水印"等反AI关键词',
    ],
    requirements: [
      '主体清晰突出，背景不抢戏',
      '品牌用图保持色调风格统一（建议固定一套视觉规范）',
      '电商主图：白底+产品占画面70%以上',
      '海报/Banner：信息层级清晰，主标题/副标题/CTA一目了然',
      '人物必须五官端正、手指数量正常、肢体不扭曲',
      '避免图中出现乱码文字——AI常在此犯错，需人工检查',
    ],
    taboos: [
      '严禁生成任何色情、暴力、血腥内容',
      '严禁生成政治敏感符号/标志/旗帜',
      '严禁生成名人肖像或模仿名人形象',
      '严禁在图中嵌入侵权品牌logo或IP形象',
      '严禁生成虚假证件/钞票/票据等伪造文件',
      '严禁生成恐怖/惊悚/恶心的视觉内容',
    ],
    prePublishChecklist: [
      '☐ 主体清晰，无扭曲变形',
      '☐ 手指/肢体数量正常',
      '☐ 图中文字可读（非乱码）',
      '☐ 无侵权logo/IP/肖像',
      '☐ 色调风格符合品牌规范',
      '☐ 分辨率满足使用场景',
    ],
    faqs: [
      {
        question: 'AI生图的手指/文字总是出错怎么办？',
        answer: '这是目前AI生图的普遍问题。建议：1）避免让AI画手指特写，尽量用道具遮挡或半身构图；2）如需画面中有文字，生成后在Photoshop中替换即可，不要依赖AI写文字；3）多生成几张，选手指最自然的那张。',
      },
      {
        question: '为什么同样的prompt不同模型效果差异很大？',
        answer: '每个模型的训练数据和画风偏好不同。Qwen Image偏向写实摄影风格，Seedream擅长亚洲审美和电商场景，Flux Pro在艺术创意方面表现更好。建议根据用途选择模型，或同一prompt在不同模型上各试一次。',
      },
    ],
  },

  // ─── 3. 电商详情页 ───
  ecommerce: {
    scenarios: [
      '淘宝/京东/拼多多商品详情页',
      '抖音/快手小店商品描述',
      '品牌官网产品介绍页',
      '跨境电商Listing描述',
    ],
    platforms: ['淘宝', '京东', '拼多多', '抖音小店', '快手小店', '亚马逊', 'Shopee'],
    inputTips: [
      '输入产品名称、核心卖点（3-5个）、目标人群、价格带',
      '可选输入竞品链接或竞品卖点，AI会差异化定位',
      '可指定风格：高端简约 / 性价比走量 / 科技感 / 小清新',
      '建议提供产品实拍图链接，AI生成文案后可对照图片检查一致性',
    ],
    requirements: [
      '详情页结构：痛点引入 → 产品登场 → 功能拆解（3-5个卖点卡片） → 场景展示 → 规格参数 → 信任背书（专利/检测报告/好评截图） → 购买CTA',
      '每个卖点卡片控制在50字以内，配1张产品图',
      '文案要对标用户痛点而非堆砌参数——"解决了什么问题"比"做了什么"更重要',
      '产品图需白底主图+w/场景使用图两种风格各至少1张',
      '价格/规格/成分等数据必须与实物完全一致，不可编造',
      '严禁使用广告法禁词："最好""第一""国家级""首选""唯一""顶级""销量冠军"（除非有第三方数据证明）',
    ],
    taboos: [
      '严禁虚假宣传功效（如"7天美白""3天瘦5斤"等）',
      '严禁盗用竞品图片或文案',
      '严禁在详情页中贬低或点名称呼竞品',
      '严禁使用未授权的检测报告/认证标志',
      '严禁价格欺诈（虚构原价再打折）——违反《价格法》',
      '严禁隐瞒产品缺陷或副作用',
      '严禁在保健食品/化妆品中暗示药品功效',
    ],
    prePublishChecklist: [
      '☐ 所有参数/成分/规格数据与实物一致',
      '☐ 无广告法禁词',
      '☐ 产品图与实物一致',
      '☐ 功效声明有合规依据',
      '☐ 检测报告/认证真实有效',
      '☐ 价格标示合规',
      '☐ 结构完整（痛点→产品→功能→场景→参数→背书→CTA）',
    ],
    faqs: [
      {
        question: '电商详情页和普通产品介绍有什么区别？',
        answer: '详情页本质是"说服用户下单的最后一步"，必须有成交导向。它不是产品说明书，而是"帮用户想象拥有这个产品后的美好生活"。好的详情页每个模块都在回答一个用户心中未说出口的问题。',
      },
      {
        question: '应该用白底图还是场景图作为主图？',
        answer: '平台规则建议首图用白底图（淘宝/京东要求），但第二张开始可以用场景图。场景图虽然更有质感，但白底图是各平台的硬性要求，违规会被下架。',
      },
    ],
  },

  // ─── 4. 短视频（v3.0：AI导演模式 — 原自由创意短片，唯一出口）───
  shortVideo: {
    scenarios: [
      '品牌叙事短片（品牌故事/品牌精神传递）',
      '创意广告片（产品创意短片/概念广告）',
      '短视频电影（微电影/短剧/剧情短片）',
      '旅游/城市风景短片',
      '个人创作短片（导演作品集/创意表达）',
    ],
    platforms: ['抖音', 'B站', '视频号', '小红书视频', 'YouTube', '品牌官网'],
    inputTips: [
      '输入创意主题、核心情感基调、风格参考（电影风格/纪录片风格/广告风格）',
      '建议提供品牌配色/logo/AI会保持视觉一致性',
      '可指定镜头节奏：快剪电影级 / 慢节奏文艺感 / 故事叙事 / 信息展示',
      '提供参考影片链接或风格关键词，帮助AI精准把握视觉调性',
      '第一次使用建议先用30秒默认时长测试，确认风格后再调整',
    ],
    requirements: [
      '6镜头叙事结构：引入（5s）→ 展开（5s）→ 高潮（5s）→ 转折（5s）→ 结论（5s）→ 余韵（5s）',
      '全片视觉风格统一：色调、构图、剪辑节奏全程保持一致',
      '配音与画面情感同步：不同镜头阶段切换不同的语速和语调',
      'BGM与画面氛围匹配：高潮段激昂、结尾段舒缓、转场段过渡自然',
      '品牌元素自然植入：logo、配色、品牌声音在关键帧中自然出现，不突兀',
      '片尾统一添加：品牌logo + 品牌slogan + CTA信息',
    ],
    taboos: [
      '严禁使用未经授权的音乐/音效——BGM版权侵权风险极高',
      '严禁使用名人肖像或知名IP作为AI生成素材',
      '严禁涉政/色情/暴力/敏感内容——核心创意也须合规',
      '严禁模仿他人品牌风格到侵权程度——创意雷同也可能引发纠纷',
      '严禁视频中出现虚假功效声明或误导性信息',
      '严禁使用未授权的人物肖像/产品实拍素材',
    ],
    prePublishChecklist: [
      '☐ 6镜头叙事结构完整',
      '☐ 全片视觉风格统一',
      '☐ BGM与画面氛围匹配',
      '☐ 配音自然无AI感',
      '☐ 品牌元素正确植入',
      '☐ 片尾logo+slogan完整',
      '☐ 音乐/素材版权已确认',
      '☐ 内容合规无敏感元素',
    ],
    faqs: [
      {
        question: 'AI导演模式和手动创作有何区别？',
        answer: 'AI导演模式让你以导演身份与AI协作：你定义创意方向、情感基调、品牌调性，AI自动完成6镜头分镜设计、画面生成、配音克隆、BGM匹配。你只需审核和微调，不需要掌握分镜、剪辑、调色等专业技能。整个过程约60秒出片。',
      },
      {
        question: '品牌配音克隆如何使用？',
        answer: '首次使用时，上传一段品牌代言人的30秒语音样本（要求安静环境、无背景噪音），AI会自动学习音色、语速、语调特征。之后该品牌的视频都会使用这个声音进行配音，保持品牌声音一致性。一个声音模型可用于无限条视频。',
      },
      {
        question: '6镜头的时长和结构可以自定义吗？',
        answer: '可以。默认6镜头各5秒共30秒，但你可以在生成前指定：总时长（15-60秒）、镜头数量（3-12个）、每个镜头的风格（特写/中景/远景/运动镜头）。系统会根据你的设置自动调整分镜和节奏。',
      },
    ],
  },

  // ─── 5. 智能剪辑（v4.0：蓝皮书 §4.1 — 素材剪辑成片）───
  smartEdit: {
    scenarios: [
      '活动/发布会多机位素材智能剪辑',
      '旅行/日常Vlog素材自动成片',
      '产品开箱/测评多段素材整合',
      '企业宣传多段实拍素材智能拼接',
      '演唱会/演出多视角素材卡点剪辑',
    ],
    platforms: ['抖音', 'B站', '视频号', '小红书视频', 'YouTube', '品牌官网'],
    inputTips: [
      '上传多个视频素材（建议每段10秒-5分钟，总计不超过30分钟，单文件不超过500MB）',
      '输入剪辑主题、目标时长、平台（竖屏9:16/横屏16:9/方形1:1）',
      '可指定卡点风格：强节奏卡点 / 舒缓叙事 / 混剪快切 / 剧情连贯',
      '可选上传BGM参考或指定音乐情绪，AI自动匹配节奏',
      '第一次使用建议先用3-5段短视频素材测试，确认风格后再正式剪辑',
    ],
    requirements: [
      'AI先理解素材内容：识别场景、主体、动作、镜头质量，标注可用的剪辑点',
      '按剪辑脚本自动排序镜头：钩子（前3秒抓住注意力）→ 主体 → 高潮 → 结尾CTA',
      '卡点编排：BGM重拍与镜头切换对齐，节奏统一',
      '自动生成字幕（中英双语SRT）和封面帧',
      '输出成片 + SRT字幕文件 + 封面图 + 标题/发布建议 + 合规报告 + AIGC标识',
    ],
    taboos: [
      '严禁使用未经授权的音乐/音效——BGM版权侵权风险极高',
      '严禁使用含他人肖像权/隐私的素材（需获得当事人授权）',
      '严禁涉政/色情/暴力/敏感内容——剪辑素材也须合规',
      '严禁拼接未经授权的影视剧/直播/赛事画面',
      '严禁素材中出现虚假功效声明或误导性信息',
      '成片必须包含AIGC标识（蓝皮书要求）',
    ],
    prePublishChecklist: [
      '☐ 素材已获得使用授权',
      '☐ 前3秒钩子足够吸引',
      '☐ 卡点与BGM节奏对齐',
      '☐ 字幕无错别字/时间轴对齐',
      '☐ 成片已添加AIGC标识',
      '☐ BGM版权已确认',
      '☐ 内容合规无敏感元素',
    ],
    faqs: [
      {
        question: '智能剪辑和AI生成视频有什么区别？',
        answer: 'AI生成视频是模型"从零生成"画面，需要消耗视频生成配额；智能剪辑是对你上传的真实素材进行AI理解、编排和本地FFmpeg合成，不消耗视频生成配额，画面100%真实，适合已有实拍素材的场景。',
      },
      {
        question: '剪辑过程在哪里执行？',
        answer: 'AI在云端完成素材理解、剪辑脚本、剪辑点识别、卡点编排、配音、字幕、BGM、调色指令；最终合成动作由智枢AI桌面端的FFmpeg工作台在本地执行，不上传你的成片到服务器。',
      },
      {
        question: '支持哪些素材格式和数量？',
        answer: '支持MP4/MOV/AVI/MKV等常见格式，建议上传3-20段素材。单文件建议不超过500MB，总时长建议不超过30分钟。多机位、多角度素材效果最佳。',
      },
    ],
  },

  // ─── 6. 企业宣传视频 ───
  enterpriseVideo: {
    scenarios: [
      '企业品牌形象片',
      '公司介绍/招商宣传视频',
      '企业文化/团队展示',
      '年度总结/里程碑回顾',
      '招聘宣传片',
    ],
    platforms: ['官网', '公众号', '视频号', 'B站', 'LinkedIn', 'YouTube'],
    inputTips: [
      '输入企业名称、成立时间、核心业务、企业使命/愿景/价值观',
      '提供企业核心数据（员工数/服务客户数/行业排名等）作为信任背书素材',
      '可选指定视频风格：大气恢弘 / 温暖走心 / 科技未来感 / 纪录片写实风',
      '建议提供企业实拍素材库链接，AI会匹配文案与画面',
    ],
    requirements: [
      '企业视频结构：品牌理念唤起共鸣 → 使命感建立信任 → 成就数据证明实力 → 愿景号召行动',
      '画面建议以实拍为主（企业环境、员工工作场景、客户使用场景），少用网络素材',
      '配音选择温暖稳重的中青年男声或女声，避免机器感',
      '文案避免"假大空"官方腔——"领先""卓越""一流"这些词用户已经免疫了',
      '建议时长：品牌片2-5分钟，招聘片1-2分钟，产品介绍片1-3分钟',
      '背景音乐选择大气/温暖/人文类，避免过于激昂或悲情',
    ],
    taboos: [
      '严禁虚假宣传企业规模、行业排名、资质认证',
      '严禁盗用他人企业办公环境/生产线素材',
      '严禁贬低竞争对手或进行不正当比较',
      '严禁使用未授权的客户logo或合作伙伴商标',
      '严禁在招聘视频中做出虚假薪资/福利承诺',
      '严禁使用未授权的音乐/字体——企业商用风险极高，一旦被诉赔偿巨大',
    ],
    prePublishChecklist: [
      '☐ 所有企业数据/排名/认证真实可查',
      '☐ 画面素材来源合法',
      '☐ 音乐/字体版权已购买或使用免费商用版权',
      '☐ 无竞品贬低内容',
      '☐ 薪资/福利信息与实际情况一致（招聘片）',
      '☐ 品牌logo使用规范',
    ],
    faqs: [
      {
        question: '企业宣传片为什么不能直接用AI生成所有画面？',
        answer: '企业宣传片的核心是"真实可信"——观众一眼就能看出AI生成画面的假感。好的企业片应该以实拍为主（80%），AI辅助生成过渡画面/图表动画/特效（20%）。实拍画面带来信任感，AI画面带来视觉亮点，两者结合才是最佳方案。',
      },
      {
        question: '怎样避免企业视频看起来像"假大空"？',
        answer: '三个技巧：1）用具体数字代替模糊形容（"服务超过500家企业"比"服务了大量客户"有力100倍）；2）让真实员工出镜说话，而非旁白念稿；3）展示真实办公环境和工作状态，哪怕不完美也比过度包装可信。',
      },
    ],
  },

  // ─── 6. 产品宣传视频 ───
  productVideo: {
    scenarios: [
      '新产品发布宣传视频',
      '电商产品展示短视频',
      '众筹/Kickstarter产品介绍',
      '功能演示/使用教程视频',
      '产品对比/测评视频',
    ],
    platforms: ['抖音', '快手', '视频号', 'B站', 'YouTube', '官网'],
    inputTips: [
      '输入产品名称、核心卖点（3-5个）、目标定价、目标用户画像',
      '提供产品实拍图/视频素材（越多越好），AI需要知道产品长什么样',
      '可选指定视频节奏：快节奏冲击感 / 温情叙事 / 科技质感 / 生活化场景',
      '带货目的请指定转化目标（加购/下单/留资/关注）',
    ],
    requirements: [
      '8镜头带货分镜结构：钩子（3s）→ 展示（5s）→ 对比（5s）→ 情感连接（5s）→ 特写（3s）→ CTA（3s）',
      '产品形态在视频中必须保持一致——颜色/大小/材质不能前后不一（这是AI视频的最大问题）',
      '特写镜头展示产品细节（材质纹理/做工/接口），建立品质感',
      '文案信息密度适中，口播+字幕双重信息传达（很多人静音刷视频）',
      '避免技术参数堆砌——用户关心"对我有什么用"而非"用了什么技术"',
      '如果对比竞品，只能用"同类产品"模糊表述，不可点名道姓',
    ],
    taboos: [
      '严禁虚假功效宣传（尤其是护肤品/保健品/电子产品）',
      '严禁使用竞品真实logo/产品图进行贬低对比',
      '严禁在视频中展示虚假使用效果（如PS前后对比图）',
      '严禁盗用他人产品实拍素材',
      '严禁宣传功能与实际产品不符',
      '严禁夸大产能/库存（"限量""售完即止"需真实有据）',
    ],
    prePublishChecklist: [
      '☐ 产品外观/颜色/尺寸全程一致',
      '☐ 功能展示与实际一致',
      '☐ 无竞品logo/产品图',
      '☐ 功效声明有依据',
      '☐ 价格/促销信息准确',
      '☐ 口播+字幕信息同步',
    ],
    faqs: [
      {
        question: 'AI生成的视频中产品形态不一致怎么办？',
        answer: '这是目前AI视频的核心挑战。建议：1）提供多角度产品参考图，在prompt中明确产品特征（颜色hex值、材质关键词）；2）关键产品镜头使用实拍+AI特效组合，而非纯AI生成；3）使用产品实拍图为视频首帧/末帧锚定产品形态。',
      },
      {
        question: '带货视频和品牌宣传视频有什么区别？',
        answer: '带货视频目标明确——让用户下单，所以节奏要快、信息要密、CTA要强、视频时长15-30秒最佳；品牌视频目标是建立认知和好感，可以走温情/故事路线，时长1-3分钟都可以。一个求快，一个求深。',
      },
    ],
  },

  // ─── 7. 探店视频 ───
  storeTour: {
    scenarios: [
      '餐饮/咖啡馆探店',
      '酒店/民宿体验',
      '商场/店铺打卡',
      '旅游景点实探',
      '理发/美甲/SPA等服务业探店',
    ],
    platforms: ['抖音', '小红书', '快手', '大众点评'],
    inputTips: [
      '输入店铺名称、地址、类型、人均消费、特色菜品/服务',
      '可提供探店素材（环境图/菜品图/短视频片段）作为AI参考',
      '建议指定探店风格：真诚种草 / 客观测评 / Vlog式 / 攻略型',
      '可选填探店日期和天气，增加真实感',
    ],
    requirements: [
      '探店脚本结构：环境引入 → 招牌推荐 → 真实体验（好吃/一般都要写） → 价格评价 → 打卡建议',
      '必须保持"真实探店"质感——有好有坏才有可信度，纯夸是广告',
      '保留环境原声描述（店里的音乐、人声、锅铲声），带入临场感',
      '第一视角讲述（"我一进门就看到..."），而非第三视角解说词',
      '菜品描述要具体（"外酥里嫩，咬下去有咔嚓声"），不要空洞（"很好吃"）',
      '建议加入排队/等位/停车等实用信息，提升落地价值',
    ],
    taboos: [
      '严禁虚假评价——未实际体验却假装去过并进行评价',
      '严禁在探店内容中恶意诽谤商家（如果体验不好只能说"个人不太合口味"这种客观表述）',
      '严禁虚报价格（"人均50"实际人均200）',
      '严禁食品安全相关虚假信息（卫生问题必须有证据支撑）',
      '严禁在未告知的情况下拍摄其他顾客正脸（隐私侵犯）',
      '严禁将探店视频当作纯粹的广告位（"广告"标签需明确标注）',
    ],
    prePublishChecklist: [
      '☐ 真实探店/有实际体验',
      '☐ 有好有坏的评价',
      '☐ 价格信息准确',
      '☐ 他人隐私已保护',
      '☐ 广告标签合规标注',
      '☐ 无虚假/诽谤内容',
    ],
    faqs: [
      {
        question: '探店和广告的边界在哪里？',
        answer: '如果商家付费请你探店，必须在内容中明确标注"广告"或"合作"。如果是自发探店，内容要客观真实。纯夸不贬、全篇溢美之词的内容，即使未收费也容易被平台判定为隐性广告而限流。',
      },
      {
        question: '探店脚本如何避免成为"菜谱复读机"？',
        answer: '不要只念菜单。好的探店有三种层次：第一层是环境氛围（装修风格、光线、音乐）；第二层是菜品体验（口感、味道、分量、颜值）；第三层是个人感受（惊喜/失望、值不值、会不会再来）。三层都有才算一个完整的探店。',
      },
    ],
  },

  // ─── 8. 真人MV视频 ───
  personMv: {
    scenarios: [
      '个人音乐MV制作',
      '企业/品牌歌曲MV',
      '婚礼/纪念日MV',
      '旅游Vlog音乐视频',
      '才艺展示视频',
    ],
    platforms: ['抖音', 'B站', '视频号', 'YouTube', '快手'],
    inputTips: [
      '输入歌曲名称/风格、MV主题/故事线、拍摄场景建议',
      '可提供歌曲音频文件链接或歌词文本',
      '建议指定MV类型：故事叙事型 / 视觉美学型 / 生活记录型 / 创意概念型',
      '如为原创歌曲，提供歌词+曲风描述',
    ],
    requirements: [
      'MV结构：前奏（氛围建立）→ 主歌（故事展开）→ 副歌（视觉高潮）→ 间奏（情绪过渡）→ 尾奏（余韵收尾）',
      '自然光拍摄优先——AI可以模拟但"人味"靠自然光质感体现',
      '人物出镜要求：真实表情、自然动作，避免僵硬的"AI微笑"',
      '场景选择建议：卧室、天台、车里、街道、咖啡店等日常场景，少用棚拍感场景',
      '歌词与画面需有情感关联——不是歌词写什么就拍什么（那是儿歌MV），而是画面传达歌词的情感',
      '色调统一（全片1个主色调+1个辅助色），营造电影感',
    ],
    taboos: [
      '严禁使用未经授权的音乐（版权侵权风险极高，可能被索赔数万至数十万）',
      '严禁低俗舞蹈动作或性暗示画面',
      '严禁使用他人真实肖像作为AI生成模特（需本人授权）',
      '严禁歌词含敏感/色情/暴力/毒品内容',
      '严禁在公共场所拍摄时不遮挡路人面部',
      '严禁模仿名人MV创意到侵权程度（创意雷同也可能被诉）',
    ],
    prePublishChecklist: [
      '☐ 音乐版权已获授权',
      '☐ 人物肖像授权完整',
      '☐ 歌词内容合规',
      '☐ 无低俗/擦边画面',
      '☐ 路人隐私已保护',
      '☐ 全片色调统一',
    ],
    faqs: [
      {
        question: '用AI生成MV最大的坑是什么？',
        answer: '音乐版权。即使是"免费商用"音乐也要仔细看授权条款（可能限制平台/限制用途/限制时长）。建议优先使用平台自带音乐库（抖音/快手都有海量版权曲库），或购买专业的商用音乐授权。版权索赔远超你的想象。',
      },
      {
        question: 'AI生成的MV人物动作不自然怎么办？',
        answer: 'AI视频人物动作的问题需要从几个方面优化：1）避免复杂的舞蹈/大幅度运动；2）使用简单的走、坐、看等自然动作；3）镜头多切近景和特写，少用全身长镜头（减少AI出错面积）；4）关键镜头用真人实拍+AI风格化处理，而非纯AI生成。',
      },
    ],
  },

  // ─── 9. 萌宠卡通短视频 ───
  cartoonVideo: {
    scenarios: [
      '萌宠日常短视频（猫/狗/兔子等）',
      '卡通动画短视频（2D/3D均可）',
      '宠物搞笑/剧情短片',
      '儿童友好型动画内容',
      '表情包/贴纸风格动画',
    ],
    platforms: ['抖音', '快手', '小红书', 'B站', '视频号', 'YouTube Kids'],
    inputTips: [
      '输入宠物类型/卡通角色设定、剧情主题、目标风格（滑稽/温馨/萌趣/治愈）',
      '如为真实宠物，提供宠物照片帮助AI准确描绘其特征',
      '可选指定动画风格：2D卡通渲染 / 3D萌系建模 / 手绘风 / Flat Design',
      '建议指定目标受众（儿童/年轻人/全年龄），影响画风和节奏',
    ],
    requirements: [
      '动画质感应追求"材质光影接近真实"而非"一眼AI"——皮肤绒毛、眼睛反光、环境光影都要考究',
      '卡通风格避免过于夸张做作的"大眼萌"——反而显得cheap，参考皮克斯/吉卜力的审美克制',
      '动物行为要基于真实宠物习性（猫舔毛/狗摇尾巴/兔子耳朵转动），不要做违背动物天性的动作',
      '声音设计很重要：萌宠视频50%的趣味来自音效（喵叫/狗吠/脚步/环境音），不是只有画面就行',
      '时长建议15-30秒，节奏轻快，一个视频一个笑点/暖点就行，不要贪多',
    ],
    taboos: [
      '严禁任何形式的虐待动物内容或暗示',
      '严禁使用真实的动物受伤/痛苦画面作为素材',
      '严禁在儿童内容中植入商业广告（多数平台禁止）',
      '严禁创作恐怖/惊悚/血腥风格——即使是"暗黑童话"也容易吓到低龄观众',
      '严禁利用宠物制造危险场景（如将猫狗放在高处/水中/火边摆拍）',
      '严禁使用未经授权的卡通IP形象（米老鼠、皮卡丘等——版权方维权非常积极）',
    ],
    prePublishChecklist: [
      '☐ 无虐待/危险内容',
      '☐ IP形象无侵权',
      '☐ 儿童内容无商业广告',
      '☐ 动画质量过关',
      '☐ 音效完整',
      '☐ 适合目标年龄层',
    ],
    faqs: [
      {
        question: 'AI生成的卡通形象会侵权吗？',
        answer: '如果AI生成的卡通形象和知名IP（皮卡丘、Hello Kitty等）过于相似，就构成侵权。建议：1）给AI明确描述独创角色特征，避免"像XX"这类prompt；2）生成后用Google Images反向搜索，确认不与现有IP撞脸；3）注册自己原创角色的版权或商标保护。',
      },
      {
        question: '萌宠视频如何做出差异化？',
        answer: '90%的萌宠视频都是"猫狗卖萌"，饱和度高。差异化方向：1）宠物+剧情（给宠物拟人化人格和故事线）；2）宠物+知识（如"我的猫这些行为代表什么"）；3）宠物+美学（高品质画面+舒缓音乐，做视觉放松类内容）；4）宠物+才艺（训练展示，需真实非虐）。找到一个细分角度比泛萌宠好做100倍。',
      },
    ],
  },

  // ─── 10. 数字人短视频 ───
  digitalHuman: {
    scenarios: [
      '数字人口播（知识科普/新闻播报/产品介绍）',
      '虚拟主播直播',
      '企业数字人客服/前台',
      '数字人讲师/培训视频',
      '虚拟IP角色日常更新',
    ],
    platforms: ['抖音', '快手', '视频号', 'B站', '淘宝直播', 'YouTube'],
    inputTips: [
      '输入口播主题、时长、目标平台、数字人形象偏好（真人写实/动漫风格）',
      '可选指定数字人性别、年龄感、着装风格',
      '提供完整口播文案，AI会标注停顿/重音/情绪变化点',
      '如需直播互动，提供常见Q&A话术库',
    ],
    requirements: [
      '数字人出镜拟真度要求：肉眼无法分辨AI——眨眼随机间隔2-4秒，头部微动幅度3-8度',
      '口型与音频必须同步——这是数字人"恐怖谷"的最核心指标，不同步直接翻车',
      '文案要按"说话"的方式写，而非"朗读"——口语化标点（...、——、！？，），像真人聊天一样停顿和语气变化',
      '背景建议用真实场景（办公室/书房/咖啡厅），纯粹的纯色/渐变背景一看就是AI',
      '情绪标注建议：文案中用[微笑][严肃][惊喜][思考]等标记，帮助数字人做出自然表情变化',
      '每段口播建议60-120秒，太短信息量不够，太长用户注意力下降',
    ],
    taboos: [
      '严禁使用数字人冒充真实人物（必须明确标注"AI生成"）',
      '严禁使用名人/网红肖像生成数字人（侵犯肖像权，法律责任非常重）',
      '严禁让数字人传播虚假信息或谣言',
      '严禁让数字人代替真人进行法律效力的签约/公证',
      '严禁数字人直播带货时不标注"AI主播"（抖音/快手等平台已出台规则）',
      '严禁数字人讨论政治敏感话题或发表立场性言论',
    ],
    prePublishChecklist: [
      '☐ 标注"AI生成"或"虚拟数字人"',
      '☐ 无名人肖像侵权',
      '☐ 口型与音频同步',
      '☐ 眨眼/微表情自然',
      '☐ 文案口语化',
      '☐ 内容合规',
      '☐ 平台标注规则符合',
    ],
    faqs: [
      {
        question: '数字人视频会被平台限流吗？',
        answer: '目前各平台对数字人态度不同：抖音要求数字人直播必须标注"AI主播"，未标注会被限流或封禁；视频号相对宽松但也在收紧；B站用户对虚拟UP主接受度高。建议：1）所有平台都主动标注"AI生成"；2）内容质量优先，不要让用户"一眼看出是AI"；3）关注各平台规则变化，这是快速演变的领域。',
      },
      {
        question: '如何让数字人不落入"恐怖谷效应"？',
        answer: '恐怖谷效应的核心是"像人但不是人"引发的不适。避免方法：1）不追求100%逼真——85%逼真反而比95%逼真更容易接受（因为95%时观众会盯着瑕疵）；2）采用明确的动漫/插画风格数字人，而不是写实风格；3）表情变化要多（单一表情最恐怖）；4）添加微小的"不完美"——偶尔歪头、说话中断、眼神飘忽，这些都是真人的特征。',
      },
    ],
  },

};
