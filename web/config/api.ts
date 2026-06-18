/**
 * 统一 API 配置
 * 所有前端模块应使用此配置文件
 */

// API 基础地址
// 开发环境: http://localhost:3001/api
// 生产环境: http://43.129.16.148:3001/api 或 https://baizhiji.net/api

const getBaseURL = () => {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // 开发环境
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001/api';
  }
  
  // 生产环境默认（通过 Nginx 反向代理）
  return '/api';
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 30000,
  VERSION: 'v1',
};

// API 端点映射 - 与后端路由完全一致
export const API_ENDPOINTS = {
  // 认证
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    SEND_CODE: '/auth/send-code',
  },
  
  // 用户
  USER: {
    INFO: '/account/info',
    UPDATE: '/account/update',
    PASSWORD: '/account/password',
  },
  
  // AI 对话
  AI_CHAT: '/ai-chat/chat',
  AI_CHAT_HISTORY: '/ai-chat/history',
  
  // AI 增强功能
  AI_ENHANCED: {
    TITLE: '/ai-enhanced/title',
    SCRIPT: '/ai-enhanced/script',
    POST: '/ai-enhanced/post',
    HASHTAGS: '/ai-enhanced/hashtags',
    KEYWORDS: '/ai-enhanced/keywords',
    COPY_WRITING: '/ai-enhanced/copywriting',
    PRODUCT_DESCRIPTION: '/ai-enhanced/product-description',
    DIGITAL_HUMAN: '/ai-enhanced/digital-human',
    VIDEO_SCRIPT: '/ai-enhanced/video-script',
    RECRUITMENT_JD: '/ai-enhanced/recruitment-jd',
    OUTREACH_MESSAGE: '/ai-enhanced/outreach-message',
    AUTO_REPLY: '/ai-enhanced/auto-reply',
  },
  
  // 素材库
  MATERIALS: {
    LIST: '/materials',
    UPLOAD: '/materials/upload',
    DELETE: '/materials/:id',
  },
  
  // 矩阵管理
  MATRIX: {
    ACCOUNTS: '/matrix/accounts',
    ACCOUNT_DETAIL: '/matrix/accounts/:id',
  },
  
  // 发布中心
  PUBLISH: {
    LIST: '/publish',
    CREATE: '/publish',
    HISTORY: '/publish/history',
  },
  
  // 招聘助手
  RECRUITMENT: {
    JOBS: '/recruitment/jobs',
    CANDIDATES: '/recruitment/candidates',
    INTERVIEWS: '/recruitment/interviews',
  },
  
  // 获客
  ACQUISITION: {
    TASKS: '/acquisition/tasks',
    LEADS: '/acquisition/leads',
  },
  
  // 推荐分享
  SHARE: {
    QRCODES: '/share/codes',
    RECORDS: '/share/records',
  },
  
  // 数据统计
  STATS: {
    DASHBOARD: '/statistics/dashboard',
    CONTENT: '/statistics/content',
    TREND: '/statistics/trend',
  },
  
  // 通知
  NOTIFICATIONS: {
    LIST: '/notifications',
    READ: '/notifications/:id/read',
    READ_ALL: '/notifications/read-all',
  },
  
  // 管道服务
  PIPELINE: {
    LIST: '/pipeline/list',
    EXECUTE: '/pipeline/execute',
    MODEL_ASSIGNMENTS: '/pipeline/model-assignments',
  },

  // 合规检测
  COMPLIANCE: {
    CHECK: '/compliance/check',
    QUICK_CHECK: '/compliance/quick-check',
    PLATFORM_RULES: '/compliance/platform-rules/:platform',
    PLATFORMS: '/compliance/platforms',
  },

  // 智能体
  AGENT: {
    LIST: '/agent/list',
    CREATE: '/agent/create',
    UPDATE: '/agent/:id',
  },
};

// 向后兼容的 apiConfig 导出（旧代码使用）
// 默认关闭 Mock，使用真实 API；仅在明确设置环境变量时开启 Mock
export const apiConfig = {
  useMock: process.env.NEXT_PUBLIC_USE_MOCK === 'true',
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
};

export default API_CONFIG;
