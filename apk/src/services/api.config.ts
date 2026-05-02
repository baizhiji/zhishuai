// API 配置
export const API_CONFIG = {
  // 开发环境使用本地Mock，实际部署时替换为真实API地址
  BASE_URL: 'https://api.zhishuai.com/v1',
  
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
  
  // 用户
  USER_INFO: '/user/info',
  UPDATE_USER: '/user/update',
  
  // 素材库
  MATERIALS: '/materials',
  MATERIALS_DETAIL: '/materials/:id',
  MATERIALS_DOWNLOAD: '/materials/:id/download',
  
  // 内容工厂
  CONTENT_GENERATE: '/content/generate',
  CONTENT_BATCH_GENERATE: '/content/batch-generate',
  CONTENT_BATCH_EDIT: '/content/batch-edit',
  
  // 矩阵管理
  ACCOUNTS: '/accounts',
  ACCOUNT_SYNC: '/accounts/:id/sync',
  
  // 发布中心
  PUBLISH_TASKS: '/publish/tasks',
  PUBLISH_BATCH: '/publish/batch',
  
  // 招聘助手
  RECRUITMENT_JOBS: '/recruitment/jobs',
  RECRUITMENT_RESUMES: '/recruitment/resumes',
  
  // 智能获客
  ACQUISITION_CUSTOMERS: '/acquisition/customers',
  ACQUISITION_TASKS: '/acquisition/tasks',
  ACQUISITION_STATS: '/acquisition/stats',
  
  // 转介绍
  REFERRAL_CODE: '/referral/codes',
  REFERRAL_RECORDS: '/referral/records',
  REFERRAL_STATS: '/referral/stats',
  
  // 订单支付
  ORDER_RECHARGE: '/orders/recharge',
  ORDER_SUBSCRIBE: '/orders/subscribe',
};
