/**
 * 权限系统配置
 * 定义角色、权限和菜单配置
 */

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin', // 开发者总后台
  AGENT = 'agent', // 区域代理
  CUSTOMER = 'customer', // 终端客户
}

// 权限枚举
export enum Permission {
  // AI创作工厂
  FACTORY_XIAOHONGSHU = 'factory.xiaohongshu',
  FACTORY_IMAGE = 'factory.image',
  FACTORY_ECOMMERCE = 'factory.ecommerce',
  FACTORY_SHORT_VIDEO = 'factory.short-video',
  FACTORY_ENTERPRISE_VIDEO = 'factory.enterprise-video',
  FACTORY_PRODUCT_VIDEO = 'factory.product-video',
  FACTORY_STORE_TOUR_VIDEO = 'factory.store-tour-video',
  FACTORY_PERSON_MV = 'factory.person-mv',
  FACTORY_CARTOON_VIDEO = 'factory.cartoon-video',
  FACTORY_DIGITAL_HUMAN = 'factory.digital-human',

  // 媒体矩阵
  MEDIA_FACTORY = 'media.factory',
  MEDIA_MATRIX = 'media.matrix',
  MEDIA_PUBLISH = 'media.publish',
  MEDIA_REPORT = 'media.report',
  MEDIA_DIGITAL_HUMAN = 'media.digital-human',

  // 招聘助手
  RECRUITMENT_PUBLISH = 'recruitment.publish',
  RECRUITMENT_SCREEN = 'recruitment.screen',
  RECRUITMENT_REPLY = 'recruitment.reply',
  RECRUITMENT_INTERVIEW = 'recruitment.interview',
  RECRUITMENT_BOARD = 'recruitment.board',
  RECRUITMENT_STATS = 'recruitment.stats',

  // 智能获客
  ACQUISITION_DISCOVER = 'acquisition.discover',
  ACQUISITION_TASK = 'acquisition.task',
  ACQUISITION_BOARD = 'acquisition.board',
  ACQUISITION_STATS = 'acquisition.stats',

  // 推荐分享
  SHARE_CODE = 'share.code',
  SHARE_TRACK = 'share.track',
  SHARE_BOARD = 'share.board',

  // 转介绍
  MY_REFERRAL = 'my.referral',

  // Admin后台
  ADMIN_TENANTS = 'admin.tenants',
  ADMIN_AGENTS = 'admin.agents',
  ADMIN_CONFIG = 'admin.config',
  ADMIN_BRANDING = 'admin.branding',
  ADMIN_ANALYTICS = 'admin.analytics',
  ADMIN_CRM = 'admin.crm',
  SYSTEM_SETTINGS = 'system.settings',
  SYSTEM_USERS = 'system.users',

  // Agent后台
  AGENT_TENANTS = 'agent.tenants',
  AGENT_REFERRALS = 'agent.referrals',
  AGENT_USAGE = 'agent.usage',
  AGENT_ANALYTICS = 'agent.analytics',
  AGENT_TICKETS = 'agent.tickets',

  // 账号配置
  ACCOUNT_INFO = 'account.info',
  ACCOUNT_API = 'account.api',
  ACCOUNT_KNOWLEDGE = 'account.knowledge',
  ACCOUNT_LOG = 'account.log',
  ACCOUNT_RECHARGE = 'account.recharge',
  ACCOUNT_STAFF = 'account.staff',
  ACCOUNT_SUBSCRIBE = 'account.subscribe',
  SETTINGS_COMPANY = 'settings.company',
  SETTINGS_SECURITY = 'settings.security',
  SETTINGS_THEME = 'settings.theme',
}

// 角色权限配置
export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // 全部功能
    ...Object.values(Permission),
  ],
  [UserRole.AGENT]: [
    // 代理可见功能
    Permission.AGENT_TENANTS,
    Permission.AGENT_REFERRALS,
    Permission.AGENT_USAGE,
    Permission.AGENT_ANALYTICS,
    Permission.AGENT_TICKETS,
    Permission.ACCOUNT_INFO,
    Permission.ACCOUNT_RECHARGE,
    Permission.MY_REFERRAL,
    Permission.SETTINGS_SECURITY,
  ],
  [UserRole.CUSTOMER]: [
    // AI创作工厂
    Permission.FACTORY_XIAOHONGSHU,
    Permission.FACTORY_IMAGE,
    Permission.FACTORY_ECOMMERCE,
    Permission.FACTORY_SHORT_VIDEO,
    Permission.FACTORY_ENTERPRISE_VIDEO,
    Permission.FACTORY_PRODUCT_VIDEO,
    Permission.FACTORY_STORE_TOUR_VIDEO,
    Permission.FACTORY_PERSON_MV,
    Permission.FACTORY_CARTOON_VIDEO,
    Permission.FACTORY_DIGITAL_HUMAN,
    Permission.RECRUITMENT_PUBLISH,
    Permission.RECRUITMENT_SCREEN,
    Permission.RECRUITMENT_REPLY,
    Permission.RECRUITMENT_INTERVIEW,
    Permission.RECRUITMENT_BOARD,
    Permission.RECRUITMENT_STATS,
    Permission.ACQUISITION_DISCOVER,
    Permission.ACQUISITION_TASK,
    Permission.ACQUISITION_BOARD,
    Permission.ACQUISITION_STATS,
    Permission.SHARE_CODE,
    Permission.SHARE_TRACK,
    Permission.SHARE_BOARD,
    Permission.MY_REFERRAL,
    Permission.ACCOUNT_INFO,
    Permission.ACCOUNT_API,
    Permission.ACCOUNT_KNOWLEDGE,
    Permission.ACCOUNT_LOG,
    Permission.ACCOUNT_RECHARGE,
    Permission.ACCOUNT_STAFF,
    Permission.ACCOUNT_SUBSCRIBE,
    Permission.SETTINGS_COMPANY,
    Permission.SETTINGS_SECURITY,
    Permission.SETTINGS_THEME,
  ],
};

// 功能开关配置（Admin可控制的开关）
export interface FeatureToggle {
  key: string;
  name: string;
  description: string;
  icon?: string;
  defaultEnabled: boolean;
  subFeatures?: SubFeature[];
}

// 子功能配置
export interface SubFeature {
  code: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
}

export const featureToggles: FeatureToggle[] = [
  {
    key: 'factory',
    name: 'AI创作工厂',
    description: 'AI图文、图片、视频等多种内容创作',
    icon: 'icon-factory',
    defaultEnabled: true,
  },
  {
    key: 'recruitment',
    name: '招聘版块',
    description: 'AI生成JD、批量发布、智能筛选',
    icon: 'icon-recruitment',
    defaultEnabled: true,
  },
  {
    key: 'acquisition',
    name: '获客版块',
    description: '潜客发现、引流任务、数据追踪',
    icon: 'icon-acquisition',
    defaultEnabled: true,
  },
];

// 功能代码映射（与后端对应）
export const FEATURE_CODES = {
  FACTORY: 'factory',
  RECRUITMENT: 'recruitment',
  ACQUISITION: 'acquisition',
  SHARE: 'share',
  REFERRAL: 'referral',
} as const;

// 角色名称映射
export const roleNames: Record<UserRole, string> = {
  [UserRole.ADMIN]: '开发者总后台',
  [UserRole.AGENT]: '区域代理',
  [UserRole.CUSTOMER]: '终端客户',
};
