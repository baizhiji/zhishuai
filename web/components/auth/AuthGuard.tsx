'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spin } from 'antd';
import { isAuthenticated } from '@/lib/permissions';

// 公开页面列表（不需要认证即可访问）
const publicPaths = ['/login', '/register'];

// 管理员专属页面
const adminOnlyPaths = ['/admin/', '/account/staff', '/system/users', '/settings/staff'];

// 代理商专属页面
const agentOnlyPaths = ['/agent/'];

// 终端客户专属页面（不需要额外限制，因为是默认入口）
const customerOnlyPaths = [];

// 管理员可以访问的所有路径
const adminAccessiblePaths = ['/admin/', '/agent/', '/customer/'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 检查是否是公开页面
    const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
    if (isPublicPath) {
      return;
    }

    // 检查认证状态
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // 获取用户角色信息
    const userStr = localStorage.getItem('user');
    const viewingRole = localStorage.getItem('viewing_role');

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const currentRole = viewingRole || user.role;

        // 检查页面访问权限
        if (pathname.startsWith('/admin/')) {
          // 只有 admin 角色才能访问
          if (currentRole !== 'admin' || user.role !== 'admin') {
            router.push('/'); // 重定向到首页
          }
        } else if (pathname.startsWith('/agent/')) {
          // 只有 agent 角色才能访问
          if (currentRole !== 'agent') {
            router.push('/');
          }
        } else if (pathname.startsWith('/customer/')) {
          // 所有登录用户都可以访问客户后台
          // 但 admin 需要以 customer 视角访问
          if (user.role !== 'admin' && user.role !== 'customer') {
            router.push('/');
          }
        }
      } catch (e) {
        // 解析失败，跳转到登录
        router.push('/login');
      }
    }
  }, [pathname, router]);

  // 简单的加载状态
  if (
    !isAuthenticated() &&
    !publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
  ) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" description="正在加载..." />
      </div>
    );
  }

  return <>{children}</>;
}
