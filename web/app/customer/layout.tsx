'use client';

import React from 'react';
import { Layout } from 'antd';
import Navbar from './layout/Navbar';

const { Content } = Layout;

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Content style={{ padding: 24, background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
        {children}
      </Content>
    </Layout>
  );
}
