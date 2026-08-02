'use client';

import React from 'react';
import { Layout, Result, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import CustomerNavbar from './layout/Navbar';

const { Content } = Layout;

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  // 认证加载中
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 未登录
  if (!user) {
    return (
      <Result
        status="403"
        title="请先登录"
        subTitle="请登录后再访问此页面"
        extra={<button onClick={() => router.push('/login')}>返回登录</button>}
      />
    );
  }

  // 角色检查：仅 customer 和 admin（以客户视角）可访问
  if (user.role !== 'customer' && user.role !== 'admin') {
    return (
      <Result
        status="403"
        title="无权限访问"
        subTitle="您没有权限访问客户后台"
        extra={<button onClick={() => router.push('/agent/dashboard')}>返回代理商后台</button>}
      />
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <CustomerNavbar>
        <Content style={{ padding: 24, background: '#f0f2f5' }}>{children}</Content>
      </CustomerNavbar>
    </Layout>
  );
}
