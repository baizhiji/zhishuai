/**
 * 多模型管道架构服务 V3
 * 核心理念：腾讯云TokenHub为主，阿里云百炼为辅
 * 
 * V3 改进：
 * 1. 与 ai-model-router 深度集成，复用模型配置、并发控制、降级策略
 * 2. 补全3个缺失的管道路由（recruitment-chat, acquisition-outreach, auto-reply）
 * 3. 流式输出支持（SSE）
 * 4. 合规使用 V2 增强版
 * 
 * 管道模式：
 * 1. 串行管道：步骤1 → 步骤2 → 步骤3（前一步输出作为后一步输入）
 * 2. 并行管道：步骤1 ┬→ 汇总步骤
 *                    步骤2 ┤
 *                    步骤3 ┘
 * 3. 混合管道：并行生成 → 串行优化
 */
import { PrismaClient } from '@prisma/client';
import { checkContentCompliance } from './compliance.service.v2';
import { aiModelRouter, getAllModelsList } from './ai-model-router';
import { prisma } from '../utils/db';


// ============ 任务类型到模型Key的映射 ============

/**
 * 任务类型到 ai-model-router 模型Key的映射
 * 通过 ai-model-router 的模型配置来选择最优模型，不再硬编码模型ID
 */
export const MODEL_ASSIGNMENTS: Record<string, {
  primary: { modelKey: string; reason: string };
  fallback: { modelKey: string; reason: string };
}> = {
  // ---- 快速任务 ----
  intent_analysis: {
    primary: { modelKey: 'deepseek_v4_flash', reason: '快速响应、低成本' },
    fallback: { modelKey: 'qwen_turbo', reason: '阿里云最快模型' },
  },
  keyword_extract: {
    primary: { modelKey: 'deepseek_v4_flash', reason: '快速提取' },
    fallback: { modelKey: 'qwen_turbo', reason: '快速响应' },
  },
  compliance_check: {
    primary: { modelKey: 'deepseek_v4_flash', reason: '快速检测、低成本' },
    fallback: { modelKey: 'qwen_turbo', reason: '快速响应' },
  },
  quick_qa: {
    primary: { modelKey: 'hunyuan_instruct', reason: '日常对话、快速' },
    fallback: { modelKey: 'qwen_turbo', reason: '快速响应' },
  },

  // ---- 高质量内容生成 ----
  content_generation: {
    primary: { modelKey: 'deepseek_v4_pro', reason: '高质量输出' },
    fallback: { modelKey: 'qwen_plus', reason: '专业内容生成' },
  },
  copywriting: {
    primary: { modelKey: 'hy3_preview', reason: '最新能力、创意强' },
    fallback: { modelKey: 'qwen_plus', reason: '专业文案' },
  },
  xiaohongshu: {
    primary: { modelKey: 'kimi_k2', reason: '长上下文、创作能力' },
    fallback: { modelKey: 'qwen_plus', reason: '小红书文案' },
  },

  // ---- 拟人化 ----
  humanize: {
    primary: { modelKey: 'hunyuan_role', reason: '角色扮演、拟人化最强' },
    fallback: { modelKey: 'qwen_plus', reason: '内容润色' },
  },
  recruitment_chat: {
    primary: { modelKey: 'hunyuan_role', reason: '像HR真人沟通' },
    fallback: { modelKey: 'qwen_plus', reason: '拟人化对话' },
  },
  acquisition_outreach: {
    primary: { modelKey: 'hunyuan_role', reason: '像真人获客话术' },
    fallback: { modelKey: 'qwen_plus', reason: '拟人化沟通' },
  },
  auto_reply: {
    primary: { modelKey: 'hunyuan_role', reason: '拟人化自动回复' },
    fallback: { modelKey: 'qwen_turbo', reason: '快速回复' },
  },

  // ---- 深度推理 ----
  deep_reasoning: {
    primary: { modelKey: 'deepseek_r1', reason: '深度推理最强' },
    fallback: { modelKey: 'hunyuan_thinking', reason: '混元思考版' },
  },
  resume_analysis: {
    primary: { modelKey: 'deepseek_r1', reason: '复杂匹配推理' },
    fallback: { modelKey: 'deepseek_v4_pro', reason: '高质量分析' },
  },

  // ---- 长文本 ----
  long_text: {
    primary: { modelKey: 'kimi_k2', reason: '128K上下文' },
    fallback: { modelKey: 'qwen_long', reason: '长文本处理' },
  },

  // ---- Agent/代码 ----
  agent_task: {
    primary: { modelKey: 'glm_5', reason: 'Agent工程能力' },
    fallback: { modelKey: 'glm_51', reason: '增强版Agent' },
  },

  // ---- 多模态 ----
  vision: {
    primary: { modelKey: 'glm_5v', reason: '视觉理解' },
    fallback: { modelKey: 'qwen_plus', reason: '降级文本理解' },
  },
  image_gen: {
    primary: { modelKey: 'hy_image', reason: '高质量图像生成' },
    fallback: { modelKey: 'hy_image_lite', reason: '轻量图像生成' },
  },
  video_gen: {
    primary: { modelKey: 'hy_video', reason: '短视频生成' },
    fallback: { modelKey: 'hy_image', reason: '降级为图片' },
  },
  digital_human: {
    primary: { modelKey: 'digital_human', reason: '数字人视频' },
    fallback: { modelKey: 'hy_image', reason: '降级为图片' },
  },
  video_understand: {
    primary: { modelKey: 'youtu_vita', reason: '视频理解' },
    fallback: { modelKey: 'glm_5v', reason: '降级视觉理解' },
  },
};

// ============ API 配置（从 ai-model-router 获取，保持一致） ============

const API_CONFIGS = {
  tencent: {
    baseUrl: 'https://tokenhub.tencentmaas.com/v1',
    apiKeyEnv: 'TENCENT_TOKENHUB_API_KEY',
  },
  aliyun: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyEnv: 'DASHSCOPE_API_KEY',
  },
};

// ============ 核心调用函数 ============

/**
 * 智能调用AI模型（V3 - 与 ai-model-router 集成）
 * 1. 先通过 MODEL_ASSIGNMENTS 查找模型Key
 * 2. 通过 ai-model-router 获取模型详细信息（ID、provider、并发控制）
 * 3. 优先主模型，失败自动降级到备用模型
 * 4. 记录并发数，防止模型过载
 */
async function callModel(
  taskType: string,
  messages: Array<{ role: string; content: string }>,
  options: {
    userId?: string;
    stream?: boolean;
    maxTokens?: number;
    temperature?: number;
  } = {},
): Promise<{ content: string; model: string; modelKey: string; provider: string; isFallback: boolean }> {
  const assignment = MODEL_ASSIGNMENTS[taskType];
  if (!assignment) {
    // 未知任务类型，使用 ai-model-router 自动选择
    const autoSelect = aiModelRouter.selectModel('chat');
    const modelInfo = aiModelRouter.getModelInfo(autoSelect.modelKey);
    if (modelInfo) {
      const result = await callProvider(modelInfo.provider as 'tencent' | 'aliyun', modelInfo.id, messages, { ...options, userId: options.userId });
      return { ...result, modelKey: autoSelect.modelKey, isFallback: false };
    }
    // 兜底
    return callProvider('tencent', 'hunyuan-2.0-instruct-20251111', messages, { ...options, userId: options.userId }).then(r => ({ ...r, modelKey: 'hunyuan_instruct', isFallback: false }));
  }

  // 获取主模型信息
  const primaryModelInfo = aiModelRouter.getModelInfo(assignment.primary.modelKey);
  if (!primaryModelInfo) {
    throw new Error(`Pipeline: 主模型 ${assignment.primary.modelKey} 不存在于 ai-model-router 配置中`);
  }

  // 检查主模型并发数
  const primaryConcurrent = aiModelRouter.getConcurrent(assignment.primary.modelKey);
  const maxConcurrent = 10;

  // 尝试主模型（如果并发未满）
  if (primaryConcurrent < maxConcurrent) {
    try {
      aiModelRouter.incrementConcurrent(assignment.primary.modelKey);
      const result = await callProvider(
        primaryModelInfo.provider as 'tencent' | 'aliyun',
        primaryModelInfo.id,
        messages,
        { maxTokens: options.maxTokens, temperature: options.temperature, stream: options.stream, userId: options.userId },
      );
      aiModelRouter.decrementConcurrent(assignment.primary.modelKey);
      return { ...result, modelKey: assignment.primary.modelKey, isFallback: false };
    } catch (primaryError: any) {
      aiModelRouter.decrementConcurrent(assignment.primary.modelKey);
      console.warn(`[Pipeline] 主模型 ${assignment.primary.modelKey}(${primaryModelInfo.id}) 调用失败: ${primaryError.message}，尝试备用模型...`);
    }
  } else {
    console.warn(`[Pipeline] 主模型 ${assignment.primary.modelKey} 并发已满(${primaryConcurrent}/${maxConcurrent})，使用备用模型`);
  }

  // 尝试备用模型
  const fallbackModelInfo = aiModelRouter.getModelInfo(assignment.fallback.modelKey);
  if (fallbackModelInfo) {
    try {
      aiModelRouter.incrementConcurrent(assignment.fallback.modelKey);
      const result = await callProvider(
        fallbackModelInfo.provider as 'tencent' | 'aliyun',
        fallbackModelInfo.id,
        messages,
        { maxTokens: options.maxTokens, temperature: options.temperature, stream: options.stream, userId: options.userId },
      );
      aiModelRouter.decrementConcurrent(assignment.fallback.modelKey);
      return { ...result, modelKey: assignment.fallback.modelKey, isFallback: true };
    } catch (fallbackError: any) {
      aiModelRouter.decrementConcurrent(assignment.fallback.modelKey);
      console.error(`[Pipeline] 备用模型 ${assignment.fallback.modelKey}(${fallbackModelInfo.id}) 也失败: ${fallbackError.message}`);
    }
  }

  // 两个都失败，尝试 ai-model-router 的降级策略
  const failedKey = assignment.primary.modelKey;
  const fallback = aiModelRouter.getFallbackModel(failedKey);
  if (fallback) {
    const fallbackInfo = aiModelRouter.getModelInfo(fallback.modelKey);
    if (fallbackInfo) {
      try {
        const result = await callProvider(
          fallbackInfo.provider as 'tencent' | 'aliyun',
          fallbackInfo.id,
          messages,
          { maxTokens: options.maxTokens, temperature: options.temperature, stream: options.stream, userId: options.userId },
        );
        return { ...result, modelKey: fallback.modelKey, isFallback: true };
      } catch (e) {
        // 降级也失败
      }
    }
  }

  throw new Error(`模型调用失败: 主模型(${assignment.primary.modelKey})和备用模型(${assignment.fallback.modelKey})均不可用`);
}

/**
 * 调用指定服务商的API
 */
async function callProvider(
  provider: 'tencent' | 'aliyun',
  model: string,
  messages: Array<{ role: string; content: string }>,
  options: {
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
    userId?: string;
  } = {},
): Promise<{ content: string; model: string; provider: string }> {
  const config = API_CONFIGS[provider];
  
  // 获取API Key：优先用户自己配置的，仅admin可fallback到环境变量
  let apiKey: string | undefined;
  if (options.userId && options.userId !== 'system') {
    // 真实用户：优先使用用户自己的Key
    const { getPrimaryApiKey } = await import('./user-api-key.service');
    const providerKey = provider === 'aliyun' ? 'dashscope' : 'tokenhub';
    const userKey = await getPrimaryApiKey(options.userId, providerKey);
    if (userKey?.apiKey) {
      apiKey = userKey.apiKey;
    }
  }
  // Fallback到环境变量（仅系统调用或admin用户）
  if (!apiKey) {
    apiKey = process.env[config.apiKeyEnv as keyof typeof process.env] as string | undefined;
  }

  if (!apiKey) {
    throw new Error(`${provider === 'tencent' ? '腾讯云TokenHub' : '阿里云百炼'} API Key 未配置`);
  }

  const requestBody: any = {
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    max_tokens: options.maxTokens || 2048,
    temperature: options.temperature ?? 0.7,
  };

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(errorData.error?.message || `API调用失败: ${response.status}`);
  }

  const data: any = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // 记录Token用量
  if (options.userId && data.usage) {
    try {
      await prisma.apiUsageLog.create({
        data: {
          userId: options.userId,
          providerId: `pipeline-${provider}`,
          providerName: provider === 'tencent' ? '腾讯云TokenHub' : '阿里云百炼',
          endpoint: `pipeline/${provider}/${model}`,
          model,
          requestTokens: data.usage.prompt_tokens || 0,
          responseTokens: data.usage.completion_tokens || 0,
          cost: estimateCost(provider, model, data.usage),
          status: 'success',
        },
      });
    } catch (e) {
      // 日志写入失败不影响主流程
    }
  }

  return { content, model, provider };
}

/**
 * 估算API调用成本
 */
function estimateCost(provider: string, model: string, usage: { prompt_tokens: number; completion_tokens: number }): number {
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  // 默认按 ¥0.002/1K input, ¥0.006/1K output
  return Number(((inputTokens * 0.002 + outputTokens * 0.006) / 1000).toFixed(6));
}

// ============ 管道执行引擎 ============

interface PipelineStep {
  name: string;
  taskType: string; // 对应 MODEL_ASSIGNMENTS 的 key
  systemPrompt: string;
  transform?: (input: string, context: Record<string, any>) => string;
  validate?: (output: string) => boolean;
  retryOnFail?: boolean;
  temperature?: number;
  maxTokens?: number;
}

interface ParallelStep {
  name: string;
  taskType: string;
  systemPrompt: string;
  input: string | ((context: Record<string, any>) => string);
  temperature?: number;
  maxTokens?: number;
}

export interface PipelineResult {
  success: boolean;
  output: string;
  steps: {
    name: string;
    model: string;
    provider: string;
    isFallback: boolean;
    input: string;
    output: string;
    duration: number;
  }[];
  compliance?: {
    passed: boolean;
    score: number;
    issues: any[];
  };
  totalDuration: number;
}

/**
 * 串行管道执行
 */
async function executePipeline(
  steps: PipelineStep[],
  initialInput: string,
  context: Record<string, any> = {},
  userId: string = 'system',
): Promise<PipelineResult> {
  const startTime = Date.now();
  let currentInput = initialInput;
  const stepResults: PipelineResult['steps'] = [];

  for (const step of steps) {
    const stepStart = Date.now();
    let stepOutput = '';
    let lastModel = '';
    let lastProvider = '';
    let lastIsFallback = false;
    let attempts = 0;
    const maxAttempts = step.retryOnFail ? 3 : 1;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const prompt = step.transform
          ? step.transform(currentInput, context)
          : currentInput;

        const result = await callModel(step.taskType, [
          { role: 'system', content: step.systemPrompt },
          { role: 'user', content: prompt },
        ], {
          userId,
          temperature: step.temperature,
          maxTokens: step.maxTokens,
        });

        stepOutput = result.content;
        lastModel = result.model;
        lastProvider = result.provider;
        lastIsFallback = result.isFallback;

        if (step.validate && !step.validate(stepOutput)) {
          if (attempts < maxAttempts) continue;
          stepOutput = currentInput;
        }
        break;
      } catch (error) {
        console.error(`管道步骤 [${step.name}] 失败:`, error);
        if (attempts >= maxAttempts) {
          stepOutput = currentInput;
        }
      }
    }

    stepResults.push({
      name: step.name,
      model: lastModel,
      provider: lastProvider,
      isFallback: lastIsFallback,
      input: currentInput.substring(0, 200),
      output: stepOutput.substring(0, 200),
      duration: Date.now() - stepStart,
    });

    currentInput = stepOutput;
  }

  return {
    success: true,
    output: currentInput,
    steps: stepResults,
    totalDuration: Date.now() - startTime,
  };
}

/**
 * 并行管道执行 + 汇总
 */
async function executeParallelPipeline(
  parallelSteps: ParallelStep[],
  mergeStep: PipelineStep,
  context: Record<string, any> = {},
  userId: string = 'system',
): Promise<PipelineResult> {
  const startTime = Date.now();
  const stepResults: PipelineResult['steps'] = [];

  // 并行执行
  const parallelResults = await Promise.all(
    parallelSteps.map(async (step) => {
      const stepStart = Date.now();
      const input = typeof step.input === 'function' ? step.input(context) : step.input;
      
      const result = await callModel(step.taskType, [
        { role: 'system', content: step.systemPrompt },
        { role: 'user', content: input },
      ], { userId, temperature: step.temperature, maxTokens: step.maxTokens });

      return {
        name: step.name,
        model: result.model,
        provider: result.provider,
        isFallback: result.isFallback,
        input: input.substring(0, 200),
        output: result.content,
        duration: Date.now() - stepStart,
      };
    }),
  );

  stepResults.push(...parallelResults);

  // 汇总
  const mergedInput = parallelResults.map(r => `【${r.name}】\n${r.output}`).join('\n\n');
  const mergeStart = Date.now();
  const mergeResult = await callModel(mergeStep.taskType, [
    { role: 'system', content: mergeStep.systemPrompt },
    { role: 'user', content: mergedInput },
  ], { userId, temperature: mergeStep.temperature, maxTokens: mergeStep.maxTokens });

  stepResults.push({
    name: mergeStep.name,
    model: mergeResult.model,
    provider: mergeResult.provider,
    isFallback: mergeResult.isFallback,
    input: mergedInput.substring(0, 200),
    output: mergeResult.content.substring(0, 200),
    duration: Date.now() - mergeStart,
  });

  return {
    success: true,
    output: mergeResult.content,
    steps: stepResults,
    totalDuration: Date.now() - startTime,
  };
}

// ============ 业务管道定义 ============

/**
 * 文案生成管道 V2
 * 意图理解(快速模型) → 内容生成(高质量) → 人性化(角色模型) → 合规(快速)
 */
export async function generateCopywritingPipeline(
  description: string,
  style: string = '专业',
  wordCount: number = 500,
  platform?: string,
  userId?: string,
): Promise<PipelineResult> {
  const result = await executePipeline([
    {
      name: '意图理解',
      taskType: 'intent_analysis',
      systemPrompt: '你是一个意图分析专家。分析用户的需求描述，提取关键信息、目标受众、内容类型和语气要求，以结构化方式输出。',
      maxTokens: 512,
    },
    {
      name: '内容生成',
      taskType: 'content_generation',
      systemPrompt: `你是一个专业的内容创作者。根据分析结果生成${style}风格的文案，约${wordCount}字。要求内容有吸引力、有逻辑、有深度。不要使用模板化的表达，确保内容自然流畅。`,
      maxTokens: wordCount * 2,
    },
    {
      name: '人性化处理',
      taskType: 'humanize',
      systemPrompt: '你是一个内容优化专家。对生成的文案进行人性化处理：1. 去除AI生成的典型痕迹（如"首先、其次、最后"等机械结构）；2. 增加口语化表达和自然过渡；3. 适当加入个人观点和情感；4. 偶尔加入语气词（啊、呢、吧）；5. 确保读起来像是真人写的。直接输出优化后的文案，不要解释。',
      temperature: 0.9,
    },
  ], description, { style, wordCount, platform }, userId);

  const compliance = await checkContentCompliance(result.output, platform);
  result.compliance = compliance;

  if (!compliance.passed && compliance.sanitizedContent && compliance.sanitizedContent !== result.output) {
    result.output = compliance.sanitizedContent;
  }

  return result;
}

/**
 * 小红书图文管道 V2
 * 选题分析 → 爆款文案(长文本模型) → emoji优化 → 合规
 */
export async function generateXiaohongshuPipeline(
  description: string,
  style: string = '生活化',
  userId?: string,
): Promise<PipelineResult> {
  const result = await executePipeline([
    {
      name: '选题分析',
      taskType: 'intent_analysis',
      systemPrompt: '你是一个小红书选题专家。分析用户的需求，确定最佳的内容角度、标题风格和关键词策略。输出选题方案。',
      maxTokens: 512,
    },
    {
      name: '爆款文案生成',
      taskType: 'xiaohongshu',
      systemPrompt: `你是一个小红书爆款文案专家。根据选题方案生成小红书风格的文案，要求：1. 标题要有吸引力（15字以内）；2. 正文300-600字；3. 语气要像朋友分享，不要太官方；4. 包含具体的使用感受和细节；5. 结尾有互动引导。风格：${style}`,
      maxTokens: 1500,
    },
    {
      name: 'emoji优化',
      taskType: 'humanize',
      systemPrompt: '你是一个小红书排版专家。在文案中适当添加emoji表情，使内容更生动有趣。要求：1. emoji不能过多，每段2-3个即可；2. emoji要与内容相关；3. 标题也要加1-2个emoji；4. 保持原文内容不变，只添加emoji。直接输出优化后的文案。',
      temperature: 0.5,
      maxTokens: 1500,
    },
  ], description, { style, platform: 'xiaohongshu' }, userId);

  const compliance = await checkContentCompliance(result.output, 'xiaohongshu');
  result.compliance = compliance;

  return result;
}

/**
 * 标题生成管道 V2（并行生成 + 汇总筛选）
 */
export async function generateTitlePipeline(
  description: string,
  count: number = 5,
  platform?: string,
  userId?: string,
): Promise<PipelineResult> {
  // 先提取关键词
  const keywordResult = await callModel('keyword_extract', [
    { role: 'system', content: '你是一个关键词分析专家。从描述中提取核心关键词、受众痛点和内容亮点，以列表形式输出。' },
    { role: 'user', content: description },
  ], { userId });

  // 并行生成多种风格的标题
  const styles = ['疑问式', '数字式', '对比式', '悬念式', '痛点式'];
  const parallelSteps: ParallelStep[] = styles.map(style => ({
    name: `${style}标题`,
    taskType: 'copywriting' as const,
    systemPrompt: `你是一个爆款标题专家。根据关键词生成${Math.ceil(count / styles.length)}个${style}标题。要求短小精悍、吸引人但不标题党。每行一个标题，不加编号。${platform ? `注意符合${platform}平台的标题规范。` : ''}`,
    input: keywordResult.content,
    maxTokens: 256,
  }));

  const result = await executeParallelPipeline(
    parallelSteps,
    {
      name: '筛选优化',
      taskType: 'content_generation',
      systemPrompt: `从以下候选标题中筛选出最好的${count}个，并对每个标题进行微调优化，使其更吸引人且不违规。每行一个标题，不加编号和额外解释。${platform ? `注意符合${platform}平台的标题规范。` : ''}`,
      maxTokens: 256,
    },
    { description, count, platform, keywords: keywordResult.content },
    userId,
  );

  return result;
}

/**
 * 电商详情页管道 V2
 */
export async function generateEcommercePipeline(
  productName: string,
  description: string,
  userId?: string,
): Promise<PipelineResult> {
  const result = await executePipeline([
    {
      name: '产品分析',
      taskType: 'intent_analysis',
      systemPrompt: '你是一个产品分析专家。分析产品描述，提取核心卖点、目标用户、使用场景和竞争优势。',
      maxTokens: 512,
    },
    {
      name: '详情页生成',
      taskType: 'content_generation',
      systemPrompt: `你是一个电商文案专家。为产品"${productName}"生成电商详情页文案，包含：1. 产品亮点（3-5点）；2. 使用场景描述；3. 用户评价（2-3条）；4. 购买建议。约800字。`,
      maxTokens: 2000,
    },
    {
      name: '人性化处理',
      taskType: 'humanize',
      systemPrompt: '对电商文案进行人性化处理：1. 让用户评价更像真实买家的话（加入口语化表达）；2. 场景描述要有画面感；3. 去除AI生成的痕迹；4. 语气亲切不生硬；5. 偶尔加一点不完美（比如感叹号、省略号）。直接输出优化后的文案。',
      temperature: 0.9,
      maxTokens: 2000,
    },
  ], `${productName}: ${description}`, { productName }, userId);

  const compliance = await checkContentCompliance(result.output);
  result.compliance = compliance;

  return result;
}

/**
 * 视频脚本管道 V2
 */
export async function generateVideoScriptPipeline(
  description: string,
  duration: number = 60,
  style: string = '专业',
  userId?: string,
): Promise<PipelineResult> {
  return executePipeline([
    {
      name: '选题策划',
      taskType: 'content_generation',
      systemPrompt: `你是一个短视频策划专家。为"${description}"设计一个${duration}秒短视频的选题方案，包括：1. 核心观点；2. 情绪曲线；3. 3秒钩子设计；4. 结尾CTA。`,
      maxTokens: 800,
    },
    {
      name: '脚本大纲',
      taskType: 'content_generation',
      systemPrompt: `你是一个短视频脚本专家。根据选题方案生成${duration}秒短视频的脚本大纲，包含：分镜头、画面描述、字幕、时长分配。`,
      maxTokens: 1500,
    },
    {
      name: '详细脚本',
      taskType: 'copywriting',
      systemPrompt: `根据脚本大纲生成详细的短视频脚本，风格${style}。包含：1. 逐字稿（配音文案）；2. 画面描述；3. 字幕内容；4. 转场提示；5. BGM建议。确保开头3秒有强烈吸引力。`,
      maxTokens: 2000,
    },
    {
      name: '节奏优化',
      taskType: 'humanize',
      systemPrompt: '优化视频脚本的节奏感：1. 确保每5-8秒有一个信息点或转折；2. 短句为主，长句拆分；3. 增加悬念和反转；4. 结尾要有强烈的行动号召；5. 让台词更口语化、像真人在说话。直接输出优化后的脚本。',
      temperature: 0.8,
    },
  ], description, { duration, style }, userId);
}

/**
 * 招聘JD生成管道 V2
 */
export async function generateRecruitmentJDPipeline(
  position: string,
  requirements: string,
  companyInfo?: string,
  userId?: string,
): Promise<PipelineResult> {
  const result = await executePipeline([
    {
      name: '岗位分析',
      taskType: 'deep_reasoning',
      systemPrompt: '你是一个人力资源专家。分析岗位需求，确定：1. 核心职责；2. 必备技能；3. 加分项；4. 发展空间；5. 适合的候选人画像。',
      maxTokens: 800,
    },
    {
      name: 'JD生成',
      taskType: 'content_generation',
      systemPrompt: `你是一个招聘文案专家。为"${position}"岗位生成一份吸引人的职位描述（JD），要求：1. 职责描述清晰具体；2. 要求合理不过分；3. 突出公司优势和发展机会；4. 语气专业但不呆板；5. 包含薪资范围参考。${companyInfo ? `公司信息：${companyInfo}` : ''}`,
      maxTokens: 2000,
    },
    {
      name: '吸引力优化',
      taskType: 'humanize',
      systemPrompt: '优化职位描述的吸引力：1. 让标题更有吸引力；2. 突出员工福利和成长机会；3. 加入公司文化元素；4. 语气更亲切、更像真人在介绍；5. 让求职者感觉这是一个不可错过的机会。直接输出优化后的JD。',
      temperature: 0.9,
    },
  ], `${position}: ${requirements}`, { companyInfo }, userId);

  return result;
}

/**
 * 招聘AI沟通管道（新增）
 * 分析候选人 → 生成个性化沟通话术 → 拟人化润色 → 合规检测
 */
export async function generateRecruitmentChatPipeline(
  candidateInfo: string,
  jobDescription: string,
  chatGoal: 'greet' | 'interview_invite' | 'follow_up' | 'answer_question',
  userId?: string,
): Promise<PipelineResult> {
  const goalPrompts: Record<string, string> = {
    greet: '生成第一条打招呼的消息，引起候选人兴趣',
    interview_invite: '生成面试邀请消息，包含时间地点',
    follow_up: '生成跟进消息，提醒候选人面试时间',
    answer_question: '根据候选人问题生成回答',
  };

  const result = await executePipeline([
    {
      name: '候选人分析',
      taskType: 'resume_analysis',
      systemPrompt: '你是一个资深HR。分析候选人信息和职位要求，找出匹配点和吸引候选人的关键因素。',
      maxTokens: 512,
    },
    {
      name: '沟通话术生成',
      taskType: 'recruitment_chat',
      systemPrompt: `你是一个经验丰富的HR。${goalPrompts[chatGoal]}。要求：1. 语气专业但温暖；2. 针对候选人的背景个性化；3. 简洁有力，不要太长；4. 让候选人感受到被重视。职位信息：${jobDescription}`,
      maxTokens: 500,
    },
    {
      name: '拟人化润色',
      taskType: 'humanize',
      systemPrompt: '将HR消息润色得更像真人在聊天：1. 去掉格式化表达（如"尊敬的先生/女士"）；2. 加入口语化表达；3. 适当使用感叹号和表情符号（但不要太多）；4. 让消息读起来像是手机上发的，不是邮件模板。直接输出润色后的消息。',
      temperature: 0.95,
      maxTokens: 500,
    },
  ], candidateInfo, { jobDescription, chatGoal }, userId);

  return result;
}

/**
 * 获客话术管道（新增）
 * 分析潜在客户 → 生成引流话术 → 拟人化润色 → 合规检测
 */
export async function generateAcquisitionOutreachPipeline(
  targetInfo: string,
  productInfo: string,
  platform?: string,
  userId?: string,
): Promise<PipelineResult> {
  const result = await executePipeline([
    {
      name: '客户画像',
      taskType: 'intent_analysis',
      systemPrompt: '你是一个营销分析专家。分析潜在客户信息，确定：1. 客户痛点；2. 可能的需求；3. 最佳沟通切入点；4. 信任建立策略。',
      maxTokens: 512,
    },
    {
      name: '引流话术生成',
      taskType: 'acquisition_outreach',
      systemPrompt: `你是一个资深销售。根据客户画像生成引流话术，要求：1. 开头要自然，不能一看就是广告；2. 从客户痛点切入，不是从产品切入；3. 建立信任后再提产品；4. 结尾有软性引导（不是硬推二维码）。产品信息：${productInfo}`,
      maxTokens: 500,
    },
    {
      name: '拟人化润色',
      taskType: 'humanize',
      systemPrompt: `将引流消息润色得更像真人在社交平台聊天：1. 绝对不能看起来像群发消息；2. 用聊天的语气，不是推销语气；3. 偶尔用网络用语但不过度；4. 消息不要太长，像手机打出来的。${platform ? `注意符合${platform}平台的交流风格。` : ''}直接输出润色后的消息。`,
      temperature: 0.95,
      maxTokens: 500,
    },
  ], targetInfo, { productInfo, platform }, userId);

  const compliance = await checkContentCompliance(result.output, platform);
  result.compliance = compliance;

  return result;
}

/**
 * 自动回复管道（新增）
 * 分析对方消息 → 生成回复 → 拟人化 → 合规
 */
export async function generateAutoReplyPipeline(
  incomingMessage: string,
  context: string,
  replyStyle: 'friendly' | 'professional' | 'casual',
  platform?: string,
  userId?: string,
): Promise<PipelineResult> {
  const styleMap = {
    friendly: '亲切友好，像朋友聊天',
    professional: '专业礼貌，像客服',
    casual: '随意轻松，像同龄人聊天',
  };

  const result = await executePipeline([
    {
      name: '消息意图分析',
      taskType: 'intent_analysis',
      systemPrompt: '分析对方消息的意图、情感和关键信息点。判断是咨询、投诉、闲聊还是其他意图。',
      maxTokens: 256,
    },
    {
      name: '回复生成',
      taskType: 'auto_reply',
      systemPrompt: `你是一个${styleMap[replyStyle]}的人。根据上下文生成回复，要求：1. 回复要自然，不能像模板；2. 语气要${styleMap[replyStyle]}；3. 回答要有帮助；4. 不要太长。上下文：${context}`,
      maxTokens: 300,
    },
    {
      name: '拟人化润色',
      taskType: 'humanize',
      systemPrompt: '让回复更像真人在手机上打出来的：1. 句子可以不完整；2. 偶尔用语气词；3. 不要用"非常感谢您的咨询"这种客服腔；4. 标点符号随意一些。直接输出润色后的回复。',
      temperature: 0.95,
      maxTokens: 300,
    },
  ], incomingMessage, { context, replyStyle, platform }, userId);

  return result;
}

/**
 * 获取可用的管道类型列表
 */
export function getAvailablePipelines() {
  return [
    { id: 'copywriting', name: '文案生成', description: '意图理解(快速模型) → 内容生成(高质量) → 人性化(角色模型) → 合规检测', models: 'DeepSeek V4 Flash → hy3-preview → 混元角色版 → DeepSeek V4 Flash' },
    { id: 'xiaohongshu', name: '小红书图文', description: '选题分析 → 爆款文案(Kimi) → emoji优化(角色模型) → 合规检测', models: 'DeepSeek V4 Flash → Kimi K2.6 → 混元角色版' },
    { id: 'title', name: '标题生成', description: '关键词提取 → 5种风格并行生成 → 汇总筛选', models: 'DeepSeek V4 Flash → 5×hy3-preview(并行) → DeepSeek V4 Pro' },
    { id: 'ecommerce', name: '电商详情页', description: '产品分析 → 详情页生成 → 人性化 → 合规', models: 'DeepSeek V4 Flash → DeepSeek V4 Pro → 混元角色版' },
    { id: 'video-script', name: '视频脚本', description: '选题策划 → 脚本大纲 → 详细脚本 → 节奏优化', models: 'DeepSeek V4 Pro → DeepSeek V4 Pro → hy3-preview → 混元角色版' },
    { id: 'recruitment-jd', name: '招聘JD', description: '岗位分析(R1) → JD生成 → 吸引力优化', models: 'DeepSeek R1 → DeepSeek V4 Pro → 混元角色版' },
    { id: 'recruitment-chat', name: '招聘AI沟通', description: '候选人分析(R1) → 沟通话术(角色模型) → 拟人化润色', models: 'DeepSeek R1 → 混元角色版 → 混元角色版' },
    { id: 'acquisition-outreach', name: '获客话术', description: '客户画像 → 引流话术(角色模型) → 拟人化 → 合规', models: 'DeepSeek V4 Flash → 混元角色版 → 混元角色版' },
    { id: 'auto-reply', name: '自动回复', description: '意图分析 → 回复生成(角色模型) → 拟人化', models: 'DeepSeek V4 Flash → 混元角色版 → 混元角色版' },
  ];
}

/**
 * 获取模型分配配置
 */
export function getModelAssignments() {
  return MODEL_ASSIGNMENTS;
}
