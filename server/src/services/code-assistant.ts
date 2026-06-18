/**
 * 编程助手服务
 * 智枢 AI SaaS 系统 - 后端
 * 
 * 功能：
 * 1. 代码生成 — 根据需求描述生成完整代码
 * 2. 代码解释 — 逐段解释代码功能
 * 3. 代码调试 — 分析错误并给出修复方案
 * 4. 单元测试生成 — 自动生成单元测试
 * 5. 代码 Review — 评价代码质量并给出改进建议
 * 6. 自然语言转代码 — 白话描述转代码（非开发者模式）
 * 7. 低代码搭建 — 生成组件描述/配置（非开发者模式）
 */

import { aiModelRouter } from './ai-model-router';
import { CODE_PROMPTS } from './ai-prompts';

export interface CodeAssistantRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  taskType: 'generate' | 'explain' | 'debug' | 'testgen' | 'review' | 'nl2code' | 'lowcode';
  language?: string;
  userMode?: 'developer' | 'non-developer';
  stream?: boolean;
  model?: string;
}

export interface CodeAssistantResponse {
  content: string;
  modelUsed: string;
  isFallback: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export class CodeAssistantService {
  /**
   * 处理编程助手请求（非流式）
   */
  static async process(request: CodeAssistantRequest): Promise<CodeAssistantResponse> {
    const { messages, taskType, language = 'javascript', userMode = 'developer', model } = request;

    const systemPrompt = this.getSystemPrompt(taskType, language, userMode);
    
    const result = await aiModelRouter.route(
      messages[messages.length - 1]?.content || '',
      model,
      systemPrompt
    );

    return {
      content: result.content,
      modelUsed: result.modelUsed,
      isFallback: result.isFallback,
      usage: result.usage,
    };
  }

  /**
   * 处理编程助手请求（流式 SSE）
   */
  static async processStream(
    request: CodeAssistantRequest,
    onChunk: (chunk: string) => void,
    onDone: (fullResponse: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const { messages, taskType, language = 'javascript', userMode = 'developer', model } = request;

    const systemPrompt = this.getSystemPrompt(taskType, language, userMode);

    return await aiModelRouter.routeStream(
      messages[messages.length - 1]?.content || '',
      systemPrompt,
      model,
      onChunk,
      onDone,
      onError
    );
  }

  /**
   * 根据任务类型获取对应的 system prompt
   */
  private static getSystemPrompt(
    taskType: string,
    language?: string,
    userMode: string = 'developer'
  ): string {
    const isDev = userMode !== 'non-developer';
    const lang = language || 'javascript';

    const promptTemplates = CODE_PROMPTS;

    switch (taskType) {
      case 'generate':
        return promptTemplates.generate(lang, isDev);
      case 'explain':
        return promptTemplates.explain(lang, isDev);
      case 'debug':
        return promptTemplates.debug(lang, isDev);
      case 'testgen':
        return promptTemplates.testgen(lang, isDev);
      case 'review':
        return promptTemplates.review(lang, isDev);
      case 'nl2code':
        return promptTemplates.nl2code(lang, isDev);
      case 'lowcode':
        return promptTemplates.lowcode(lang, isDev);
      default:
        return promptTemplates.generate(lang, isDev);
    }
  }
}
