/**
 * AI 智能体工作流引擎
 * 智枢 AI SaaS 系统 - 后端
 *
 * 功能：
 * 1. 多步骤任务分解与执行
 * 2. 多模型流水线协作
 * 3. Chain of Thought 推理
 * 4. 任务状态追踪
 */

import { PrismaClient } from '@prisma/client';
import { chatCompletion } from './ai-service';

const prisma = new PrismaClient();

// ==================== 工作流定义 ====================

export interface WorkflowStep {
  step: string;
  model: string;
  task: string;
  prompt?: string;
  dependsOn?: string[];
  outputKey?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

// 预定义工作流
export const WORKFLOWS: Record<string, Workflow> = {
  // 自媒体内容生产工作流
  content_production: {
    id: 'content_production',
    name: '自媒体内容生产',
    description: '从热点研究到内容发布的完整流程',
    steps: [
      { step: 'topic_research', model: 'hunyuan-flash', task: '搜索热点话题', outputKey: 'hot_topics' },
      { step: 'outline_create', model: 'dashscope:qwen-plus', task: '创建内容大纲', outputKey: 'outline', dependsOn: ['topic_research'] },
      { step: 'content_write', model: 'dashscope:qwen-max', task: '撰写完整内容', outputKey: 'content', dependsOn: ['outline_create'] },
      { step: 'title_generate', model: 'dashscope:qwen-max', task: '生成吸引标题', outputKey: 'titles', dependsOn: ['content_write'] },
      { step: 'hashtag_select', model: 'hunyuan-flash', task: '选择合适标签', outputKey: 'hashtags', dependsOn: ['content_write'] },
      { step: 'quality_check', model: 'hunyuan-flash', task: '质量检查', outputKey: 'quality_report', dependsOn: ['content_write', 'title_generate'] }
    ]
  },

  // 招聘全流程工作流
  recruitment: {
    id: 'recruitment',
    name: '招聘全流程',
    description: '从JD生成到面试准备',
    steps: [
      { step: 'jd_generate', model: 'dashscope:qwen-max', task: '生成招聘JD', outputKey: 'job_description' },
      { step: 'jd_optimize', model: 'dashscope:qwen-plus', task: '优化JD吸引力', outputKey: 'optimized_jd', dependsOn: ['jd_generate'] },
      { step: 'resume_screen', model: 'dashscope:qwen-plus', task: '筛选简历', outputKey: 'screened_resumes', dependsOn: [] },
      { step: 'outreach_compose', model: 'dashscope:qwen-plus', task: '撰写沟通话术', outputKey: 'outreach_messages', dependsOn: ['resume_screen'] },
      { step: 'interview_questions', model: 'dashscope:qwen-max', task: '生成面试问题', outputKey: 'interview_questions', dependsOn: ['resume_screen'] },
      { step: 'interview_guide', model: 'dashscope:qwen-plus', task: '生成面试指南', outputKey: 'interview_guide', dependsOn: ['interview_questions'] }
    ]
  },

  // 高质量标题生成流水线
  title_generation: {
    id: 'title_generation',
    name: '高质量标题生成',
    description: '多模型协作生成最佳标题',
    steps: [
      { step: 'generate_candidates', model: 'dashscope:qwen-max', task: '批量生成标题候选', outputKey: 'candidates' },
      { step: 'score_titles', model: 'hunyuan-flash', task: '质量评分排序', outputKey: 'scored_titles', dependsOn: ['generate_candidates'] },
      { step: 'final_selection', model: 'dashscope:qwen-plus', task: '最终精选', outputKey: 'final_titles', dependsOn: ['score_titles'] }
    ]
  },

  // 数字人视频生产工作流
  digital_human_video: {
    id: 'digital_human_video',
    name: '数字人视频生产',
    description: '从脚本到视频的完整流程',
    steps: [
      { step: 'topic_analysis', model: 'hunyuan-flash', task: '分析主题方向', outputKey: 'topic_analysis' },
      { step: 'script_write', model: 'dashscope:qwen-max', task: '生成口播脚本', outputKey: 'script', dependsOn: ['topic_analysis'] },
      { step: 'script_optimize', model: 'dashscope:qwen-plus', task: '优化脚本节奏', outputKey: 'optimized_script', dependsOn: ['script_write'] },
      { step: 'hashtag_generate', model: 'hunyuan-flash', task: '生成话题标签', outputKey: 'hashtags', dependsOn: ['script_optimize'] },
      { step: 'description_generate', model: 'dashscope:qwen-plus', task: '生成视频描述', outputKey: 'description', dependsOn: ['script_optimize'] }
    ]
  },

  // 获客话术优化工作流
  outreach_optimization: {
    id: 'outreach_optimization',
    name: '获客话术优化',
    description: '生成高效引流话术',
    steps: [
      { step: 'customer_profile', model: 'dashscope:qwen-plus', task: '分析客户画像', outputKey: 'profile' },
      { step: 'pain_points', model: 'dashscope:qwen-plus', task: '提炼痛点需求', outputKey: 'pain_points', dependsOn: ['customer_profile'] },
      { step: 'message_draft', model: 'dashscope:qwen-max', task: '撰写话术初稿', outputKey: 'draft', dependsOn: ['pain_points'] },
      { step: 'message_optimize', model: 'dashscope:qwen-plus', task: '优化话术防封', outputKey: 'optimized_message', dependsOn: ['message_draft'] },
      { step: 'cta_design', model: 'hunyuan-flash', task: '设计行动号召', outputKey: 'cta', dependsOn: ['message_optimize'] }
    ]
  },

  // 数据分析解读工作流
  data_analysis: {
    id: 'data_analysis',
    name: '数据分析解读',
    description: '多维度分析运营数据',
    steps: [
      { step: 'basic_metrics', model: 'hunyuan-flash', task: '基础指标计算', outputKey: 'metrics' },
      { step: 'benchmark_compare', model: 'dashscope:qwen-plus', task: '行业基准对比', outputKey: 'benchmark', dependsOn: ['basic_metrics'] },
      { step: 'problem_diagnosis', model: 'dashscope:qwen-max', task: '问题诊断', outputKey: 'diagnosis', dependsOn: ['basic_metrics', 'benchmark_compare'] },
      { step: 'recommendations', model: 'dashscope:qwen-max', task: '优化建议', outputKey: 'recommendations', dependsOn: ['problem_diagnosis'] },
      { step: 'trend_prediction', model: 'dashscope:qwen-plus', task: '趋势预测', outputKey: 'prediction', dependsOn: ['basic_metrics'] }
    ]
  }
};

// ==================== Chain of Thought 推理 ====================

export interface CotStep {
  title: string;
  content: string;
  confidence?: number;
}

export interface CotResult {
  steps: CotStep[];
  conclusion: string;
  reasoning_trace: string;
}

/**
 * Chain of Thought 推理引擎
 */
export class CoTEngine {
  /**
   * 通用推理任务
   */
  static async reason(userId: string, task: string, context: Record<string, any>): Promise<CotResult> {
    const prompt = this.buildReasoningPrompt(task, context);

    const response = await chatCompletion(userId, {
      model: 'dashscope:qwen-max',
      messages: [
        {
          role: 'system',
          content: `你是一位专业的AI推理专家。请使用Chain of Thought（思维链）方法，分步骤分析问题。

【思维链方法】
1. 首先理解问题的核心目标
2. 分解为可处理的小问题
3. 逐步推理，每个步骤都要有依据
4. 中间结果要记录
5. 最终给出有依据的结论

【输出格式】
请严格按以下JSON格式输出，不要包含其他内容：
{
  "steps": [
    {"title": "步骤1标题", "content": "步骤1的推理过程和结论", "confidence": 0.9},
    {"title": "步骤2标题", "content": "步骤2的推理过程和结论", "confidence": 0.85}
  ],
  "conclusion": "最终结论，用一句话概括",
  "reasoning_trace": "完整的推理链条，便于审计"
}`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    try {
      // 尝试解析JSON
      const content = response.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // 如果解析失败，返回文本结果
      return {
        steps: [{ title: '分析', content: content, confidence: 0.7 }],
        conclusion: content.slice(0, 200),
        reasoning_trace: content
      };
    } catch {
      return {
        steps: [{ title: '分析', content: response.choices[0]?.message?.content || '', confidence: 0.7 }],
        conclusion: '分析完成',
        reasoning_trace: response.choices[0]?.message?.content || ''
      };
    }
  }

  /**
   * 简历分析推理
   */
  static async analyzeResume(userId: string, resumeText: string, jobRequirements: string): Promise<CotResult> {
    return this.reason(userId, '简历匹配度分析', {
      resume: resumeText,
      requirements: jobRequirements,
      analysis_type: 'recruitment'
    });
  }

  /**
   * 内容质量评估推理
   */
  static async assessContent(userId: string, content: string, platform: string, purpose: string): Promise<CotResult> {
    return this.reason(userId, '内容质量评估', {
      content,
      platform,
      purpose,
      analysis_type: 'content_quality'
    });
  }

  /**
   * 客户意向判断推理
   */
  static async judgeCustomerIntent(userId: string, customerData: Record<string, any>, interactionHistory: string[]): Promise<CotResult> {
    return this.reason(userId, '客户意向判断', {
      customer: customerData,
      history: interactionHistory,
      analysis_type: 'customer_intent'
    });
  }

  private static buildReasoningPrompt(task: string, context: Record<string, any>): string {
    let prompt = `【任务】${task}\n\n【上下文信息】\n`;

    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'object') {
        prompt += `${key}:\n${JSON.stringify(value, null, 2)}\n\n`;
      } else {
        prompt += `${key}: ${value}\n\n`;
      }
    }

    prompt += `\n请使用思维链方法，逐步分析并给出结论。`;
    return prompt;
  }
}

// ==================== 工作流执行引擎 ====================

export interface WorkflowContext {
  [key: string]: any;
}

export interface WorkflowResult {
  workflowId: string;
  success: boolean;
  context: WorkflowContext;
  executionTime: number;
  stepsExecuted: number;
  errors?: string[];
}

/**
 * 工作流执行器
 */
export class WorkflowEngine {
  private workflow: Workflow;
  private context: WorkflowContext = {};
  private startTime: number = 0;
  private errors: string[] = [];

  constructor(workflow: Workflow) {
    this.workflow = workflow;
  }

  /**
   * 执行工作流
   */
  async execute(userId: string, initialContext: Record<string, any> = {}): Promise<WorkflowResult> {
    this.context = { ...initialContext };
    this.startTime = Date.now();
    this.errors = [];

    console.log(`[Workflow] Starting workflow: ${this.workflow.id}`);

    for (const step of this.workflow.steps) {
      try {
        // 检查依赖是否满足
        if (step.dependsOn && step.dependsOn.length > 0) {
          const missingDeps = step.dependsOn.filter(dep => !this.context[dep]);
          if (missingDeps.length > 0) {
            throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
          }
        }

        console.log(`[Workflow] Executing step: ${step.step}`);
        const result = await this.executeStep(userId, step);
        this.context[step.outputKey || step.step] = result;

      } catch (error: any) {
        console.error(`[Workflow] Step failed: ${step.step}`, error);
        this.errors.push(`${step.step}: ${error.message}`);
        // 根据错误类型决定是否继续
        if (this.isCriticalStep(step.step)) {
          throw error;
        }
      }
    }

    const executionTime = Date.now() - this.startTime;
    console.log(`[Workflow] Completed in ${executionTime}ms`);

    return {
      workflowId: this.workflow.id,
      success: this.errors.length === 0,
      context: this.context,
      executionTime,
      stepsExecuted: this.workflow.steps.length - this.errors.length,
      errors: this.errors.length > 0 ? this.errors : undefined
    };
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(userId: string, step: WorkflowStep): Promise<any> {
    const prompt = this.buildStepPrompt(step);
    const model = step.model.includes(':') ? step.model : `dashscope:${step.model}`;

    const response = await chatCompletion(userId, {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: step.task.includes('生成') || step.task.includes('创作') ? 0.8 : 0.5,
      max_tokens: 4000
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * 构建步骤提示词
   */
  private buildStepPrompt(step: WorkflowStep): string {
    let prompt = `【任务】${step.task}\n`;

    // 添加依赖的上下文
    if (step.dependsOn) {
      prompt += '\n【参考信息】\n';
      for (const dep of step.dependsOn) {
        if (this.context[dep]) {
          prompt += `- ${dep}: ${this.context[dep]}\n`;
        }
      }
    }

    prompt += '\n请完成任务并输出结果。';
    return prompt;
  }

  /**
   * 判断是否为关键步骤
   */
  private isCriticalStep(stepName: string): boolean {
    const criticalSteps = ['jd_generate', 'content_write', 'script_write'];
    return criticalSteps.includes(stepName);
  }
}

// ==================== 多模型流水线 ====================

/**
 * 多模型协作流水线
 */
export class MultiModelPipeline {
  /**
   * 高质量标题生成流水线
   */
  static async generateBestTitles(
    userId: string,
    topic: string,
    platform: string,
    count: number = 10
  ): Promise<{ titles: string[]; scores: number[] }> {
    // Step 1: 批量生成标题候选
    const candidatesResponse = await chatCompletion(userId, {
      model: 'dashscope:qwen-max',
      messages: [{
        role: 'user',
        content: `你是一位${platform}爆款标题专家，请为以下主题生成${count * 2}个高点击率标题。

主题：${topic}
平台：${platform}

要求：
1. 每个标题15-25字
2. 运用以下技巧：
   - 悬念式：制造好奇心
   - 数字型：具体数据
   - 冲突型：制造反差
   - 情感型：引发共鸣
3. 标题之间要有明显差异

请直接输出标题，每行一个，用编号：`
      }],
      temperature: 0.9,
      n: 3,
      max_tokens: 2000
    });

    // 解析候选标题
    const candidates = this.extractTitles(candidatesResponse.choices[0]?.message?.content || '');

    if (candidates.length === 0) {
      return { titles: [], scores: [] };
    }

    // Step 2: 质量评分
    const scored = await Promise.all(
      candidates.slice(0, 20).map(async (title) => {
        const scoreResponse = await chatCompletion(userId, {
          model: 'dashscope:hunyuan-flash',
          messages: [{
            role: 'user',
            content: `请为以下${platform}标题评分（1-10分），只输出数字：

标题：${title}

评分维度：
- 吸引力（1-3分）
- 平台适配（1-3分）
- 可读性（1-2分）
- 原创性（1-2分）

总分（1-10）：`
          }],
          temperature: 0.1,
          max_tokens: 50
        });

        const scoreText = scoreResponse.choices[0]?.message?.content || '5';
        const score = parseFloat(scoreText.match(/\d+\.?\d*/)?.[0] || '5');
        return { title, score };
      })
    );

    // Step 3: 排序并返回TOP结果
    scored.sort((a, b) => b.score - a.score);
    return {
      titles: scored.slice(0, count).map(s => s.title),
      scores: scored.slice(0, count).map(s => s.score)
    };
  }

  /**
   * 内容优化流水线
   */
  static async optimizeContent(
    userId: string,
    content: string,
    platform: string,
    goal: string
  ): Promise<{ optimized: string; improvements: string[] }> {
    // Step 1: 问题诊断
    const diagnosisResponse = await chatCompletion(userId, {
      model: 'dashscope:qwen-plus',
      messages: [{
        role: 'user',
        content: `请分析以下内容的不足之处：

内容：
${content}

目标：${goal}
平台：${platform}

请列出3-5个具体问题，用编号：`
      }],
      temperature: 0.3,
      max_tokens: 1000
    });

    const issues = this.extractIssues(diagnosisResponse.choices[0]?.message?.content || '');

    // Step 2: 针对优化
    const optimizeResponse = await chatCompletion(userId, {
      model: 'dashscope:qwen-max',
      messages: [{
        role: 'user',
        content: `请根据以下问题优化内容：

原文：
${content}

目标：${goal}
平台：${platform}

发现的问题：
${issues.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

请直接输出优化后的内容：`
      }],
      temperature: 0.7,
      max_tokens: 3000
    });

    return {
      optimized: optimizeResponse.choices[0]?.message?.content || content,
      improvements: issues
    };
  }

  /**
   * 简历深度分析流水线
   */
  static async analyzeResumeDeep(
    userId: string,
    resumeText: string,
    jobRequirements: string
  ): Promise<{
    score: number;
    strengths: string[];
    concerns: string[];
    recommendation: string;
    interview_questions: string[];
  }> {
    const response = await chatCompletion(userId, {
      model: 'dashscope:qwen-max',
      messages: [{
        role: 'system',
        content: `你是一位资深HR总监，请全面分析简历。

【输出格式】请严格按以下JSON格式输出：
{
  "score": 8.5,
  "strengths": ["优势1", "优势2"],
  "concerns": ["顾虑1", "顾虑2"],
  "recommendation": "强烈推荐/推荐/待定/不推荐",
  "interview_questions": ["问题1", "问题2", "问题3"]
}`
      }, {
        role: 'user',
        content: `【简历】
${resumeText}

【岗位要求】
${jobRequirements}

请按格式输出分析结果：`
      }],
      temperature: 0.3,
      max_tokens: 3000
    });

    try {
      const content = response.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error('[Pipeline] Failed to parse resume analysis');
    }

    return {
      score: 7,
      strengths: ['未解析成功'],
      concerns: [],
      recommendation: '待定',
      interview_questions: []
    };
  }

  private static extractTitles(content: string): string[] {
    const lines = content.split('\n');
    const titles: string[] = [];

    for (const line of lines) {
      // 去掉编号和特殊字符
      const cleaned = line.replace(/^\d+[\.、:：]\s*/, '').trim();
      if (cleaned.length >= 5 && cleaned.length <= 50) {
        titles.push(cleaned);
      }
    }

    return titles;
  }

  private static extractIssues(content: string): string[] {
    const lines = content.split('\n');
    const issues: string[] = [];

    for (const line of lines) {
      const cleaned = line.replace(/^\d+[\.、:：]\s*/, '').trim();
      if (cleaned.length > 5) {
        issues.push(cleaned);
      }
    }

    return issues.slice(0, 5);
  }
}

// ==================== 导出便捷方法 ====================

export async function runWorkflow(
  userId: string,
  workflowId: string,
  initialContext: Record<string, any> = {}
): Promise<WorkflowResult> {
  const workflow = WORKFLOWS[workflowId];
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  const engine = new WorkflowEngine(workflow);
  return engine.execute(userId, initialContext);
}

export async function runCotReasoning(
  userId: string,
  task: string,
  context: Record<string, any>
): Promise<CotResult> {
  return CoTEngine.reason(userId, task, context);
}

export async function runTitlePipeline(
  userId: string,
  topic: string,
  platform: string,
  count: number = 10
): Promise<{ titles: string[]; scores: number[] }> {
  return MultiModelPipeline.generateBestTitles(userId, topic, platform, count);
}

export async function runContentOptimization(
  userId: string,
  content: string,
  platform: string,
  goal: string
): Promise<{ optimized: string; improvements: string[] }> {
  return MultiModelPipeline.optimizeContent(userId, content, platform, goal);
}
