/**
 * AI模型智能调度服务
 * 智枢 AI SaaS 系统
 * 
 * 功能：
 * 1. 智能任务分类 - 根据用户输入自动识别任务类型
 * 2. 模型自动选择 - 根据任务类型选择最优模型
 * 3. 高并发降级 - 自动切换到备用模型
 * 4. 费用优化 - 优先使用性价比高的模型
 */

// ==================== 模型配置 ====================

// 腾讯云TokenHub模型列表（对齐服务端统一标准，2026-08 在售模型）
export const TENCENT_MODELS = {
  // 日常对话模型
  hunyuan_instruct: {
    id: 'kimi-k3',
    name: 'Kimi K3 日常',
    provider: 'tencent',
    type: 'chat',
    priority: 1, // 优先级（1最高）
    cost: 'low', // 费用等级
    maxTokens: 8192,
    description: '日常对话、智能问答、快速响应 — 实测质量优先',
    keywords: ['你好', '在吗', '帮忙', '怎么', '如何', '是什么', '为什么', '聊天'],
    fallback: 'qwen_turbo',
  },
  hunyuan_thinking: {
    id: 'deepseek-v4-pro-202606',
    name: 'DeepSeek V4 Pro 思考',
    provider: 'tencent',
    type: 'reasoning',
    priority: 2,
    cost: 'medium',
    maxTokens: 32768,
    description: '复杂推理、数学问题、深度思考 — 实测质量优先',
    keywords: ['分析', '推理', '计算', '证明', '思考', '逻辑'],
    fallback: 'kimi_k2',
  },
  
  // 超长文本模型
  kimi_k2: {
    id: 'kimi-k3',
    name: 'Kimi K3 长文',
    provider: 'tencent',
    type: 'long_text',
    priority: 1,
    cost: 'medium',
    maxTokens: 128000, // 128K tokens
    description: '长篇文本处理/摘要/改写 — 质量优先',
    keywords: ['报告', '总结', '文章', '论文', '文档', '小说', '长文', '万字', '摘要'],
    fallback: 'qwen_38_max',
  },

  // 深度分析模型（实测版：DeepSeek V4 Pro 归属腾讯 TokenHub）
  deepseek_v4_pro_tc: {
    id: 'deepseek-v4-pro-202606',
    name: 'DeepSeek V4 Pro',
    provider: 'tencent',
    type: 'reasoning',
    priority: 1,
    cost: 'medium',
    maxTokens: 64000,
    description: '结构化分析/大纲/评审/合规 — 质量优先',
    keywords: ['深度', '推理', '分析', '思考', '复杂', '数学', '证明', '评审', '合规', '大纲', '结构化'],
    fallback: 'qwen_38_max',
  },
  
  // 图像理解模型
  glm_5v: {
    id: 'hy-vision-2.0-instruct',
    name: '混元视觉2.0',
    provider: 'tencent',
    type: 'vision',
    priority: 1,
    cost: 'medium',
    maxTokens: 8192,
    description: '图像理解/OCR/图表分析 — 质量优先',
    keywords: ['图片', '图像', '看图', '图表', '截图', '照片', '分析图片'],
    fallback: 'glm_5',
  },
  
  // 视频理解模型（实测版：YT-VITA 1.5 归属腾讯）
  youtu_vita: {
    id: 'yt-vita-1-5',
    name: 'YT-VITA 视频理解',
    provider: 'tencent',
    type: 'video',
    priority: 1,
    cost: 'high',
    maxTokens: 16384,
    description: '视频理解/素材理解/剪辑点识别',
    keywords: ['视频', '抖音', '快手', '小红书视频', 'B站', '分析视频', '视频链接'],
    fallback: null,
  },
}

// 阿里云百炼模型列表（对齐实测版《AI模型配置最终版》统一标准）
export const ALIYUN_MODELS = {
  qwen_turbo: {
    id: 'qwen3.8-max',
    name: 'Qwen3.8快速',
    provider: 'aliyun',
    type: 'chat',
    priority: 1,
    cost: 'low',
    maxTokens: 8192,
    description: '日常对话、快速响应 — 实测质量优先',
    keywords: ['你好', '在吗', '简单', '快速', '问问'],
    fallback: 'hunyuan_instruct', // 备用模型
  },
  
  qwen_plus: {
    id: 'qwen3.8-max',
    name: 'Qwen3.8专业',
    provider: 'aliyun',
    type: 'professional',
    priority: 2,
    cost: 'medium',
    maxTokens: 32768,
    description: '专业文案、营销内容 — 实测质量优先',
    keywords: ['文案', '营销', '推广', '策划', '方案', '专业', '详细'],
    fallback: 'qwen_38_max',
  },
  
  qwen_long: {
    id: 'qwen-long',
    name: '千问长文',
    provider: 'aliyun',
    type: 'long_text',
    priority: 2,
    cost: 'medium',
    maxTokens: 10000000, // 10M tokens
    description: '超长文本处理、长文档分析',
    keywords: ['超长', '万字', '长文', '长篇小说', '长文档'],
    fallback: 'kimi_k2',
  },
  
  // 高质量创作/复杂推理模型（实测版：Qwen 3.8 Max 归属阿里百炼）
  qwen_38_max: {
    id: 'qwen3.8-max',
    name: 'Qwen3.8 Max',
    provider: 'aliyun',
    type: 'professional',
    priority: 1,
    cost: 'medium',
    maxTokens: 128000,
    description: '高质量创作/复杂推理 — 实测质量优先',
    keywords: ['文案', '营销', '推广', '策划', '方案', '创作', '写作', '创意', '内容'],
    fallback: 'deepseek_v4_pro_tc',
  },
}

// 火山方舟模型列表（实测版：GLM-5.2 / Doubao Seed 2.1 Pro 归属火山方舟）
export const VOLCANO_MODELS = {
  glm_5: {
    id: 'glm-5-2',
    name: 'GLM-5.2（方舟）',
    provider: 'volcano',
    type: 'agent',
    priority: 2,
    cost: 'medium',
    maxTokens: 32768,
    description: '字幕/去AI化/中英双语（1M上下文） + Agent/代码 — 实测质量优先',
    keywords: ['代码', '编程', '开发', '任务', '执行', '字幕', '去AI化', '中英', '翻译', '超长'],
    fallback: 'kimi_k2',
  },
  doubao_seed_2_1_pro: {
    id: 'doubao-seed-2-1-pro-260628',
    name: 'Doubao Seed 2.1 Pro',
    provider: 'volcano',
    type: 'chat',
    priority: 1,
    cost: 'low',
    maxTokens: 8192,
    description: '创作/推理/视频理解/多模态 — 实测质量优先',
    keywords: ['创作', '推理', '多模态', '视频理解', '兜底'],
    fallback: 'qwen_38_max',
  },
}

// 合并所有模型
export const ALL_MODELS = {
  ...TENCENT_MODELS,
  ...ALIYUN_MODELS,
  ...VOLCANO_MODELS,
}

// ==================== 任务类型定义 ====================

export type TaskType = 
  | 'chat'           // 日常对话
  | 'reasoning'      // 深度推理
  | 'long_text'      // 超长文本
  | 'professional'  // 专业内容
  | 'agent'          // Agent任务
  | 'vision'         // 图像理解
  | 'video'          // 视频理解
  | 'unknown'        // 未知

// ==================== 智能调度核心类 ====================

export class AIModelRouter {
  private availableModels: Set<string>
  private fallbackCache: Map<string, string>
  private loadBalancingIndex: number = 0

  constructor() {
    this.availableModels = new Set()
    this.fallbackCache = new Map()
    // 默认启用所有模型
    this.initDefaultModels()
  }

  // 初始化默认启用的模型
  private initDefaultModels() {
    // 腾讯云模型
    Object.keys(TENCENT_MODELS).forEach(key => {
      this.availableModels.add(key)
    })
    // 阿里云模型
    Object.keys(ALIYUN_MODELS).forEach(key => {
      this.availableModels.add(key)
    })
    // 火山方舟模型
    Object.keys(VOLCANO_MODELS).forEach(key => {
      this.availableModels.add(key)
    })
  }

  // 更新可用模型列表
  setAvailableModels(modelKeys: string[]) {
    this.availableModels.clear()
    modelKeys.forEach(key => this.availableModels.add(key))
  }

  // 获取所有可用模型
  getAvailableModels(): string[] {
    return Array.from(this.availableModels)
  }

  // ==================== 任务分析 ====================

  /**
   * 分析用户输入，判断任务类型
   */
  analyzeTask(userInput: string): TaskType {
    const input = userInput.toLowerCase()
    
    // 1. 检查图像理解
    if (this.matchKeywords(input, ['图片', '图像', '看图', '图表', '截图', '照片', '分析图片'])) {
      return 'vision'
    }
    
    // 2. 检查视频理解
    if (this.matchKeywords(input, ['视频', '抖音', '快手', '小红书视频', 'B站', '分析视频', '视频链接'])) {
      return 'video'
    }
    
    // 3. 检查代码/Agent任务
    if (this.matchKeywords(input, ['代码', '编程', '开发', '任务', '执行', '自动化', '脚本', '写代码'])) {
      return 'agent'
    }
    
    // 4. 检查超长文本
    if (this.matchKeywords(input, ['报告', '总结', '文章', '论文', '文档', '小说', '长文', '超长', '万字'])) {
      return 'long_text'
    }
    
    // 5. 检查专业内容
    if (this.matchKeywords(input, ['文案', '营销', '推广', '策划', '方案', '专业', '详细', '营销文案'])) {
      return 'professional'
    }
    
    // 6. 检查深度推理
    if (this.matchKeywords(input, ['深度', '推理', '分析', '思考', '复杂', '数学', '证明', '为什么', '分析一下'])) {
      return 'reasoning'
    }
    
    return 'chat' // 默认日常对话
  }

  // 关键词匹配
  private matchKeywords(input: string, keywords: string[]): boolean {
    return keywords.some(keyword => input.includes(keyword))
  }

  // ==================== 模型选择 ====================

  /**
   * 根据任务类型选择最优模型
   */
  selectModel(taskType: TaskType, preferProvider?: 'tencent' | 'aliyun' | 'volcano'): string {
    const candidates = this.getCandidateModels(taskType, preferProvider)
    
    if (candidates.length === 0) {
      // 如果没有匹配的，返回默认模型
      return 'hunyuan_instruct'
    }

    // 使用负载均衡选择模型
    const selectedIndex = this.loadBalancingIndex % candidates.length
    const selectedModel = candidates[selectedIndex]
    
    // 更新负载均衡索引
    this.loadBalancingIndex++

    return selectedModel
  }

  /**
   * 获取候选模型列表（按优先级排序）
   */
  private getCandidateModels(taskType: TaskType, preferProvider?: 'tencent' | 'aliyun' | 'volcano'): string[] {
    const candidates: { key: string; priority: number; cost: string }[] = []

    // 遍历所有模型，找出符合任务类型的
    Object.entries(ALL_MODELS).forEach(([key, model]) => {
      if (!this.availableModels.has(key)) return // 模型未启用
      if (model.type !== taskType && !(taskType === 'chat' && model.type === 'professional')) {
        // 如果任务类型不匹配，且不是chat类型降级到professional
        if (taskType === 'professional' && model.type === 'chat') {
          // 专业内容可以使用chat模型
        } else {
          return
        }
      }
      
      if (preferProvider && model.provider !== preferProvider) return

      candidates.push({
        key,
        priority: model.priority,
        cost: model.cost,
      })
    })

    // 按优先级和费用排序
    candidates.sort((a, b) => {
      // 先按优先级
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      // 同优先级按费用
      const costOrder = { low: 0, medium: 1, high: 2 }
      return costOrder[a.cost as keyof typeof costOrder] - costOrder[b.cost as keyof typeof costOrder]
    })

    return candidates.map(c => c.key)
  }

  /**
   * 获取模型的详细信息
   */
  getModelInfo(modelKey: string) {
    return ALL_MODELS[modelKey as keyof typeof ALL_MODELS]
  }

  /**
   * 获取模型的可读名称
   */
  getModelName(modelKey: string): string {
    const model = ALL_MODELS[modelKey as keyof typeof ALL_MODELS]
    return model?.name || modelKey
  }

  /**
   * 获取模型的provider
   */
  getModelProvider(modelKey: string): string {
    const model = ALL_MODELS[modelKey as keyof typeof ALL_MODELS]
    return model?.provider || 'unknown'
  }

  // ==================== 降级处理 ====================

  /**
   * 当主模型失败时，获取备用模型
   */
  getFallbackModel(failedModelKey: string): string | null {
    // 1. 先检查缓存
    const cached = this.fallbackCache.get(failedModelKey)
    if (cached) return cached

    const model = ALL_MODELS[failedModelKey as keyof typeof ALL_MODELS]
    if (!model) return null

    // 2. 检查模型是否有备用模型
    if ('fallback' in model && model.fallback) {
      const fallbackKey = model.fallback as string
      if (this.availableModels.has(fallbackKey)) {
        this.fallbackCache.set(failedModelKey, fallbackKey)
        return fallbackKey
      }
    }

    // 3. 查找同类型的其他模型
    const sameTypeModels = Object.entries(ALL_MODELS)
      .filter(([key, m]) => {
        if (key === failedModelKey) return false
        if (!this.availableModels.has(key)) return false
        return m.type === model.type
      })
      .map(([key]) => key)

    if (sameTypeModels.length > 0) {
      const fallbackKey = sameTypeModels[0]
      this.fallbackCache.set(failedModelKey, fallbackKey)
      return fallbackKey
    }

    // 4. 返回任意可用模型
    const anyModel = Array.from(this.availableModels)[0]
    if (anyModel) {
      this.fallbackCache.set(failedModelKey, anyModel)
      return anyModel
    }

    return null
  }

  /**
   * 检查模型是否可用
   */
  isModelAvailable(modelKey: string): boolean {
    return this.availableModels.has(modelKey)
  }

  /**
   * 获取模型统计信息
   */
  getStats() {
    const stats = {
      total: Object.keys(ALL_MODELS).length,
      available: this.availableModels.size,
      byProvider: {
        tencent: 0,
        aliyun: 0,
        volcano: 0,
      },
      byType: {} as Record<string, number>,
    }

    this.availableModels.forEach(key => {
      const model = ALL_MODELS[key as keyof typeof ALL_MODELS]
      if (model) {
        stats.byProvider[model.provider as keyof typeof stats.byProvider]++
        stats.byType[model.type] = (stats.byType[model.type] || 0) + 1
      }
    })

    return stats
  }
}

// ==================== 导出单例 ====================

export const aiModelRouter = new AIModelRouter()

// ==================== 工具函数 ====================

/**
 * 快速选择模型（静态函数，方便调用）
 */
export function selectModelForTask(
  taskType: TaskType, 
  preferProvider?: 'tencent' | 'aliyun' | 'volcano'
): { modelKey: string; modelName: string; provider: string } {
  const modelKey = aiModelRouter.selectModel(taskType, preferProvider)
  return {
    modelKey,
    modelName: aiModelRouter.getModelName(modelKey),
    provider: aiModelRouter.getModelProvider(modelKey),
  }
}

/**
 * 分析并选择模型（一体化函数）
 */
export function analyzeAndSelectModel(
  userInput: string,
  preferProvider?: 'tencent' | 'aliyun' | 'volcano'
): { 
  taskType: TaskType
  modelKey: string
  modelName: string
  provider: string
  reason: string
} {
  const taskType = aiModelRouter.analyzeTask(userInput)
  const modelKey = aiModelRouter.selectModel(taskType, preferProvider)
  const model = aiModelRouter.getModelInfo(modelKey)
  
  return {
    taskType,
    modelKey,
    modelName: model?.name || modelKey,
    provider: model?.provider || 'unknown',
    reason: `任务类型: ${getTaskTypeName(taskType)}, 模型: ${model?.name}, 原因: ${model?.description}`,
  }
}

/**
 * 获取任务类型的中文名称
 */
export function getTaskTypeName(taskType: TaskType): string {
  const names: Record<TaskType, string> = {
    chat: '日常对话',
    reasoning: '深度推理',
    long_text: '超长文本',
    professional: '专业内容',
    agent: 'Agent任务',
    vision: '图像理解',
    video: '视频理解',
    unknown: '未知',
  }
  return names[taskType]
}

/**
 * 获取任务类型对应的图标
 */
export function getTaskTypeIcon(taskType: TaskType): string {
  const icons: Record<TaskType, string> = {
    chat: 'chatbubbles-outline',
    reasoning: 'bulb-outline',
    long_text: 'document-text-outline',
    professional: 'create-outline',
    agent: 'cog-outline',
    vision: 'image-outline',
    video: 'videocam-outline',
    unknown: 'help-outline',
  }
  return icons[taskType]
}
