import { chatCompletion } from './ai-service';
import { generatePrompt } from './ai-prompts';

/**
 * AI 工作流处理
 */

// 工作流类型
type WorkflowType = 'content_production' | 'recruitment' | 'customer_acquisition';

/**
 * 处理工作流
 */
export async function processWorkflow(workflowType: WorkflowType, params: any): Promise<any> {
  switch (workflowType) {
    case 'content_production':
      return await contentProductionWorkflow(params);
    case 'recruitment':
      return await recruitmentWorkflow(params);
    case 'customer_acquisition':
      return await customerAcquisitionWorkflow(params);
    default:
      throw new Error(`Unknown workflow type: ${workflowType}`);
  }
}

/**
 * 内容生产工作流
 */
async function contentProductionWorkflow(params: { topic: string; platform: string; title?: string }) {
  // 1. 生成标题
  const titlePrompt = generatePrompt('title', { topic: params.topic, platform: params.platform });
  const titleResult = await chatCompletion([
    { role: 'user', content: `${titlePrompt}\n\n请生成5个标题。` }
  ]);
  
  // 2. 生成脚本
  const scriptPrompt = generatePrompt('script', { 
    topic: params.topic, 
    duration: params.duration || 60,
    style: params.style || '知识分享'
  });
  const scriptResult = await chatCompletion([
    { role: 'user', content: `${scriptPrompt}\n\n请生成一个完整的分镜脚本。` }
  ]);
  
  // 3. 生成话题标签
  const hashtagsPrompt = generatePrompt('hashtags', { topic: params.topic, platform: params.platform, count: 10 });
  const hashtagsResult = await chatCompletion([
    { role: 'user', content: hashtagsPrompt }
  ]);

  return {
    titles: titleResult,
    script: scriptResult,
    hashtags: hashtagsResult,
    topic: params.topic,
    platform: params.platform,
  };
}

/**
 * 招聘工作流
 */
async function recruitmentWorkflow(params: { jobTitle: string; requirements?: string[]; benefits?: string[] }) {
  // 1. 生成 JD
  const jdPrompt = `为以下职位生成一份专业的招聘JD：
职位：${params.jobTitle}
要求：${params.requirements?.join('、') || '面议'}
福利：${params.benefits?.join('、') || '面议'}`;

  const jdResult = await chatCompletion([
    { role: 'user', content: jdPrompt }
  ]);

  // 2. 生成筛选问题
  const questionPrompt = `为${params.jobTitle}职位生成5个面试必问问题，用于筛选候选人`;
  const questionsResult = await chatCompletion([
    { role: 'user', content: questionPrompt }
  ]);

  return {
    jobDescription: jdResult,
    interviewQuestions: questionsResult,
    jobTitle: params.jobTitle,
  };
}

/**
 * 获客话术工作流
 */
async function customerAcquisitionWorkflow(params: { product: string; targetProfile: string; platform?: string }) {
  // 1. 生成引流话术
  const outreachPrompt = `为以下产品/服务生成引流私信话术：
产品：${params.product}
目标客户画像：${params.targetProfile}
平台：${params.platform || '抖音'}

要求：
1. 生成3个不同风格的话术
2. 每个话术控制在80字以内
3. 像朋友建议，不像销售`;

  const outreachResult = await chatCompletion([
    { role: 'user', content: outreachPrompt }
  ]);

  // 2. 生成跟进话术
  const followupPrompt = `生成跟进话术，当客户未回复时的二次触达：
产品：${params.product}`;

  const followupResult = await chatCompletion([
    { role: 'user', content: followupPrompt }
  ]);

  return {
    outreachMessages: outreachResult,
    followupMessages: followupResult,
    product: params.product,
  };
}

export default { processWorkflow };
