'use client';

import React from 'react';
import { Layout } from 'antd';
import CustomerNavbar from './layout/Navbar';

const { Content } = Layout;

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <CustomerNavbar />
      <Layout style={{ marginLeft: 220 }}>
        <Content style={{ padding: 24, background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
