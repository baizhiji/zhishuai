/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Transpile @ant-design/charts
  transpilePackages: ['@ant-design/charts', 'antd', '@ant-design/icons', '@ant-design/plots'],

  // Bundle analyzer (enable with ANALYZE=true)
  // webpack(config) { if(process.env.ANALYZE) { const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer'); config.plugins.push(new BundleAnalyzerPlugin()); } return config; },

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'code.coze.cn' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'baizhiji.net' },
      { protocol: 'https', hostname: '**.baizhiji.net' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600,
  },

  // Compression
  compress: true,

  // Experimental features
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons', '@ant-design/charts', 'echarts'],
    optimizeCss: true,
    scrollRestoration: true,
    webpackBuildWorker: true,
  },

  // Env
  env: {
    NEXT_PUBLIC_APP_NAME: '智枢AI',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Webpack
  webpack: (config, { isServer, dev }) => {
    // Production-only optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
              priority: -10,
              reuseExistingChunk: true,
            },
            antd: {
              name: 'antd',
              test: /[\\/]node_modules[\\/](antd|@ant-design|rc-)[\\/]/,
              chunks: 'all',
              priority: 15,
            },
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              chunks: 'all',
              priority: 20,
            },
            charts: {
              name: 'charts',
              test: /[\\/]node_modules[\\/](echarts|recharts|@ant-design\/(charts|plots))[\\/]/,
              chunks: 'all',
              priority: 10,
            },
            utils: {
              name: 'utils',
              test: /[\\/]node_modules[\\/](lodash|axios|dayjs|clsx|uuid|tailwind-merge)[\\/]/,
              chunks: 'all',
              priority: 5,
            },
            framer: {
              name: 'framer',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              chunks: 'all',
              priority: 8,
            },
          },
        },
      };
    }

    // Remove moment.js locale bloat
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        moment$: 'moment/moment.js',
      };
    }

    return config;
  },

  // On-demand entries
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },

  // Production: no sourcemaps
  productionBrowserSourceMaps: false,

  // Security & performance headers
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico)',
        locale: false,
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
