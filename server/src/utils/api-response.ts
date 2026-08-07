import { Response } from 'express';

export interface ApiMeta {
  requestId?: string;
  timestamp: string;
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  error: null;
  meta: ApiMeta;
}

export interface ApiError {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: ApiMeta;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

function buildMeta(meta?: Partial<ApiMeta>): ApiMeta {
  return {
    timestamp: new Date().toISOString(),
    ...meta,
  };
}

export function ok<T>(res: Response, data: T, meta?: Partial<ApiMeta>, status = 200): void {
  res.status(status).json({
    success: true,
    data,
    error: null,
    meta: buildMeta(meta),
  });
}

export function created<T>(res: Response, data: T, meta?: Partial<ApiMeta>): void {
  ok(res, data, meta, 201);
}

export function noContent(res: Response): void {
  res.status(204).send();
}

export function fail(
  res: Response,
  code: string,
  message: string,
  status: number,
  details?: unknown,
  meta?: Partial<ApiMeta>,
): void {
  res.status(status).json({
    success: false,
    data: null,
    error: { code, message, details },
    meta: buildMeta(meta),
  });
}

export function badRequest(res: Response, message: string, details?: unknown): void {
  fail(res, 'BAD_REQUEST', message, 400, details);
}

export function unauthorized(res: Response, message = '未登录或登录已过期'): void {
  fail(res, 'UNAUTHORIZED', message, 401);
}

export function forbidden(res: Response, message = '无权限访问'): void {
  fail(res, 'FORBIDDEN', message, 403);
}

export function notFound(res: Response, message = '资源不存在'): void {
  fail(res, 'NOT_FOUND', message, 404);
}

export function conflict(res: Response, message: string): void {
  fail(res, 'CONFLICT', message, 409);
}

export function validationError(res: Response, message: string, details?: unknown): void {
  fail(res, 'VALIDATION_ERROR', message, 422, details);
}

export function tooManyRequests(res: Response, message = '请求过于频繁'): void {
  fail(res, 'TOO_MANY_REQUESTS', message, 429);
}

export function internalError(res: Response, message = '服务器内部错误'): void {
  fail(res, 'INTERNAL_ERROR', message, 500);
}
