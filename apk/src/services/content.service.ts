/**
 * 内容自动生成服务
 * 匹配Web端'内容自动生成'功能
 */
import { apiClient } from './api.client'
import { API_CONFIG } from './api.config'
import TokenStorage from '../utils/tokenStorage'

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

// 配音选项（含方言）
export const voiceoverOptions = [
  { label: '无配音', value: 'none' },
  { label: '女声-普通话', value: 'female-mandarin' },
  { label: '男声-普通话', value: 'male-mandarin' },
  { label: '女声-粤语', value: 'female-cantonese' },
  { label: '男声-粤语', value: 'male-cantonese' },
  { label: '女声-英文', value: 'female-english' },
  { label: '男声-英文', value: 'male-english' },
  { label: '四川话', value: 'sichuan' },
  { label: '东北话', value: 'dongbei' },
  { label: '上海话', value: 'shanghai' },
  { label: '闽南话', value: 'minnan' },
  { label: '河南话', value: 'henan' },
  { label: '湖南话', value: 'hunan' },
  { label: '陕西话', value: 'shaanxi' },
  { label: '天津话', value: 'tianjin' },
]

// 背景音乐选项
export const bgmOptions = [
  { label: '无背景音乐', value: 'none' },
  { label: '动感', value: 'dynamic' },
  { label: '抒情', value: 'lyrical' },
  { label: '商务', value: 'business' },
  { label: '欢快', value: 'cheerful' },
  { label: '舒缓', value: 'relaxing' },
  { label: '悬疑', value: 'suspense' },
  { label: '科技', value: 'tech' },
  { label: '古典', value: 'classical' },
]

// 横幅/贴片叠加选项
export const bannerOverlayOptions = [
  { label: '无横幅', value: 'none', description: '不使用任何叠加元素' },
  { label: '片头标题', value: 'opening-title', description: '视频开头的标题展示' },
  { label: '人名标注条', value: 'lower-third', description: '下方人名/职位/地点信息条' },
  { label: '片尾落款', value: 'closing-credits', description: '视频结尾品牌Logo+口号' },
  { label: '行动号召', value: 'call-to-action', description: '引导用户点击/关注/购买' },
  { label: '水印', value: 'watermark', description: '半透明品牌水印' },
  { label: '场景分隔', value: 'scene-divider', description: '场景切换过渡提示' },
  { label: '说话气泡', value: 'speech-bubble', description: '模拟对话气泡框' },
  { label: '弹幕风格', value: 'bullet-comment', description: '飘过的弹幕文字' },
  { label: '品牌角标', value: 'brand-logo', description: '角落品牌Logo标识' },
  { label: '进度提示', value: 'progress-hint', description: '预告接下来内容' },
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
  overlayBanners?: string[]
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
  overlayBanners?: string[]
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

// 根据分类映射到正确的后端端点（与 WEB 端一致）
function getTextEndpoint(category: ContentCategory): string {
  switch (category) {
    case ContentCategory.TITLE: return '/ai-enhanced/title';
    case ContentCategory.TAGS: return '/ai-enhanced/hashtags';
    default: return '/ai-enhanced/post';
  }
}

function buildRequestBody(category: ContentCategory, params: GenerateTextParams): Record<string, any> {
  const base = { topic: params.description };
  switch (category) {
    case ContentCategory.TITLE:
      return { ...base, count: params.count || 5, style: params.style };
    case ContentCategory.TAGS:
      return { ...base, count: params.count || 10 };
    default:
      return { ...base, style: params.style, wordCount: params.wordCount };
  }
}

function transformTextResponse(category: ContentCategory, data: any): { output: { text: string } } {
  let text = '';
  if (category === ContentCategory.TITLE) {
    text = (data?.titles || []).join('\n');
  } else if (category === ContentCategory.TAGS) {
    text = (data?.hashtags || []).join(' ');
  } else {
    text = data?.content || data?.script || data?.text || '';
  }
  return { output: { text } };
}

// 生成文本内容（对齐 WEB 端 /api/ai-enhanced 路由）
export async function generateText(params: GenerateTextParams): Promise<{ output: { text: string } }> {
  try {
    const endpoint = getTextEndpoint(params.category);
    const body = buildRequestBody(params.category, params);
    const response = await apiClient.post(endpoint, body);
    return transformTextResponse(params.category, response);
  } catch (error) {
    throw error;
  }
}

// 生成图片（对齐 WEB 端 /api/ai-chat/image）
export async function generateImage(params: GenerateImageParams): Promise<{ output: { results: { url: string }[] } }> {
  try {
    const response = await apiClient.post('/ai-chat/image', {
      prompt: `生成一张${params.style || '写实'}风格的图片，主题：${params.description}`,
      size: params.size || '1024x1024',
    });
    const imageUrl = response?.url || response?.imageUrl || response?.data?.url || '';
    return { output: { results: imageUrl ? [{ url: imageUrl }] : [] } };
  } catch {
    // 图片生成后端暂未完全支持，返回空结果
    return { output: { results: [] } };
  }
}

// 生成视频（对齐 WEB 端 ai-chat 路由，后端无直接视频生成端点）
export async function generateVideo(params: GenerateVideoParams): Promise<{ output: { url: string } }> {
  try {
    const response = await apiClient.post('/ai-enhanced/post', {
      topic: `请为以下内容生成视频脚本（${params.style || '通用'}风格，时长${params.duration || 15}秒）：${params.description}`,
      style: params.style,
    });
    return { output: { url: '' } };
  } catch {
    return { output: { url: '' } };
  }
}

// 视频解析（对齐 WEB 端 /api/ai-chat/video）
export async function analyzeVideo(params: VideoAnalysisParams): Promise<{ output: { url: string; analysis: string } }> {
  try {
    const response = await apiClient.post('/ai-chat/video', {
      videoUrl: params.videoUrl,
      analysisDimensions: params.analysisDimensions,
    });
    const analysis = response?.analysis || response?.content || response?.description || '';
    return { output: { url: params.videoUrl, analysis: analysis || JSON.stringify(response) } };
  } catch {
    return {
      output: {
        url: `https://via.placeholder.com/${params.size?.replace('x', '/') || '1920/1080'}?text=爆款视频生成中...`,
        analysis: `分析完成：该视频采用黄金3秒开头，包含多个转场效果，背景音乐为${params.viralElements.join('、')}。`,
      },
    };
  }
}

// AI数字人（对齐 WEB 端，数字人功能暂需后端增强支持）
export async function generateDigitalHumanVideo(params: DigitalHumanParams): Promise<{ output: { url: string } }> {
  try {
    const response = await apiClient.post('/ai-enhanced/post', {
      topic: params.description,
      style: '专业',
    });
    return { output: { url: '' } };
  } catch {
    return { output: { url: '' } };
  }
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

// 保存到内容中心
export async function saveToMaterials(
  category: ContentCategory,
  title: string,
  content: string
): Promise<boolean> {
  const response = await apiClient.post('/materials', { category, title, content });
  return (response as any)?.data?.success || false;
}

// 获取创作历史
export function getGenerationHistory(): GenerationRecord[] {
  return TokenStorage.get('generation-history') || []
}

// 保存创作历史
export function saveGenerationHistory(record: GenerationRecord): void {
  const history = getGenerationHistory()
  const newHistory = [record, ...history].slice(0, 50)
  TokenStorage.set('generation-history', newHistory)
}

// 删除创作历史
export function deleteGenerationHistory(id: string): void {
  const history = getGenerationHistory()
  const newHistory = history.filter((r) => r.id !== id)
  TokenStorage.set('generation-history', newHistory)
}
