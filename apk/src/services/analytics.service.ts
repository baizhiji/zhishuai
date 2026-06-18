/**
 * 分析埋点服务 (APK端)
 * 通过后端 /api/analytics/events 上报
 */
import { apiClient } from './api.client';
import { API_ENDPOINTS } from './api.config';

type EventCategory = 'page_view' | 'click' | 'action' | 'error' | 'conversion';

interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: number;
}

class AnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly FLUSH_INTERVAL = 5000;
  private readonly MAX_QUEUE = 20;

  constructor() {
    this.startFlushTimer();
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

    if (category === 'error' || category === 'conversion' || this.queue.length >= this.MAX_QUEUE) {
      this.flush();
    }
  }

  pageView(pageName: string, metadata?: Record<string, any>) {
    this.track('page_view', pageName, undefined, undefined, metadata);
  }

  click(elementName: string, metadata?: Record<string, any>) {
    this.track('click', elementName, undefined, undefined, metadata);
  }

  action(actionName: string, metadata?: Record<string, any>) {
    this.track('action', actionName, undefined, undefined, metadata);
  }

  error(errorName: string, metadata?: Record<string, any>) {
    this.track('error', errorName, undefined, undefined, metadata);
  }

  conversion(conversionName: string, value?: number, metadata?: Record<string, any>) {
    this.track('conversion', conversionName, undefined, value, metadata);
  }

  private async flush() {
    if (this.queue.length === 0) return;
    const events = [...this.queue];
    this.queue = [];

    try {
      await apiClient.post('/analytics/events', { events }).catch(() => {});
    } catch (e) {
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

export const analyticsService = new AnalyticsService();
