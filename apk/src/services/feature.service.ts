// 功能开关服务
import { apiClient, ApiResponse } from './api.client';
import { API_ENDPOINTS } from './api.config';

// 功能开关类型
export interface FeatureSwitch {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  enabled: boolean;
  sortOrder: number;
  subFeatures: SubFeatureSwitch[];
}

export interface SubFeatureSwitch {
  id: string;
  featureCode: string;
  code: string;
  name: string;
  description?: string;
  enabled: boolean;
  sortOrder: number;
}

// 功能开关服务
export const featureService = {
  // 获取用户的功能开关状态
  getUserFeatures: async (userId: string): Promise<FeatureSwitch[]> => {
    try {
      const response = await apiClient.get<ApiResponse<FeatureSwitch[]>>(
        API_ENDPOINTS.FEATURES,
        { userId }
      );
      return response.data?.data || [];
    } catch (error) {
      console.error('获取功能开关失败:', error);
      return getDefaultFeatures();
    }
  },

  // 获取用户可用的功能（简化版，供首页金刚区使用）
  getAvailableFeatures: async (userId: string): Promise<FeatureSwitch[]> => {
    try {
      const response = await apiClient.get<ApiResponse<FeatureSwitch[]>>(
        API_ENDPOINTS.FEATURES_AVAILABLE,
        { userId }
      );
      return response.data?.data || [];
    } catch (error) {
      console.error('获取可用功能失败:', error);
      return getDefaultFeatures().filter(f => f.enabled);
    }
  },

  // 获取单个功能开关状态
  getFeatureStatus: async (userId: string, featureCode: string): Promise<FeatureSwitch | null> => {
    try {
      const response = await apiClient.get<ApiResponse<FeatureSwitch>>(
        API_ENDPOINTS.FEATURE_DETAIL,
        { userId },
        { featureCode }
      );
      return response.data?.data || null;
    } catch (error) {
      console.error('获取功能状态失败:', error);
      return null;
    }
  },

  // 设置用户功能开关
  setFeature: async (userId: string, featureCode: string, enabled: boolean): Promise<boolean> => {
    try {
      await apiClient.put<ApiResponse<any>>(
        API_ENDPOINTS.FEATURE_DETAIL,
        { enabled },
        { featureCode }
      );
      return true;
    } catch (error) {
      console.error('设置功能开关失败:', error);
      return false;
    }
  },

  // 批量设置用户功能开关
  setFeatures: async (
    userId: string,
    features: { featureCode: string; enabled: boolean }[]
  ): Promise<boolean> => {
    try {
      await apiClient.put<ApiResponse<any>>(API_ENDPOINTS.FEATURES, {
        userId,
        features,
      });
      return true;
    } catch (error) {
      console.error('批量设置功能开关失败:', error);
      return false;
    }
  },

  // 重置功能开关到默认
  resetFeature: async (userId: string, featureCode: string): Promise<boolean> => {
    try {
      await apiClient.delete<ApiResponse<void>>(
        API_ENDPOINTS.FEATURE_DETAIL,
        { userId },
        { featureCode }
      );
      return true;
    } catch (error) {
      console.error('重置功能开关失败:', error);
      return false;
    }
  },
};

// 获取默认功能开关配置
export function getDefaultFeatures(): FeatureSwitch[] {
  return [
    {
      id: '1',
      code: 'media',
      name: '自媒体运营',
      description: 'AI批量生成内容、多平台发布管理',
      icon: 'videocam',
      enabled: true,
      sortOrder: 1,
      subFeatures: [
        { id: '1-1', featureCode: 'media', code: 'content_factory', name: '内容工厂', description: 'AI批量生成内容', enabled: true, sortOrder: 1 },
        { id: '1-2', featureCode: 'media', code: 'matrix_account', name: '矩阵账号管理', description: '多平台账号统一管理', enabled: true, sortOrder: 2 },
        { id: '1-3', featureCode: 'media', code: 'publish_center', name: '发布中心', description: '素材选取批量发布', enabled: true, sortOrder: 3 },
      ],
    },
    {
      id: '2',
      code: 'recruitment',
      name: '招聘助手',
      description: 'AI生成JD、批量发布、智能筛选',
      icon: 'people',
      enabled: true,
      sortOrder: 2,
      subFeatures: [
        { id: '2-1', featureCode: 'recruitment', code: 'post_manage', name: '职位发布', description: '批量发布职位', enabled: true, sortOrder: 1 },
        { id: '2-2', featureCode: 'recruitment', code: 'ai_generate_jd', name: 'AI生成JD', description: 'AI生成职位描述', enabled: true, sortOrder: 2 },
      ],
    },
    {
      id: '3',
      code: 'acquisition',
      name: '智能获客',
      description: '潜客发现、引流任务、数据追踪',
      icon: 'trending-up',
      enabled: true,
      sortOrder: 3,
      subFeatures: [
        { id: '3-1', featureCode: 'acquisition', code: 'lead_discovery', name: '潜客发现', description: '按行业/关键词搜索', enabled: true, sortOrder: 1 },
        { id: '3-2', featureCode: 'acquisition', code: 'drain_task', name: '引流任务', description: '自动发送引流话术', enabled: true, sortOrder: 2 },
      ],
    },
    {
      id: '4',
      code: 'share',
      name: '推荐分享',
      description: '视频推广码、效果追踪',
      icon: 'share-social',
      enabled: true,
      sortOrder: 4,
      subFeatures: [
        { id: '4-1', featureCode: 'share', code: 'qrcode_generate', name: '码生成', description: '生成专属推广二维码', enabled: true, sortOrder: 1 },
        { id: '4-2', featureCode: 'share', code: 'effect_track', name: '效果追踪', description: '扫码/下载数据追踪', enabled: true, sortOrder: 2 },
      ],
    },
    {
      id: '5',
      code: 'referral',
      name: '转介绍',
      description: '推荐下载APP、奖励记录',
      icon: 'person-add',
      enabled: true,
      sortOrder: 5,
      subFeatures: [
        { id: '5-1', featureCode: 'referral', code: 'my_referral', name: '我的推荐', description: '查看推荐用户', enabled: true, sortOrder: 1 },
        { id: '5-2', featureCode: 'referral', code: 'reward_record', name: '奖励记录', description: '查看推荐奖励', enabled: true, sortOrder: 2 },
      ],
    },
  ];
}

// 功能代码常量
export const FEATURE_CODES = {
  MEDIA: 'media',
  RECRUITMENT: 'recruitment',
  ACQUISITION: 'acquisition',
  SHARE: 'share',
  REFERRAL: 'referral',
} as const;

// 功能路由映射
export const FEATURE_ROUTES: Record<string, string> = {
  [FEATURE_CODES.MEDIA]: 'MediaOperation',
  [FEATURE_CODES.RECRUITMENT]: 'Recruitment',
  [FEATURE_CODES.ACQUISITION]: 'Acquisition',
  [FEATURE_CODES.SHARE]: 'Share',
  [FEATURE_CODES.REFERRAL]: 'Referral',
};

// 功能图标映射
export const FEATURE_ICONS: Record<string, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
  [FEATURE_CODES.MEDIA]: 'videocam',
  [FEATURE_CODES.RECRUITMENT]: 'people',
  [FEATURE_CODES.ACQUISITION]: 'trending-up',
  [FEATURE_CODES.SHARE]: 'share-social',
  [FEATURE_CODES.REFERRAL]: 'person-add',
  'materials': 'images',
  'analytics': 'stats-chart',
};

// 功能颜色映射
export const FEATURE_COLORS: Record<string, string> = {
  [FEATURE_CODES.MEDIA]: '#3B82F6',
  [FEATURE_CODES.RECRUITMENT]: '#8B5CF6',
  [FEATURE_CODES.ACQUISITION]: '#10B981',
  [FEATURE_CODES.SHARE]: '#F97316',
  [FEATURE_CODES.REFERRAL]: '#EC4899',
  'materials': '#06B6D4',
  'analytics': '#4F46E5',
};
