/**
 * 智枢AI 共享类型定义
 *
 * 当前实际使用方：
 * - shared/types/video-production.ts（Banner/BGM/字幕等）→ desktop-ui（lib/ai/video-overlay-config.ts）
 * - UserRole（admin/agent/customer）为三端角色契约的权威枚举，与
 *   server/prisma/schema-restore.prisma 的 User.role 默认值("customer")保持一致
 *
 * 约定：新增跨端公共类型统一追加到本文件，不再另建独立类型文件
 * （shared/types/index.ts 已删除——其 PageResponse.list 与本文件 PaginatedResult.items
 *   契约冲突且无任何引用，避免误导）。
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
