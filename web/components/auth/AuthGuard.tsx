'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spin } from 'antd';
import { isAuthenticated } from '@/lib/permissions';

// 公开页面列表（不需要认证即可访问）
const publicPaths = ['/login', '/register', '/'];

// 受保护页面列表（需要特定权限）
const protectedPaths: Record<string, string[]> = {
  '/account/staff': ['admin'], // 只允许管理员访问
  '/system/users': ['admin'],
  '/settings/staff': ['admin']
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 检查是否是公开页面
    const isPublicPath = publicPaths.includes(pathname);

    if (isPublicPath) {
      return;
    }

    // 检查认证状态
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // 检查页面权限
    for (const [path, allowedRoles] of Object.entries(protectedPaths)) {
      if (pathname.startsWith(path)) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (!allowedRoles.includes(user.role)) {
            router.push('/dashboard');
          }
        }
        break;
      }
    }
  }, [pathname, router]);

  // 简单的加载状态
  if (!isAuthenticated() && !publicPaths.includes(pathname)) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <Spin size="large" description="正在加载..." />
      </div>
    );
  }

  return <>{children}</>;
}
