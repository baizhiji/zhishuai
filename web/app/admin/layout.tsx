'use client';

import React from 'react';
import {
  Layout,
  Result,
  Tag,
  Spin,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminNavbar from './layout/Navbar';
import GlobalSearch from '@/components/common/GlobalSearch';

const { Header, Content } = Layout;

const SIDER_WIDTH = 220;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
        title="无权限访问"
        subTitle="您没有权限访问管理员后台，请使用管理员账号登录或切换到正确的角色。"
        extra={<button onClick={() => router.push('/login')}>返回登录</button>}
      />
    );
  }

  // 非管理员
  if (user.role !== 'admin') {
    return (
      <Result
        status="403"
        title="无权限访问"
        subTitle="您没有权限访问管理员后台，请使用管理员账号登录或切换到正确的角色。"
        extra={<button onClick={() => router.push('/login')}>返回登录</button>}
      />
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AdminNavbar />
      <Layout style={{ marginLeft: SIDER_WIDTH }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 16,
          }}
        >
          <Tag
            style={{
              cursor: 'pointer',
              background: '#f5f5f5',
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              padding: '2px 10px',
              fontSize: 12,
              color: '#8c8c8c',
            }}
          >
            <SearchOutlined style={{ marginRight: 6 }} />
            Ctrl+K 搜索
          </Tag>
        </Header>
        <Content
          style={{
            padding: '0 24px 24px',
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
          <GlobalSearch />
        </Content>
      </Layout>
    </Layout>
  );
}