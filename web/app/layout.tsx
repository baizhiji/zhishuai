import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '智枢AI - 智能商业平台',
  description: '一站式智能商业平台，集成自媒体、招聘、获客、推荐分享等全场景功能',
  keywords: 'AI,自媒体,招聘,获客,推荐,智枢AI',
  authors: [{ name: '智枢AI' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  )
}
