/**
 * 内容自动生成服务
 * 匹配Web端'内容自动生成'功能
 * 使用后端 /ai/generate, /ai/image 等真实路由
 */
import { apiClient } from './api.client';
import TokenStorage from '../utils/tokenStorage';

// 内容分类
export enum ContentCategory {
  TITLE = 'title',
  TAGS = 'tags',
  COPYWRITING = 'copywriting',
  IMAGE_TO_TEXT = 'image-to-text',
  XIAOHONGSHU = 'xiaohongshu',
  IMAGE = 'image',
  ECOMMERCE = 'ecommerce',
  VIDEO = 'video',
  VIDEO_ANALYSIS = 'video-analysis',
  DIGITAL_HUMAN = 'digital-human',
}

// 内容分类配置
export const contentCategoryConfig: Record<ContentCategory, {
  label: string
  color: string
  icon: string
  description: string
  type: 'text' | 'image' | 'video'
}> = {
  [ContentCategory.TITLE]: {
    label: '标题',
    color: '#3B82F6',
    icon: 'text',
    description: '生成吸引人的标题，提升内容点击率',
    type: 'text',
  },
  [ContentCategory.TAGS]: {
    label: '话题/标签',
    color: '#8B5CF6',
    icon: 'pricetags',
    description: '生成相关话题标签，增加内容曝光',
    type: 'text',
  },
  [ContentCategory.COPYWRITING]: {
    label: '文案生成',
    color: '#06B6D4',
    icon: 'document-text',
    description: '智能生成文案，根据字数自动判断长短',
    type: 'text',
  },
  [ContentCategory.IMAGE_TO_TEXT]: {
    label: '图生文',
    color: '#10B981',
    icon: 'image',
    description: '根据图片生成文案描述',
    type: 'text',
  },
  [ContentCategory.XIAOHONGSHU]: {
    label: '小红书图文',
    color: '#EF4444',
    icon: 'heart',
    description: '生成小红书风格的图文内容',
    type: 'text',
  },
  [ContentCategory.IMAGE]: {
    label: '图片',
    color: '#F97316',
    icon: 'images',
    description: '生成高质量图片内容',
    type: 'image',
  },
  [ContentCategory.ECOMMERCE]: {
    label: '电商详情页',
    color: '#DC2626',
    icon: 'cart',
    description: '生成电商产品详情页内容',
    type: 'text',
  },
  [ContentCategory.VIDEO]: {
    label: '短视频',
    color: '#EC4899',
    icon: 'videocam',
    description: '生成短视频内容，自动生成字幕、配音和背景音乐',
    type: 'video',
  },
  [ContentCategory.VIDEO_ANALYSIS]: {
    label: '视频解析',
    color: '#8B5CF6',
    icon: 'analytics',
    description: '分析短视频链接，生成新的爆款视频',
    type: 'video',
  },
  [ContentCategory.DIGITAL_HUMAN]: {
    label: '数字人短视频',
    color: '#6366F1',
    icon: 'person',
    description: '使用数字人生成真人出镜视频，支持真人克隆',
    type: 'video',
  },
}

// 风格选项
export const styleOptions = [
  { label: '专业', value: '专业' },
  { label: '活泼', value: '活泼' },
  { label: '商务', value: '商务' },
  { label: '生活化', value: '生活化' },
  { label: '吸引眼球', value: '吸引眼球' },
  { label: '简洁', value: '简洁' },
  { label: '幽默', value: '幽默' },
]

// 图片尺寸选项
export const imageSizeOptions = [
  { label: '正方形 1:1 (1024×1024)', value: '1024x1024' },
  { label: '横版 16:9 (1280×720)', value: '1280x720' },
  { label: '竖版 9:16 (720×1280)', value: '720x1280' },
  { label: '横版 4:3 (1024×768)', value: '1024x768' },
]

// 视频尺寸选项
export const videoSizeOptions = [
  { label: '横屏 16:9 (1920×1080)', value: '1920x1080' },
  { label: '竖屏 9:16 (1080×1920)', value: '1080x1920' },
  { label: '正方形 1:1 (1080×1080)', value: '1080x1080' },
]

// 字幕选项
export const subtitleOptions = [
  { label: '无字幕', value: 'none' },
  { label: '中文', value: 'chinese' },
  { label: '英文', value: 'english' },
  { label: '双语', value: 'bilingual' },
]

// 配音选项
export const voiceoverOptions = [
  { label: '无配音', value: 'none' },
  { label: '女声-普通话', value: 'female-mandarin' },
  { label: '男声-普通话', value: 'male-mandarin' },
  { label: '女声-英文', value: 'female-english' },
  { label: '男声-英文', value: 'male-english' },
]

// 背景音乐选项
export const bgmOptions = [
  { label: '无背景音乐', value: 'none' },
  { label: '动感', value: 'dynamic' },
  { label: '抒情', value: 'lyrical' },
  { label: '商务', value: 'business' },
  { label: '欢快', value: 'cheerful' },
]

// 分析维度选项
export const analysisDimensionOptions = [
  { label: '内容分析', value: 'content' },
  { label: '背景音乐', value: 'music' },
  { label: '字幕分析', value: 'subtitle' },
  { label: '节奏分析', value: 'rhythm' },
  { label: '风格分析', value: 'style' },
]

// 爆款元素选项
export const viralElementOptions = [
  { label: '黄金3秒开头', value: 'opening' },
  { label: '转场效果', value: 'transition' },
  { label: '背景音乐', value: 'music' },
  { label: '字幕样式', value: 'subtitle' },
  { label: '节奏变化', value: 'rhythm' },
]

// 数字人选项（带缩略图）
export const digitalHumanOptions = [
  { 
    label: '商务男1', 
    value: 'system_male_1', 
    type: '系统自带',
    thumbnail: 'https://img.icons8.com/color/96/user-male--v1.png'
  },
  { 
    label: '商务女1', 
    value: 'system_female_1', 
    type: '系统自带',
    thumbnail: 'https://img.icons8.com/color/96/user-female--v1.png'
  },
  { 
    label: '活泼男1', 
    value: 'system_male_2', 
    type: '系统自带',
    thumbnail: 'https://img.icons8.com/color/96/user-male--v1.png'
  },
  { 
    label: '活泼女1', 
    value: 'system_female_2', 
    type: '系统自带',
    thumbnail: 'https://img.icons8.com/color/96/user-female--v1.png'
  },
  { 
    label: '专业男1', 
    value: 'pro_male_1', 
    type: '专业版',
    thumbnail: 'https://img.icons8.com/color/96/businessman.png'
  },
  { 
    label: '专业女1', 
    value: 'pro_female_1', 
    type: '专业版',
    thumbnail: 'https://img.icons8.com/color/96/businesswoman.png'
  },
  { 
    label: '年轻女1', 
    value: 'young_female_1', 
    type: '年轻系列',
    thumbnail: 'https://img.icons8.com/color/96/girl.png'
  },
  { 
    label: '阳光男1', 
    value: 'sunny_male_1', 
    type: '阳光系列',
    thumbnail: 'https://img.icons8.com/color/96/smiling-man.png'
  },
]

// 生成内容请求参数
export interface GenerateTextParams {
  category: ContentCategory
  description: string
  style?: string
  wordCount?: number
  requirements?: string
  count?: number
}

export interface GenerateImageParams {
  description: string
  style?: string
  size?: string
}

export interface GenerateVideoParams {
  category: ContentCategory
  description: string
  style?: string
  size?: string
  duration?: number
  subtitle?: string
  voiceover?: string
  bgm?: string
}

export interface VideoAnalysisParams {
  videoUrl: string
  analysisDimensions: string[]
  viralElements: string[]
  description: string
  size?: string
  duration?: number
}

export interface DigitalHumanParams {
  description: string
  digitalHumanId: string
  wordCount?: number
  size?: string
  duration?: number
  subtitle?: string
  voiceover?: string
  bgm?: string
}

// 生成记录
export interface GenerationRecord {
  id: string
  category: ContentCategory
  title: string
  content: string
  config: any
  timestamp: number
  status: 'success' | 'failed'
}

// 生成文本内容 - 使用后端 /ai/generate 路由
export async function generateText(params: GenerateTextParams): Promise<{ output: { text: string } }> {
  const response = await apiClient.post('/ai/generate', {
    category: params.category,
    type: 'text',
    prompt: buildTextPrompt(params),
    count: params.count || 1,
    options: {
      style: params.style,
      wordCount: params.wordCount,
    },
  });
  return response;
}

// 生成图片 - 使用后端 /ai/image 路由
export async function generateImage(params: GenerateImageParams): Promise<{ output: { results: { url: string }[] } }> {
  const response = await apiClient.post('/ai/image', {
    prompt: `生成一张${params.style || '写实'}风格的图片，主题：${params.description}`,
    size: params.size || '1024x1024',
  });
  return response;
}

// 生成视频 - 使用后端 /ai/generate 路由
export async function generateVideo(params: GenerateVideoParams): Promise<{ output: { url: string } }> {
  const response = await apiClient.post('/ai/generate', {
    category: params.category,
    type: 'video',
    prompt: params.description,
    options: {
      style: params.style,
      size: params.size,
      duration: params.duration,
      subtitle: params.subtitle,
      voiceover: params.voiceover,
      bgm: params.bgm,
    },
  });
  return response;
}

// 视频解析 - 使用后端 /ai/generate 路由 (video-analysis 类别)
export async function analyzeVideo(params: VideoAnalysisParams): Promise<{ output: { url: string; analysis: string } }> {
  const response = await apiClient.post('/ai/generate', {
    category: ContentCategory.VIDEO_ANALYSIS,
    type: 'video',
    prompt: `解析视频 ${params.videoUrl}，分析维度：${params.analysisDimensions.join(',')}, 爆款元素：${params.viralElements.join(',')}, 描述：${params.description}`,
    videoUrl: params.videoUrl,
    dimensions: params.analysisDimensions,
    viralElements: params.viralElements,
    options: {
      size: params.size,
      duration: params.duration,
    },
  });
  return response;
}

// 数字人视频 - 使用后端 /ai/generate 路由
export async function generateDigitalHumanVideo(params: DigitalHumanParams): Promise<{ output: { url: string } }> {
  const response = await apiClient.post('/ai/generate', {
    category: ContentCategory.DIGITAL_HUMAN,
    type: 'video',
    prompt: params.description,
    options: {
      digitalHumanId: params.digitalHumanId,
      wordCount: params.wordCount,
      size: params.size,
      duration: params.duration,
      subtitle: params.subtitle,
      voiceover: params.voiceover,
      bgm: params.bgm,
    },
  });
  return response;
}

// 构建文本提示词
function buildTextPrompt(params: GenerateTextParams): string {
  const { category, description, style, wordCount, requirements } = params

  switch (category) {
    case ContentCategory.TITLE:
      return `生成${params.count || 1}个吸引人的标题，主题：${description}，风格：${style || '吸引眼球'}。`
    case ContentCategory.TAGS:
      return `为"${description}"生成${params.count || 1}个相关的话题标签，格式：#标签1 #标签2，风格：${style || '流行'}。`
    case ContentCategory.COPYWRITING:
      return `为"${description}"生成${wordCount || 500}字左右的文案，风格：${style || '专业'}。${requirements ? `额外要求：${requirements}` : ''}`
    case ContentCategory.IMAGE_TO_TEXT:
      return `根据上传的图片生成${wordCount || 300}字左右的文案描述，风格：${style || '生动'}。`
    case ContentCategory.XIAOHONGSHU:
      return `为"${description}"生成${wordCount || 300}字左右的小红书风格文案，包含emoji，风格：${style || '生活化'}。${requirements ? `额外要求：${requirements}` : ''}`
    case ContentCategory.ECOMMERCE:
      return `为产品"${description}"生成电商详情页文案，包含产品介绍、卖点、使用场景等，字数：${wordCount || 800}字。${requirements ? `额外要求：${requirements}` : ''}`
    default:
      return `为"${description}"生成内容，风格：${style || '专业'}，字数限制：${wordCount || 500}字。`
  }
}

// 保存到素材库
export async function saveToMaterials(
  category: ContentCategory,
  title: string,
  content: string
): Promise<boolean> {
  try {
    await apiClient.post('/materials', {
      category,
      title,
      content,
    });
    return true;
  } catch (error) {
    // 回退: 保存到本地
    const materials = (await TokenStorage.get('materials')) || [];
    materials.push({
      id: `material_${Date.now()}`,
      category,
      title,
      content,
      timestamp: Date.now(),
      status: 'unused',
    });
    await TokenStorage.set('materials', materials);
    return true;
  }
}

// 获取创作历史
export async function getGenerationHistory(): Promise<GenerationRecord[]> {
  const history = await TokenStorage.get('generation-history');
  return history || [];
}

// 保存创作历史
export async function saveGenerationHistory(record: GenerationRecord): Promise<void> {
  const history = await getGenerationHistory();
  const newHistory = [record, ...history].slice(0, 50);
  await TokenStorage.set('generation-history', newHistory);
}

// 删除创作历史
export async function deleteGenerationHistory(id: string): Promise<void> {
  const history = await getGenerationHistory();
  const newHistory = history.filter((r) => r.id !== id);
  await TokenStorage.set('generation-history', newHistory);
}
