/**
 * 全量模型注册表 (Complete Model Registry)
 * 智枢 AI SaaS 系统
 *
 * 覆盖腾讯云 TokenHub + 阿里云百炼 全部模型
 * 总计 70+ 模型，按能力类型分组，支持自动 Provider 检测
 */

// ─── 模型能力类型 ────────────────────────
export type ModelCapability =
  | 'chat'           // 通用对话
  | 'reasoning'      // 深度推理
  | 'creative'       // 创意文案
  | 'long_text'      // 超长文本
  | 'agent'          // Agent/函数调用
  | 'code'           // 代码生成
  | 'translation'    // 翻译
  | 'roleplay'       // 角色扮演
  | 'image'          // 图像生成
  | 'image_edit'     // 图像编辑
  | 'video'          // 视频生成
  | 'video_edit'     // 视频编辑
  | 'vision'         // 图像理解
  | 'vision_video'   // 视频理解
  | 'audio_tts'      // 语音合成
  | 'audio_asr'      // 语音识别
  | 'audio_music'    // 音乐生成
  | 'omni'           // 全模态
  | 'omni_realtime'  // 全模态实时
  | 'embedding'      // 文本向量
  | 'embedding_vl'   // 多模态向量
  | 'rerank'         // 重排序
  | 'digital_human'  // 数字人
  | '3d';            // 3D 生成

// ─── 成本等级 ────────────────────────────
export type CostTier = 'free' | 'low' | 'medium' | 'high' | 'premium';

// ─── 模型定义 ────────────────────────────
export interface ModelDefinition {
  /** 内部唯一标识 (key) */
  key: string;
  /** API 调用的模型 ID */
  modelId: string;
  /** 显示名称 */
  name: string;
  /** 所属 Provider */
  provider: 'tencent' | 'aliyun';
  /** 能力类型 */
  capability: ModelCapability;
  /** 也支持的次要能力 */
  secondaryCapabilities?: ModelCapability[];
  /** 优先级 (1最高) */
  priority: number;
  /** 成本等级 */
  cost: CostTier;
  /** 最大上下文 (tokens) */
  maxContext: number;
  /** 最大输出 (tokens) */
  maxOutput: number;
  /** 推荐 temperature 范围 */
  recommendedTemp: { min: number; max: number };
  /** 是否支持流式输出 */
  supportsStream: boolean;
  /** 是否支持 Function Calling */
  supportsFunctionCalling: boolean;
  /** 是否支持深度思考 (thinking) */
  supportsThinking: boolean;
  /** 适用场景描述 */
  bestFor: string[];
  /** 降级模型 key (自身不可用时) */
  fallbackKey?: string;
  /** 同 Provider 内的备用 */
  sameProviderFallback?: string;
  /** 跨 Provider 备用 */
  crossProviderFallback?: string;
}

// ─── 腾讯云 TokenHub 文本模型 ─────────────────
const TENCENT_TEXT_MODELS: Record<string, ModelDefinition> = {
  // === 旗舰模型 ===
  hy3: {
    key: 'hy3', modelId: 'hy3', name: '混元 Hy3 旗舰',
    provider: 'tencent', capability: 'reasoning',
    secondaryCapabilities: ['chat', 'creative', 'agent', 'code'],
    priority: 1, cost: 'premium', maxContext: 128000, maxOutput: 32768,
    recommendedTemp: { min: 0.3, max: 0.9 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: true,
    bestFor: ['复杂推理', '深度分析', '策略规划', '多步骤任务'],
    fallbackKey: 'deepseek-v4-pro-tc',
  },
  'hy3-preview': {
    key: 'hy3-preview', modelId: 'hy3-preview', name: '混元 Hy3 预览',
    provider: 'tencent', capability: 'reasoning',
    secondaryCapabilities: ['chat', 'creative'],
    priority: 1, cost: 'premium', maxContext: 128000, maxOutput: 32768,
    recommendedTemp: { min: 0.3, max: 0.9 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: true,
    bestFor: ['实验性任务', '前沿探索'],
    fallbackKey: 'hy3',
  },

  // === DeepSeek 系列 ===
  'deepseek-v4-pro-tc': {
    key: 'deepseek-v4-pro-tc', modelId: 'deepseek-v4-pro-202606', name: 'DeepSeek V4 Pro (原厂)',
    provider: 'tencent', capability: 'reasoning',
    secondaryCapabilities: ['chat', 'code', 'agent', 'creative'],
    priority: 1, cost: 'medium', maxContext: 128000, maxOutput: 64000,
    recommendedTemp: { min: 0.1, max: 0.7 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: true,
    bestFor: ['深度推理', '代码生成', '数学计算', '逻辑分析'],
    fallbackKey: 'deepseek-v4-flash-tc',
    crossProviderFallback: 'deepseek-r1-aly',
  },
  'deepseek-v4-flash-tc': {
    key: 'deepseek-v4-flash-tc', modelId: 'deepseek-v4-flash-202605', name: 'DeepSeek V4 Flash (原厂)',
    provider: 'tencent', capability: 'reasoning',
    secondaryCapabilities: ['chat', 'code'],
    priority: 2, cost: 'low', maxContext: 128000, maxOutput: 32768,
    recommendedTemp: { min: 0.1, max: 0.7 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: true,
    bestFor: ['快速推理', '批量分析', '中等复杂度任务'],
    fallbackKey: 'hunyuan-thinking',
  },

  // === GLM 系列 ===
  'glm-5.2': {
    key: 'glm-5.2', modelId: 'glm-5.2', name: 'GLM-5.2 (1M上下文)',
    provider: 'tencent', capability: 'agent',
    secondaryCapabilities: ['chat', 'reasoning', 'code', 'long_text'],
    priority: 2, cost: 'medium', maxContext: 1000000, maxOutput: 32768,
    recommendedTemp: { min: 0.3, max: 0.8 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: true,
    bestFor: ['Agent任务', '超长上下文', '代码生成', '工具调用'],
    fallbackKey: 'glm-5',
    crossProviderFallback: 'qwen3.7-plus',
  },
  'glm-5': {
    key: 'glm-5', modelId: 'glm-5', name: 'GLM-5',
    provider: 'tencent', capability: 'agent',
    secondaryCapabilities: ['chat', 'code'],
    priority: 3, cost: 'medium', maxContext: 128000, maxOutput: 32768,
    recommendedTemp: { min: 0.3, max: 0.8 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: true,
    bestFor: ['Agent任务', '代码辅助'],
    fallbackKey: 'qwen3.5-plus',
  },
  'glm-5v-turbo': {
    key: 'glm-5v-turbo', modelId: 'glm-5v-turbo', name: 'GLM-5V 视觉',
    provider: 'tencent', capability: 'vision',
    secondaryCapabilities: ['chat', 'reasoning'],
    priority: 2, cost: 'medium', maxContext: 32000, maxOutput: 8192,
    recommendedTemp: { min: 0.1, max: 0.5 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: true,
    bestFor: ['图片理解', '图表分析', 'OCR', '视觉问答'],
    fallbackKey: 'hy-vision-2.0',
    crossProviderFallback: 'qwen3.7-max',
  },

  // === Kimi 系列 ===
  'kimi-k3': {
    key: 'kimi-k3', modelId: 'kimi-k3', name: 'Kimi K3 旗舰',
    provider: 'tencent', capability: 'long_text',
    secondaryCapabilities: ['reasoning', 'creative'],
    priority: 1, cost: 'medium', maxContext: 128000, maxOutput: 32768,
    recommendedTemp: { min: 0.3, max: 0.8 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: true,
    bestFor: ['超长文本', '报告生成', '文档总结', '知识问答'],
    fallbackKey: 'kimi-k2.6',
  },
  'kimi-k2.6': {
    key: 'kimi-k2.6', modelId: 'kimi-k2.6', name: 'Kimi K2.6',
    provider: 'tencent', capability: 'long_text',
    secondaryCapabilities: ['chat'],
    priority: 2, cost: 'medium', maxContext: 128000, maxOutput: 32768,
    recommendedTemp: { min: 0.3, max: 0.7 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: true,
    bestFor: ['长文生成', '内容规划', '文档处理'],
    fallbackKey: 'qwen-long',
  },
  'kimi-k2.7-code': {
    key: 'kimi-k2.7-code', modelId: 'kimi-k2.7-code', name: 'Kimi K2.7 Code',
    provider: 'tencent', capability: 'code',
    secondaryCapabilities: ['reasoning'],
    priority: 2, cost: 'medium', maxContext: 128000, maxOutput: 32768,
    recommendedTemp: { min: 0.1, max: 0.5 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: true,
    bestFor: ['代码生成', '代码审查', 'Bug修复', '架构设计'],
    fallbackKey: 'deepseek-v4-pro-tc',
  },

  // === 千问系列 (TokenHub) ===
  'qwen3.5-plus-tc': {
    key: 'qwen3.5-plus-tc', modelId: 'qwen3.5-plus', name: 'Qwen 3.5 Plus (991K)',
    provider: 'tencent', capability: 'creative',
    secondaryCapabilities: ['chat', 'agent', 'long_text'],
    priority: 2, cost: 'low', maxContext: 991000, maxOutput: 32768,
    recommendedTemp: { min: 0.5, max: 1.0 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: false,
    bestFor: ['创意文案', '内容创作', '营销策划'],
    fallbackKey: 'qwen3.5-flash-tc',
    crossProviderFallback: 'qwen-max-aly',
  },
  'qwen3.5-flash-tc': {
    key: 'qwen3.5-flash-tc', modelId: 'qwen3.5-flash', name: 'Qwen 3.5 Flash (991K)',
    provider: 'tencent', capability: 'chat',
    priority: 3, cost: 'low', maxContext: 991000, maxOutput: 8192,
    recommendedTemp: { min: 0.5, max: 0.9 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: false,
    bestFor: ['日常对话', '快速问答', '批量处理'],
    fallbackKey: 'hunyuan-instruct',
  },

  // === MiniMax ===
  'minimax-m3': {
    key: 'minimax-m3', modelId: 'minimax-m3', name: 'MiniMax M3 (1M)',
    provider: 'tencent', capability: 'creative',
    secondaryCapabilities: ['chat', 'long_text'],
    priority: 2, cost: 'medium', maxContext: 1000000, maxOutput: 32768,
    recommendedTemp: { min: 0.5, max: 1.0 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: true,
    bestFor: ['长篇创作', '小说写作', '叙事内容'],
    fallbackKey: 'kimi-k3',
  },

  // === 混元系列 ===
  'hunyuan-instruct': {
    key: 'hunyuan-instruct', modelId: 'hunyuan-2.0-instruct-20251111', name: '混元日常',
    provider: 'tencent', capability: 'chat',
    secondaryCapabilities: ['creative'],
    priority: 3, cost: 'low', maxContext: 32000, maxOutput: 8192,
    recommendedTemp: { min: 0.5, max: 0.9 },
    supportsStream: true, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['日常对话', '智能问答', '简单任务'],
    fallbackKey: 'qwen3.5-flash-tc',
  },
  'hunyuan-thinking': {
    key: 'hunyuan-thinking', modelId: 'hunyuan-2.0-thinking-20251109', name: '混元思考',
    provider: 'tencent', capability: 'reasoning',
    priority: 3, cost: 'medium', maxContext: 32000, maxOutput: 32768,
    recommendedTemp: { min: 0.1, max: 0.5 },
    supportsStream: true, supportsFunctionCalling: false, supportsThinking: true,
    bestFor: ['推理分析', '数学计算', '逻辑论证'],
    fallbackKey: 'deepseek-v4-flash-tc',
  },

  // === 翻译 ===
  'hy-mt2-pro': {
    key: 'hy-mt2-pro', modelId: 'hy-mt2-pro', name: '混元翻译 Pro',
    provider: 'tencent', capability: 'translation',
    priority: 1, cost: 'medium', maxContext: 8000, maxOutput: 8000,
    recommendedTemp: { min: 0.1, max: 0.3 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['专业翻译', '多语言互译', '本地化'],
    fallbackKey: 'hy-mt2-plus',
  },
  'hy-mt2-plus': {
    key: 'hy-mt2-plus', modelId: 'hy-mt2-plus', name: '混元翻译 Plus',
    provider: 'tencent', capability: 'translation',
    priority: 2, cost: 'low', maxContext: 8000, maxOutput: 8000,
    recommendedTemp: { min: 0.1, max: 0.3 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['日常翻译', '快速翻译'],
    fallbackKey: 'qwen3.5-flash-tc',
  },

  // === 角色扮演 ===
  'hy-role-latest': {
    key: 'hy-role-latest', modelId: 'hunyuan-role-latest', name: '混元角色扮演',
    provider: 'tencent', capability: 'roleplay',
    secondaryCapabilities: ['chat', 'creative'],
    priority: 2, cost: 'medium', maxContext: 32000, maxOutput: 8192,
    recommendedTemp: { min: 0.7, max: 1.2 },
    supportsStream: true, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['角色扮演', '剧情互动', '品牌人设对话'],
    fallbackKey: 'qwen3.5-plus-tc',
  },
};

// ─── 腾讯云 TokenHub 视觉模型 ─────────────────
const TENCENT_VISION_MODELS: Record<string, ModelDefinition> = {
  // 图像生成
  'hy-image-v3': {
    key: 'hy-image-v3', modelId: 'hy-image-v3.0', name: '混元图像 V3.0',
    provider: 'tencent', capability: 'image',
    secondaryCapabilities: ['image_edit'],
    priority: 1, cost: 'high', maxContext: 4000, maxOutput: 0,
    recommendedTemp: { min: 0, max: 0 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['高质量图像生成', '文字嵌入图片', '漫画/表情包', '创意设计'],
    fallbackKey: 'wan2.7-image-pro-aly',
  },
  'hy-image-lite': {
    key: 'hy-image-lite', modelId: 'hy-image-lite', name: '混元图像 Lite',
    provider: 'tencent', capability: 'image',
    priority: 2, cost: 'medium', maxContext: 4000, maxOutput: 0,
    recommendedTemp: { min: 0, max: 0 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['快速出图', '电商素材', '批量生成'],
    fallbackKey: 'hy-image-v3',
  },

  // 视频生成
  'hy-video-1.5': {
    key: 'hy-video-1.5', modelId: 'hy-video-1.5', name: '混元视频 1.5',
    provider: 'tencent', capability: 'video',
    priority: 1, cost: 'high', maxContext: 4000, maxOutput: 0,
    recommendedTemp: { min: 0, max: 0 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['文生视频', '图生视频', '场景切换', '多角色视频'],
    fallbackKey: 'kling-video-v3',
  },
  'kling-video-v3': {
    key: 'kling-video-v3', modelId: 'kl-video-v3', name: '可灵 V3',
    provider: 'tencent', capability: 'video',
    priority: 1, cost: 'premium', maxContext: 4000, maxOutput: 0,
    recommendedTemp: { min: 0, max: 0 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['智能分镜', '15秒长视频', '连续叙事'],
    fallbackKey: 'hy-video-1.5',
  },
  'yt-video-2.0': {
    key: 'yt-video-2.0', modelId: 'yt-video-2.0', name: '优图视频 2.0',
    provider: 'tencent', capability: 'video',
    priority: 2, cost: 'high', maxContext: 4000, maxOutput: 0,
    recommendedTemp: { min: 0, max: 0 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['图生视频', '广告创意', '产品展示'],
    fallbackKey: 'hy-video-1.5',
  },
  'yt-video-humanactor': {
    key: 'yt-video-humanactor', modelId: 'yt-video-humanactor', name: '数字人数人',
    provider: 'tencent', capability: 'digital_human',
    priority: 1, cost: 'high', maxContext: 2000, maxOutput: 0,
    recommendedTemp: { min: 0, max: 0 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['数字人口播', '动态人像', '虚拟主播'],
    fallbackKey: null as any,
  },

  // 多模态理解
  'youtu-vita': {
    key: 'youtu-vita', modelId: 'youtu-vita', name: '优图 VITA 视频理解',
    provider: 'tencent', capability: 'vision_video',
    secondaryCapabilities: ['vision'],
    priority: 1, cost: 'high', maxContext: 16384, maxOutput: 4096,
    recommendedTemp: { min: 0.1, max: 0.3 },
    supportsStream: true, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['视频理解', '视频分析', '内容审核'],
    fallbackKey: 'hy-vision-video',
  },
  'hy-vision-2.0': {
    key: 'hy-vision-2.0', modelId: 'hy-vision-2.0-instruct', name: '混元视觉 2.0',
    provider: 'tencent', capability: 'vision',
    priority: 1, cost: 'medium', maxContext: 32000, maxOutput: 8192,
    recommendedTemp: { min: 0.1, max: 0.5 },
    supportsStream: true, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['图像理解', 'OCR', '图表分析', 'STEM推理'],
    fallbackKey: 'glm-5v-turbo',
    crossProviderFallback: 'qwen3.7-max',
  },
  'hy-vision-1.5-thinking': {
    key: 'hy-vision-1.5-thinking', modelId: 'hunyuan-t1-vision-20250916', name: '混元视觉 深度思考',
    provider: 'tencent', capability: 'vision',
    secondaryCapabilities: ['reasoning'],
    priority: 2, cost: 'medium', maxContext: 32000, maxOutput: 8192,
    recommendedTemp: { min: 0.1, max: 0.5 },
    supportsStream: true, supportsFunctionCalling: false, supportsThinking: true,
    bestFor: ['深度视觉推理', '拍题解题', '复杂图表分析'],
    fallbackKey: 'hy-vision-2.0',
  },
  'hy-vision-video': {
    key: 'hy-vision-video', modelId: 'hunyuan-turbos-vision-video-20250728', name: '混元视频理解',
    provider: 'tencent', capability: 'vision_video',
    priority: 2, cost: 'high', maxContext: 16384, maxOutput: 4096,
    recommendedTemp: { min: 0.1, max: 0.3 },
    supportsStream: true, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['视频描述', '视频问答', '内容理解'],
    fallbackKey: 'youtu-vita',
  },
};

// ─── 腾讯云 TokenHub Embedding 模型 ────────────
const TENCENT_EMBEDDING_MODELS: Record<string, ModelDefinition> = {
  'kinfra-text-embedding-4b': {
    key: 'kinfra-text-embedding-4b', modelId: 'kinfra-text-embedding-4b', name: '向量化 4B (2560维)',
    provider: 'tencent', capability: 'embedding',
    priority: 1, cost: 'low', maxContext: 8192, maxOutput: 2560,
    recommendedTemp: { min: 0, max: 0 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['高质量语义检索', '深层语义理解'],
    fallbackKey: 'kinfra-text-embedding-0.6b',
  },
  'kinfra-text-embedding-0.6b': {
    key: 'kinfra-text-embedding-0.6b', modelId: 'kinfra-text-embedding-0.6b', name: '向量化 0.6B (1024维)',
    provider: 'tencent', capability: 'embedding',
    priority: 2, cost: 'low', maxContext: 8192, maxOutput: 1024,
    recommendedTemp: { min: 0, max: 0 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['大规模文本召回', '延迟敏感场景'],
    fallbackKey: 'text-embedding-v4-aly',
  },
  'kinfra-vl-embedding-8b': {
    key: 'kinfra-vl-embedding-8b', modelId: 'kinfra-vl-embedding-8b', name: '多模态向量 8B (4096维)',
    provider: 'tencent', capability: 'embedding_vl',
    priority: 1, cost: 'medium', maxContext: 8192, maxOutput: 4096,
    recommendedTemp: { min: 0, max: 0 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['以图搜图', '多模态检索', '视频检索'],
    fallbackKey: null as any,
  },
};

// ─── 阿里云百炼 文本模型 ──────────────────────
const ALIYUN_TEXT_MODELS: Record<string, ModelDefinition> = {
  // === 千问旗舰 ===
  'qwen3.7-max': {
    key: 'qwen3.7-max', modelId: 'qwen3.7-max', name: 'Qwen 3.7 Max',
    provider: 'aliyun', capability: 'creative',
    secondaryCapabilities: ['chat', 'reasoning', 'vision', 'vision_video'],
    priority: 1, cost: 'premium', maxContext: 128000, maxOutput: 32768,
    recommendedTemp: { min: 0.3, max: 1.0 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: true,
    bestFor: ['高质量创作', '复杂分析', '视觉理解', '多模态任务'],
    fallbackKey: 'qwen3.7-plus',
    crossProviderFallback: 'hy3',
  },
  'qwen3.7-plus': {
    key: 'qwen3.7-plus', modelId: 'qwen3.7-plus', name: 'Qwen 3.7 Plus',
    provider: 'aliyun', capability: 'professional',
    secondaryCapabilities: ['chat', 'vision', 'vision_video'],
    priority: 2, cost: 'medium', maxContext: 128000, maxOutput: 32768,
    recommendedTemp: { min: 0.4, max: 0.9 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: true,
    bestFor: ['专业文案', '商业分析', '内容创作'],
    fallbackKey: 'qwen3.6-flash',
    crossProviderFallback: 'qwen3.5-plus-tc',
  },
  'qwen3.6-flash': {
    key: 'qwen3.6-flash', modelId: 'qwen3.6-flash', name: 'Qwen 3.6 Flash',
    provider: 'aliyun', capability: 'chat',
    secondaryCapabilities: ['vision', 'vision_video'],
    priority: 3, cost: 'low', maxContext: 128000, maxOutput: 8192,
    recommendedTemp: { min: 0.5, max: 0.9 },
    supportsStream: true, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['日常对话', '快速响应', '简单任务'],
    fallbackKey: 'qwen-turbo-aly',
    crossProviderFallback: 'qwen3.5-flash-tc',
  },

  // === 千问经典 ===
  'qwen-max-aly': {
    key: 'qwen-max-aly', modelId: 'qwen-max', name: 'Qwen Max (经典)',
    provider: 'aliyun', capability: 'creative',
    secondaryCapabilities: ['chat'],
    priority: 2, cost: 'medium', maxContext: 32000, maxOutput: 8192,
    recommendedTemp: { min: 0.5, max: 1.0 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: false,
    bestFor: ['创意文案', '营销策划', '高质量写作'],
    fallbackKey: 'qwen-plus-aly',
    crossProviderFallback: 'qwen3.5-plus-tc',
  },
  'qwen-plus-aly': {
    key: 'qwen-plus-aly', modelId: 'qwen-plus', name: 'Qwen Plus',
    provider: 'aliyun', capability: 'professional',
    secondaryCapabilities: ['chat'],
    priority: 3, cost: 'low', maxContext: 32000, maxOutput: 8192,
    recommendedTemp: { min: 0.5, max: 0.9 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: false,
    bestFor: ['专业文案', '内容生成', '数据整理'],
    fallbackKey: 'qwen-turbo-aly',
    crossProviderFallback: 'qwen3.5-plus-tc',
  },
  'qwen-turbo-aly': {
    key: 'qwen-turbo-aly', modelId: 'qwen-turbo', name: 'Qwen Turbo',
    provider: 'aliyun', capability: 'chat',
    priority: 4, cost: 'low', maxContext: 8000, maxOutput: 8000,
    recommendedTemp: { min: 0.5, max: 0.9 },
    supportsStream: true, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['日常快速对话', '简单问答'],
    fallbackKey: 'qwen-plus-aly',
    crossProviderFallback: 'hunyuan-instruct',
  },
  'qwen-long': {
    key: 'qwen-long', modelId: 'qwen-long', name: 'Qwen Long (1000万token)',
    provider: 'aliyun', capability: 'long_text',
    priority: 2, cost: 'medium', maxContext: 10000000, maxOutput: 8192,
    recommendedTemp: { min: 0.3, max: 0.7 },
    supportsStream: true, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['超长文本处理', '大规模文档分析', '全文总结'],
    fallbackKey: 'kimi-k3',
  },

  // === DeepSeek ===
  'deepseek-r1-aly': {
    key: 'deepseek-r1-aly', modelId: 'deepseek-r1-0528', name: 'DeepSeek R1 (百炼)',
    provider: 'aliyun', capability: 'reasoning',
    secondaryCapabilities: ['code'],
    priority: 2, cost: 'medium', maxContext: 64000, maxOutput: 64000,
    recommendedTemp: { min: 0.1, max: 0.5 },
    supportsStream: true, supportsFunctionCalling: false, supportsThinking: true,
    bestFor: ['深度推理', '数学计算', '逻辑分析'],
    fallbackKey: 'qwen3.7-plus',
    crossProviderFallback: 'deepseek-v4-pro-tc',
  },
};

// ─── 阿里云百炼 多模态模型 ─────────────────────
const ALIYUN_MULTIMODAL_MODELS: Record<string, ModelDefinition> = {
  // 图像生成
  'qwen-image-3.0-pro': {
    key: 'qwen-image-3.0-pro', modelId: 'qwen-image-3.0-pro', name: '千问图像 3.0 Pro',
    provider: 'aliyun', capability: 'image',
    priority: 1, cost: 'high', maxContext: 4000, maxOutput: 0,
    recommendedTemp: { min: 0, max: 0 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['高质量文生图', '创意海报', '品牌视觉'],
    fallbackKey: 'wan2.7-image-pro-aly',
    crossProviderFallback: 'hy-image-v3',
  },
  'wan2.7-image-pro-aly': {
    key: 'wan2.7-image-pro-aly', modelId: 'wan2.7-image-pro', name: 'WAN 2.7 图像 Pro',
    provider: 'aliyun', capability: 'image',
    priority: 1, cost: 'high', maxContext: 4000, maxOutput: 0,
    recommendedTemp: { min: 0, max: 0 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['旗舰文生图', '高分辨率输出', '电商设计'],
    fallbackKey: 'qwen-image-3.0-pro',
    crossProviderFallback: 'hy-image-v3',
  },

  // 音频
  'qwen-audio-3.0-tts-plus': {
    key: 'qwen-audio-3.0-tts-plus', modelId: 'qwen-audio-3.0-tts-plus', name: '千问 TTS Plus',
    provider: 'aliyun', capability: 'audio_tts',
    priority: 1, cost: 'medium', maxContext: 4000, maxOutput: 0,
    recommendedTemp: { min: 0, max: 0 },
    supportsStream: true, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['语音合成', '流式TTS', '配音'],
    fallbackKey: null as any,
  },

  // 全模态
  'qwen3.5-omni-plus': {
    key: 'qwen3.5-omni-plus', modelId: 'qwen3.5-omni-plus', name: '千问全模态 Omni',
    provider: 'aliyun', capability: 'omni',
    secondaryCapabilities: ['chat', 'vision', 'vision_video', 'audio_tts'],
    priority: 1, cost: 'premium', maxContext: 128000, maxOutput: 8192,
    recommendedTemp: { min: 0.3, max: 0.8 },
    supportsStream: true, supportsFunctionCalling: true, supportsThinking: false,
    bestFor: ['全模态对话', '语音输入+图像理解', '多模态交互'],
    fallbackKey: 'qwen3.7-max',
  },
  'qwen3.5-omni-plus-realtime': {
    key: 'qwen3.5-omni-plus-realtime', modelId: 'qwen3.5-omni-plus-realtime', name: '千问全模态实时',
    provider: 'aliyun', capability: 'omni_realtime',
    secondaryCapabilities: ['chat', 'vision', 'audio_tts', 'audio_asr'],
    priority: 1, cost: 'premium', maxContext: 128000, maxOutput: 8192,
    recommendedTemp: { min: 0.3, max: 0.8 },
    supportsStream: true, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['实时语音对话', '语音助手', '全模态交互'],
    fallbackKey: 'qwen3.5-omni-plus',
  },
};

// ─── 阿里云百炼 Embedding 模型 ────────────────
const ALIYUN_EMBEDDING_MODELS: Record<string, ModelDefinition> = {
  'text-embedding-v4-aly': {
    key: 'text-embedding-v4-aly', modelId: 'text-embedding-v4', name: '文本向量 V4 (1024维)',
    provider: 'aliyun', capability: 'embedding',
    priority: 1, cost: 'low', maxContext: 8192, maxOutput: 1024,
    recommendedTemp: { min: 0, max: 0 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['语义检索', '文本相似度', '知识库索引'],
    fallbackKey: 'kinfra-text-embedding-4b',
  },
  'tongyi-embedding-vision-plus': {
    key: 'tongyi-embedding-vision-plus', modelId: 'tongyi-embedding-vision-plus', name: '通义多模态向量',
    provider: 'aliyun', capability: 'embedding_vl',
    priority: 2, cost: 'medium', maxContext: 8192, maxOutput: 1536,
    recommendedTemp: { min: 0, max: 0 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['图文检索', '多模态相似度'],
    fallbackKey: 'kinfra-vl-embedding-8b',
  },
  'qwen3-rerank': {
    key: 'qwen3-rerank', modelId: 'qwen3-rerank', name: 'Qwen 重排序',
    provider: 'aliyun', capability: 'rerank',
    priority: 1, cost: 'low', maxContext: 8192, maxOutput: 0,
    recommendedTemp: { min: 0, max: 0 },
    supportsStream: false, supportsFunctionCalling: false, supportsThinking: false,
    bestFor: ['检索结果精排', '相关性排序'],
    fallbackKey: null as any,
  },
};

// ─── 合并所有模型 ────────────────────────────
export const ALL_MODELS: Record<string, ModelDefinition> = {
  ...TENCENT_TEXT_MODELS,
  ...TENCENT_VISION_MODELS,
  ...TENCENT_EMBEDDING_MODELS,
  ...ALIYUN_TEXT_MODELS,
  ...ALIYUN_MULTIMODAL_MODELS,
  ...ALIYUN_EMBEDDING_MODELS,
};

// ─── 按能力类型分组的模型索引 ────────────────
export const MODELS_BY_CAPABILITY: Record<ModelCapability, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const [key, model] of Object.entries(ALL_MODELS)) {
    if (!map[model.capability]) map[model.capability] = [];
    map[model.capability].push(key);
    if (model.secondaryCapabilities) {
      for (const cap of model.secondaryCapabilities) {
        if (!map[cap]) map[cap] = [];
        if (!map[cap].includes(key)) map[cap].push(key);
      }
    }
  }
  return map as Record<ModelCapability, string[]>;
})();

// ─── 按 Provider 分组 ────────────────────────
export const MODELS_BY_PROVIDER: Record<string, string[]> = {
  tencent: Object.keys({ ...TENCENT_TEXT_MODELS, ...TENCENT_VISION_MODELS, ...TENCENT_EMBEDDING_MODELS }),
  aliyun: Object.keys({ ...ALIYUN_TEXT_MODELS, ...ALIYUN_MULTIMODAL_MODELS, ...ALIYUN_EMBEDDING_MODELS }),
};

// ─── 辅助函数 ────────────────────────────────
export function getModel(key: string): ModelDefinition | undefined {
  return ALL_MODELS[key];
}

export function getModelsByCapability(capability: ModelCapability): ModelDefinition[] {
  const keys = MODELS_BY_CAPABILITY[capability] || [];
  return keys.map(k => ALL_MODELS[k]).filter(Boolean);
}

export function getModelsByProvider(provider: 'tencent' | 'aliyun'): ModelDefinition[] {
  const keys = MODELS_BY_PROVIDER[provider] || [];
  return keys.map(k => ALL_MODELS[k]).filter(Boolean);
}

export function getBestModelForTask(
  capability: ModelCapability,
  availableModels: Set<string>,
  preferProvider?: 'tencent' | 'aliyun'
): ModelDefinition | null {
  const candidates = getModelsByCapability(capability)
    .filter(m => availableModels.has(m.key))
    .filter(m => !preferProvider || m.provider === preferProvider)
    .sort((a, b) => a.priority - b.priority);
  return candidates[0] || null;
}

export function getTopKModelsForTask(
  capability: ModelCapability,
  availableModels: Set<string>,
  k: number = 3,
  requireDifferentProviders: boolean = false
): ModelDefinition[] {
  let candidates = getModelsByCapability(capability)
    .filter(m => availableModels.has(m.key))
    .sort((a, b) => a.priority - b.priority);

  if (requireDifferentProviders) {
    const seen = new Set<string>();
    candidates = candidates.filter(m => {
      if (seen.has(m.provider)) return false;
      seen.add(m.provider);
      return true;
    });
  }

  return candidates.slice(0, k);
}

// ─── 模型统计 ────────────────────────────────
export function getModelStats() {
  const stats = {
    total: Object.keys(ALL_MODELS).length,
    byProvider: { tencent: 0, aliyun: 0 } as Record<string, number>,
    byCapability: {} as Record<string, number>,
    byCost: { free: 0, low: 0, medium: 0, high: 0, premium: 0 } as Record<string, number>,
  };

  for (const model of Object.values(ALL_MODELS)) {
    stats.byProvider[model.provider] = (stats.byProvider[model.provider] || 0) + 1;
    stats.byCapability[model.capability] = (stats.byCapability[model.capability] || 0) + 1;
    stats.byCost[model.cost] = (stats.byCost[model.cost] || 0) + 1;
  }

  return stats;
}
