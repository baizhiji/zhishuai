/**
 * Rate Limiter Middleware — 限流防刷
 *
 * 使用内存存储(生产环境建议换Redis)
 * 支持按用户ID、IP、端点维度限流
 */
import { Request, Response, NextFunction } from 'express';

// ─── 类型 ────────────────────────────────

interface RateWindow {
  count: number;
  resetAt: number;
}

interface LimiterConfig {
  windowMs: number;   // 时间窗口(毫秒)
  max: number;        // 最大请求数
  keyFn?: (req: Request) => string; // 自定义key函数
  message?: string;
}

// ─── 内存存储 ────────────────────────────────

const store = new Map<string, RateWindow>();

// 定期清理过期记录(每5分钟)
setInterval(() => {
  const now = Date.now();
  for (const [key, window] of store.entries()) {
    if (window.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ─── 限流器工厂 ────────────────────────────────

export function rateLimiter(config: LimiterConfig) {
  const { windowMs, max, keyFn, message = '请求过于频繁，请稍后重试' } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn
      ? keyFn(req)
      : `${(req as any).userId || req.ip}_${req.path}`;

    const now = Date.now();
    let window = store.get(key);

    // 过期或不存在则重置
    if (!window || window.resetAt <= now) {
      window = { count: 0, resetAt: now + windowMs };
      store.set(key, window);
    }

    window.count++;

    // 设置限流头
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - window.count));
    res.setHeader('X-RateLimit-Reset', new Date(window.resetAt).toISOString());

    if (window.count > max) {
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((window.resetAt - now) / 1000),
      });
    }

    next();
  };
}

// ─── 预置限流器 ────────────────────────────────

// 登录接口: 5次/分钟
export const loginLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  keyFn: (req) => `login_${req.ip}`,
  message: '登录尝试过于频繁，请1分钟后重试',
});

// 扫码接口: 20次/分钟
export const scanLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  keyFn: (req) => `scan_${(req as any).userId || req.ip}`,
  message: '扫码请求过于频繁，请稍后重试',
});

// AI生成接口: 30次/分钟(按用户)
export const aiGenerationLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  keyFn: (req) => `ai_${(req as any).userId}`,
  message: 'AI生成请求过于频繁，请稍后重试',
});

// 全局API: 100次/分钟(按IP)
export const globalLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  keyFn: (req) => `global_${req.ip}`,
  message: '请求过于频繁，请稍后重试',
});

// 创建自定义限流器
export function createLimiter(windowMs: number, max: number, name: string) {
  return rateLimiter({
    windowMs,
    max,
    keyFn: (req) => `${name}_${(req as any).userId || req.ip}`,
  });
}

export default { rateLimiter, loginLimiter, scanLimiter, aiGenerationLimiter, globalLimiter, createLimiter };
