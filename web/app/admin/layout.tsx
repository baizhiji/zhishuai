'use client';

import React from 'react';
import { Layout } from 'antd';
import AdminNavbar from './Navbar';

const { Content } = Layout;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AdminNavbar />
      <Layout style={{ marginLeft: 220 }}>
        <Content style={{ background: '#f0f2f5' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
