/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // V3.0 桌面安装版：固定静态导出（供 Tauri WebView 加载，无 Node 运行时）
  output: 'export',
  trailingSlash: true,
  // 强制类型检查：所有类型错误必须修复后才能构建（商用化要求）
  typescript: { ignoreBuildErrors: false },

  // Transpile @ant-design/charts
  transpilePackages: ['@ant-design/charts'],

  // 图片优化配置（静态导出必须关闭 Next 图片优化，由 Tauri 本地/远程资源直接加载）
  images: {
    domains: ['code.coze.cn', 'api.dicebear.com', 'via.placeholder.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: true,
    minimumCacheTTL: 60,
  },

  // 压缩配置
  compress: false,

  // 实验性功能
  experimental: {
    optimizePackageImports: ['antd'],
    optimizeCss: false,
  },

  // 环境变量
  env: {
    NEXT_PUBLIC_APP_NAME: '智枢AI',
    NEXT_PUBLIC_APP_VERSION: '3.2.0',
  },

  // Webpack配置
  webpack: (config, { isServer }) => {
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
            priority: -10,
          },
          // Antd 单独打包
          antd: {
            name: 'antd',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
            priority: 10,
          },
          // React 相关库
          react: {
            name: 'react',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
            priority: 20,
          },
          // 工具库
          utils: {
            name: 'utils',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](lodash|axios|dayjs)[\\/]/,
            priority: 5,
          },
        },
      },
    }

    // 移除 moment.js 的 locale 减小体积
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        moment$: 'moment/moment.js',
      }
    }

    return config
  },

  // 页面预加载（静态导出不支持，移除）

  // 生产环境优化
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
