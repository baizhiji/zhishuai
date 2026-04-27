// 共享类型定义

// 用户相关类型
export interface User {
  id: string
  username: string
  phone: string
  role: 'admin' | 'agent' | 'customer'
  avatar?: string
  permissions: string[]
  features: string[]
  createdAt: Date
  updatedAt: Date
}

// 登录请求
export interface LoginRequest {
  phone: string
  password: string
}

// 登录响应
export interface LoginResponse {
  token: string
  user: User
  expiresIn: number
}

// 平台类型
export type Platform =
  | 'douyin'      // 抖音
  | 'kuaishou'    // 快手
  | 'xiaohongshu' // 小红书
  | 'video'       // 视频号
  | 'taobao'      // 淘宝
  | 'jd'          // 京东
  | 'pinduoduo'   // 拼多多
  | 'doudian'     // 抖店
  | 'meituan'     // 美团
  | 'boss'        // BOSS直聘
  | '51job'       // 前程无忧
  | 'zhilian'     // 智联招聘
  | 'lagou'       // 拉勾网

// API响应通用格式
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  code?: number
}

// 分页响应
export interface PageResponse<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
