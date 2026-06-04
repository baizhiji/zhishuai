/**
 * AI Workflow Service - Simplified version
 */
import { chatCompletion } from './ai-service';

/**
 * Process workflow
 */
export async function processWorkflow(workflowType: string, params: any): Promise<any> {
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

async function contentProductionWorkflow(params: { topic: string; platform: string }) {
  const prompt = `生成关于"${params.topic}"的完整内容方案：
平台：${params.platform || '抖音'}
包括：标题(5个)、正文、话题标签(10个)`;
  
  const result = await chatCompletion('system', { messages: [{ role: 'user', content: prompt }] });
  
  return { content: result, topic: params.topic, platform: params.platform };
}

async function recruitmentWorkflow(params: { jobTitle: string }) {
  const prompt = `为职位"${params.jobTitle}"生成：
1. 完整的招聘JD
2. 5个面试必问问题`;
  
  const result = await chatCompletion('system', { messages: [{ role: 'user', content: prompt }] });
  
  return { content: result, jobTitle: params.jobTitle };
}

async function customerAcquisitionWorkflow(params: { product: string; targetProfile: string }) {
  const prompt = `为产品"${params.product}"生成引流话术：
目标客户：${params.targetProfile}
包括：开场白(3个)、价值传递、行动引导`;
  
  const result = await chatCompletion('system', { messages: [{ role: 'user', content: prompt }] });
  
  return { content: result, product: params.product };
}

export default { processWorkflow };
