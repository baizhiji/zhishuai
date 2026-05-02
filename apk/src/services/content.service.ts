// AI创作服务
import { apiClient } from './api.client';
import { API_ENDPOINTS } from './api.config';

// 内容类型 - 匹配Web端"内容自动生成"
export type ContentType = 
  | 'title'           // 标题
  | 'tags'            // 话题/标签
  | 'copywriting'     // 文案生成
  | 'imageToText'     // 图生文
  | 'xiaohongshu'     // 小红书图文
  | 'image'           // 图片
  | 'ecommerce'       // 电商详情页
  | 'video'           // 短视频
  | 'videoAnalysis'   // 视频解析
  | 'digitalHuman';   // 数字人短视频

// 内容生成请求
export interface GenerateContentParams {
  type: ContentType;
  platform?: string;  // 平台：douyin, xiaohongshu, weibo, zhihu
  topic?: string;     // 主题
  keywords?: string[]; // 关键词
  wordCount?: number;  // 字数要求
  style?: string;      // 风格
  imageUrl?: string;   // 图片URL（图生文时使用）
}

// 内容生成响应
export interface GeneratedContent {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  tags?: string[];
  imageUrl?: string;
  createdAt: string;
  status: 'generating' | 'completed' | 'failed';
}

// 素材类型
export type MaterialType = 'text' | 'image' | 'video' | 'digital-human' | 'ecommerce';

// 素材项
export interface MaterialItem {
  id: string;
  type: MaterialType;
  title: string;
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  platform?: string;  // 来源平台
  status: 'unused' | 'used';
  createdAt: string;
  usedAt?: string;
}

// 创作历史
export interface HistoryItem {
  id: string;
  type: ContentType;
  title: string;
  preview: string;  // 内容预览
  createdAt: string;
}

// 平台选项
export const PLATFORMS = [
  { value: 'douyin', label: '抖音', icon: 'logo-youtube' },
  { value: 'xiaohongshu', label: '小红书', icon: 'images-outline' },
  { value: 'weibo', label: '微博', icon: 'chatbox-outline' },
  { value: 'zhihu', label: '知乎', icon: 'help-circle-outline' },
  { value: 'bilibili', label: 'B站', icon: 'play-circle-outline' },
];

// 内容类型配置 - 匹配Web端"内容自动生成"
export const CONTENT_TYPES: Record<ContentType, { label: string; icon: string; color: string; description: string }> = {
  title: {
    label: '标题',
    icon: 'text',
    color: '#3B82F6',
    description: '生成吸引人的标题，提升内容点击率'
  },
  tags: {
    label: '话题/标签',
    icon: 'pricetags',
    color: '#10B981',
    description: '生成相关话题标签，增加内容曝光'
  },
  copywriting: {
    label: '文案生成',
    icon: 'document-text',
    color: '#6366F1',
    description: '智能生成文案，根据字数自动判断长短'
  },
  imageToText: {
    label: '图生文',
    icon: 'image',
    color: '#EC4899',
    description: '根据图片生成文案描述'
  },
  xiaohongshu: {
    label: '小红书图文',
    icon: 'logo-instapaper',
    color: '#EF4444',
    description: '生成小红书风格的图文内容'
  },
  image: {
    label: '图片',
    icon: 'images',
    color: '#F59E0B',
    description: '生成高质量图片内容'
  },
  ecommerce: {
    label: '电商详情页',
    icon: 'storefront',
    color: '#14B8A6',
    description: '生成电商产品详情页内容'
  },
  video: {
    label: '短视频',
    icon: 'videocam',
    color: '#2563EB',
    description: '生成短视频内容，自动生成字幕、配音和背景音乐'
  },
  videoAnalysis: {
    label: '视频解析',
    icon: 'analytics',
    color: '#8B5CF6',
    description: '分析短视频链接，生成新的爆款视频'
  },
  digitalHuman: {
    label: '数字人短视频',
    icon: 'person',
    color: '#D97706',
    description: '使用数字人生成真人出镜视频'
  },
};

class ContentService {
  // 生成内容
  async generateContent(params: GenerateContentParams): Promise<GeneratedContent> {
    try {
      const data = await apiClient.post<GeneratedContent>(
        API_ENDPOINTS.CONTENT_GENERATE,
        {
          type: params.type,
          contentType: this.getContentTypeString(params.type),
          platform: params.platform,
          topic: params.topic,
          style: params.style,
          wordCount: params.wordCount,
        }
      );
      return data;
    } catch (error) {
      console.log('使用Mock数据: 生成内容');
      return this.getMockGeneratedContent(params);
    }
  }

  // 批量生成
  async batchGenerate(params: {
    type: ContentType;
    topics: string[];
    count?: number;
  }): Promise<GeneratedContent[]> {
    try {
      const data = await apiClient.post<GeneratedContent[]>(
        API_ENDPOINTS.CONTENT_BATCH_GENERATE,
        {
          type: params.type,
          count: params.count || params.topics.length,
          topics: params.topics,
        }
      );
      return data;
    } catch (error) {
      console.log('使用Mock数据: 批量生成');
      return params.topics.map((topic, index) => ({
        ...this.getMockGeneratedContent({ type: params.type, topic }),
        id: `mock-batch-${index}`,
      }));
    }
  }

  // 获取创作历史
  async getHistory(page: number = 1, pageSize: number = 20): Promise<{
    list: HistoryItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const data = await apiClient.get<any>(API_ENDPOINTS.MATERIALS, {
        page,
        pageSize,
      });
      return {
        list: data.list || this.getMockHistory(),
        total: data.total || 20,
        page,
        pageSize,
      };
    } catch (error) {
      return {
        list: this.getMockHistory(),
        total: 20,
        page,
        pageSize,
      };
    }
  }

  // 保存到素材库
  async saveToMaterials(content: GeneratedContent): Promise<MaterialItem> {
    try {
      const data = await apiClient.post<MaterialItem>(API_ENDPOINTS.MATERIALS, {
        type: this.getMaterialType(content.type),
        title: content.title,
        content: content.content,
      });
      return data;
    } catch (error) {
      // Mock保存成功
      return {
        id: `mock-material-${Date.now()}`,
        type: this.getMaterialType(content.type),
        title: content.title,
        content: content.content,
        status: 'unused',
        createdAt: new Date().toISOString(),
      };
    }
  }

  // 获取素材列表
  async getMaterials(params: {
    page?: number;
    pageSize?: number;
    type?: MaterialType;
    status?: 'unused' | 'used';
    keyword?: string;
  }): Promise<{
    list: MaterialItem[];
    total: number;
  }> {
    try {
      const data = await apiClient.get<any>(API_ENDPOINTS.MATERIALS, {
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        type: params.type,
        status: params.status,
        keyword: params.keyword,
      });
      return {
        list: data.list || [],
        total: data.total || 0,
      };
    } catch (error) {
      return {
        list: this.getMockMaterials(),
        total: 5,
      };
    }
  }

  // ===== 辅助方法 =====
  
  private getContentTypeString(type: ContentType): string {
    const typeMap: Record<ContentType, string> = {
      title: 'title',
      tag: 'tag',
      long_text: 'long',
      short_text: 'short',
      image_to_text: 'image_text',
      xiaohongshu: 'xiaohongshu',
      image: 'image',
      ecommerce: 'ecommerce',
      video_script: 'video',
      digital_human: 'digital_human',
    };
    return typeMap[type];
  }

  private getMaterialType(contentType: ContentType): MaterialType {
    if (contentType === 'image' || contentType === 'xiaohongshu') return 'image';
    if (contentType === 'video_script' || contentType === 'digital_human') return 'video';
    if (contentType === 'ecommerce') return 'ecommerce';
    return 'text';
  }

  private getMockGeneratedContent(params: GenerateContentParams): GeneratedContent {
    const contentType = CONTENT_TYPES[params.type];
    return {
      id: `mock-${Date.now()}`,
      type: params.type,
      title: `${contentType.label} - ${params.topic || '未命名'}`,
      content: this.generateMockContent(params),
      tags: ['AI生成', '热门', '推荐'],
      createdAt: new Date().toISOString(),
      status: 'completed',
    };
  }

  private generateMockContent(params: GenerateContentParams): string {
    const topic = params.topic || '主题';
    return `【${topic}】

这是一个由AI生成的${CONTENT_TYPES[params.type].label}内容。

AI创作的优势：
• 高效快速，节省时间
• 智能优化，提升质量
• 多样风格，灵活选择
• 数据驱动，精准投放

（此为演示内容，实际使用时请调用真实API）`;
  }

  private getMockHistory(): HistoryItem[] {
    return [
      {
        id: '1',
        type: 'short_text',
        title: '产品推广文案',
        preview: '这是一段简短的产品推广文案...',
        createdAt: '2024-01-15 10:30',
      },
      {
        id: '2',
        type: 'title',
        title: '科技产品标题',
        preview: '【重磅】这款科技产品让生活更智能...',
        createdAt: '2024-01-14 15:20',
      },
      {
        id: '3',
        type: 'xiaohongshu',
        title: '美妆种草笔记',
        preview: '今天给大家分享一款超好用的美妆产品...',
        createdAt: '2024-01-13 09:45',
      },
      {
        id: '4',
        type: 'video_script',
        title: '产品介绍视频脚本',
        preview: '开场：各位小伙伴们好，今天给大家介绍...',
        createdAt: '2024-01-12 14:00',
      },
      {
        id: '5',
        type: 'image',
        title: '电商主图设计',
        preview: '电商平台商品主图，要求突出产品特点...',
        createdAt: '2024-01-11 11:30',
      },
    ];
  }

  private getMockMaterials(): MaterialItem[] {
    return [
      {
        id: 'm1',
        type: 'text',
        title: '产品推广文案1',
        content: '这是一段产品推广文案内容...',
        status: 'unused',
        createdAt: '2024-01-15 10:30',
      },
      {
        id: 'm2',
        type: 'image',
        title: '小红书配图',
        content: '小红书风格的配图文案...',
        status: 'used',
        createdAt: '2024-01-14 15:20',
        usedAt: '2024-01-14 18:00',
      },
    ];
  }
}

export const contentService = new ContentService();
