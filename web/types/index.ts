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

export interface LoginRequest {
  phone: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
  expiresIn: number
}

// 自媒体相关类型
export interface MediaPlatform {
  id: string
  name: string
  icon: string
  type: 'douyin' | 'kuaishou' | 'xiaohongshu' | 'video'
  userId?: string
  nickname?: string
  avatar?: string
  fansCount?: number
  status: 'connected' | 'disconnected' | 'expired'
  createdAt: Date
}

export interface MediaContent {
  id: string
  title: string
  description: string
  content: string
  type: 'video' | 'image' | 'text'
  tags: string[]
  coverImage?: string
  videoUrl?: string
  images?: string[]
  platform: string
  publishStatus: 'draft' | 'published' | 'scheduled'
  publishTime?: Date
  stats: {
    views: number
    likes: number
    comments: number
    shares: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface ContentGenerationRequest {
  topic?: string
  keywords?: string[]
  style?: string
  type: 'video' | 'image' | 'text'
  platform: string
}

// 电商相关类型
export interface EcommercePlatform {
  id: string
  name: string
  icon: string
  type: 'taobao' | 'jd' | 'pinduoduo' | 'doudian' | 'meituan'
  shopId?: string
  shopName?: string
  status: 'connected' | 'disconnected' | 'expired'
  createdAt: Date
}

export interface Product {
  id: string
  name: string
  title: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  brand?: string
  stock: number
  sales: number
  platform: string
  publishStatus: 'draft' | 'published' | 'offline'
  publishTime?: Date
  stats: {
    views: number
    orders: number
    conversionRate: number
    refundRate: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface PriceMonitor {
  id: string
  productId: string
  productName: string
  competitorPrice: number
  ourPrice: number
  priceDiff: number
  trend: 'up' | 'down' | 'stable'
  updateTime: Date
}

// HR相关类型
export interface HRPlatform {
  id: string
  name: string
  icon: string
  type: 'boss' | '51job' | 'zhilian' | 'lagou'
  companyId?: string
  companyName?: string
  status: 'connected' | 'disconnected' | 'expired'
  createdAt: Date
}

export interface JobPosition {
  id: string
  title: string
  description: string
  requirements: string[]
  salary: string
  location: string
  type: 'fulltime' | 'parttime' | 'intern'
  experience: string
  education: string
  platform: string
  publishStatus: 'draft' | 'published' | 'closed'
  publishTime?: Date
  applicantsCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Resume {
  id: string
  name: string
  phone: string
  email: string
  age?: number
  education: string
  experience: string
  skills: string[]
  matchScore: number
  status: 'pending' | 'reviewed' | 'interviewed' 'hired' | 'rejected'
  notes: string
  jobId: string
  createdAt: Date
  updatedAt: Date
}

// 获客相关类型
export interface CustomerLead {
  id: string
  platform: string
  username: string
  avatar?: string
  userId?: string
  source: 'keyword' | 'topic' | 'behavior' | 'live'
  tags: string[]
  intention: 'high' | 'medium' | 'low'
  contactStatus: 'pending' | 'contacted' | 'responded' 'converted'
  lastContactTime?: Date
  conversionStatus: boolean
  notes: string
  createdAt: Date
  updatedAt: Date
}

// 推荐相关类型
export interface Referral {
  id: string
  referrerId: string
  referredUserId: string
  referredUserName: string
  status: 'pending' | 'registered' | 'active'
  commission?: number
  createdAt: Date
  registeredAt?: Date
  activatedAt?: Date
}

export interface ReferralQRCode {
  id: string
  userId: string
  qrCode: string
  shortLink: string
  scanCount: number
  registerCount: number
  activeCount: number
  commission: number
  createdAt: Date
  expiresAt?: Date
}

// 系统配置相关类型
export interface SystemConfig {
  appName: string
  appLogo: string
  themeColor: string
  theme: 'light' | 'dark' | 'auto'
  version: string
  features: {
    media: boolean
    ecommerce: boolean
    hr: boolean
    customer: boolean
    referral: boolean
  }
  apiProvider: 'qwen' | 'volcano'
}

export interface APIConfig {
  provider: string
  apiKey: string
  apiSecret?: string
  baseUrl: string
  enabled: boolean
}

// 通用响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  code?: number
}

export interface PageResponse<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
