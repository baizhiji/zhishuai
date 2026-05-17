// API 配置
export const API_CONFIG = {
  // 后端服务地址（生产环境）- 香港腾讯云服务器
  BASE_URL: 'https://baizhiji.net/api',
  
  // 启用生产模式
  DEV_MODE: false,
  
  // 超时设置（毫秒）
  TIMEOUT: 30000,
  
  // API版本
  VERSION: 'v1',
};

// API端点
export const API_ENDPOINTS = {
  // 认证
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  SEND_CODE: '/auth/send-code',
  
  // 用户
  USER_INFO: '/account/profile',
  UPDATE_USER: '/account/profile',
  UPDATE_PASSWORD: '/account/password',
  
  // 素材库
  MATERIALS: '/materials',
  MATERIALS_DETAIL: '/materials/:id',
  MATERIALS_DOWNLOAD: '/materials/:id/download',
  
  // AI生成
  AI_TEXT: '/ai/generate/text',
  AI_IMAGE: '/ai/generate/image',
  AI_VIDEO: '/ai/generate/video',
  AI_DIGITAL: '/ai/generate/digital',
  AI_CHAT: '/ai-chat/message',
  
  // 内容工厂
  CONTENT_GENERATE: '/ai/generate/text',
  CONTENT_BATCH_GENERATE: '/ai/generate/batch',
  
  // 矩阵管理
  MATRIX_ACCOUNTS: '/matrix/accounts',
  MATRIX_ACCOUNT_DETAIL: '/matrix/accounts/:id',
  
  // 发布中心
  PUBLISH_LIST: '/publish',
  PUBLISH_CREATE: '/publish',
  PUBLISH_HISTORY: '/publish/history',
  
  // 招聘助手
  RECRUITMENT_JOBS: '/recruitment/posts',
  RECRUITMENT_CANDIDATES: '/recruitment/candidates',
  RECRUITMENT_INTERVIEWS: '/recruitment/interviews',
  
  // 智能获客
  ACQUISITION_TASKS: '/acquisition/tasks',
  ACQUISITION_LEADS: '/acquisition/leads',
  
  // 推荐分享
  SHARE_QRCODES: '/share/qrcodes',
  SHARE_RECORDS: '/share/records',
  
  // 转介绍
  REFERRAL_STATS: '/referral/stats',
  REFERRAL_USERS: '/referral/users',
  
  // 统计
  DASHBOARD: '/statistics/dashboard',
  TREND: '/statistics/trend',
  
  // 通知
  NOTIFICATIONS: '/notifications',
};
