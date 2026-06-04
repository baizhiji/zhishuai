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
  const prompt = `Generate complete content plan for "${params.topic}":
Platform: ${params.platform || 'Douyin'}
Include: titles(5), body, hashtags(10)`;
  
  const result = await chatCompletion('system', { 
    model: 'qwen-max',
    messages: [{ role: 'user', content: prompt }] 
  });
  
  return { content: result, topic: params.topic, platform: params.platform };
}

async function recruitmentWorkflow(params: { jobTitle: string }) {
  const prompt = `For job "${params.jobTitle}" generate:
1. Complete recruitment JD
2. 5 interview questions`;
  
  const result = await chatCompletion('system', { 
    model: 'qwen-max',
    messages: [{ role: 'user', content: prompt }] 
  });
  
  return { content: result, jobTitle: params.jobTitle };
}

async function customerAcquisitionWorkflow(params: { product: string; targetProfile: string }) {
  const prompt = `Generate outreach message for product "${params.product}":
Target customer: ${params.targetProfile}
Include: opening(3), value proposition, call to action`;
  
  const result = await chatCompletion('system', { 
    model: 'qwen-max',
    messages: [{ role: 'user', content: prompt }] 
  });
  
  return { content: result, product: params.product };
}

export default { processWorkflow };
