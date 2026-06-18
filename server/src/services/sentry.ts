// Sentry 错误监控初始化
// 安装: npm install @sentry/node

import { init, captureException, setTag, setUser } from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping error monitoring setup');
    return;
  }

  init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [],
  });

  console.log('Sentry error monitoring initialized');
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (SENTRY_DSN) {
    if (context?.userId) setUser({ id: context.userId });
    if (context?.tag) setTag('feature', context.tag);
    captureException(error);
  }
  // 同时输出到本地日志
  console.error('[Error]', error.message, context || '');
}

export { captureException, setUser, setTag };
