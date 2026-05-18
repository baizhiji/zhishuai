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
    key: 'media',
    name: '自媒体运营',
    description: 'AI批量生成内容、多平台发布管理',
    icon: 'icon-media',
    defaultEnabled: true,
    subFeatures: [
      { code: 'content_factory', name: '内容工厂', description: 'AI批量生成内容', defaultEnabled: true },
      { code: 'matrix_account', name: '矩阵账号管理', description: '多平台账号统一管理', defaultEnabled: true },
      { code: 'publish_center', name: '发布中心', description: '素材选取批量发布', defaultEnabled: true },
      { code: 'timing_publish', name: '定时发布', description: '支持定时发布任务', defaultEnabled: true },
      { code: 'hot_topics', name: '热点话题', description: '接入热点话题数据', defaultEnabled: true },
      { code: 'digital_human', name: '数字人视频', description: 'AI数字人视频生成', defaultEnabled: true },
    ]
  },
  {
    key: 'recruitment',
    name: '招聘助手',
    description: 'AI生成JD、批量发布、智能筛选',
    icon: 'icon-recruitment',
    defaultEnabled: true,
    subFeatures: [
      { code: 'post_manage', name: '职位发布', description: '批量发布职位', defaultEnabled: true },
      { code: 'ai_generate_jd', name: 'AI生成JD', description: 'AI生成职位描述', defaultEnabled: true },
      { code: 'resume_filter', name: '简历筛选', description: 'AI匹配度分析', defaultEnabled: true },
      { code: 'interview_manage', name: '面试管理', description: '面试安排与反馈', defaultEnabled: true },
    ]
  },
  {
    key: 'acquisition',
    name: '智能获客',
    description: '潜客发现、引流任务、数据追踪',
    icon: 'icon-acquisition',
    defaultEnabled: true,
    subFeatures: [
      { code: 'lead_discovery', name: '潜客发现', description: '按行业/关键词搜索', defaultEnabled: true },
      { code: 'drain_task', name: '引流任务', description: '自动发送引流话术', defaultEnabled: true },
      { code: 'wechat_qr', name: '企业微信二维码', description: '自动发送二维码', defaultEnabled: true },
    ]
  },
  {
    key: 'share',
    name: '推荐分享',
    description: '视频推广码、效果追踪',
    icon: 'icon-share',
    defaultEnabled: true,
    subFeatures: [
      { code: 'qrcode_generate', name: '码生成', description: '生成专属推广二维码', defaultEnabled: true },
      { code: 'effect_track', name: '效果追踪', description: '扫码/下载数据追踪', defaultEnabled: true },
    ]
  },
  {
    key: 'referral',
    name: '转介绍',
    description: '推荐下载APP、奖励记录',
    icon: 'icon-referral',
    defaultEnabled: true,
    subFeatures: [
      { code: 'my_referral', name: '我的推荐', description: '查看推荐用户', defaultEnabled: true },
      { code: 'reward_record', name: '奖励记录', description: '查看推荐奖励', defaultEnabled: true },
    ]
  },
  {
    key: 'ecommerce',
    name: '电商运营',
    description: '电商运营管理（即将上线）',
    icon: 'icon-ecommerce',
    defaultEnabled: false,
  },
  {
    key: 'crm',
    name: 'CRM客户管理',
    description: '客户关系管理（即将上线）',
    icon: 'icon-crm',
    defaultEnabled: false,
  },
  {
    key: 'marketing',
    name: '营销工具',
    description: '营销活动管理（即将上线）',
    icon: 'icon-marketing',
    defaultEnabled: false,
  },
];

// 功能代码映射（与后端对应）
export const FEATURE_CODES = {
  MEDIA: 'media',
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
