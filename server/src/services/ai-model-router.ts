/**
 * AI模型智能调度服务
 * 智枢 AI SaaS 系统 - 后端
 * 
 * 功能：
 * 1. 智能任务分类 - 根据用户输入自动识别任务类型
 * 2. 模型自动选择 - 根据任务类型选择最优模型
 * 3. 高并发降级 - 自动切换到备用模型
 * 4. 费用优化 - 优先使用性价比高的模型
 */

import { Request, Response } from 'express';

// ==================== 模型配置 ====================

// 腾讯云TokenHub模型列表
const TENCENT_MODELS = {
  hunyuan_instruct: {
    id: 'hunyuan-2.0-instruct-20251111',
    name: '混元日常',
    provider: 'tencent',
    type: 'chat',
    priority: 1,
    cost: 'low',
    maxTokens: 8192,
    description: '日常对话、智能问答',
    keywords: ['你好', '在吗', '帮忙', '怎么', '如何', '是什么', '为什么', '聊天'],
    fallback: 'qwen_turbo',
  },
  hunyuan_thinking: {
    id: 'hunyuan-2.0-thinking-20251109',
    name: '混元思考',
    provider: 'tencent',
    type: 'reasoning',
    priority: 2,
    cost: 'medium',
    maxTokens: 32768,
    description: '复杂推理、数学问题',
    keywords: ['分析', '推理', '计算', '证明', '思考', '逻辑'],
    fallback: 'deepseek_r1',
  },
  kimi_k2: {
    id: 'kimi-k2.6',
    name: 'Kimi长文',
    provider: 'tencent',
    type: 'long_text',
    priority: 2,
    cost: 'medium',
    maxTokens: 128000,
    description: '超长文本、报告生成',
    keywords: ['报告', '总结', '文章', '论文', '文档', '小说', '长文'],
    fallback: 'qwen_long',
  },
  glm_5: {
    id: 'glm-5',
    name: 'GLM-5 Agent',
    provider: 'tencent',
    type: 'agent',
    priority: 3,
    cost: 'medium',
    maxTokens: 32768,
    description: 'Agent任务、代码生成',
    keywords: ['代码', '编程', '开发', '任务', '执行'],
    fallback: 'qwen_plus',
  },
  glm_5v: {
    id: 'glm-5v-turbo',
    name: 'GLM视觉',
    provider: 'tencent',
    type: 'vision',
    priority: 2,
    cost: 'medium',
    maxTokens: 8192,
    description: '图片理解、图表分析',
    keywords: ['图片', '图像', '看图', '图表', '截图', '照片'],
    fallback: null,
  },
  youtu_vita: {
    id: 'youtu-vita',
    name: '视频解析',
    provider: 'tencent',
    type: 'video',
    priority: 2,
    cost: 'high',
    maxTokens: 16384,
    description: '视频理解、视频分析',
    keywords: ['视频', '抖音', '快手', '小红书视频', 'B站'],
    fallback: null,
  },
  hy_image: {
    id: 'HY-Image-V3.0',
    name: '图片生成',
    provider: 'tencent',
    type: 'image',
    priority: 1,
    cost: 'high',
    description: '高质量图像生成',
    keywords: ['生成图片', '画图', '创作图片', 'AI绘图'],
    fallback: null,
  },
  digital_human: {
    id: 'YT-Video-HumanActor',
    name: '数字人口播',
    provider: 'tencent',
    type: 'digital_human',
    priority: 1,
    cost: 'high',
    description: '数字人口播视频',
    keywords: ['数字人', '口播', '配音', '主播', '虚拟人'],
    fallback: null,
  },
};

// 阿里云百炼模型列表
const ALIYUN_MODELS = {
  qwen_turbo: {
    id: 'qwen-turbo',
    name: '千问快速',
    provider: 'aliyun',
    type: 'chat',
    priority: 1,
    cost: 'low',
    maxTokens: 8192,
    description: '日常对话、快速响应',
    keywords: ['你好', '在吗', '简单', '快速'],
    fallback: 'hunyuan_instruct',
  },
  qwen_plus: {
    id: 'qwen-plus',
    name: '千问专业',
    provider: 'aliyun',
    type: 'professional',
    priority: 2,
    cost: 'medium',
    maxTokens: 32768,
    description: '专业文案、营销内容',
    keywords: ['文案', '营销', '推广', '策划', '方案'],
    fallback: 'glm_5',
  },
  qwen_long: {
    id: 'qwen-long',
    name: '千问长文',
    provider: 'aliyun',
    type: 'long_text',
    priority: 2,
    cost: 'medium',
    maxTokens: 10000000,
    description: '超长文本处理',
    keywords: ['超长', '万字', '长文', '长篇小说'],
    fallback: 'kimi_k2',
  },
  deepseek_r1: {
    id: 'deepseek-r1-0528',
    name: 'DeepSeek思考',
    provider: 'aliyun',
    type: 'reasoning',
    priority: 2,
    cost: 'medium',
    maxTokens: 64000,
    description: '深度思考、复杂推理',
    keywords: ['深度', '推理', '分析', '思考', '复杂', '数学'],
    fallback: 'hunyuan_thinking',
  },
};

// 合并所有模型
const ALL_MODELS = {
  ...TENCENT_MODELS,
  ...ALIYUN_MODELS,
};

// ==================== 模型调度器类 ====================

export class AIModelRouter {
  private availableModels: Set<string>;
  private fallbackCache: Map<string, string>;
  private loadBalancingIndex: number = 0;
  private concurrentRequests: Map<string, number> = new Map(); // 记录各模型的并发数
  private maxConcurrentPerModel: number = 10; // 每个模型最大并发数

  constructor() {
    this.availableModels = new Set();
    this.fallbackCache = new Map();
    this.initDefaultModels();
  }

  // 初始化默认启用的模型
  private initDefaultModels() {
    Object.keys(TENCENT_MODELS).forEach(key => {
      this.availableModels.add(key);
    });
    Object.keys(ALIYUN_MODELS).forEach(key => {
      this.availableModels.add(key);
    });
  }

  // 更新可用模型列表（从数据库读取用户配置）
  setAvailableModels(modelKeys: string[]) {
    this.availableModels.clear();
    modelKeys.forEach(key => this.availableModels.add(key));
  }

  // 获取所有可用模型
  getAvailableModels(): string[] {
    return Array.from(this.availableModels);
  }

  // ==================== 任务分析 ====================

  /**
   * 分析用户输入，判断任务类型
   */
  analyzeTask(userInput: string): string {
    const input = userInput.toLowerCase();
    
    // 1. 检查图像理解
    if (this.matchKeywords(input, ['图片', '图像', '看图', '图表', '截图', '照片', '分析图片'])) {
      return 'vision';
    }
    
    // 2. 检查视频理解
    if (this.matchKeywords(input, ['视频', '抖音', '快手', '小红书视频', 'B站', '分析视频'])) {
      return 'video';
    }
    
    // 3. 检查图像生成
    if (this.matchKeywords(input, ['生成图片', '画图', '创作图片', '生成画作', 'AI绘图'])) {
      return 'image';
    }
    
    // 4. 检查数字人
    if (this.matchKeywords(input, ['数字人', '口播', '配音', '主播', '虚拟人'])) {
      return 'digital_human';
    }
    
    // 5. 检查代码/Agent任务
    if (this.matchKeywords(input, ['代码', '编程', '开发', '任务', '执行', '自动化'])) {
      return 'agent';
    }
    
    // 6. 检查超长文本
    if (this.matchKeywords(input, ['报告', '总结', '文章', '论文', '文档', '小说', '长文', '万字'])) {
      return 'long_text';
    }
    
    // 7. 检查专业内容
    if (this.matchKeywords(input, ['文案', '营销', '推广', '策划', '方案', '专业', '详细'])) {
      return 'professional';
    }
    
    // 8. 检查深度推理
    if (this.matchKeywords(input, ['深度', '推理', '分析', '思考', '复杂', '数学', '为什么', '分析一下'])) {
      return 'reasoning';
    }
    
    return 'chat'; // 默认日常对话
  }

  // 关键词匹配
  private matchKeywords(input: string, keywords: string[]): boolean {
    return keywords.some(keyword => input.includes(keyword));
  }

  // ==================== 模型选择 ====================

  /**
   * 根据任务类型选择最优模型
   * 包含高并发降级逻辑
   */
  selectModel(taskType: string, preferProvider?: 'tencent' | 'aliyun'): { modelKey: string; provider: string; isFallback: boolean } {
    const candidates = this.getCandidateModels(taskType, preferProvider);
    
    if (candidates.length === 0) {
      return { modelKey: 'hunyuan_instruct', provider: 'tencent', isFallback: false };
    }

    // 优先选择低并发的模型
    const sortedCandidates = candidates.sort((a, b) => {
      const aConcurrent = this.concurrentRequests.get(a) || 0;
      const bConcurrent = this.concurrentRequests.get(b) || 0;
      
      // 如果有模型超过最大并发数，标记为不可用
      const aAvailable = aConcurrent < this.maxConcurrentPerModel ? 0 : 1;
      const bAvailable = bConcurrent < this.maxConcurrentPerModel ? 0 : 1;
      
      if (aAvailable !== bAvailable) {
        return aAvailable - bAvailable; // 优先选择可用的
      }
      
      // 都可用则按负载均衡选择
      const aIndex = this.loadBalancingIndex % candidates.length;
      const bIndex = (this.loadBalancingIndex + 1) % candidates.length;
      
      if (a === candidates[0] && b === candidates[1]) return aIndex - bIndex;
      
      return aConcurrent - bConcurrent;
    });

    // 更新负载均衡索引
    this.loadBalancingIndex++;

    // 返回第一个可用模型
    const selectedModel = sortedCandidates[0];
    const model = ALL_MODELS[selectedModel as keyof typeof ALL_MODELS];
    
    return {
      modelKey: selectedModel,
      provider: model?.provider || 'tencent',
      isFallback: false,
    };
  }

  /**
   * 获取候选模型列表（按优先级和并发数排序）
   */
  private getCandidateModels(taskType: string, preferProvider?: 'tencent' | 'aliyun'): string[] {
    const candidates: { key: string; priority: number; cost: string; concurrent: number }[] = [];

    Object.entries(ALL_MODELS).forEach(([key, model]) => {
      if (!this.availableModels.has(key)) return;
      
      // 检查任务类型匹配
      let typeMatch = model.type === taskType;
      if (!typeMatch) {
        // chat类型可以作为professional的降级
        if (taskType === 'professional' && model.type === 'chat') {
          typeMatch = true;
        }
      }
      if (!typeMatch) return;
      
      // 检查提供商偏好
      if (preferProvider && model.provider !== preferProvider) return;

      const concurrent = this.concurrentRequests.get(key) || 0;
      
      candidates.push({
        key,
        priority: model.priority,
        cost: model.cost,
        concurrent,
      });
    });

    // 按优先级、费用、并发数排序
    candidates.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      const costOrder: Record<string, number> = { low: 0, medium: 1, high: 2 };
      if (a.cost !== b.cost) {
        return costOrder[a.cost as keyof typeof costOrder] - costOrder[b.cost as keyof typeof costOrder];
      }
      // 同优先级同费用，优先选择并发低的
      return a.concurrent - b.concurrent;
    });

    return candidates.map(c => c.key);
  }

  /**
   * 获取模型的详细信息
   */
  getModelInfo(modelKey: string) {
    return ALL_MODELS[modelKey as keyof typeof ALL_MODELS];
  }

  // ==================== 并发控制 ====================

  /**
   * 增加模型并发计数
   */
  incrementConcurrent(modelKey: string) {
    const current = this.concurrentRequests.get(modelKey) || 0;
    this.concurrentRequests.set(modelKey, current + 1);
  }

  /**
   * 减少模型并发计数
   */
  decrementConcurrent(modelKey: string) {
    const current = this.concurrentRequests.get(modelKey) || 0;
    if (current > 0) {
      this.concurrentRequests.set(modelKey, current - 1);
    }
  }

  /**
   * 获取模型的当前并发数
   */
  getConcurrent(modelKey: string): number {
    return this.concurrentRequests.get(modelKey) || 0;
  }

  // ==================== 降级处理 ====================

  /**
   * 当主模型失败时，获取备用模型
   */
  getFallbackModel(failedModelKey: string): { modelKey: string; provider: string } | null {
    // 1. 先检查缓存
    const cached = this.fallbackCache.get(failedModelKey);
    if (cached) {
      const model = ALL_MODELS[cached as keyof typeof ALL_MODELS];
      if (model && this.availableModels.has(cached) && this.getConcurrent(cached) < this.maxConcurrentPerModel) {
        return { modelKey: cached, provider: model.provider };
      }
    }

    const model = ALL_MODELS[failedModelKey as keyof typeof ALL_MODELS];
    if (!model) return null;

    // 2. 检查模型是否有直接定义的备用模型
    if ('fallback' in model && model.fallback) {
      const fallbackKey = model.fallback as string;
      if (this.availableModels.has(fallbackKey)) {
        const fallbackModel = ALL_MODELS[fallbackKey as keyof typeof ALL_MODELS];
        if (this.getConcurrent(fallbackKey) < this.maxConcurrentPerModel) {
          this.fallbackCache.set(failedModelKey, fallbackKey);
          return { modelKey: fallbackKey, provider: fallbackModel?.provider || 'tencent' };
        }
      }
    }

    // 3. 查找同类型的其他模型
    const sameTypeModels = Object.entries(ALL_MODELS)
      .filter(([key, m]) => {
        if (key === failedModelKey) return false;
        if (!this.availableModels.has(key)) return false;
        return m.type === model.type;
      })
      .map(([key, m]) => ({ key, concurrent: this.getConcurrent(key), provider: m.provider }))
      .filter(m => m.concurrent < this.maxConcurrentPerModel)
      .sort((a, b) => a.concurrent - b.concurrent);

    if (sameTypeModels.length > 0) {
      const fallbackKey = sameTypeModels[0].key;
      this.fallbackCache.set(failedModelKey, fallbackKey);
      return { modelKey: fallbackKey, provider: sameTypeModels[0].provider };
    }

    // 4. 返回任意可用模型
    const anyModel = Array.from(this.availableModels)
      .map(key => ({ key, concurrent: this.getConcurrent(key), model: ALL_MODELS[key as keyof typeof ALL_MODELS] }))
      .filter(m => m.concurrent < this.maxConcurrentPerModel)
      .sort((a, b) => a.concurrent - b.concurrent)[0];

    if (anyModel) {
      this.fallbackCache.set(failedModelKey, anyModel.key);
      return { modelKey: anyModel.key, provider: anyModel.model?.provider || 'tencent' };
    }

    return null;
  }

  // ==================== 统计信息 ====================

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
      },
      byType: {} as Record<string, number>,
      byConcurrent: {} as Record<string, number>,
    };

    this.availableModels.forEach(key => {
      const model = ALL_MODELS[key as keyof typeof ALL_MODELS];
      if (model) {
        stats.byProvider[model.provider as keyof typeof stats.byProvider]++;
        stats.byType[model.type] = (stats.byType[model.type] || 0) + 1;
        stats.byConcurrent[key] = this.getConcurrent(key);
      }
    });

    return stats;
  }
}

// ==================== 导出单例 ====================

export const aiModelRouter = new AIModelRouter();

// ==================== 工具函数 ====================

/**
 * 快速分析并选择模型
 */
export function analyzeAndSelectModel(userInput: string, preferProvider?: 'tencent' | 'aliyun') {
  const taskType = aiModelRouter.analyzeTask(userInput);
  const result = aiModelRouter.selectModel(taskType, preferProvider);
  const model = aiModelRouter.getModelInfo(result.modelKey);
  
  return {
    taskType,
    modelKey: result.modelKey,
    modelId: model?.id || result.modelKey,
    modelName: model?.name || result.modelKey,
    provider: result.provider,
    isFallback: result.isFallback,
    reason: model?.description || '',
  };
}

/**
 * 获取任务类型的中文名称
 */
export function getTaskTypeName(taskType: string): string {
  const names: Record<string, string> = {
    chat: '日常对话',
    reasoning: '深度推理',
    long_text: '超长文本',
    professional: '专业内容',
    agent: 'Agent任务',
    vision: '图像理解',
    video: '视频理解',
    image: '图像生成',
    digital_human: '数字人',
    unknown: '未知',
  };
  return names[taskType] || taskType;
}

/**
 * 导出所有模型列表
 */
export function getAllModelsList() {
  return {
    tencent: Object.entries(TENCENT_MODELS).map(([key, model]) => ({
      key,
      ...model,
    })),
    aliyun: Object.entries(ALIYUN_MODELS).map(([key, model]) => ({
      key,
      ...model,
    })),
  };
}
