/**
 * 性能监控工具
 */

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * 开始性能测量
   */
  startMeasure(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-start`)
    }
  }

  /**
   * 结束性能测量并记录
   */
  endMeasure(name: string): number {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-end`)
      window.performance.measure(name, `${name}-start`, `${name}-end`)

      const measure = window.performance.getEntriesByName(name)[0]
      const duration = measure.duration

      // 记录指标
      if (!this.metrics.has(name)) {
        this.metrics.set(name, [])
      }
      this.metrics.get(name)!.push(duration)

      // 清理标记
      window.performance.clearMarks(`${name}-start`)
      window.performance.clearMarks(`${name}-end`)
      window.performance.clearMeasures(name)

      return duration
    }
    return 0
  }

  /**
   * 获取指标统计数据
   */
  getMetrics(name: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) {
      return null
    }

    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    return { avg, min, max, count: values.length }
  }

  /**
   * 获取所有指标
   */
  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {}
    this.metrics.forEach((values, name) => {
      result[name] = this.getMetrics(name)
    })
    return result
  }

  /**
   * 清理指标
   */
  clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name)
    } else {
      this.metrics.clear()
    }
  }

  /**
   * 记录页面加载时间
   */
  recordPageLoad(): void {
    if (typeof window !== 'undefined' && window.performance) {
      const timing = window.performance.timing
      const metrics = {
        // DNS查询时间
        dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
        // TCP连接时间
        tcpConnect: timing.connectEnd - timing.connectStart,
        // 请求响应时间
        request: timing.responseEnd - timing.responseStart,
        // DOM解析时间
        domParse: timing.domComplete - timing.domInteractive,
        // 资源加载时间
        resourceLoad: timing.loadEventEnd - timing.domContentLoadedEventEnd,
        // 总加载时间
        totalLoad: timing.loadEventEnd - timing.navigationStart,
      }

      console.log('页面性能指标:', metrics)

      // 存储到指标中
      Object.entries(metrics).forEach(([key, value]) => {
        if (!this.metrics.has(key)) {
          this.metrics.set(key, [])
        }
        this.metrics.get(key)!.push(value)
      })
    }
  }

  /**
   * 获取Core Web Vitals
   */
  getCoreWebVitals(): Promise<{ LCP: number; FID: number; CLS: number }> {
    return new Promise((resolve) => {
      // 在实际项目中，这里应该使用 web-vitals 库
      // 这里提供一个简化版本
      setTimeout(() => {
        resolve({
          LCP: 2500, // Largest Contentful Paint
          FID: 100,  // First Input Delay
          CLS: 0.1,  // Cumulative Layout Shift
        })
      }, 1000)
    })
  }
}

export default PerformanceMonitor.getInstance()
