<<<<<<< HEAD
import Image from 'next/image'

export default function optimizeImage(src: string, width: number, quality: number = 75) {
  // 在生产环境中，这里可以接入CDN或图片优化服务
  return src
=======
import Image from 'next/image';

export default function optimizeImage(src: string, width: number, quality: number = 75) {
  // 在生产环境中，这里可以接入CDN或图片优化服务
  return src;
>>>>>>> 962968886be726cd434c792933b5515366d34518
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
<<<<<<< HEAD
}
=======
};
>>>>>>> 962968886be726cd434c792933b5515366d34518

export const getOptimizedImageUrl = (
  originalUrl: string,
  size: keyof typeof imageConfig.sizes = 'medium'
): string => {
  // 这里可以根据实际需求实现图片URL优化逻辑
  // 例如：添加CDN前缀、调整尺寸参数等
<<<<<<< HEAD
  return originalUrl
}
=======
  return originalUrl;
};
>>>>>>> 962968886be726cd434c792933b5515366d34518
