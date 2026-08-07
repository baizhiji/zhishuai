// API 配置 - 通过 Expo 环境变量或默认值配置
// 生产: https://api.zhishuai.cc/api  |  本地: http://localhost:3001/api
// 可通过 EXPO_PUBLIC_API_URL 环境变量覆盖
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.zhishuai.cc/api',
  
  // 启用生产模式
  DEV_MODE: false,
  
  // 超时设置（毫秒）
  TIMEOUT: 30000,
  
  // API版本
  VERSION: 'v1',
};

// API端点 - 与后端路由完全匹配
export const API_ENDPOINTS = {
  // 认证
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  SEND_CODE: '/auth/send-code',
  
  // 用户
  USER_INFO: '/account/',
  UPDATE_USER: '/account/',
  UPDATE_PASSWORD: '/account/password',
  
  // 内容中心
  MATERIALS: '/materials',
  MATERIALS_DETAIL: '/materials/:id',
  MATERIALS_DOWNLOAD: '/materials/:id/download',
  
  // AI对话
  AI_CHAT: '/ai-chat/chat',
  
  // 智能招聘
  RECRUITMENT_JOBS: '/recruitment/jobs',
  RECRUITMENT_CANDIDATES: '/recruitment/candidates',
  RECRUITMENT_INTERVIEWS: '/recruitment/interviews',
  
  // 智能获客
  ACQUISITION_TASKS: '/acquisition/tasks',
  ACQUISITION_LEADS: '/acquisition/leads',
  ACQUISITION_STATS: '/acquisition/stats',
  
  // 推荐分享
  REFERRAL_STATS: '/referral/stats',
  REFERRAL_CODE: '/share/codes',
  REFERRAL_RECORDS: '/share/records',
  SHARE_QRCODES: '/share/codes',
  SHARE_RECORDS: '/share/records',
  
  // 通知
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_READ: '/notifications/:id/read',
  
  // 功能开关
  FEATURES: '/features',
  FEATURES_AVAILABLE: '/features/available',
  FEATURE_DETAIL: '/features/:featureCode',
};
