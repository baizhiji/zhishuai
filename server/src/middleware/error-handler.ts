import { Request, Response, NextFunction } from 'express';
import { internalError, ApiMeta } from '../utils/api-response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(`[ERROR] ${err.message}`, err.stack);

  internalError(
    res,
    process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message,
  );
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    data: null,
    error: { code: 'NOT_FOUND', message: `路由 ${_req.method} ${_req.path} 不存在` },
    meta: { timestamp: new Date().toISOString() },
  });
}
