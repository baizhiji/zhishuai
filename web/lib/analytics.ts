/**
 * 分析埋点基础框架
 * 当前通过后端 /api/analytics 上报
 * 后续可接入 Google Analytics / 百度统计 / 神策 等
 */

type EventCategory = 'page_view' | 'click' | 'action' | 'error' | 'conversion';

interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: number;
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly FLUSH_INTERVAL = 5000; // 5秒批量上报
  private readonly MAX_QUEUE = 20; // 最多缓存20条

  constructor() {
    if (typeof window !== 'undefined') {
      this.startFlushTimer();
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => this.flush(), this.FLUSH_INTERVAL);
  }

  track(
    category: EventCategory,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ) {
    const event: AnalyticsEvent = {
      category,
      action,
      label,
      value,
      metadata,
      timestamp: Date.now(),
    };

    this.queue.push(event);

    // 重要事件（error/conversion）立即上报
    if (category === 'error' || category === 'conversion') {
      this.flush();
      return;
    }

    // 队列满了也上报
    if (this.queue.length >= this.MAX_QUEUE) {
      this.flush();
    }
  }

  // 页面浏览
  pageView(pageName: string, metadata?: Record<string, any>) {
    this.track('page_view', pageName, undefined, undefined, metadata);
  }

  // 点击
  click(elementName: string, metadata?: Record<string, any>) {
    this.track('click', elementName, undefined, undefined, metadata);
  }

  // 业务操作
  action(actionName: string, metadata?: Record<string, any>) {
    this.track('action', actionName, undefined, undefined, metadata);
  }

  // 错误
  error(errorName: string, metadata?: Record<string, any>) {
    this.track('error', errorName, undefined, undefined, metadata);
  }

  // 转化
  conversion(conversionName: string, value?: number, metadata?: Record<string, any>) {
    this.track('conversion', conversionName, undefined, value, metadata);
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
      await fetch(`${baseURL}/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
        keepalive: true, // 确保页面关闭时也能发送
      });
    } catch (e) {
      // 静默失败，不影响用户体验
      // 重新放回队列，下次再试
      this.queue = [...events, ...this.queue].slice(0, this.MAX_QUEUE);
    }
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}

// 单例
const analytics = typeof window !== 'undefined' ? new Analytics() : null;

export function useAnalytics() {
  return {
    pageView: (page: string, meta?: Record<string, any>) => analytics?.pageView(page, meta),
    click: (el: string, meta?: Record<string, any>) => analytics?.click(el, meta),
    action: (act: string, meta?: Record<string, any>) => analytics?.action(act, meta),
    error: (err: string, meta?: Record<string, any>) => analytics?.error(err, meta),
    conversion: (conv: string, value?: number, meta?: Record<string, any>) =>
      analytics?.conversion(conv, value, meta),
  };
}

export default analytics;
