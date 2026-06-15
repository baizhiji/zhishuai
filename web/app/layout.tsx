<<<<<<< HEAD
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import AuthGuard from '@/components/auth/AuthGuard'
import AntdProvider from '@/components/providers/AntdProvider'
import { UserProvider } from '@/components/auth/UserProvider'
=======
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import AntdProvider from '@/components/providers/AntdProvider';
import { UserProvider } from '@/components/auth/UserProvider';
>>>>>>> 962968886be726cd434c792933b5515366d34518

export const metadata: Metadata = {
  title: '智枢AI - 智能商业平台',
  description: '一站式智能商业平台，集成自媒体、招聘、获客、推荐分享等全场景功能',
  keywords: 'AI,自媒体,招聘,获客,推荐,智枢AI',
  authors: [{ name: '智枢AI' }],
<<<<<<< HEAD
}
=======
};
>>>>>>> 962968886be726cd434c792933b5515366d34518

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
<<<<<<< HEAD
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
=======
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
>>>>>>> 962968886be726cd434c792933b5515366d34518
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AntdProvider>
          <UserProvider>
            <AuthProvider>
<<<<<<< HEAD
              <AuthGuard>
                {children}
              </AuthGuard>
=======
              <AuthGuard>{children}</AuthGuard>
>>>>>>> 962968886be726cd434c792933b5515366d34518
            </AuthProvider>
          </UserProvider>
        </AntdProvider>
      </body>
    </html>
<<<<<<< HEAD
  )
=======
  );
>>>>>>> 962968886be726cd434c792933b5515366d34518
}
