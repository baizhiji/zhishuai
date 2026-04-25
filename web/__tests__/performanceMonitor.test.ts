import PerformanceMonitor from '@/lib/performanceMonitor'

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    // 清理单例实例
    // @ts-ignore
    PerformanceMonitor.instance = null
    monitor = PerformanceMonitor.getInstance()
  })

  describe('startMeasure 和 endMeasure', () => {
    it('应该能够开始和结束测量', () => {
      monitor.startMeasure('test-operation')
      const duration = monitor.endMeasure('test-operation')

      expect(duration).toBeGreaterThanOrEqual(0)
    })

    it('应该记录多个测量值', () => {
      monitor.startMeasure('test1')
      monitor.endMeasure('test1')

      monitor.startMeasure('test2')
      monitor.endMeasure('test2')

      const metrics = monitor.getAllMetrics()
      expect(metrics).toHaveProperty('test1')
      expect(metrics).toHaveProperty('test2')
    })
  })

  describe('getMetrics', () => {
    it('应该返回正确的统计数据', () => {
      monitor.startMeasure('test-metrics')
      monitor.endMeasure('test-metrics')

      const metrics = monitor.getMetrics('test-metrics')
      expect(metrics).not.toBeNull()
      expect(metrics?.avg).toBeGreaterThanOrEqual(0)
      expect(metrics?.min).toBeGreaterThanOrEqual(0)
      expect(metrics?.max).toBeGreaterThanOrEqual(0)
      expect(metrics?.count).toBe(1)
    })

    it('应该返回null如果没有数据', () => {
      const metrics = monitor.getMetrics('non-existent')
      expect(metrics).toBeNull()
    })
  })

  describe('getAllMetrics', () => {
    it('应该返回所有指标', () => {
      monitor.startMeasure('metric1')
      monitor.endMeasure('metric1')

      monitor.startMeasure('metric2')
      monitor.endMeasure('metric2')

      const allMetrics = monitor.getAllMetrics()
      expect(Object.keys(allMetrics)).toContain('metric1')
      expect(Object.keys(allMetrics)).toContain('metric2')
    })

    it('应该返回空对象如果没有指标', () => {
      monitor.clearMetrics()
      const allMetrics = monitor.getAllMetrics()
      expect(Object.keys(allMetrics)).toHaveLength(0)
    })
  })

  describe('clearMetrics', () => {
    it('应该清除所有指标', () => {
      monitor.startMeasure('test-clear')
      monitor.endMeasure('test-clear')

      monitor.clearMetrics()
      const metrics = monitor.getAllMetrics()
      expect(Object.keys(metrics)).toHaveLength(0)
    })

    it('应该清除指定指标', () => {
      monitor.startMeasure('metric1')
      monitor.endMeasure('metric1')

      monitor.startMeasure('metric2')
      monitor.endMeasure('metric2')

      monitor.clearMetrics('metric1')
      const metrics = monitor.getAllMetrics()
      expect(metrics).not.toHaveProperty('metric1')
      expect(metrics).toHaveProperty('metric2')
    })
  })

  describe('recordPageLoad', () => {
    it('应该记录页面加载指标', () => {
      // 模拟performance.timing
      // @ts-ignore
      global.performance = {
        timing: {
          domainLookupStart: 0,
          domainLookupEnd: 50,
          connectStart: 50,
          connectEnd: 100,
          responseStart: 200,
          responseEnd: 300,
          domInteractive: 400,
          domComplete: 500,
          domContentLoadedEventEnd: 600,
          loadEventEnd: 700,
          navigationStart: 0,
        },
        mark: jest.fn(),
        measure: jest.fn(),
        clearMarks: jest.fn(),
        clearMeasures: jest.fn(),
        getEntriesByName: jest.fn(() => [{ duration: 100 }]),
      }

      monitor.recordPageLoad()
      const metrics = monitor.getAllMetrics()

      expect(metrics).toHaveProperty('dnsLookup')
      expect(metrics).toHaveProperty('tcpConnect')
      expect(metrics).toHaveProperty('request')
      expect(metrics).toHaveProperty('domParse')
      expect(metrics).toHaveProperty('resourceLoad')
      expect(metrics).toHaveProperty('totalLoad')
    })
  })

  describe('getCoreWebVitals', () => {
    it('应该返回Core Web Vitals', async () => {
      const vitals = await monitor.getCoreWebVitals()

      expect(vitals).toHaveProperty('LCP')
      expect(vitals).toHaveProperty('FID')
      expect(vitals).toHaveProperty('CLS')

      expect(vitals.LCP).toBeGreaterThanOrEqual(0)
      expect(vitals.FID).toBeGreaterThanOrEqual(0)
      expect(vitals.CLS).toBeGreaterThanOrEqual(0)
    })
  })
})
