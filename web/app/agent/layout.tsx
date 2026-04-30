'use client';

import React from 'react';
import { Layout } from 'antd';
import AgentNavbar from './layout/Navbar';

const { Content } = Layout;

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AgentNavbar />
      <Layout style={{ marginLeft: 220 }}>
        <Content style={{ background: '#f0f2f5' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
