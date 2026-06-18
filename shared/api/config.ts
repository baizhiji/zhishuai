/**
 * 共享 API 配置
 * Server / Web / APK 三端共用
 */

// API基础配置
export const API_CONFIG = {
  development: {
    baseUrl: 'http://localhost:3001/api',
    timeout: 30000,
  },
  production: {
    baseUrl: 'https://api.baizhiji.net',
    timeout: 30000,
  },
};

// 当前环境配置
export const CURRENT_API_CONFIG =
  process.env.NODE_ENV === 'production'
    ? API_CONFIG.production
    : API_CONFIG.development;

// API提供商配置
export const API_PROVIDER = {
  qwen: {
    name: '阿里云百炼',
    baseUrl: 'https://dashscope.aliyuncs.com',
    models: {
      text: 'qwen3.6-plus',
      image: 'wan2.7-image-pro',
      video: 'wan2.7-t2v',
      digitalHuman: 'wan2.7-digital-human-clone',
    },
  },
  volcano: {
    name: '火山引擎',
    baseUrl: 'https://api.volcengine.com',
    models: {
      text: 'doubao-pro',
      image: 'wanx-v1',
      video: 'x1-video',
    },
  },
};

export const DEFAULT_API_PROVIDER = 'qwen';

/**
 * API 端点配置 —— 与 server/src/index.ts 路由注册完全一致
 */
export const API_ENDPOINTS = {
  // 认证
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    sendCode: '/auth/send-code',
    refreshToken: '/auth/refresh',
  },

  // 账号管理
  account: {
    info: '/account/info',
    update: '/account/update',
    password: '/account/password',
    balance: '/account/balance',
    points: '/account/points',
  },

  // 用户功能开关
  features: {
    list: '/features',
    available: '/features/available',
  },

  // 素材库
  materials: {
    list: '/materials',
    detail: '/materials/:id',
    create: '/materials',
    delete: '/materials/:id',
    upload: '/materials/upload',
    batchDelete: '/materials/batch-delete',
  },

  // 矩阵账号
  matrix: {
    accounts: '/matrix/accounts',
    accountDetail: '/matrix/accounts/:id',
  },

  // 发布中心
  publish: {
    tasks: '/publish/tasks',
    taskDetail: '/publish/tasks/:id',
    batch: '/publish/batch',
  },

  // 内容
  content: {
    generate: '/content/generate',
    batchGenerate: '/content/batch-generate',
    batchEdit: '/content/batch-edit',
    taskStatus: '/content/tasks/:id',
  },

  // 招聘
  recruitment: {
    jobs: '/recruitment/jobs',
    jobDetail: '/recruitment/jobs/:id',
    candidates: '/recruitment/candidates',
    interviews: '/recruitment/interviews',
    resumes: '/recruitment/resumes',
  },

  // 获客
  acquisition: {
    tasks: '/acquisition/tasks',
    leads: '/acquisition/leads',
    customers: '/acquisition/customers',
    stats: '/acquisition/stats',
  },

  // 数据采集
  dataAcquisition: {
    sources: '/data-acquisition/sources',
    data: '/data-acquisition/data',
    tasks: '/data-acquisition/tasks',
  },

  // 分享推荐
  share: {
    codes: '/share/codes',
    records: '/share/records',
  },

  // 推荐
  referral: {
    codes: '/referral/codes',
    records: '/referral/records',
    stats: '/referral/stats',
  },

  // CRM
  crm: {
    customers: '/crm/customers',
    followUps: '/crm/follow-ups',
    tags: '/crm/tags',
    automation: '/crm/automation',
    reminders: '/crm/reminders',
  },

  // 统计
  statistics: {
    dashboard: '/statistics/dashboard',
    content: '/statistics/content',
    trend: '/statistics/trend',
  },

  // Dashboard
  dashboardStats: {
    overview: '/dashboard-stats/overview',
  },

  // 通知
  notifications: {
    list: '/notifications',
    read: '/notifications/:id/read',
    readAll: '/notifications/read-all',
  },

  // AI 对话
  aiChat: {
    chat: '/ai-chat/chat',
    history: '/ai-chat/history',
  },

  // AI 增强
  aiEnhanced: {
    title: '/ai-enhanced/title',
    script: '/ai-enhanced/script',
    post: '/ai-enhanced/post',
    hashtags: '/ai-enhanced/hashtags',
    keywords: '/ai-enhanced/keywords',
    copywriting: '/ai-enhanced/copywriting',
    productDescription: '/ai-enhanced/product-description',
    digitalHuman: '/ai-enhanced/digital-human',
    videoScript: '/ai-enhanced/video-script',
    recruitmentJd: '/ai-enhanced/recruitment-jd',
    outreachMessage: '/ai-enhanced/outreach-message',
    autoReply: '/ai-enhanced/auto-reply',
  },

  // AI
  ai: {
    generate: '/ai/generate',
    workflow: '/ai-workflow',
    multimodal: '/multimodal',
    enhancement: '/enhancement',
  },

  // 数字人 & 声音克隆
  digitalHuman: '/digital-human',
  voiceClone: '/voice-clone',

  // Token统计
  tokenStats: '/token-stats',

  // 反馈
  feedback: '/ai-feedback',
  hotspot: '/hotspot',

  // 话术模板
  scripts: '/scripts',

  // 员工
  employee: '/employee',

  // 工单
  tickets: '/tickets',

  // 自动回复
  autoReply: '/auto-reply',

  // OAuth / 社交账号
  oauth: '/oauth',
  social: '/social',

  // Admin 管理
  admin: {
    features: '/admin/features',
    agents: '/admin/agents',
    branding: '/admin/branding',
    apiProviders: '/admin/api-providers',
    logs: '/admin/logs',
  },

  // Agent 代理
  agent: {
    list: '/agent/list',
    create: '/agent/create',
    update: '/agent/:id',
  },

  // 热点话题
  hotTopics: '/hot-topics',

  // 版本
  version: '/version',

  // 订单支付
  orders: {
    list: '/orders',
    detail: '/orders/:id',
    recharge: '/orders/recharge',
    subscribe: '/orders/subscribe',
    cancel: '/orders/:id/cancel',
    status: '/orders/:id/status',
  },

  // 订阅
  subscription: '/subscription',

  // 结算
  settlement: '/settlement',

  // 短信
  sms: '/sms',

  // 公告
  announcement: '/announcement',

  // 导出
  export: '/export',
};
