// 共享工具函数

// 格式化日期
export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

// 格式化数字（例如：125000 -> 12.5万）
export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return String(num)
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), wait)
    }
  }
}

// 获取平台图标
export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    douyin: '🎵',
    kuaishou: '📹',
    xiaohongshu: '📕',
    video: '🎬',
    taobao: '🛍️',
    jd: '🛒',
    pinduoduo: '📦',
    doudian: '🎪',
    meituan: '🍔',
    boss: '💼',
    '51job': '📋',
    zhilian: '🔍',
    lagou: '🎯',
  }
  return icons[platform] || '📱'
}

// 获取平台名称
export function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    douyin: '抖音',
    kuaishou: '快手',
    xiaohongshu: '小红书',
    video: '视频号',
    taobao: '淘宝',
    jd: '京东',
    pinduoduo: '拼多多',
    doudian: '抖店',
    meituan: '美团',
    boss: 'BOSS直聘',
    '51job': '前程无忧',
    zhilian: '智联招聘',
    lagou: '拉勾网',
  }
  return names[platform] || platform
}

// 截断字符串
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.substr(0, maxLength) + '...'
}

// 获取错误消息
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

// 验证手机号
export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

// 验证密码
export function validatePassword(password: string): boolean {
  return password.length >= 6
}

// 睡眠函数
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
