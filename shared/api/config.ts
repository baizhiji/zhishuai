// 共享API配置

// API基础配置
export const API_CONFIG = {
  // 开发环境
  development: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 30000,
  },

  // 生产环境
  production: {
    baseUrl: 'https://api.zhishuai.com',
    timeout: 30000,
  },
}

// 当前环境配置
export const CURRENT_API_CONFIG = API_CONFIG.development

// API提供商配置
export const API_PROVIDER = {
  // 阿里云百炼（主力平台）
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

  // 火山引擎（备用平台）
  volcano: {
    name: '火山引擎',
    baseUrl: 'https://api.volcengine.com',
    models: {
      text: 'doubao-pro',
      image: 'wanx-v1',
      video: 'x1-video',
    },
  },
}

// 默认API提供商
export const DEFAULT_API_PROVIDER = 'qwen'

// API端点配置
export const API_ENDPOINTS = {
  // 认证相关
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    refreshToken: '/auth/refresh',
  },

  // 用户相关
  user: {
    profile: '/user/profile',
    update: '/user/update',
    changePassword: '/user/change-password',
  },

  // 自媒体相关
  media: {
    generate: '/media/generate',
    accounts: '/media/accounts',
    publish: '/media/publish',
    stats: '/media/stats',
  },

  // 电商相关
  ecommerce: {
    products: '/ecommerce/products',
    shops: '/ecommerce/shops',
    publish: '/ecommerce/publish',
    priceMonitor: '/ecommerce/price-monitor',
    sales: '/ecommerce/sales',
  },

  // HR相关
  hr: {
    jobs: '/hr/jobs',
    resumes: '/hr/resumes',
    autoReply: '/hr/auto-reply',
    interview: '/hr/interview',
  },

  // 获客相关
  customer: {
    leads: '/customer/leads',
    messages: '/customer/messages',
    qrCodes: '/customer/qr-codes',
    stats: '/customer/stats',
  },

  // 推荐相关
  referral: {
    qrCode: '/referral/qr-code',
    link: '/referral/link',
    list: '/referral/list',
    track: '/referral/track',
  },

  // 系统配置相关
  system: {
    apiConfig: '/system/api-config',
    knowledgeBase: '/system/knowledge-base',
    appCustomize: '/system/app-customize',
  },
}
