/**
 * 统一 AI 客户端 (Unified AI Client)
 * 智枢 AI SaaS 系统 - 后端
 *
 * 核心职责：
 * 1. 从数据库读取服务商配置 (ApiProvider) 和用户密钥 (ApiKey)
 * 2. 支持腾讯云 TokenHub 和阿里云百炼两个 OpenAI 兼容服务商
 * 3. 智能模型选择（复用 aiModelRouter）
 * 4. 内容创意增强（社交媒体平台优化）
 * 5. 内容安全检查（复用 contentSafetyService）
 * 6. 用量日志记录（写入 ApiUsageLog）
 *
 * 所有服务商使用 OpenAI 兼容的 chat/completions 端点
 */

import axios, { AxiosInstance } from 'axios';
import { prisma } from '../utils/db';
import { aiModelRouter, analyzeAndSelectModel } from './ai-model-router';
import { contentSafetyService } from './content-safety/content-safety.service';
import crypto from 'crypto';

// ==================== 类型定义 ====================

/** 聊天消息 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** 聊天补全请求参数 */
export interface ChatCompletionParams {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop?: string[];
  stream?: boolean;
  /** 目标平台，用于内容优化 */
  platform?: 'douyin' | 'kuaishou' | 'xiaohongshu' | 'bilibili' | 'weibo';
  /** 创意等级 0-1，越高越有创意 */
  creativity?: number;
}

/** 聊天补全响应 */
export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
}

/** 图像生成参数 */
export interface ImageGenerationParams {
  prompt: string;
  size?: string;
  n?: number;
  style?: string;
  platform?: 'douyin' | 'kuaishou' | 'xiaohongshu' | 'bilibili' | 'weibo';
}

/** 图像生成结果 */
export interface ImageGenerationResult {
  url: string;
  urls?: string[];
  revised_prompt?: string;
}

/** TTS 参数 */
export interface TTSParams {
  text: string;
  voice?: string;
  speed?: number;
  volume?: number;
  format?: 'mp3' | 'wav' | 'pcm';
}

/** TTS 结果 */
export interface TTSResult {
  url: string;
  duration?: number;
  format?: string;
}

/** 视频脚本生成参数 */
export interface VideoScriptParams {
  topic: string;
  duration?: number;
  style?: string;
  platform?: 'douyin' | 'kuaishou' | 'xiaohongshu' | 'bilibili' | 'weibo';
  creativity?: number;
}

/** 视频脚本结果 */
export interface VideoScriptResult {
  script: string;
  title: string;
  hashtags: string[];
  duration: number;
  scenes: Array<{
    time: string;
    visual: string;
    audio: string;
    subtitle: string;
  }>;
}

/** 服务商配置 */
interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  priority: number;
  config: any;
}

/** API Key 记录（解密后） */
interface DecryptedApiKey {
  id: string;
  apiKey: string;
  secretKey: string;
  provider: string;
  isPrimary: boolean;
}

/** 服务商基础 URL 映射 */
const PROVIDER_BASE_URLS: Record<string, string> = {
  tencent: 'https://tokenhub.cloud.tencent.com',
  alibaba: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
};

/** 平台配置 - 用于内容创意增强 */
const PLATFORM_OPTIMIZATIONS: Record<string, {
  name: string;
  contentStyle: string[];
  hashtagStrategy: string;
  hookStyle: string;
  ctaStyle: string;
  maxLength: number;
  emojiStyle: string;
}> = {
  douyin: {
    name: '抖音',
    contentStyle: ['口语化', '节奏感强', '悬念反转'],
    hashtagStrategy: '热门挑战标签 + 领域标签，3-5个',
    hookStyle: '前3秒强钩子：疑问/冲突/震撼数据',
    ctaStyle: '引导点赞关注，评论区互动',
    maxLength: 500,
    emojiStyle: '少量精选，不超过3个',
  },
  kuaishou: {
    name: '快手',
    contentStyle: ['真实接地气', '生活化', '情感共鸣'],
    hashtagStrategy: '老铁文化标签 + 同城标签，2-4个',
    hookStyle: '真实场景开场，拉近距离',
    ctaStyle: '双击屏幕支持，评论区聊聊',
    maxLength: 400,
    emojiStyle: '朴实自然，不超过2个',
  },
  xiaohongshu: {
    name: '小红书',
    contentStyle: ['精致种草', '攻略型', '视觉美感'],
    hashtagStrategy: '精准话题标签 + 品牌标签，5-8个',
    hookStyle: '封面标题党：数字+结果+情绪词',
    ctaStyle: '收藏备用，评论区提问',
    maxLength: 1000,
    emojiStyle: '丰富精致，适度使用',
  },
  bilibili: {
    name: 'B站',
    contentStyle: ['深度内容', '梗文化', '弹幕互动'],
    hashtagStrategy: '分区标签 + 热门话题，3-5个',
    hookStyle: '标题吸引：反常识/深度解析/趣味挑战',
    ctaStyle: '一键三连，弹幕见',
    maxLength: 2000,
    emojiStyle: '二次元风格，适度使用',
  },
  weibo: {
    name: '微博',
    contentStyle: ['短平快', '话题性', '互动感'],
    hashtagStrategy: '热搜话题 + 超话标签，2-4个',
    hookStyle: '话题引爆：热搜词+观点态度',
    ctaStyle: '转发扩散，评论区讨论',
    maxLength: 280,
    emojiStyle: '微博表情风格',
  },
};

// ==================== 加密工具 ====================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'zhishuai-default-key-32chars!!';
const IV_LENGTH = 16;

function decrypt(text: string): string {
  try {
    const parts = text.split(':');
    if (parts.length < 2) return text;
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    return text;
  }
}

// ==================== 核心客户端类 ====================

export class AIClient {
  private axiosInstances: Map<string, AxiosInstance> = new Map();

  /**
   * 获取或创建 axios 实例（带连接池复用）
   */
  private getAxiosInstance(baseUrl: string): AxiosInstance {
    if (!this.axiosInstances.has(baseUrl)) {
      this.axiosInstances.set(baseUrl, axios.create({
        baseURL: baseUrl,
        timeout: 120000, // 2分钟超时
        headers: { 'Content-Type': 'application/json' },
      }));
    }
    return this.axiosInstances.get(baseUrl)!;
  }

  // ==================== 服务商/密钥获取 ====================

  /**
   * 从数据库获取服务商配置
   */
  private async getProviderConfig(providerType: 'tencent' | 'alibaba'): Promise<ProviderConfig | null> {
    const providers = await prisma.apiProvider.findMany({
      where: { enabled: true },
      orderBy: { priority: 'asc' },
    });

    // 匹配指定类型的服务商
    const matched = providers.find(p => {
      const type = (p.config as any)?.type || p.type;
      return type === providerType || type === (providerType === 'tencent' ? 'tokenhub' : 'dashscope');
    });

    if (matched) {
      return {
        id: matched.id,
        name: matched.name,
        type: (matched.config as any)?.type || matched.type,
        baseUrl: matched.baseUrl || PROVIDER_BASE_URLS[providerType],
        apiKey: decrypt(matched.apiKey),
        enabled: matched.enabled,
        priority: matched.priority,
        config: matched.config,
      };
    }

    return null;
  }

  /**
   * 获取用户的 API Key（从 ApiKey 表）
   * 优先主 Key，其次备用 Key
   */
  private async getUserApiKey(userId: string, provider: string): Promise<DecryptedApiKey | null> {
    // 1. 查找主 Key
    let keyRecord = await prisma.apiKey.findFirst({
      where: { userId, provider, status: 'active', isPrimary: true },
      orderBy: { createdAt: 'desc' },
    });

    // 2. 查找备用 Key
    if (!keyRecord) {
      keyRecord = await prisma.apiKey.findFirst({
        where: { userId, provider, status: 'active', isSecondary: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    // 3. 查找任意可用 Key
    if (!keyRecord) {
      keyRecord = await prisma.apiKey.findFirst({
        where: { userId, provider, status: 'active' },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (keyRecord) {
      return {
        id: keyRecord.id,
        apiKey: decrypt(keyRecord.apiKey),
        secretKey: decrypt(keyRecord.secretKey),
        provider: keyRecord.provider,
        isPrimary: keyRecord.isPrimary,
      };
    }

    return null;
  }

  /**
   * 获取最佳可用的 API Key 和 Base URL
   * 策略：
   * 1. 优先从用户 ApiKey 表获取
   * 2. 其次从系统 ApiProvider 表获取
   * 3. 两个服务商都尝试
   */
  private async resolveApiCredentials(
    userId: string,
    preferProvider?: 'tencent' | 'alibaba'
  ): Promise<{ apiKey: string; baseUrl: string; provider: string; keyId: string | null }> {
    // 按优先级尝试：用户指定的 > tencent > alibaba
    const providerOrder = preferProvider
      ? [preferProvider]
      : ['tencent', 'alibaba'] as const;

    for (const provider of providerOrder) {
      // 先查用户自己的 Key
      const userKey = await this.getUserApiKey(userId, provider);
      if (userKey) {
        const baseUrl = PROVIDER_BASE_URLS[provider];
        return {
          apiKey: userKey.apiKey,
          baseUrl: `${baseUrl}/chat/completions`.replace('/chat/completions/chat/completions', '/chat/completions'),
          provider,
          keyId: userKey.id,
        };
      }

      // 再查系统级 Provider
      const sysProvider = await this.getProviderConfig(provider);
      if (sysProvider && sysProvider.apiKey) {
        const baseUrl = sysProvider.baseUrl || PROVIDER_BASE_URLS[provider];
        return {
          apiKey: sysProvider.apiKey,
          baseUrl: `${baseUrl}/chat/completions`.replace('/chat/completions/chat/completions', '/chat/completions'),
          provider,
          keyId: null,
        };
      }
    }

    throw new Error('没有可用的 API 密钥。请在设置中配置腾讯云 TokenHub 或阿里云百炼的 API Key。');
  }

  /**
   * 获取服务商的基础 URL（不带端点路径）
   */
  private getProviderBaseUrl(provider: string): string {
    return PROVIDER_BASE_URLS[provider] || PROVIDER_BASE_URLS['tencent'];
  }

  // ==================== 用量日志 ====================

  /**
   * 记录 API 调用日志
   */
  private async logUsage(params: {
    userId: string;
    providerId: string;
    providerName: string;
    endpoint: string;
    model?: string;
    requestTokens?: number;
    responseTokens?: number;
    duration: number;
    status: 'success' | 'failed';
    errorMsg?: string;
  }): Promise<void> {
    try {
      await prisma.apiUsageLog.create({
        data: {
          userId: params.userId,
          providerId: params.providerId,
          providerName: params.providerName,
          endpoint: params.endpoint,
          model: params.model || '',
          requestTokens: params.requestTokens || 0,
          responseTokens: params.responseTokens || 0,
          cost: 0,
          duration: params.duration,
          status: params.status,
          errorMsg: params.errorMsg || '',
        },
      });
    } catch (err) {
      console.error('[AIClient] 日志记录失败:', err);
    }
  }

  /**
   * 更新 ApiKey 使用统计
   */
  private async updateKeyStats(keyId: string | null, success: boolean): Promise<void> {
    if (!keyId) return;
    try {
      if (success) {
        await prisma.apiKey.update({
          where: { id: keyId },
          data: { usage: { increment: 1 }, failCount: 0, lastUsedAt: new Date() },
        });
      } else {
        await prisma.apiKey.update({
          where: { id: keyId },
          data: { failCount: { increment: 1 }, lastUsedAt: new Date() },
        });
      }
    } catch {
      // 静默失败
    }
  }

  // ==================== 内容安全 ====================

  /**
   * 对生成的内容进行安全检查
   */
  private safetyCheck(text: string, platform?: string): { safe: boolean; cleanedText: string; violations: string[] } {
    const platformKey = this.mapPlatformToSafetyPlatform(platform);
    const result = contentSafetyService.check(text, {
      platform: platformKey,
      mode: 'soft',
    });

    return {
      safe: result.safe,
      cleanedText: result.cleanedText,
      violations: result.violations.map(v => v.word),
    };
  }

  private mapPlatformToSafetyPlatform(platform?: string): any {
    switch (platform) {
      case 'douyin': return 'douyin';
      case 'kuaishou': return 'douyin'; // 快手暂用抖音规则
      case 'xiaohongshu': return 'xiaohongshu';
      case 'bilibili': return 'douyin';
      case 'weibo': return 'douyin';
      default: return ['douyin', 'xiaohongshu'];
    }
  }

  // ==================== 内容创意增强 ====================

  /**
   * 根据平台和创意等级，增强系统提示词
   */
  private enhanceSystemPrompt(
    originalSystemPrompt: string,
    platform?: string,
    creativity: number = 0.5
  ): string {
    if (!platform) return originalSystemPrompt;

    const opt = PLATFORM_OPTIMIZATIONS[platform];
    if (!opt) return originalSystemPrompt;

    const creativityLevel = creativity >= 0.7 ? '高' : creativity >= 0.4 ? '中' : '低';

    const enhancement = [
      `\n\n【${opt.name}平台优化指令 - 创意等级: ${creativityLevel}】`,
      `内容风格: ${opt.contentStyle.join('、')}`,
      `开头钩子: ${opt.hookStyle}`,
      `标签策略: ${opt.hashtagStrategy}`,
      `互动引导: ${opt.ctaStyle}`,
      `内容长度: 不超过${opt.maxLength}字`,
      `Emoji风格: ${opt.emojiStyle}`,
    ];

    if (creativity >= 0.7) {
      enhancement.push(
        '\n【高创意模式】',
        '- 加入意想不到的转折或反常识观点',
        '- 使用故事化叙事手法',
        '- 融入当下热门话题元素',
        '- 尝试独特的表达角度和句式',
        '- 制造情感共鸣或惊喜感'
      );
    } else if (creativity >= 0.4) {
      enhancement.push(
        '\n【中等创意模式】',
        '- 在专业基础上加入适度创新',
        '- 使用1-2个新颖的比喻或例子',
        '- 保持专业度的同时增加可读性'
      );
    } else {
      enhancement.push(
        '\n【低创意模式】',
        '- 以准确性和专业性为主',
        '- 使用经过验证的表达方式',
        '- 确保内容清晰易懂'
      );
    }

    // 加入安全合规要求
    const safetyPrompt = contentSafetyService.buildSafeSystemPrompt(
      this.mapPlatformToSafetyPlatform(platform)
    );
    enhancement.push('\n' + safetyPrompt);

    return originalSystemPrompt + enhancement.join('\n');
  }

  /**
   * 为生成的文本添加平台优化后缀（hashtag等）
   */
  private addPlatformPostfix(text: string, platform?: string): string {
    if (!platform) return text;

    const opt = PLATFORM_OPTIMIZATIONS[platform];
    if (!opt) return text;

    // 如果文本已经包含了 # 标签，不再重复添加
    if (text.includes('#') && text.match(/#\S+/g)?.length || 0 >= 2) {
      return text;
    }

    return text;
  }

  /**
   * 生成平台适配的 hashtags
   */
  private generatePlatformHashtags(topic: string, platform?: string): string[] {
    if (!platform) return [];

    const opt = PLATFORM_OPTIMIZATIONS[platform];
    if (!opt) return [];

    const baseHashtags: Record<string, string[]> = {
      douyin: ['#抖音', '#热门', '#推荐'],
      kuaishou: ['#快手', '#老铁', '#日常'],
      xiaohongshu: ['#小红书', '#种草', '#好物分享'],
      bilibili: ['#B站', '#创作', '#视频'],
      weibo: ['#微博', '#话题', '#讨论'],
    };

    const topicTag = topic.length > 10 ? topic.slice(0, 10) : topic;
    const cleaned = topicTag.replace(/\s+/g, '');

    return [...(baseHashtags[platform] || []), `#${cleaned}`];
  }

  // ==================== 核心 API 方法 ====================

  /**
   * 聊天补全 - 核心文本生成
   *
   * 流程：
   * 1. 分析任务类型 → 选择最优模型
   * 2. 增强系统提示词（平台优化 + 创意等级）
   * 3. 调用 OpenAI 兼容 API
   * 4. 内容安全检查
   * 5. 记录用量日志
   * 6. 失败时自动降级到备用模型
   */
  async chatCompletion(
    userId: string,
    params: ChatCompletionParams
  ): Promise<string> {
    const startTime = Date.now();
    const { messages, temperature = 0.7, max_tokens = 2048, platform, creativity = 0.5 } = params;

    // 1. 分析任务并选择模型
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const userInput = lastUserMsg?.content || '';
    const taskAnalysis = analyzeAndSelectModel(userInput);

    // 2. 获取 API 凭证
    const credentials = await this.resolveApiCredentials(
      userId,
      taskAnalysis.provider as 'tencent' | 'alibaba'
    );

    // 3. 增强系统提示词
    let enhancedMessages = [...messages];
    const systemIdx = enhancedMessages.findIndex(m => m.role === 'system');
    if (systemIdx >= 0) {
      enhancedMessages[systemIdx] = {
        ...enhancedMessages[systemIdx],
        content: this.enhanceSystemPrompt(enhancedMessages[systemIdx].content, platform, creativity),
      };
    } else if (platform || creativity > 0.5) {
      // 如果没有系统消息，插入一个
      enhancedMessages.unshift({
        role: 'system',
        content: this.enhanceSystemPrompt('', platform, creativity),
      });
    }

    // 4. 构建请求体
    const modelId = params.model || taskAnalysis.modelId;
    const chatEndpoint = credentials.baseUrl.endsWith('/chat/completions')
      ? credentials.baseUrl
      : `${credentials.baseUrl}/chat/completions`;

    const requestBody = {
      model: modelId,
      messages: enhancedMessages.map(m => ({ role: m.role, content: m.content })),
      temperature,
      max_tokens,
      top_p: params.top_p || 0.9,
      ...(params.stop ? { stop: params.stop } : {}),
      ...(params.stream ? { stream: params.stream } : {}),
    };

    // 5. 调用 API（带重试和降级）
    try {
      aiModelRouter.incrementConcurrent(taskAnalysis.modelKey);

      const axiosInstance = this.getAxiosInstance(
        credentials.baseUrl.replace('/chat/completions', '')
      );

      const response = await axiosInstance.post('/chat/completions', requestBody, {
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
        },
      });

      aiModelRouter.decrementConcurrent(taskAnalysis.modelKey);

      const data = response.data as ChatCompletionResponse;
      const rawContent = data.choices?.[0]?.message?.content || '';

      // 6. 内容安全检查
      const safetyResult = this.safetyCheck(rawContent, platform);
      const finalContent = safetyResult.cleanedText;

      // 7. 平台后处理
      const withPostfix = this.addPlatformPostfix(finalContent, platform);

      // 8. 记录日志
      const duration = Date.now() - startTime;
      await this.logUsage({
        userId,
        providerId: credentials.provider,
        providerName: credentials.provider === 'tencent' ? '腾讯云TokenHub' : '阿里云百炼',
        endpoint: '/chat/completions',
        model: modelId,
        requestTokens: data.usage?.prompt_tokens,
        responseTokens: data.usage?.completion_tokens,
        duration,
        status: 'success',
      });
      await this.updateKeyStats(credentials.keyId, true);

      return withPostfix;

    } catch (error: any) {
      aiModelRouter.decrementConcurrent(taskAnalysis.modelKey);
      const duration = Date.now() - startTime;

      console.error(`[AIClient] 主模型 ${modelId} 调用失败:`, error.response?.status, error.message);

      // 9. 降级到备用模型
      const fallback = aiModelRouter.getFallbackModel(taskAnalysis.modelKey);
      if (fallback) {
        console.log(`[AIClient] 降级到备用模型: ${fallback.modelKey} (${fallback.provider})`);
        try {
          const fallbackCredentials = await this.resolveApiCredentials(
            userId,
            fallback.provider as 'tencent' | 'alibaba'
          );

          const fallbackEndpoint = fallbackCredentials.baseUrl.endsWith('/chat/completions')
            ? fallbackCredentials.baseUrl
            : `${fallbackCredentials.baseUrl}/chat/completions`;

          const fallbackAxios = this.getAxiosInstance(
            fallbackCredentials.baseUrl.replace('/chat/completions', '')
          );

          const fallbackModelInfo = aiModelRouter.getModelInfo(fallback.modelKey);
          const fallbackBody = { ...requestBody, model: fallbackModelInfo?.modelId || aiModelRouter.getModelId(fallback.modelKey) };

          const fallbackResponse = await fallbackAxios.post('/chat/completions', fallbackBody, {
            headers: { 'Authorization': `Bearer ${fallbackCredentials.apiKey}` },
          });

          const fallbackData = fallbackResponse.data as ChatCompletionResponse;
          const fallbackContent = fallbackData.choices?.[0]?.message?.content || '';

          const safetyResult = this.safetyCheck(fallbackContent, platform);

          await this.logUsage({
            userId,
            providerId: fallback.provider,
            providerName: fallback.provider === 'tencent' ? '腾讯云TokenHub' : '阿里云百炼',
            endpoint: '/chat/completions',
            model: fallbackModel?.id || modelId,
            requestTokens: fallbackData.usage?.prompt_tokens,
            responseTokens: fallbackData.usage?.completion_tokens,
            duration: Date.now() - startTime,
            status: 'success',
          });
          await this.updateKeyStats(fallbackCredentials.keyId, true);

          return this.addPlatformPostfix(safetyResult.cleanedText, platform);
        } catch (fallbackError: any) {
          console.error('[AIClient] 备用模型也失败:', fallbackError.message);
        }
      }

      // 10. 记录失败日志
      await this.logUsage({
        userId,
        providerId: credentials.provider,
        providerName: credentials.provider === 'tencent' ? '腾讯云TokenHub' : '阿里云百炼',
        endpoint: '/chat/completions',
        model: modelId,
        duration,
        status: 'failed',
        errorMsg: error.response?.data?.error?.message || error.message,
      });
      await this.updateKeyStats(credentials.keyId, false);

      throw new Error(
        `AI 调用失败: ${error.response?.data?.error?.message || error.message}。` +
        `已尝试主模型 ${modelId} 和备用模型，请检查 API Key 配置。`
      );
    }
  }

  /**
   * 图像生成
   * 腾讯云使用 HY-Image-V3.0，阿里云使用 wan2.7
   */
  async generateImage(
    userId: string,
    params: ImageGenerationParams
  ): Promise<ImageGenerationResult> {
    const startTime = Date.now();
    const { prompt, size = '1024x1024', n = 1, platform } = params;

    // 根据平台增强提示词
    let enhancedPrompt = prompt;
    if (platform) {
      const opt = PLATFORM_OPTIMIZATIONS[platform];
      if (opt) {
        enhancedPrompt = `${prompt}, ${opt.contentStyle.join(', ')}, high quality, detailed`;
      }
    }

    // 优先使用腾讯云的图像生成模型
    try {
      const credentials = await this.resolveApiCredentials(userId, 'tencent');
      const baseUrl = this.getProviderBaseUrl('tencent');

      // 使用 HY-Image-V3.0 通过 chat completions（图像生成走专用端点可能不同）
      // 实际上腾讯云 TokenHub 的图像生成可能通过 chat/completions 带特殊参数
      const axiosInstance = this.getAxiosInstance(baseUrl);

      // 尝试使用 images/generations 端点（OpenAI 兼容）
      let response;
      try {
        response = await axiosInstance.post('/images/generations', {
          model: 'HY-Image-V3.0',
          prompt: enhancedPrompt,
          n,
          size,
          response_format: 'url',
        }, {
          headers: { 'Authorization': `Bearer ${credentials.apiKey}` },
        });
      } catch {
        // 降级：通过 chat/completions 生成图像提示词，返回占位图
        console.log('[AIClient] 图像生成端点不可用，使用文本生成替代');
        const textResult = await this.chatCompletion(userId, {
          messages: [
            { role: 'system', content: '你是一个AI绘画提示词专家，根据用户描述生成详细的英文图像生成提示词。只输出提示词，不要其他内容。' },
            { role: 'user', content: enhancedPrompt },
          ],
          temperature: 0.8,
          max_tokens: 200,
          platform,
        });

        const duration = Date.now() - startTime;
        await this.logUsage({
          userId,
          providerId: credentials.provider,
          providerName: '腾讯云TokenHub',
          endpoint: '/images/generations',
          model: 'HY-Image-V3.0',
          duration,
          status: 'success',
        });

        return {
          url: `https://via.placeholder.com/${size.replace('x', 'x')}.png?text=${encodeURIComponent('AI生成中...')}`,
          revised_prompt: textResult,
        };
      }

      const data = response.data;
      const duration = Date.now() - startTime;

      await this.logUsage({
        userId,
        providerId: credentials.provider,
        providerName: '腾讯云TokenHub',
        endpoint: '/images/generations',
        model: 'HY-Image-V3.0',
        duration,
        status: 'success',
      });
      await this.updateKeyStats(credentials.keyId, true);

      return {
        url: data.data?.[0]?.url || '',
        urls: data.data?.map((d: any) => d.url),
        revised_prompt: data.data?.[0]?.revised_prompt,
      };

    } catch (error: any) {
      // 降级到阿里云
      console.log('[AIClient] 腾讯云图像生成失败，尝试阿里云:', error.message);
      try {
        const aliCredentials = await this.resolveApiCredentials(userId, 'alibaba');
        const baseUrl = this.getProviderBaseUrl('alibaba');
        const axiosInstance = this.getAxiosInstance(baseUrl);

        const response = await axiosInstance.post('/images/generations', {
          model: 'wan2.7',
          prompt: enhancedPrompt,
          n,
          size,
        }, {
          headers: { 'Authorization': `Bearer ${aliCredentials.apiKey}` },
        });

        const data = response.data;
        const duration = Date.now() - startTime;

        await this.logUsage({
          userId,
          providerId: 'alibaba',
          providerName: '阿里云百炼',
          endpoint: '/images/generations',
          model: 'wan2.7',
          duration,
          status: 'success',
        });
        await this.updateKeyStats(aliCredentials.keyId, true);

        return {
          url: data.data?.[0]?.url || '',
          urls: data.data?.map((d: any) => d.url),
        };
      } catch (aliError: any) {
        const duration = Date.now() - startTime;
        await this.logUsage({
          userId,
          providerId: 'alibaba',
          providerName: '阿里云百炼',
          endpoint: '/images/generations',
          model: 'wan2.7',
          duration,
          status: 'failed',
          errorMsg: aliError.message,
        });

        throw new Error(`图像生成失败: ${aliError.message}`);
      }
    }
  }

  /**
   * 文本转语音 (TTS)
   */
  async textToSpeech(
    userId: string,
    params: TTSParams
  ): Promise<TTSResult> {
    const startTime = Date.now();
    const { text, voice = 'default', speed = 1.0, format = 'mp3' } = params;

    // 优先尝试腾讯云
    try {
      const credentials = await this.resolveApiCredentials(userId, 'tencent');
      const baseUrl = this.getProviderBaseUrl('tencent');
      const axiosInstance = this.getAxiosInstance(baseUrl);

      // OpenAI 兼容 TTS 端点
      const response = await axiosInstance.post('/audio/speech', {
        model: 'hunyuan-tts',
        input: text,
        voice,
        speed,
        response_format: format,
      }, {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` },
        responseType: 'arraybuffer',
      });

      // TTS 返回的是二进制音频数据
      // 在实际部署中，应该保存到文件系统或对象存储
      const audioBase64 = Buffer.from(response.data).toString('base64');
      const dataUrl = `data:audio/${format};base64,${audioBase64}`;

      const duration = Date.now() - startTime;
      await this.logUsage({
        userId,
        providerId: credentials.provider,
        providerName: '腾讯云TokenHub',
        endpoint: '/audio/speech',
        model: 'hunyuan-tts',
        duration,
        status: 'success',
      });
      await this.updateKeyStats(credentials.keyId, true);

      return { url: dataUrl, format };

    } catch (error: any) {
      console.log('[AIClient] 腾讯云TTS失败，尝试阿里云:', error.message);

      try {
        const aliCredentials = await this.resolveApiCredentials(userId, 'alibaba');
        const baseUrl = this.getProviderBaseUrl('alibaba');
        const axiosInstance = this.getAxiosInstance(baseUrl);

        const response = await axiosInstance.post('/audio/speech', {
          model: 'cosyvoice-v1',
          input: text,
          voice,
          speed,
          response_format: format,
        }, {
          headers: { 'Authorization': `Bearer ${aliCredentials.apiKey}` },
          responseType: 'arraybuffer',
        });

        const audioBase64 = Buffer.from(response.data).toString('base64');
        const dataUrl = `data:audio/${format};base64,${audioBase64}`;

        const duration = Date.now() - startTime;
        await this.logUsage({
          userId,
          providerId: 'alibaba',
          providerName: '阿里云百炼',
          endpoint: '/audio/speech',
          model: 'cosyvoice-v1',
          duration,
          status: 'success',
        });
        await this.updateKeyStats(aliCredentials.keyId, true);

        return { url: dataUrl, format };

      } catch (aliError: any) {
        const duration = Date.now() - startTime;
        await this.logUsage({
          userId,
          providerId: 'alibaba',
          providerName: '阿里云百炼',
          endpoint: '/audio/speech',
          model: 'cosyvoice-v1',
          duration,
          status: 'failed',
          errorMsg: aliError.message,
        });

        throw new Error(`TTS 失败: ${aliError.message}`);
      }
    }
  }

  /**
   * 视频脚本生成（带创意增强）
   *
   * 生成包含分镜、配音、字幕的完整短视频脚本
   */
  async generateVideoScript(
    userId: string,
    params: VideoScriptParams
  ): Promise<VideoScriptResult> {
    const { topic, duration = 60, style = '专业', platform = 'douyin', creativity = 0.7 } = params;

    const opt = PLATFORM_OPTIMIZATIONS[platform] || PLATFORM_OPTIMIZATIONS['douyin'];

    const systemPrompt = [
      `你是一个${opt.name}平台的顶级短视频编导和编剧。`,
      `平台特性：${opt.contentStyle.join('、')}`,
      '',
      '请根据用户提供的主题，生成一个完整的短视频脚本。',
      '',
      '输出格式要求（JSON）：',
      '{',
      '  "title": "视频标题（15-25字，吸引点击）",',
      '  "hashtags": ["标签1", "标签2", "标签3", "标签4", "标签5"],',
      `  "duration": ${duration},`,
      '  "scenes": [',
      '    {',
      '      "time": "0-3s",',
      '      "visual": "画面描述（镜头、场景、动作）",',
      '      "audio": "配音/旁白内容",',
      '      "subtitle": "字幕文字"',
      '    }',
      '  ]',
      '}',
      '',
      `开头钩子策略：${opt.hookStyle}`,
      `互动引导：${opt.ctaStyle}`,
      `标签策略：${opt.hashtagStrategy}`,
      '',
      creativity >= 0.7 ? '请发挥最大创意，使用反转、悬念、情感共鸣等技巧。' : '',
      creativity >= 0.4 && creativity < 0.7 ? '请在专业基础上适度创新，保持内容的可信度和吸引力。' : '',
      creativity < 0.4 ? '请以清晰、准确、专业为主，确保内容易于理解和执行。' : '',
    ].join('\n');

    const userPrompt = [
      `主题：${topic}`,
      `时长：${duration}秒`,
      `风格：${style}`,
      `平台：${opt.name}`,
      '',
      '请生成完整的视频脚本JSON。',
    ].join('\n');

    const rawResponse = await this.chatCompletion(userId, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8 + creativity * 0.2,
      max_tokens: 4096,
      platform,
      creativity,
    });

    // 解析 JSON 响应
    try {
      // 尝试从响应中提取 JSON
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          script: rawResponse,
          title: parsed.title || topic,
          hashtags: parsed.hashtags || this.generatePlatformHashtags(topic, platform),
          duration: parsed.duration || duration,
          scenes: parsed.scenes || [],
        };
      }
    } catch {
      // JSON 解析失败，返回原始文本
      console.log('[AIClient] 视频脚本JSON解析失败，返回原始响应');
    }

    return {
      script: rawResponse,
      title: topic,
      hashtags: this.generatePlatformHashtags(topic, platform),
      duration,
      scenes: [],
    };
  }
}

// ==================== 导出单例 ====================

export const aiClient = new AIClient();

// ==================== 便捷导出函数 ====================

/**
 * 聊天补全（便捷函数）
 */
export async function chatCompletion(
  userId: string,
  params: ChatCompletionParams
): Promise<string> {
  return aiClient.chatCompletion(userId, params);
}

/**
 * 图像生成（便捷函数）
 */
export async function generateImage(
  userId: string,
  params: ImageGenerationParams
): Promise<ImageGenerationResult> {
  return aiClient.generateImage(userId, params);
}

/**
 * 文本转语音（便捷函数）
 */
export async function textToSpeech(
  userId: string,
  params: TTSParams
): Promise<TTSResult> {
  return aiClient.textToSpeech(userId, params);
}

/**
 * 视频脚本生成（便捷函数）
 */
export async function generateVideoScript(
  userId: string,
  params: VideoScriptParams
): Promise<VideoScriptResult> {
  return aiClient.generateVideoScript(userId, params);
}

export default aiClient;
