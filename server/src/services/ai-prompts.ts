/**
 * AI 提示词模板
 * 为各种内容类型提供优化后的提示词
 */

// 平台配置
export const PLATFORM_CONFIG = {
  douyin: {
    name: '抖音',
    features: ['短视频', '娱乐性', '节奏快'],
    contentStyle: ['口语化', '节奏感', '悬念感'],
    bestTime: '12:00-13:00, 18:00-21:00',
  },
  kuaishou: {
    name: '快手',
    features: ['真实接地气', '生活化', '互动强'],
    contentStyle: ['真实感', '接地气', '情感共鸣'],
    bestTime: '7:00-9:00, 18:00-22:00',
  },
  xiaohongshu: {
    name: '小红书',
    features: ['图文笔记', '种草', '精致生活'],
    contentStyle: ['精致感', '攻略型', '种草感'],
    bestTime: '10:00-12:00, 20:00-22:00',
  },
  video: {
    name: '视频号',
    features: ['社交传播', '正能量', '情感共鸣'],
    contentStyle: ['情感类', '正能量', '社会话题'],
    bestTime: '7:00-9:00, 12:00-14:00, 18:00-21:00',
  },
};

// 内容生成提示词
export const CONTENT_PROMPTS = {
  title: {
    name: '短视频标题',
    template: (params: { topic: string; platform: string }) => {
      const platform = PLATFORM_CONFIG[params.platform as keyof typeof PLATFORM_CONFIG] || PLATFORM_CONFIG.douyin;
      return `你是一位抖音爆款内容专家，请为以下主题生成高点击率标题。

主题：${params.topic}
平台：${platform.name}

要求：
1. 生成多个标题，每个控制在15-25字
2. 使用技巧：悬念型、数字型、冲突型、情感型
3. 避免标题党、夸大虚假
4. 每行一个标题`;
    },
  },
  script: {
    name: '短视频脚本',
    template: (params: { topic: string; duration: number; style: string }) => {
      return `请为以下主题生成短视频分镜脚本：
主题：${params.topic}
时长：${params.duration}秒
风格：${params.style}

格式：
[时间段] 画面描述 + 配音文字`;
    },
  },
  post: {
    name: '图文帖子',
    template: (params: { topic: string; platform: string }) => {
      const platform = PLATFORM_CONFIG[params.platform as keyof typeof PLATFORM_CONFIG] || PLATFORM_CONFIG.douyin;
      return `生成一篇${platform.name}平台的图文帖子：
主题：${params.topic}

包含：标题、正文、话题标签`;
    },
  },
  hashtags: {
    name: '话题标签',
    template: (params: { topic: string; platform: string; count?: number }) => {
      const platform = PLATFORM_CONFIG[params.platform as keyof typeof PLATFORM_CONFIG] || PLATFORM_CONFIG.douyin;
      const num = params.count || 10;
      return `为${platform.name}平台生成${num}个话题标签：
主题：${params.topic}`;
    },
  },
};

// 生成标题
export function generateTitlePrompt(topic: string, platform: string): string {
  const cfg = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG] || PLATFORM_CONFIG.douyin;
  return CONTENT_PROMPTS.title.template({ topic, platform });
}

// 生成脚本
export function generateScriptPrompt(topic: string, duration: number, style: string): string {
  return CONTENT_PROMPTS.script.template({ topic, duration, style });
}

// 生成帖子
export function generatePostPrompt(topic: string, platform: string): string {
  return CONTENT_PROMPTS.post.template({ topic, platform });
}

// 生成话题标签
export function generateHashtagsPrompt(topic: string, platform: string, count: number = 10): string {
  return CONTENT_PROMPTS.hashtags.template({ topic, platform, count });
}

// 通用生成提示词
export function generatePrompt(contentType: string, params: any): string {
  const prompt = CONTENT_PROMPTS[contentType as keyof typeof CONTENT_PROMPTS];
  if (!prompt) {
    return `生成关于${params.topic || params.content || '指定主题'}的内容`;
  }
  return prompt.template(params);
}

export default CONTENT_PROMPTS;
