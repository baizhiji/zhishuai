'use client';

import React from 'react';
import { Layout, Button, Space, Typography } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import AgentNavbar from './layout/Navbar';
import { useRouter } from 'next/navigation';

const { Header, Content } = Layout;
const { Text } = Typography;

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    // 清除登录状态
    localStorage.removeItem('userRole');
    localStorage.removeItem('userInfo');
    // 跳转到登录页
    router.push('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AgentNavbar />
      <Layout style={{ marginLeft: 220 }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          justifyContent: 'flex-end',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <Space>
            <Text type="secondary">代理商</Text>
            <Button 
              type="text" 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
            >
              退出
            </Button>
          </Space>
        </Header>
        <Content style={{ background: '#f0f2f5' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
