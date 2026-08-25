// API 配置 - 通过 Expo 环境变量或默认值配置
// 生产: https://api.baizhiji.net/api  |  本地: http://localhost:3001/api
// 单一配置入口：EXPO_PUBLIC_SERVER_URL（根地址）；BASE_URL 由其推导，仍可用 EXPO_PUBLIC_API_URL 单独覆盖
const DEFAULT_SERVER_URL = 'https://api.baizhiji.net';

// 服务器根地址（不带 /api 路径）—— 唯一配置入口
const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL || DEFAULT_SERVER_URL;

export const API_CONFIG = {
  // 服务器根地址（不带 /api 路径）
  SERVER_URL: serverUrl,

  // 完整 API 基础 URL（带 /api 路径），默认由 SERVER_URL 推导，避免只配一个变量时指向生产
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || `${serverUrl}/api`,

  // 启用生产模式
  DEV_MODE: false,

  // 超时设置（毫秒）
  TIMEOUT: 30000,

  // API版本
  VERSION: 'v1',
};

// 获取不带 /api 后缀的服务器根地址（support/qrcode 等需要拼接自定义路径时使用）
export function getApiBaseUrl(): string {
  return API_CONFIG.SERVER_URL;
}

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
