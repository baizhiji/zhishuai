/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // 图片优化配置
  images: {
    domains: ['code.coze.cn', 'api.dicebear.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: false,
  },

  // 压缩配置
  compress: true,

  // 实验性功能
  experimental: {
    optimizePackageImports: ['antd'],
  },

  // 环境变量
  env: {
    NEXT_PUBLIC_APP_NAME: '智枢AI',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Webpack配置
  webpack: (config) => {
    // 优化打包体积
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // 代码分割配置
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
          // Antd 单独打包
          antd: {
            name: 'antd',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
          },
        },
      },
    }

    return config
  },

  // 页面预加载
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },

  // 生产环境优化
  productionBrowserSourceMaps: false,

  // 输出配置
  output: 'standalone',

  // 头部配置
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
