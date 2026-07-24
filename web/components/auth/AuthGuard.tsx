'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spin } from 'antd';
import { useAuth } from '@/contexts/AuthContext';

// 公开页面列表（不需要认证即可访问）
const publicPaths = ['/login', '/register'];

// 获取用户应跳转的角色页面
function getRoleHome(role: string, viewingRole?: string | null): string {
  const effectiveRole = viewingRole || role;
  if (effectiveRole === 'admin') return '/admin/tenants';
  if (effectiveRole === 'agent') return '/agent/tenants';
  return '/customer/dashboard';
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const lastRedirectRef = useRef<string | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 判断是否为公开页面
  const isPublicPath = publicPaths.some(
    p => pathname === p || pathname.startsWith(p + '/')
  );

  useEffect(() => {
    // 等待 AuthContext 加载完成再做决策
    if (loading) return;

    // 公开页面放行
    if (isPublicPath) return;

    // 未认证 → 重定向到登录
    if (!user) {
      if (lastRedirectRef.current !== '/login') {
        lastRedirectRef.current = '/login';
        // 微小延迟，防止 React 渲染周期中的竞争
        redirectTimerRef.current = setTimeout(() => {
          router.replace('/login');
        }, 0);
      }
      return;
    }

    // 已登录用户访问登录页 → 跳转到对应角色首页
    if (pathname === '/login' || pathname === '/register') {
      const home = getRoleHome(user.role, localStorage.getItem('viewing_role'));
      if (lastRedirectRef.current !== home) {
        lastRedirectRef.current = home;
        redirectTimerRef.current = setTimeout(() => {
          router.replace(home);
        }, 0);
      }
      return;
    }

    // 角色权限检查
    const viewingRole =
      typeof window !== 'undefined'
        ? localStorage.getItem('viewing_role')
        : null;
    const effectiveRole = viewingRole || user.role;

    if (pathname.startsWith('/admin/') && user.role !== 'admin') {
      // 非管理员访问 admin 页面 → 跳转到其角色首页（而非 /）
      const home = getRoleHome(user.role);
      if (lastRedirectRef.current !== home) {
        lastRedirectRef.current = home;
        redirectTimerRef.current = setTimeout(() => {
          router.replace(home);
        }, 0);
      }
      return;
    }

    if (pathname.startsWith('/agent/') && effectiveRole !== 'agent' && effectiveRole !== 'admin') {
      const home = getRoleHome(user.role);
      if (lastRedirectRef.current !== home) {
        lastRedirectRef.current = home;
        redirectTimerRef.current = setTimeout(() => {
          router.replace(home);
        }, 0);
      }
      return;
    }

    if (pathname.startsWith('/customer/')) {
      const allowedRoles: string[] = ['admin', 'agent', 'user'];
      if (!allowedRoles.includes(user.role)) {
        if (lastRedirectRef.current !== '/login') {
          lastRedirectRef.current = '/login';
          redirectTimerRef.current = setTimeout(() => {
            router.replace('/login');
          }, 0);
        }
        return;
      }
    }

    // 已登录用户访问根路径 → 跳转到角色首页
    if (pathname === '/') {
      const home = getRoleHome(user.role, viewingRole);
      if (lastRedirectRef.current !== home) {
        lastRedirectRef.current = home;
        redirectTimerRef.current = setTimeout(() => {
          router.replace(home);
        }, 0);
      }
    }
  }, [loading, user, pathname, isPublicPath, router]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  // 加载中：显示 Spin
  if (loading && !isPublicPath) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // 已登录但在登录页 → 仍在处理跳转，显示加载
  if (user && (pathname === '/login' || pathname === '/register')) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // 公开页面或已认证 → 渲染子组件
  return <>{children}</>;
}
