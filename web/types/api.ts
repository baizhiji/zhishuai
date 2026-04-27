// API响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 用户类型
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  role: 'admin' | 'agent' | 'customer';
  status: 'active' | 'inactive' | 'banned';
  createdAt?: string;
  updatedAt?: string;
}

// 登录请求
export interface LoginRequest {
  phone: string;
  password: string;
}

// 注册请求
export interface RegisterRequest {
  phone: string;
  password: string;
  code: string;
  name: string;
}

// 登录响应
export interface LoginResponse {
  token: string;
  user: User;
}

// 素材类型
export enum MaterialType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  DIGITAL_HUMAN = 'digital-human',
  ECOMMERCE = 'ecommerce'
}

// 素材状态
export enum MaterialStatus {
  UNUSED = 'unused',
  USED = 'used'
}

// 素材
export interface Material {
  id: string;
  type: MaterialType;
  title: string;
  content: string;
  url?: string;
  thumbnailUrl?: string;
  category?: string;
  tags?: string[];
  status: MaterialStatus;
  createdAt: string;
  updatedAt: string;
}

// 素材列表查询参数
export interface MaterialListParams {
  page: number;
  pageSize: number;
  type?: MaterialType;
  status?: MaterialStatus;
  keyword?: string;
  category?: string;
}

// 内容生成请求
export interface ContentGenerateRequest {
  type: 'text' | 'image' | 'video' | 'digital-human';
  contentType?: 'short' | 'long' | 'article';
  platform?: 'douyin' | 'xiaohongshu' | 'weibo' | 'wechat';
  topic: string;
  style?: string;
  wordCount?: number;
}

// 批量生成请求
export interface BatchGenerateRequest {
  type: 'text' | 'image' | 'video';
  count: number;
  topics: string[];
  style?: string;
}

// 批量剪辑请求
export interface BatchEditRequest {
  materials: string[];
  addSubtitle?: 'auto' | 'off';
  addBgm?: string;
  effects?: string[];
}

// 账号平台
export enum Platform {
  DOUYIN = 'douyin',
  XIAOHONGSHU = 'xiaohongshu',
  WEIBO = 'weibo',
  WECHAT = 'wechat',
  BILIBILI = 'bilibili'
}

// 账号
export interface Account {
  id: string;
  platform: Platform;
  accountName: string;
  accountId?: string;
  avatar?: string;
  followerCount?: number;
  autoPublish: boolean;
  status: 'active' | 'inactive' | 'banned';
  lastSyncAt?: string;
  createdAt: string;
}

// 发布任务
export interface PublishTask {
  id: string;
  materialId: string;
  platforms: Platform[];
  scheduledTime?: string;
  status: 'pending' | 'publishing' | 'success' | 'failed';
  results?: {
    platform: Platform;
    status: 'success' | 'failed';
    url?: string;
    error?: string;
  }[];
  createdAt: string;
}

// 职位
export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  experience: string;
  education: string;
  description: string;
  requirements: string[];
  status: 'active' | 'closed' | 'draft';
  createdAt: string;
}

// 简历
export interface Resume {
  id: string;
  jobId: string;
  name: string;
  phone: string;
  email: string;
  age?: number;
  education: string;
  experience: string;
  skills: string[];
  score?: number;
  status: 'new' | 'reviewed' | 'interview' | 'hired' | 'rejected';
  createdAt: string;
}

// 潜客
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  source: string;
  interestLevel: 'high' | 'medium' | 'low';
  status: 'new' | 'contacted' | 'converted' | 'lost';
  tags: string[];
  notes?: string;
  createdAt: string;
}

// 获客任务
export interface AcquisitionTask {
  id: string;
  name: string;
  type: string;
  target: number;
  current: number;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
}

// 获客统计
export interface AcquisitionStats {
  totalCustomers: number;
  newCustomers: number;
  conversionRate: number;
  avgAcquisitionCost: number;
}

// 推荐码
export interface ReferralCode {
  id: string;
  code: string;
  status: 'active' | 'inactive';
  totalReferrals: number;
  totalEarnings: number;
  createdAt: string;
  expiresAt?: string;
}

// 推荐记录
export interface ReferralRecord {
  id: string;
  referredUserId: string;
  referredUserName: string;
  amount: number;
  status: 'pending' | 'completed';
  createdAt: string;
}

// 推荐统计
export interface ReferralStats {
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  conversionRate: number;
}

// 订单类型
export enum OrderType {
  RECHARGE = 'recharge',
  SUBSCRIBE = 'subscribe'
}

// 支付方式
export enum PaymentMethod {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  BALANCE = 'balance'
}

// 订单状态
export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// 订阅计划
export enum SubscriptionPlan {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// 订单
export interface Order {
  id: string;
  type: OrderType;
  amount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  planId?: SubscriptionPlan;
  createdAt: string;
  paidAt?: string;
}

// 用户余额
export interface UserBalance {
  balance: number;
  frozenBalance: number;
}

// 用户积分
export interface UserPoints {
  total: number;
  available: number;
  frozen: number;
}

// API服务商
export interface ApiProvider {
  id: string;
  name: string;
  type: 'aliyun' | 'volcengine' | 'openai';
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
}

// 知识库
export interface Knowledge {
  id: string;
  name: string;
  description: string;
  fileCount: number;
  status: 'active' | 'processing';
  createdAt: string;
}

// 操作日志
export interface Log {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: string;
  ipAddress: string;
  createdAt: string;
}
