/**
 * 多模型协同协调器 (Multi-Model Orchestrator)
 * 智枢 AI SaaS 系统
 *
 * 核心能力：
 * 1. Ensemble 模式 — 2-3 个模型并行生成，AI 评判选最佳
 * 2. Pipeline 模式 — 多步骤流水线，每个步骤用最优模型
 * 3. Quality 评分 — 自动评估输出质量，按场景打分
 * 4. Smart Fallback — 跨 Provider 智能降级
 */

import { aiModelRouter } from './ai-model-router';
import {
  ModelDefinition, ModelCapability,
  getBestModelForTask, getTopKModelsForTask, getModel,
  ALL_MODELS, MODELS_BY_CAPABILITY,
} from './model-registry';

// ─── 类型定义 ────────────────────────────────

/** 单模型调用结果 */
export interface ModelCallResult {
  modelKey: string;
  modelName: string;
  provider: string;
  output: string;
  duration: number;
  tokensUsed?: number;
  success: boolean;
  error?: string;
}

/** Ensemble 模式 — 多模型并行 + 评选最优 */
export interface EnsembleConfig {
  /** 参与竞争的模型数量 */
  candidateCount: number;
  /** 候选模型的能力类型 */
  capability: ModelCapability;
  /** 是否要求不同 Provider */
  requireDifferentProviders: boolean;
  /** 评判模型 key */
  judgeModelKey?: string;
  /** 质量维度权重 */
  qualityWeights?: {
    creativity?: number;    // 创意性
    relevance?: number;     // 相关性
    accuracy?: number;      // 准确性
    fluency?: number;       // 流畅度
    actionability?: number; // 可执行性
  };
  /** 系统提示词 (所有候选模型共用) */
  systemPrompt: string;
  /** 评判提示词模板 {{outputs}} 为候选结果 */
  judgePrompt?: string;
}

export interface EnsembleResult {
  winner: ModelCallResult;
  allCandidates: ModelCallResult[];
  judgeReasoning?: string;
  qualityScores?: Record<string, number>;
  totalDuration: number;
  /** 是否有跨Provider的候选 */
  multiProvider: boolean;
}

/** Pipeline 模式 — 多步骤流水线 */
export interface PipelineStage {
  id: string;
  description: string;
  capability: ModelCapability;
  systemPrompt: string;
  /** 是否可与前一个 stage 并行 */
  parallelWithPrevious?: boolean;
  /** 使用上一个 stage 的输出作为输入 */
  dependsOn?: string;
}

export interface PipelineConfig {
  stages: PipelineStage[];
  /** 最终合成提示词 */
  synthesisPrompt?: string;
}

export interface PipelineResult {
  success: boolean;
  totalDuration: number;
  stages: Array<{
    stageId: string;
    success: boolean;
    output: string;
    modelKey: string;
    modelName: string;
    duration: number;
    error?: string;
  }>;
  finalOutput: string;
}

// ─── 核心类 ──────────────────────────────────

export class MultiModelOrchestrator {
  private aiCallFn: ((modelKey: string, systemPrompt: string, userPrompt: string, temperature?: number) => Promise<string>) | null = null;
  private availableModels: Set<string> = new Set();

  constructor() {
    // 默认所有模型可用
    Object.keys(ALL_MODELS).forEach(k => this.availableModels.add(k));
  }

  /** 注入 AI 调用函数 */
  setAICallFunction(fn: (modelKey: string, systemPrompt: string, userPrompt: string, temperature?: number) => Promise<string>) {
    this.aiCallFn = fn;
  }

  /** 设置可用模型 */
  setAvailableModels(keys: string[]) {
    this.availableModels = new Set(keys);
  }

  // =========== Ensemble 模式 ===========

  /**
   * 多模型 Ensemble 执行
   * 并行调用 2-3 个模型，用评判模型选最佳结果
   */
  async executeEnsemble(config: EnsembleConfig, userInput: string): Promise<EnsembleResult> {
    const startTime = Date.now();
    const candidateCount = Math.min(config.candidateCount, 3);

    // 1. 选择候选模型
    const candidates = getTopKModelsForTask(
      config.capability,
      this.availableModels,
      candidateCount,
      config.requireDifferentProviders,
    );

    if (candidates.length === 0) {
      throw new Error(`No available models for capability: ${config.capability}`);
    }

    // 2. 并行调用所有候选模型
    const candidateResults = await Promise.all(
      candidates.map(model => this.callModel(model, config.systemPrompt, userInput)),
    );

    // 如果只有一个候选或 AI 调用函数不可用，直接返回第一个
    if (candidates.length === 1 || !this.aiCallFn) {
      const winner = candidateResults.find(r => r.success) || candidateResults[0];
      return {
        winner,
        allCandidates: candidateResults,
        totalDuration: Date.now() - startTime,
        multiProvider: new Set(candidates.map(c => c.provider)).size > 1,
      };
    }

    // 3. 评判：选择最佳结果
    const judgeResult = await this.judgeBestResult(
      candidateResults,
      config,
      userInput,
    );

    return {
      ...judgeResult,
      totalDuration: Date.now() - startTime,
      multiProvider: new Set(candidates.map(c => c.provider)).size > 1,
    };
  }

  /** 调用单个模型 */
  private async callModel(
    model: ModelDefinition,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<ModelCallResult> {
    const startTime = Date.now();
    const temp = (model.recommendedTemp.min + model.recommendedTemp.max) / 2;

    try {
      if (!this.aiCallFn) {
        return {
          modelKey: model.key, modelName: model.name, provider: model.provider,
          output: `[${model.name}] 模板降级响应\n\n基于您的需求，${model.bestFor[0] || '生成内容'}。\n\n配置 API Key 后即可使用真实 AI 生成，享受多模型 Ensemble 带来的质量提升。`,
          duration: 0, success: true,
        };
      }

      const output = await this.aiCallFn(model.key, systemPrompt, userPrompt, temp);

      return {
        modelKey: model.key,
        modelName: model.name,
        provider: model.provider,
        output,
        duration: Date.now() - startTime,
        success: true,
      };
    } catch (err: any) {
      return {
        modelKey: model.key, modelName: model.name, provider: model.provider,
        output: '', duration: Date.now() - startTime, success: false,
        error: err?.message || '调用失败',
      };
    }
  }

  /** 评判最佳结果 */
  private async judgeBestResult(
    candidates: ModelCallResult[],
    config: EnsembleConfig,
    userInput: string,
  ): Promise<{ winner: ModelCallResult; allCandidates: ModelCallResult[]; judgeReasoning?: string; qualityScores?: Record<string, number> }> {
    const succeeded = candidates.filter(c => c.success);
    if (succeeded.length === 0) {
      return { winner: candidates[0], allCandidates: candidates };
    }
    if (succeeded.length === 1) {
      return { winner: succeeded[0], allCandidates: candidates };
    }

    // 使用评判模型
    const judgeKey = config.judgeModelKey || getBestModelForTask('reasoning', this.availableModels)?.key || 'deepseek-v4-pro-tc';
    const judgeModel = getModel(judgeKey);

    const judgePrompt = config.judgePrompt || this.buildDefaultJudgePrompt(config.qualityWeights);
    const candidatesText = succeeded.map((c, i) =>
      `[候选${i + 1}] 模型: ${c.modelName} (${c.provider})\n${c.output}\n`
    ).join('\n---\n');

    const fullJudgePrompt = `${judgePrompt}\n\n用户需求：${userInput}\n\n候选结果：\n${candidatesText}\n\n请给出你的评判。`;

    try {
      if (!this.aiCallFn) {
        return { winner: succeeded[0], allCandidates: candidates };
      }

      const judgeOutput = await this.aiCallFn(
        judgeKey,
        '你是一个专业的AI内容质量评判专家。你需要从多个AI模型生成的结果中选出最佳的一个。请客观公正，关注内容质量而非模型名称。',
        fullJudgePrompt,
        0.2,
      );

      // 解析评判结果，提取最佳候选编号
      const winnerIndex = this.parseJudgeOutput(judgeOutput, succeeded.length);
      const winner = succeeded[Math.min(winnerIndex, succeeded.length - 1)];

      return {
        winner,
        allCandidates: candidates,
        judgeReasoning: judgeOutput,
        qualityScores: this.extractQualityScores(judgeOutput),
      };
    } catch {
      // 评判失败，返回第一个成功的结果
      return { winner: succeeded[0], allCandidates: candidates };
    }
  }

  private buildDefaultJudgePrompt(weights?: EnsembleConfig['qualityWeights']): string {
    const w = weights || {};
    const criteria = [
      `创意性(权重${w.creativity || 25}%): 内容是否有新意、是否吸引人`,
      `相关性(权重${w.relevance || 25}%): 是否准确回应了用户需求`,
      `准确性(权重${w.accuracy || 20}%): 信息是否准确、逻辑是否严谨`,
      `流畅度(权重${w.fluency || 15}%): 表达是否自然流畅`,
      `可执行性(权重${w.actionability || 15}%): 内容是否可以直接使用`,
    ];

    return `请从以下${criteria.length}个维度评估每个候选结果，选出最佳的一个：
${criteria.join('\n')}

输出格式：
WINNER: 候选N
REASON: 简短说明选择理由
SCORES: [候选1: X分, 候选2: Y分, ...]`;
  }

  private parseJudgeOutput(output: string, candidateCount: number): number {
    const match = output.match(/WINNER:\s*候选(\d+)/i) || output.match(/WINNER:\s*(\d+)/i);
    if (match) {
      return parseInt(match[1]) - 1;
    }
    // 找第一个出现的 "候选N" 模式
    const altMatch = output.match(/候选(\d+)/);
    if (altMatch) {
      return parseInt(altMatch[1]) - 1;
    }
    return 0;
  }

  private extractQualityScores(output: string): Record<string, number> | undefined {
    const scoresMatch = output.match(/SCORES:\s*\[(.+)\]/);
    if (!scoresMatch) return undefined;
    const scores: Record<string, number> = {};
    const parts = scoresMatch[1].split(',');
    parts.forEach((p, i) => {
      const numMatch = p.match(/(\d+)\s*分/);
      if (numMatch) {
        scores[`候选${i + 1}`] = parseInt(numMatch[1]);
      }
    });
    return Object.keys(scores).length > 0 ? scores : undefined;
  }

  // =========== Pipeline 模式 ===========

  /**
   * 多步骤流水线执行
   * 每个步骤使用最适合的模型
   */
  async executePipeline(config: PipelineConfig, userInput: string): Promise<PipelineResult> {
    const startTime = Date.now();
    const stageResults: PipelineResult['stages'] = [];
    let lastOutput = userInput;

    // 分组：可并行的 stage 放一起
    let i = 0;
    while (i < config.stages.length) {
      const parallelGroup: PipelineStage[] = [config.stages[i]];
      // 收集连续的 parallelWithPrevious stage
      while (
        i + 1 < config.stages.length &&
        config.stages[i + 1].parallelWithPrevious
      ) {
        i++;
        parallelGroup.push(config.stages[i]);
      }

      // 并行执行
      const groupResults = await Promise.all(
        parallelGroup.map(async (stage) => {
          const stageStart = Date.now();
          try {
            const bestModel = getBestModelForTask(stage.capability, this.availableModels);
            if (!bestModel) throw new Error(`No model for: ${stage.capability}`);

            const input = stage.dependsOn
              ? stageResults.find(s => s.stageId === stage.dependsOn)?.output || userInput
              : lastOutput;

            const result = await this.callModel(bestModel, stage.systemPrompt, input);

            return {
              stageId: stage.id,
              success: result.success,
              output: result.output,
              modelKey: result.modelKey,
              modelName: result.modelName,
              duration: Date.now() - stageStart,
              error: result.error,
            };
          } catch (err: any) {
            return {
              stageId: stage.id,
              success: false,
              output: '',
              modelKey: 'unknown',
              modelName: '未知',
              duration: Date.now() - stageStart,
              error: err?.message || '执行失败',
            };
          }
        }),
      );

      stageResults.push(...groupResults);

      // 更新 lastOutput 为最后一个成功的结果
      const lastSuccess = [...groupResults].reverse().find(r => r.success);
      if (lastSuccess) lastOutput = lastSuccess.output;

      i++;
    }

    // 合成最终输出
    let finalOutput: string;
    if (config.synthesisPrompt && this.aiCallFn) {
      try {
        const synthesisModel = getBestModelForTask('professional', this.availableModels) ||
          getBestModelForTask('chat', this.availableModels);
        const synthesisInput = stageResults
          .filter(s => s.success)
          .map(s => `[${s.stageId}] (${s.modelName})\n${s.output}`)
          .join('\n\n---\n\n');
        finalOutput = await this.aiCallFn(
          synthesisModel?.key || 'qwen3.5-plus-tc',
          config.synthesisPrompt,
          synthesisInput,
          0.5,
        );
      } catch {
        finalOutput = stageResults.filter(s => s.success).map(s => s.output).join('\n\n');
      }
    } else {
      finalOutput = this.synthesizeResultsSimple(stageResults);
    }

    return {
      success: stageResults.every(r => r.success),
      totalDuration: Date.now() - startTime,
      stages: stageResults,
      finalOutput,
    };
  }

  private synthesizeResultsSimple(results: PipelineResult['stages']): string {
    const succeeded = results.filter(r => r.success);
    return succeeded.map(r => `[${r.stageId}] (${r.modelName})\n${r.output}`).join('\n\n---\n\n');
  }
}

// ─── 预定义 Ensemble 配置 ────────────────────

/** 创意文案 Ensemble (标题/广告语/营销文案) */
export const CREATIVE_ENSEMBLE: EnsembleConfig = {
  candidateCount: 3,
  capability: 'creative',
  requireDifferentProviders: true,
  judgeModelKey: 'deepseek-v4-pro-tc',
  systemPrompt: '',
  qualityWeights: { creativity: 35, relevance: 25, fluency: 20, actionability: 15, accuracy: 5 },
};

/** 专业内容 Ensemble (JD/报告/方案) */
export const PROFESSIONAL_ENSEMBLE: EnsembleConfig = {
  candidateCount: 2,
  capability: 'professional',
  requireDifferentProviders: true,
  judgeModelKey: 'deepseek-v4-pro-tc',
  systemPrompt: '',
  qualityWeights: { accuracy: 30, relevance: 25, actionability: 25, fluency: 15, creativity: 5 },
};

/** 深度推理 Ensemble (诊断/分析) */
export const REASONING_ENSEMBLE: EnsembleConfig = {
  candidateCount: 2,
  capability: 'reasoning',
  requireDifferentProviders: true,
  judgeModelKey: 'deepseek-v4-pro-tc',
  systemPrompt: '',
  qualityWeights: { accuracy: 40, relevance: 30, fluency: 15, actionability: 10, creativity: 5 },
};

// ─── 预定义 Pipeline 配置 ────────────────────

/** 爆款内容创意 Pipeline (完整版) */
export const CONTENT_CREATIVITY_PIPELINE: PipelineConfig = {
  stages: [
    {
      id: 'topic_analysis',
      description: '主题爆款潜力分析',
      capability: 'reasoning',
      systemPrompt: '你是爆款内容分析专家。分析以下主题的爆款潜力，从情绪钩子、信息差、身份标签、行动触发四个维度评估。输出结构化分析。',
    },
    {
      id: 'creative_brainstorming',
      description: '创意方向头脑风暴',
      capability: 'creative',
      systemPrompt: '你是创意策划专家。基于主题分析结果，提出3个差异化创意方向。每个方向包含：核心概念、目标受众、预期传播路径。',
      parallelWithPrevious: false,
      dependsOn: 'topic_analysis',
    },
    {
      id: 'title_generation',
      description: '爆款标题生成',
      capability: 'creative',
      systemPrompt: '你是爆款标题专家。基于创意方向，为每个方向生成5个爆款标题。使用数字、悬念、身份标签、结果导向等公式。',
      parallelWithPrevious: true,
      dependsOn: 'creative_brainstorming',
    },
    {
      id: 'content_writing',
      description: '正文内容撰写',
      capability: 'creative',
      systemPrompt: '你是内容创作专家。根据最佳标题和创意方向，撰写完整的正文内容。注意：平台特有的语言风格、互动引导、话题标签。',
      dependsOn: 'title_generation',
    },
  ],
  synthesisPrompt: '你是内容总监。请整合以下分析、创意、标题和正文，形成一份完整的"爆款内容创意蓝图"。包含：主题分析摘要、推荐创意方向及理由、最佳标题TOP3、完整正文、发布策略建议。',
};

/** 小红书内容 Pipeline (增强版) */
export const XIAOHONGSHU_ENHANCED_PIPELINE: PipelineConfig = {
  stages: [
    {
      id: 'audience_analysis',
      description: '目标受众分析',
      capability: 'reasoning',
      systemPrompt: '你是小红书用户研究员。根据主题分析目标受众画像、阅读偏好、决策心理。输出JSON格式。',
    },
    {
      id: 'outline',
      description: '内容大纲规划',
      capability: 'long_text',
      systemPrompt: '你是小红书内容策划专家。根据受众分析，生成完整的内容大纲：目标受众、核心卖点、内容结构、情感基调。',
      parallelWithPrevious: true,
      dependsOn: 'audience_analysis',
    },
    {
      id: 'title',
      description: '爆款标题生成',
      capability: 'creative',
      systemPrompt: '你是小红书爆款标题专家。生成10个吸引点击的标题，包含emoji、数字、疑问句等元素。',
      parallelWithPrevious: true,
      dependsOn: 'audience_analysis',
    },
    {
      id: 'body',
      description: '正文内容撰写',
      capability: 'creative',
      systemPrompt: '你是小红书内容创作专家。撰写完整正文。口语化、有互动感、分段清晰、包含emoji和话题标签。',
      dependsOn: 'outline',
    },
  ],
};

/** 诊断分析 Pipeline (增强版) */
export const DIAGNOSIS_ENHANCED_PIPELINE: PipelineConfig = {
  stages: [
    {
      id: 'data_analysis',
      description: '数据分析与归纳',
      capability: 'reasoning',
      systemPrompt: '你是数据分析师。根据提供的业务数据，进行定量分析。识别趋势、异常和关键指标。',
    },
    {
      id: 'swot_analysis',
      description: 'SWOT分析',
      capability: 'reasoning',
      systemPrompt: '你是战略顾问。基于数据分析结果，进行SWOT分析。深入分析优势、劣势、机会、威胁。',
      parallelWithPrevious: true,
      dependsOn: 'data_analysis',
    },
    {
      id: 'recommendation',
      description: '策略建议',
      capability: 'professional',
      systemPrompt: '你是管理顾问。综合以上分析，提出具体可执行的策略建议。包含短期和长期行动计划。',
      dependsOn: 'swot_analysis',
    },
  ],
};

// ─── 导出单例 ────────────────────────────────
export const multiModelOrchestrator = new MultiModelOrchestrator();

// ─── 快捷函数 ────────────────────────────────

/**
 * 为指定内容类型获取最佳协作策略
 */
export function getBestStrategy(contentType: string): 'ensemble' | 'pipeline' | 'single' {
  const ensembleTypes = ['title', 'creative', 'marketing', 'ad', 'headline', 'slogan'];
  const pipelineTypes = ['xiaohongshu', 'video', 'ecommerce', 'diagnosis', 'report', 'content_creativity'];
  const singleTypes = ['chat', 'image', 'vision', 'tts', 'translate'];

  if (pipelineTypes.some(t => contentType.includes(t))) return 'pipeline';
  if (ensembleTypes.some(t => contentType.includes(t))) return 'ensemble';
  return 'single';
}

/**
 * 智能选择最佳执行模式
 * 根据内容类型和复杂度自动决定用 Ensemble / Pipeline / 单模型
 */
export async function smartExecute(
  contentType: string,
  userInput: string,
  systemPrompt?: string,
): Promise<{ output: string; strategy: string; details?: any }> {
  const strategy = getBestStrategy(contentType);

  if (strategy === 'ensemble') {
    const config: EnsembleConfig = {
      ...CREATIVE_ENSEMBLE,
      systemPrompt: systemPrompt || '你是一个专业的内容创作助手，请根据用户需求生成高质量内容。',
    };
    const result = await multiModelOrchestrator.executeEnsemble(config, userInput);
    return {
      output: result.winner.output,
      strategy: `Ensemble (${result.allCandidates.length}模型竞争，优胜: ${result.winner.modelName})`,
      details: { allCandidates: result.allCandidates, judgeReasoning: result.judgeReasoning },
    };
  }

  if (strategy === 'pipeline') {
    // 根据内容类型选择 pipeline
    let pipelineConfig: PipelineConfig;
    if (contentType.includes('xiaohongshu')) {
      pipelineConfig = XIAOHONGSHU_ENHANCED_PIPELINE;
    } else if (contentType.includes('diagnosis')) {
      pipelineConfig = DIAGNOSIS_ENHANCED_PIPELINE;
    } else if (contentType.includes('content_creativity') || contentType.includes('creativity')) {
      pipelineConfig = CONTENT_CREATIVITY_PIPELINE;
    } else {
      // 默认使用电商详情页 pipeline
      pipelineConfig = {
        stages: [
          { id: 'analysis', description: '需求分析', capability: 'reasoning', systemPrompt: systemPrompt || '分析用户需求并制定内容策略。' },
          { id: 'generation', description: '内容生成', capability: 'creative', systemPrompt: '基于分析结果，生成完整内容。', dependsOn: 'analysis' },
        ],
      };
    }
    const result = await multiModelOrchestrator.executePipeline(pipelineConfig, userInput);
    return {
      output: result.finalOutput,
      strategy: `Pipeline (${result.stages.length}阶段, 使用${new Set(result.stages.map(s => s.modelName)).size}个模型)`,
      details: result,
    };
  }

  // 单模型
  const capability = contentType.includes('image') ? 'image' as ModelCapability
    : contentType.includes('video_gen') ? 'video' as ModelCapability
    : contentType.includes('vision') ? 'vision' as ModelCapability
    : contentType.includes('tts') || contentType.includes('audio') ? 'audio_tts' as ModelCapability
    : 'chat' as ModelCapability;

  const bestModel = getBestModelForTask(capability, multiModelOrchestrator['availableModels']);
  return {
    output: '',
    strategy: `Single (${bestModel?.name || 'auto'})`,
    details: { bestModel },
  };
}
