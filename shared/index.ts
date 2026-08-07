/**
 * 智枢AI 共享类型定义
 * 被 web/ 和 server/ 共同引用
 *
 * TODO: 目前仅含基础 API 类型（ApiResponse/Pagination/UserInfo/ErrorCode 等）。
 * 随着三端发展，应将更多跨端类型（如 FeatureToggle、AgentInfo 等）提升至此文件，
 * 避免 web/ 和 server/ 各自维护独立类型定义。
 */

// ========== API 响应格式 ==========
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>[];
}

// ========== 分页 ==========
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor?: string;
}

// ========== 用户/认证 ==========
export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  CUSTOMER = 'customer',
}

export interface UserInfo {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

// ========== 状态枚举 ==========
export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
  PENDING = 'pending',
}

// ========== 错误码 ==========
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

// ========== 视频生产配置 ==========
// 配音/字幕/横幅/BGM 统一类型，web/apk/server 三端共用
export * from './types/video-production';
