// API 配置
export const API_CONFIG = {
  // 后端服务地址（生产环境）- 统一使用实际服务器地址
  BASE_URL: 'https://api.zhishuai.com/v1',
  
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
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  SEND_CODE: '/auth/send-code',
  
  // 用户
  USER_INFO: '/account/',
  UPDATE_USER: '/account/',
  UPDATE_PASSWORD: '/account/password',
  
  // 素材库
  MATERIALS: '/materials',
  MATERIALS_DETAIL: '/materials/:id',
  MATERIALS_DOWNLOAD: '/materials/:id/download',
  
  // AI对话
  AI_CHAT: '/ai-chat/chat',
  
  // 矩阵管理
  MATRIX_ACCOUNTS: '/matrix/accounts',
  MATRIX_ACCOUNT_DETAIL: '/matrix/accounts/:id',
  
  // 发布中心
  PUBLISH_LIST: '/publish',
  PUBLISH_CREATE: '/publish',
  PUBLISH_HISTORY: '/publish/history',
  
  // 招聘助手
  RECRUITMENT_JOBS: '/recruitment/jobs',
  RECRUITMENT_CANDIDATES: '/recruitment/candidates',
  RECRUITMENT_INTERVIEWS: '/recruitment/interviews',
  
  // 智能获客
  ACQUISITION_TASKS: '/acquisition/tasks',
  ACQUISITION_LEADS: '/acquisition/leads',
  
  // 推荐分享
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
