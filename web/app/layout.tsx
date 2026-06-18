import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import AntdProvider from '@/components/providers/AntdProvider';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

export const metadata: Metadata = {
  title: '智枢AI - 智能商业平台',
  description: '智能中枢 · AI驱动的一站式SaaS平台，集成自媒体、招聘、获客、推荐分享等全场景功能',
  keywords: 'AI,自媒体,招聘,获客,推荐,智枢AI,SaaS',
  authors: [{ name: '智枢AI' }],
  icons: { icon: '/logo.png' },
  openGraph: {
    title: '智枢AI - 智能商业平台',
    description: '智能中枢 · AI驱动的一站式SaaS平台',
    type: 'website',
    locale: 'zh_CN',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: '智枢AI' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <ErrorBoundary>
          <AntdProvider>
            <AuthProvider>
              <AuthGuard>{children}</AuthGuard>
            </AuthProvider>
          </AntdProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
