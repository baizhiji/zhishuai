'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Result } from 'antd';
import { useRouter } from 'next/navigation';
import CustomerNavbar from './layout/Navbar';

const { Content } = Layout;

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // 权限检查：所有登录用户都可以访问客户后台
    // 但 admin 用户需要以 customer 视角才能访问
    const userStr = localStorage.getItem('user');
    const viewingRole = localStorage.getItem('viewing_role');
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const currentRole = viewingRole || user.role;
        
        // 所有用户都可以访问客户后台（这是默认的访问入口）
        // 如果 viewing_role 存在，则必须匹配
        if (!viewingRole || currentRole === 'customer') {
          setIsAuthorized(true);
        } else if (user.role !== 'admin') {
          // 非 admin 用户有 viewing_role 但不是 customer，拒绝访问
          setIsAuthorized(false);
        } else {
          // admin 用户有 viewing_role 但不是 customer，也拒绝（admin 默认进入 admin 后台）
          setIsAuthorized(false);
        }
      } catch (e) {
        setIsAuthorized(true); // 解析失败也允许访问
      }
    } else {
      // 未登录，重定向到登录页（由 AuthGuard 处理）
      setIsAuthorized(false);
    }
  }, []);

  // 未授权
  if (isAuthorized === false) {
    return (
      <Result
        status="403"
        title="无权限访问"
        subTitle="您没有权限访问此页面。"
        extra={
          <button onClick={() => router.push('/')}>
            返回首页
          </button>
        }
      />
    );
  }

  // 加载中
  if (isAuthorized === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>加载中...</div>;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <CustomerNavbar>
        <Content style={{ padding: 24, background: '#f0f2f5' }}>
          {children}
        </Content>
      </CustomerNavbar>
    </Layout>
  );
}
