// API 配置
export const API_CONFIG = {
  // 后端服务地址（生产环境必须 HTTPS）
  // 开发调试时可在 app.json extra 中覆盖
  BASE_URL: 'https://baizhiji.net/api',

  // 启用生产模式
  DEV_MODE: false,

  // 超时设置（毫秒）
  TIMEOUT: 30000,
  // 流式接口超时（毫秒）
  STREAM_TIMEOUT: 120000,

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

  // 用户/账号
  USER_INFO: '/account/',
  UPDATE_USER: '/account/',
  UPDATE_PASSWORD: '/account/password',
  USER_PACKAGES: '/account/packages',
  USER_STAFF: '/account/staff',

  // 素材库
  MATERIALS: '/materials',
  MATERIALS_DETAIL: '/materials/:id',
  MATERIALS_DOWNLOAD: '/materials/:id/download',

  // AI对话
  AI_CHAT: '/ai-chat/chat',
  AI_CHAT_HISTORY: '/ai-chat/history',

  // 矩阵管理 (服务端路由: /matrix/, /matrix/:id)
  MATRIX_ACCOUNTS: '/matrix',
  MATRIX_ACCOUNT_CREATE: '/matrix',
  MATRIX_ACCOUNT_UPDATE: '/matrix/:id',
  MATRIX_ACCOUNT_DELETE: '/matrix/:id',

  // 发布中心 (服务端路由: /publish/tasks, /publish/stats)
  PUBLISH_LIST: '/publish/tasks',
  PUBLISH_CREATE: '/publish/tasks',
  PUBLISH_DETAIL: '/publish/tasks/:id',
  PUBLISH_RETRY: '/publish/tasks/:id/retry',
  PUBLISH_DELETE: '/publish/tasks/:id',
  PUBLISH_STATS: '/publish/stats',

  // 招聘助手
  RECRUITMENT_JOBS: '/recruitment/jobs',
  RECRUITMENT_STATS: '/recruitment/stats',
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

  // 管理员操作
  ADMIN_CREATE_USER: '/auth/admin/create-user',
  ADMIN_USERS: '/auth/admin/users',
  ADMIN_RESET_PASSWORD: '/auth/admin/reset-user-password',

  // AI配置
  AI_CONFIG_KEYS: '/ai-config/keys',

  // 转介绍/推荐分享
  REFERRAL_CODE: '/share/codes',
  REFERRAL_RECORDS: '/share/records',
  REFERRAL_STATS: '/referral/stats',

  // 数字人 (服务端路由: /digital-human/humans, /digital-human/tasks)
  DIGITAL_HUMAN_LIST: '/digital-human/humans',
  DIGITAL_HUMAN_DETAIL: '/digital-human/humans/:id',
  DIGITAL_HUMAN_CREATE: '/digital-human/humans',
  DIGITAL_HUMAN_TEMPLATES: '/digital-human/templates',
  DIGITAL_HUMAN_TASKS: '/digital-human/tasks',
  DIGITAL_HUMAN_TASK_CREATE: '/digital-human/tasks',
  DIGITAL_HUMAN_TASK_DETAIL: '/digital-human/tasks/:id',
  DIGITAL_HUMAN_STATS: '/digital-human/stats',

  // 声音克隆 (服务端路由: /voice-clone/voices, /voice-clone/videos)
  VOICE_CLONE_LIST: '/voice-clone/voices',
  VOICE_CLONE_CREATE: '/voice-clone/voices',
  VOICE_CLONE_PREVIEW: '/voice-clone/voices/:id/preview',
  VOICE_CLONE_VIDEOS: '/voice-clone/videos',
  VOICE_CLONE_VIDEO_CREATE: '/voice-clone/videos',

  // Dashboard统计
  DASHBOARD_OVERVIEW: '/dashboard-stats/overview',
  DASHBOARD_STATS: '/dashboard-stats/stats',

  // 员工管理 (服务端路由: /employee/employees)
  EMPLOYEE_LIST: '/employee/employees',
  EMPLOYEE_CREATE: '/employee/employees',
  EMPLOYEE_UPDATE: '/employee/employees/:id',
  EMPLOYEE_RESET_PASSWORD: '/employee/employees/:id/reset-password',
  EMPLOYEE_DELETE: '/employee/employees/:id',
  EMPLOYEE_LOGIN: '/employee/employees/login',
  EMPLOYEE_LOGIN_LOGS: '/employee/employees/:id/login-logs',

  // CRM客户管理 (服务端路由: /crm/customers)
  CRM_CUSTOMERS: '/crm/customers',
  CRM_CUSTOMER_DETAIL: '/crm/customers/:id',
  CRM_CUSTOMER_CREATE: '/crm/customers',
  CRM_CUSTOMER_UPDATE: '/crm/customers/:id',
  CRM_CUSTOMER_DELETE: '/crm/customers/:id',
  CRM_FOLLOW_UPS: '/crm/customers/:id/follow-ups',
  CRM_MY_STATS: '/crm/my-stats',
  CRM_PUBLIC_POOL: '/crm/public-pool',
  CRM_CLAIM: '/crm/customers/:id/claim',
  CRM_RELEASE: '/crm/customers/:id/release',

  // 合规检测 (服务端路由: /compliance/check)
  COMPLIANCE_CHECK: '/compliance/check',
  COMPLIANCE_QUICK_CHECK: '/compliance/quick-check',
  COMPLIANCE_PLATFORM_RULES: '/compliance/platform-rules/:platform',
  COMPLIANCE_PLATFORMS: '/compliance/platforms',

  // 报表 (服务端路由: /report/generate, /report/types)
  REPORT_GENERATE: '/report/generate',
  REPORT_TYPES: '/report/types',
  // 编程助手
  CODE_ASSISTANT_GENERATE: '/code-assistant/generate',
  CODE_ASSISTANT_EXPLAIN: '/code-assistant/explain',
  CODE_ASSISTANT_DEBUG: '/code-assistant/debug',
  CODE_ASSISTANT_TESTGEN: '/code-assistant/testgen',
  CODE_ASSISTANT_REVIEW: '/code-assistant/review',
  CODE_ASSISTANT_NL2CODE: '/code-assistant/nl2code',
  CODE_ASSISTANT_MODELS: '/code-assistant/models',
  CODE_ASSISTANT_CONVERSATIONS: '/code-assistant/conversations',
  CODE_ASSISTANT_CONVERSATION_DETAIL: '/code-assistant/conversations/:id',
};
