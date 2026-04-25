/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['code.coze.cn'],
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_APP_NAME: '智枢AI',
    NEXT_PUBLIC_APP_VERSION: '1.0.0'
  }
}

module.exports = nextConfig
