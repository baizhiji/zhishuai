import Image from 'next/image'

export default function optimizeImage(src: string, width: number, quality: number = 75) {
  // 在生产环境中，这里可以接入CDN或图片优化服务
  return src
}

export const imageConfig = {
  // 图片质量
  quality: 75,
  // 支持的图片格式
  formats: ['image/avif', 'image/webp'],
  // 图片尺寸
  sizes: {
    thumbnail: 150,
    small: 300,
    medium: 600,
    large: 1200,
    xlarge: 1920,
  },
  // 懒加载配置
  lazy: {
    rootMargin: '50px',
    threshold: 0.1,
  },
}

export const getOptimizedImageUrl = (
  originalUrl: string,
  size: keyof typeof imageConfig.sizes = 'medium'
): string => {
  // 这里可以根据实际需求实现图片URL优化逻辑
  // 例如：添加CDN前缀、调整尺寸参数等
  return originalUrl
}
