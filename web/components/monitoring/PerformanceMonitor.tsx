'use client';

import { useEffect, useRef } from 'react';
import { message } from 'antd';

interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

/**
 * 性能监控组件
 * 在开发环境下显示性能指标，在生产环境下上报性能数据
 */
export default function PerformanceMonitor() {
  const metricsRef = useRef<PerformanceMetrics>({
    pageLoadTime: 0,
    domContentLoaded: 0,
    firstPaint: 0,
    firstContentfulPaint: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }

    // 等待页面完全加载
    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      metricsRef.current = {
        pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstPaint: paint.find((entry) => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint:
          paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0,
      };

      // 获取LCP
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            metricsRef.current.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.error('LCP observer error:', e);
        }
      }

      // 获取CLS
      if ('PerformanceObserver' in window) {
        try {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            metricsRef.current.cumulativeLayoutShift = clsValue;
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          console.error('CLS observer error:', e);
        }
      }

      // 获取FID
      if ('PerformanceObserver' in window) {
        try {
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              const entry = entries[0] as PerformanceEventTiming;
              metricsRef.current.firstInputDelay = entry.processingStart - entry.startTime;
            }
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          console.error('FID observer error:', e);
        }
      }

      // 开发环境下显示性能指标
      if (process.env.NODE_ENV === 'development') {
        console.group('🚀 Performance Metrics');
        console.log('Page Load Time:', `${metricsRef.current.pageLoadTime.toFixed(2)}ms`);
        console.log('DOM Content Loaded:', `${metricsRef.current.domContentLoaded.toFixed(2)}ms`);
        console.log('First Paint:', `${metricsRef.current.firstPaint.toFixed(2)}ms`);
        console.log('First Contentful Paint:', `${metricsRef.current.firstContentfulPaint.toFixed(2)}ms`);
        console.log('Largest Contentful Paint:', `${metricsRef.current.largestContentfulPaint?.toFixed(2)}ms || 'N/A'}`);
        console.log('Cumulative Layout Shift:', `${metricsRef.current.cumulativeLayoutShift?.toFixed(3)} || 'N/A'}`);
        console.log('First Input Delay:', `${metricsRef.current.firstInputDelay?.toFixed(2)}ms || 'N/A'}`);
        console.groupEnd();

        // 警告信息
        if (metricsRef.current.pageLoadTime > 3000) {
          message.warning('⚠️ 页面加载时间超过3秒，建议优化');
        }
        if (metricsRef.current.firstContentfulPaint > 1800) {
          message.warning('⚠️ 首次内容绘制时间过长，建议优化');
        }
      }

      // 生产环境下上报性能数据
      if (process.env.NODE_ENV === 'production') {
        reportPerformanceMetrics(metricsRef.current);
      }
    };

    // 延迟执行以确保性能数据完整
    window.addEventListener('load', measurePerformance);

    return () => {
      window.removeEventListener('load', measurePerformance);
    };
  }, []);

  // 上报性能数据
  const reportPerformanceMetrics = async (metrics: PerformanceMetrics) => {
    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          metrics,
        }),
      });
    } catch (error) {
      console.error('Failed to report performance metrics:', error);
    }
  };

  // 开发环境下显示性能面板
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        padding: 16,
        borderRadius: 8,
        fontSize: 12,
        zIndex: 9999,
        maxWidth: 300,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>性能指标</div>
      <div>页面加载: {metricsRef.current.pageLoadTime.toFixed(2)}ms</div>
      <div>DOM加载: {metricsRef.current.domContentLoaded.toFixed(2)}ms</div>
      <div>首次绘制: {metricsRef.current.firstPaint.toFixed(2)}ms</div>
      <div>FCP: {metricsRef.current.firstContentfulPaint.toFixed(2)}ms</div>
      {metricsRef.current.largestContentfulPaint && (
        <div>LCP: {metricsRef.current.largestContentfulPaint.toFixed(2)}ms</div>
      )}
      {metricsRef.current.cumulativeLayoutShift && (
        <div>CLS: {metricsRef.current.cumulativeLayoutShift.toFixed(3)}</div>
      )}
      {metricsRef.current.firstInputDelay && (
        <div>FID: {metricsRef.current.firstInputDelay.toFixed(2)}ms</div>
      )}
    </div>
  );
}

/**
 * 性能评分函数
 * @param metric 性能指标值
 * @param thresholds 阈值 { good: number, needsImprovement: number }
 * @returns 性能评分
 */
export function getPerformanceScore(
  metric: number,
  thresholds: { good: number; needsImprovement: number }
): 'good' | 'needs-improvement' | 'poor' {
  if (metric <= thresholds.good) return 'good';
  if (metric <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * 获取性能评分颜色
 * @param score 性能评分
 * @returns 颜色
 */
export function getPerformanceScoreColor(score: 'good' | 'needs-improvement' | 'poor'): string {
  switch (score) {
    case 'good':
      return '#52c41a';
    case 'needs-improvement':
      return '#faad14';
    case 'poor':
      return '#ff4d4f';
    default:
      return '#666';
  }
}
