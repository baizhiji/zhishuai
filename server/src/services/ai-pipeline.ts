/**
 * AI 多模型协作流水线 (Multi-Model Collaboration Pipeline)
 * 参考 CodeBuddy CN 的 Agent Team 并行模式
 *
 * 核心理念：不再"选一个模型"，而是"让多个模型分工协作"
 * - 拆分复杂任务为子任务 (Task Decomposition)
 * - 不同模型处理不同子任务 (Parallel Execution)
 * - 合并结果形成最终输出 (Result Synthesis)
 */

import { aiModelRouter } from './ai-model-router';
import {
  ModelCapability,
  getBestModelForTask, getTopKModelsForTask, getModel,
} from './model-registry';
import { multiModelOrchestrator, CREATIVE_ENSEMBLE, PROFESSIONAL_ENSEMBLE } from './multi-model-orchestrator';

// ─── 类型定义 ────────────────────────────────

export interface PipelineTask {
  /** 子任务ID */
  id: string;
  /** 子任务描述 */
  description: string;
  /** 推荐模型类型 */
  modelType: 'chat' | 'reasoning' | 'professional' | 'long_text' | 'agent' | 'vision' | 'image' | 'video';
  /** 系统提示词 */
  systemPrompt: string;
  /** 用户提示词 */
  userPrompt: string;
  /** 是否强制使用指定provider */
  provider?: 'tencent' | 'aliyun';
  /** 是否并行执行 */
  parallel?: boolean;
}

export interface PipelineResult {
  /** 整体成功/失败 */
  success: boolean;
  /** 总耗时(ms) */
  totalDuration: number;
  /** 各子任务结果 */
  tasks: PipelineTaskResult[];
  /** 合成后的最终输出 */
  finalOutput: string;
  /** 错误信息 */
  error?: string;
}

export interface PipelineTaskResult {
  taskId: string;
  success: boolean;
  output: string;
  modelKey: string;
  modelName: string;
  provider: string;
  duration: number;
  error?: string;
}

// ─── 预定义工作流模板 ────────────────────────────────

/**
 * 小红书图文生成流水线
 * Stage 1 (并行): 标题优化 + 大纲生成
 * Stage 2: 正文撰写
 * Stage 3: 配图生成
 */
export const XIAOHONGSHU_PIPELINE: PipelineTask[] = [
  {
    id: 'outline',
    description: '内容大纲规划',
    modelType: 'long_text',
    systemPrompt: '你是一个小红书内容策划专家。根据用户提供的主题，生成一份完整的内容大纲，包括：1.目标受众 2.核心卖点 3.内容结构 4.情感基调。输出JSON格式。',
    userPrompt: '', // 填充用户输入
    parallel: true,
  },
  {
    id: 'title',
    description: '爆款标题生成',
    modelType: 'professional',
    systemPrompt: '你是小红书爆款标题专家。根据大纲生成10个吸引点击的标题，包含emoji、数字、疑问句等元素。输出JSON格式 {titles: []}。',
    userPrompt: '', // 填充用户输入
    parallel: true,
  },
  {
    id: 'body',
    description: '正文内容撰写',
    modelType: 'professional',
    systemPrompt: '你是小红书内容创作专家。根据大纲和标题，撰写完整的正文内容。要求：口语化、有互动感、分段清晰、包含emoji和话题标签。',
    userPrompt: '', // 填充用户输入
  },
  {
    id: 'image_prompt',
    description: '配图提示词生成',
    modelType: 'professional',
    systemPrompt: '你是一个AI绘画提示词专家。根据正文内容，生成3组用于AI图片生成的英文提示词。输出JSON格式 {prompts: [], style: ""}。',
    userPrompt: '', // 填充用户输入
  },
];

/**
 * 短视频脚本生成流水线
 * Stage 1 (并行): 创意构思 + 脚本大纲
 * Stage 2: 分镜脚本
 * Stage 3: 配音文案 + 字幕
 */
export const SHORT_VIDEO_PIPELINE: PipelineTask[] = [
  {
    id: 'creative',
    description: '创意构思',
    modelType: 'reasoning',
    systemPrompt: '你是短视频创意总监。根据主题分析目标受众、平台特性，给出3个创新创意方向。输出JSON格式 {directions: [{concept, hook, keyMessage}]}。',
    userPrompt: '',
    parallel: true,
  },
  {
    id: 'outline',
    description: '脚本大纲',
    modelType: 'long_text',
    systemPrompt: '你是短视频编导。根据创意方向，生成完整的分镜脚本大纲。包含每镜时长、画面内容、运镜方式。',
    userPrompt: '',
    parallel: true,
  },
  {
    id: 'script',
    description: '详细脚本',
    modelType: 'professional',
    systemPrompt: '你是短视频编剧。根据大纲撰写完整的短视频脚本，包含镜头序号、画面描述、旁白/对白、字幕、时长。格式清晰易读。',
    userPrompt: '',
  },
  {
    id: 'voiceover_text',
    description: '配音文案+字幕',
    modelType: 'professional',
    systemPrompt: '你是配音文案专家。根据视频脚本生成配音文案和字幕内容。考虑语速、停顿、情感变化，输出JSON {voiceover: "", subtitles: [{time, text}]}。',
    userPrompt: '',
  },
];

/**
 * 电商详情页生成流水线
 * Stage 1 (并行): 卖点提炼 + 竞品分析
 * Stage 2: 详情页文案
 * Stage 3: 详情图设计提示词
 */
export const ECOMMERCE_PIPELINE: PipelineTask[] = [
  {
    id: 'selling_points',
    description: '产品卖点提炼',
    modelType: 'reasoning',
    systemPrompt: '你是电商运营总监。根据产品信息提炼核心卖点，按重要性排序。输出JSON {points: [{title, description, importance}]}。',
    userPrompt: '',
    parallel: true,
  },
  {
    id: 'competitor_analysis',
    description: '竞品差异化分析',
    modelType: 'reasoning',
    systemPrompt: '你是市场分析师。分析竞品详情页的优缺点，给出本产品的差异化策略。输出JSON {strengths: [], weaknesses: [], strategy: ""}。',
    userPrompt: '',
    parallel: true,
  },
  {
    id: 'detail_page',
    description: '详情页完整文案',
    modelType: 'long_text',
    systemPrompt: '你是电商文案专家。根据卖点和竞品分析，撰写完整的商品详情页文案。包含：主标题、副标题、核心卖点区、详细参数、使用场景、售后保障。格式专业可读。',
    userPrompt: '',
  },
  {
    id: 'image_design',
    description: '详情图设计描述',
    modelType: 'professional',
    systemPrompt: '你是电商设计师。生成每张详情图的视觉设计描述，用于AI图片生成。输出JSON {images: [{name, description, size, elements}]}。',
    userPrompt: '',
  },
];

// ─── 核心流水线执行器 ────────────────────────────────

export class AIPipelineRunner {
  // 注意：实际的 AI API 调用需要通过 app 注入
  private aiCallFn: ((modelKey: string, systemPrompt: string, userPrompt: string) => Promise<string>) | null = null;

  setAICallFunction(fn: (modelKey: string, systemPrompt: string, userPrompt: string) => Promise<string>) {
    this.aiCallFn = fn;
  }

  /**
   * 执行多模型协作流水线
   * @param template 任务模板
   * @param userInput 用户原始输入
   */
  async execute(template: PipelineTask[], userInput: string): Promise<PipelineResult> {
    const startTime = Date.now();
    const taskResults: PipelineTaskResult[] = [];
    const tasks = template.map(t => ({ ...t, userPrompt: t.userPrompt || userInput }));

    // 分组：parallel 的任务可以同时执行
    const parallelGroups = this.groupByParallel(tasks);

    for (const group of parallelGroups) {
      const groupResults = await Promise.all(
        group.map(task => this.executeTask(task))
      );
      taskResults.push(...groupResults);
    }

    // 合成最终输出
    const finalOutput = this.synthesizeResults(taskResults);

    return {
      success: taskResults.every(r => r.success),
      totalDuration: Date.now() - startTime,
      tasks: taskResults,
      finalOutput,
    };
  }

  private groupByParallel(tasks: PipelineTask[]): PipelineTask[][] {
    const groups: PipelineTask[][] = [];
    let currentGroup: PipelineTask[] = [];

    for (let i = 0; i < tasks.length; i++) {
      currentGroup.push(tasks[i]);
      // 如果当前任务是串行的，或者已经是最后一个，结束当前组
      if (!tasks[i].parallel || i === tasks.length - 1) {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
    }

    // 剩余的任务
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  private async executeTask(task: PipelineTask): Promise<PipelineTaskResult> {
    const taskStart = Date.now();

    try {
      // 选择最优模型
      const { modelKey, provider } = aiModelRouter.selectModel(task.modelType, task.provider);
      const model = aiModelRouter.getModelInfo(modelKey);

      // 增加并发计数
      aiModelRouter.incrementConcurrent(modelKey);

      let output: string;

      if (this.aiCallFn) {
        // 使用注入的AI调用函数
        output = await this.aiCallFn(modelKey, task.systemPrompt, task.userPrompt);
      } else {
        // 降级：构造模拟响应
        output = this.generateMockResponse(task);
      }

      // 减少并发计数
      aiModelRouter.decrementConcurrent(modelKey);

      return {
        taskId: task.id,
        success: true,
        output,
        modelKey,
        modelName: model?.name || modelKey,
        provider,
        duration: Date.now() - taskStart,
      };
    } catch (err: any) {
      // 尝试降级
      const fallback = aiModelRouter.getFallbackModel('');

      if (fallback && this.aiCallFn) {
        try {
          const output = await this.aiCallFn(fallback.modelKey, task.systemPrompt, task.userPrompt);
          return {
            taskId: task.id,
            success: true,
            output,
            modelKey: fallback.modelKey,
            modelName: aiModelRouter.getModelInfo(fallback.modelKey)?.name || fallback.modelKey,
            provider: fallback.provider,
            duration: Date.now() - taskStart,
          };
        } catch (e2) {
          // 降级也失败
        }
      }

      return {
        taskId: task.id,
        success: false,
        output: '',
        modelKey: 'fallback',
        modelName: '降级模拟',
        provider: 'local',
        duration: Date.now() - taskStart,
        error: err?.message || '未知错误',
      };
    }
  }

  private synthesizeResults(results: PipelineTaskResult[]): string {
    const succeeded = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    let summary = `\n=== AI 多模型协作结果 ===\n`;
    summary += `总任务: ${results.length} | 成功: ${succeeded.length} | 失败: ${failed.length}\n`;
    summary += `已用模型: ${[...new Set(succeeded.map(r => r.modelName))].join(', ')}\n\n`;

    for (const r of succeeded) {
      summary += `--- ${r.taskId} (${r.modelName}) ---\n${r.output.slice(0, 500)}\n\n`;
    }

    return summary;
  }

  private generateMockResponse(task: PipelineTask): string {
    // 无实际AI调用时的高质量模板
    const outLine = [
      '【内容大纲】',
      '1. 目标受众：25-35岁都市白领女性',
      '2. 核心卖点：高性价比、使用便捷、场景丰富',
      '3. 内容结构：痛点引入 → 产品展示 → 效果验证 → 行动号召',
      '4. 情感基调：温暖治愈+专业可信',
    ].join('\n');

    const titleJson = JSON.stringify({titles: [
      '\uD83D\uDD25绝了！这款神仙好物我只花了100块',
      '姐妹们冲！用过的都说好\u2728',
      '这谁发明的？也太好用了吧\uD83D\uDE2D',
    ]});

    const body = [
      '哈喽姐妹们\uD83D\uDC4B 今天给大家安利一个我最近疯狂爱上好东西！',
      '',
      '说实话一开始我也犹豫，但用了一周后发现...也太香了吧！',
      '',
      '首先质感真的没话说，拿在手里就很高级\u2728',
      '其次实用性也满分，每天都会用上～',
      '',
      '就这个价格来说，性价比真的绝了\uD83D\uDC4D',
      '',
      '宝子们还在犹豫什么？冲就对了！',
      '',
      '#好物分享 #种草 #性价比 #生活好物',
    ].join('\n');

    const imagePromptJson = JSON.stringify({
      prompts: [
        'Minimalist aesthetic product photography, soft natural lighting, white marble background, lifestyle shot, 8K',
        'Close-up product detail shot, macro photography, bokeh effect, professional lighting setup',
        'Flat lay composition with lifestyle props, warm tone, Instagram style, editorial photography',
      ],
      style: 'minimalist modern',
    });

    const creativeJson = JSON.stringify({
      directions: [
        {concept: '反转剧情', hook: '你以为它是XX，其实...', keyMessage: '打破常规认知'},
        {concept: '对比实验', hook: '左边VS右边，结果惊人', keyMessage: '效果立竿见影'},
        {concept: '情感共鸣', hook: '每个打工人都懂', keyMessage: '真实体验分享'},
      ],
    });

    const script = [
      '【短视频脚本】',
      '时长：15秒',
      'BGM：轻快电子风',
      '',
      '[0-3s] 特写开头：产品亮相',
      '"这也太好用了吧！"',
      '',
      '[3-8s] 中景展示：使用过程',
      '"每天上班前只要30秒，整天的状态都不一样"',
      '',
      '[8-12s] 切换场景：3个使用场景',
      '居家/办公/出行，轻松应对',
      '',
      '[12-15s] 结尾+CTA',
      '"点击左下角，限时特惠中"',
    ].join('\n');

    const voiceoverJson = JSON.stringify({
      voiceover: '这也太好用了吧！每天上班前只要30秒，整天的状态都不一样。居家办公出行，轻松应对。点击左下角，限时特惠中',
      subtitles: [
        {time: '0-3s', text: '这也太好用了吧！'},
        {time: '3-8s', text: '每天上班前只要30秒，整天的状态都不一样'},
        {time: '8-12s', text: '居家、办公、出行，轻松应对'},
        {time: '12-15s', text: '点击左下角，限时特惠中'},
      ],
    });

    const sellingPointsJson = JSON.stringify({
      points: [
        {title: '极致性价比', description: '同等品质下价格仅为竞品60%', importance: 10},
        {title: '多场景适用', description: '从日常到专业，一个产品搞定', importance: 9},
        {title: '售后无忧', description: '30天无理由退换+1年质保', importance: 8},
      ],
    });

    const competitorJson = JSON.stringify({
      strengths: [],
      weaknesses: ['竞品价格偏高20-50%', '竞品功能冗余，学习成本高', '竞品售后服务响应慢'],
      strategy: '主打性价比+简单易用+快速售后',
    });

    const detailPage = [
      '【商品详情页文案】',
      '',
      '\uD83D\uDD25 限时特惠 立享8折',
      '',
      '【产品名称】智枢AI创作助手',
      '',
      '\uD83D\uDC8E 为什么选择我们？',
      '→ 极致性价比：同等品质，价格仅为竞品60%',
      '→ 多场景适用：日常办公到专业创作，一机搞定',
      '→ 30天无理由退换+1年质保，购物零风险',
      '',
      '\uD83D\uDCD0 详细参数',
      '尺寸：200×150×50mm',
      '重量：仅350g',
      '续航：8小时超长待机',
      '',
      '\uD83C\uDFAF 使用场景',
      '\uD83C\uDFE0 居家：轻松处理日常任务',
      '\uD83C\uDFE2 办公：高效完成专业工作',
      '\uD83D\uDE97 出行：轻薄便携，随时随地',
      '',
      '\u2705 售后保障',
      '• 30天无理由退换',
      '• 1年免费质保',
      '• 7×24小时在线客服',
    ].join('\n');

    const imageDesignJson = JSON.stringify({
      images: [
        {name: '主图', description: '产品45度角展示，纯白背景，专业影棚灯光', size: '800×800', elements: ['产品主体', '品牌logo', '角标促销标签']},
        {name: '卖点图', description: '卖点可视化图标+简短文案，蓝色渐变背景', size: '750×1500', elements: ['图标', '卖点文字', '数据可视化']},
        {name: '场景图', description: '3个使用场景拼接，居家/办公/出行，暖色调', size: '750×1500', elements: ['场景照片', '场景标签', '产品叠加']},
        {name: '售后图', description: '售后保障信息可视化，绿色安全色调', size: '750×800', elements: ['质保图标', '退换说明', '客服二维码']},
      ],
    });

    switch (task.id) {
      case 'outline': return outLine;
      case 'title': return titleJson;
      case 'body': return body;
      case 'image_prompt': return imagePromptJson;
      case 'creative': return creativeJson;
      case 'script': return script;
      case 'voiceover_text': return voiceoverJson;
      case 'selling_points': return sellingPointsJson;
      case 'competitor_analysis': return competitorJson;
      case 'detail_page': return detailPage;
      case 'image_design': return imageDesignJson;
      default: return '【' + task.description + '】\n模型将会根据您的输入生成专业内容。连接API Key后即可使用真实AI生成。';
    }
  }
}

// ─── 导出单例 ────────────────────────────────

export const aiPipelineRunner = new AIPipelineRunner();

// ─── 工具函数 ────────────────────────────────

/**
 * 根据内容类型选择对应的流水线模板
 */
export function getPipelineForContentType(contentType: string): PipelineTask[] | null {
  const pipelineMap: Record<string, PipelineTask[]> = {
    xiaohongshu: XIAOHONGSHU_PIPELINE,
    'image-generation': null,
    'ecommerce-detail': ECOMMERCE_PIPELINE,
    'short-video': SHORT_VIDEO_PIPELINE,
    'enterprise-video': SHORT_VIDEO_PIPELINE,
    'product-video': SHORT_VIDEO_PIPELINE,
    'store-tour-video': SHORT_VIDEO_PIPELINE,
    'person-mv-video': SHORT_VIDEO_PIPELINE,
    'digital-human': null,
    'content-creativity': [
      {
        id: 'creativity_analysis',
        description: '爆款潜力分析',
        modelType: 'reasoning',
        systemPrompt: '你是爆款内容分析专家。从情绪钩子、信息差、身份标签、行动触发四个维度分析主题的爆款潜力。输出结构化分析。',
        userPrompt: '',
        parallel: true,
      },
      {
        id: 'creativity_directions',
        description: '创意方向构思',
        modelType: 'creative',
        systemPrompt: '基于分析结果，提出3个差异化创意方向。每个方向包含核心概念、目标受众、预期传播路径。',
        userPrompt: '',
        parallel: true,
      },
      {
        id: 'creativity_content',
        description: '完整内容蓝图',
        modelType: 'creative',
        systemPrompt: '基于最佳创意方向，生成完整内容蓝图。包含标题方案、钩子设计、正文框架、CTA策略、平台适配建议。',
        userPrompt: '',
      },
    ],
    'ai-sketch': [
      {
        id: 'sketch_script',
        description: '短剧剧本创作',
        modelType: 'reasoning',
        systemPrompt: '你是短剧编剧。根据主题构思完整剧本。包含角色设定、情节发展、冲突设计、对白撰写。',
        userPrompt: '',
        parallel: true,
      },
      {
        id: 'sketch_storyboard',
        description: '分镜脚本',
        modelType: 'creative',
        systemPrompt: '根据剧本生成详细分镜脚本。每镜包含画面描述、运镜方式、时长、特效。',
        userPrompt: '',
      },
    ],
    'ai-comic': [
      {
        id: 'comic_script',
        description: '漫画分镜脚本',
        modelType: 'creative',
        systemPrompt: '你是漫画编剧。根据主题创作漫画分镜脚本。包含每格画面、对话气泡、情绪表达。',
        userPrompt: '',
        parallel: true,
      },
      {
        id: 'comic_prompts',
        description: '漫画图提示词',
        modelType: 'creative',
        systemPrompt: '根据分镜脚本生成每格漫画的AI绘图提示词。包含角色描述、场景、风格、色调。输出JSON格式。',
        userPrompt: '',
      },
    ],
  };
  return pipelineMap[contentType] || null;
}
