/**
 * AI Workflow Service — 多步骤AI工作流
 * 使用统一 AI 客户端 (腾讯云TokenHub/阿里云百炼)
 */
import { chatCompletion } from './ai-client';

// ─── 类型定义 ────────────────────────────────

export interface WorkflowOptions {
  creativity?: number;
  platform?: string;
}

// ─── 核心工作流调度 ────────────────────────────────

export async function processWorkflow(
  userId: string,
  workflowType: string,
  params: any,
  options?: WorkflowOptions
): Promise<any> {
  const opts = { creativity: 0.5, platform: 'douyin', ...options };
  switch (workflowType) {
    case 'content_production':
      return await contentProductionWorkflow(userId, params, opts);
    case 'recruitment':
      return await recruitmentWorkflow(userId, params, opts);
    case 'customer_acquisition':
      return await customerAcquisitionWorkflow(userId, params, opts);
    default:
      throw new Error(`未知工作流类型: ${workflowType}`);
  }
}

// ─── 内容生产工作流 ────────────────────────────────

async function contentProductionWorkflow(
  userId: string,
  params: { topic: string; platform?: string },
  opts: WorkflowOptions
) {
  const platform = params.platform || 'douyin';

  // Step 1: 选题策划——分析话题的爆款潜力，确定切入角度
  const planPrompt = `你是一位资深内容策划。请分析以下主题在${platform}平台的内容策略：

1. 目标受众画像（年龄段、兴趣、痛点）
2. 三个差异化切入角度（每个角度包含：核心概念、预期传播点、情绪钩子）
3. 最佳发布时间和内容形式建议

主题：${params.topic}`;

  const planResult = await chatCompletion(userId, {
    model: 'qwen-max',
    messages: [{ role: 'system', content: '你是有10年经验的中文内容策划专家。输出结构化、实用、可执行的方案。' }, { role: 'user', content: planPrompt }],
    temperature: 0.7,
    max_tokens: 1500,
    platform: platform as any,
    creativity: opts.creativity,
  });

  // Step 2: 内容生成——基于策划方案生成完整内容
  const contentPrompt = `请基于以下策划方案，生成一条完整的${platform}平台内容：

策划方案：
${planResult}

要求：
1. 标题（15-25字，吸引点击）
2. 正文（口语化、有节奏、有互动感）
3. 5-8个相关标签
4. 互动引导语

请按"标题→正文→标签→引导"的顺序输出。`;

  const contentResult = await chatCompletion(userId, {
    model: 'qwen-max',
    messages: [{ role: 'system', content: '你是中文内容创作专家，输出高质量、可直接发布的内容。' }, { role: 'user', content: contentPrompt }],
    temperature: 0.8,
    max_tokens: 2048,
    platform: platform as any,
    creativity: opts.creativity,
  });

  return { plan: planResult, content: contentResult, topic: params.topic, platform };
}

// ─── 招聘工作流 ────────────────────────────────

async function recruitmentWorkflow(
  userId: string,
  params: { jobTitle: string; industry?: string; location?: string },
  opts: WorkflowOptions
) {
  const { jobTitle, industry = '互联网', location = '全国' } = params;

  // Step 1: 生成JD
  const jdPrompt = `请为以下岗位生成一份专业的招聘JD：

岗位名称：${jobTitle}
行业：${industry}
地点：${location}

要求：
1. 岗位职责（5-7条，具体明确）
2. 任职要求（3-5条，区分硬性和软性）
3. 薪资范围（参考行业水平，给出合理范围）
4. 福利亮点（5条以上特色福利）
5. 团队介绍（150字左右）`;

  const jdResult = await chatCompletion(userId, {
    model: 'qwen-max',
    messages: [{ role: 'system', content: '你是资深HR，擅长撰写吸引优质候选人的招聘JD。' }, { role: 'user', content: jdPrompt }],
    temperature: 0.6,
    max_tokens: 1500,
  });

  // Step 2: 生成面试题
  const interviewPrompt = `基于以下JD，生成5道专业面试题和评分标准：

JD内容：
${jdResult}

要求：
1. 覆盖技术能力、项目经验、沟通协作三个维度
2. 每题包含：问题、考察点、理想回答要点、评分标准(1-5分)`;

  const interviewResult = await chatCompletion(userId, {
    model: 'qwen-max',
    messages: [{ role: 'system', content: '你是资深技术面试官，擅长设计有区分度的面试题。' }, { role: 'user', content: interviewPrompt }],
    temperature: 0.6,
    max_tokens: 1500,
  });

  return { jd: jdResult, interviewQuestions: interviewResult, jobTitle };
}

// ─── 获客话术工作流 ────────────────────────────────

async function customerAcquisitionWorkflow(
  userId: string,
  params: { product: string; targetProfile: string; platform?: string },
  opts: WorkflowOptions
) {
  const { product, targetProfile, platform = 'xiaohongshu' } = params;

  // 生成多渠道获客话术
  const prompt = `请为以下产品/服务生成针对不同触达场景的获客话术：

产品/服务：${product}
目标客户画像：${targetProfile}
主要平台：${platform}

要求生成以下5种话术：
1. 私信首条（30字以内，快速建立信任）
2. 评论区互动（20字以内，引发好奇）
3. 短视频开场白（前3秒钩子）
4. 社群/朋友圈文案（100字，有价值感）
5. 跟进话术（已读不回后的二次触达）`;

  const result = await chatCompletion(userId, {
    model: 'qwen-max',
    messages: [{ role: 'system', content: '你是顶级销售文案专家，擅长撰写高转化率的获客话术。每种话术独立成段，标注清楚话术类型。' }, { role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 1500,
    platform: platform as any,
  });

  return { content: result, product };
}

export default { processWorkflow };
