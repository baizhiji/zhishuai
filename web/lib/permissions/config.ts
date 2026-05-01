/**
 * 权限系统配置
 * 定义角色、权限和菜单配置
 */

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',           // 开发者总后台
  AGENT = 'agent',           // 区域代理
  CUSTOMER = 'customer',     // 终端客户
}

// 权限枚举
export enum Permission {
  // 自媒体运营
  MEDIA_FACTORY = 'media.factory',
  MEDIA_MATRIX = 'media.matrix',
  MEDIA_PUBLISH = 'media.publish',
  MEDIA_REPORT = 'media.report',
  MEDIA_DIGITAL_HUMAN = 'media.digital_human',
  MATERIALS = 'materials',

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

  // 预留模块
  ECOMMERCE = 'ecommerce',
  CRM = 'crm',
  MARKETING = 'marketing',
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
    // 客户可见功能
    Permission.MEDIA_FACTORY,
    Permission.MEDIA_MATRIX,
    Permission.MEDIA_PUBLISH,
    Permission.MEDIA_REPORT,
    Permission.MEDIA_DIGITAL_HUMAN,
    Permission.MATERIALS,
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
  defaultEnabled: boolean;
}

export const featureToggles: FeatureToggle[] = [
  {
    key: 'media_factory',
    name: 'AI内容工厂',
    description: 'AI智能生成文案、图片、视频内容',
    defaultEnabled: true,
  },
  {
    key: 'media_matrix',
    name: '矩阵管理',
    description: '多平台账号矩阵统一管理',
    defaultEnabled: true,
  },
  {
    key: 'media_publish',
    name: '发布中心',
    description: '一键发布内容到多个平台',
    defaultEnabled: true,
  },
  {
    key: 'media_digital_human',
    name: '数字人视频',
    description: 'AI数字人视频生成',
    defaultEnabled: true,
  },
  {
    key: 'recruitment',
    name: '招聘助手',
    description: '智能招聘管理全套解决方案',
    defaultEnabled: true,
  },
  {
    key: 'acquisition',
    name: '智能获客',
    description: 'AI驱动精准获客',
    defaultEnabled: true,
  },
  {
    key: 'share',
    name: '推荐分享',
    description: '裂变分享推广工具',
    defaultEnabled: true,
  },
  {
    key: 'ecommerce',
    name: '电商运营',
    description: '电商运营管理（即将上线）',
    defaultEnabled: false,
  },
  {
    key: 'crm',
    name: 'CRM客户管理',
    description: '客户关系管理（即将上线）',
    defaultEnabled: false,
  },
  {
    key: 'marketing',
    name: '营销工具',
    description: '营销活动管理（即将上线）',
    defaultEnabled: false,
  },
];

// 角色名称映射
export const roleNames: Record<UserRole, string> = {
  [UserRole.ADMIN]: '开发者总后台',
  [UserRole.AGENT]: '区域代理',
  [UserRole.CUSTOMER]: '终端客户',
};
