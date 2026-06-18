'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  SettingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Sider } = Layout;

const AgentNavbar: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '数据总览',
      path: '/agent/dashboard',
    },
    {
      key: 'customers',
      icon: <TeamOutlined />,
      label: '客户管理',
      path: '/agent/customers',
    },
    {
      key: 'features',
      icon: <SettingOutlined />,
      label: '功能开关',
      path: '/agent/features',
    },
    {
      key: 'settlement',
      icon: <DollarOutlined />,
      label: '分成结算',
      path: '/agent/settlement',
    },
    {
      key: 'tickets',
      icon: <WarningOutlined />,
      label: '工单处理',
      path: '/agent/tickets',
    },
  ];

  useEffect(() => {
    const current = menuItems.find(item => pathname.startsWith(item.path));
    if (current) {
      setSelectedKey(current.key);
    }
  }, [pathname]);

  const handleMenuClick = (key: string) => {
    const item = menuItems.find(i => i.key === key);
    if (item) {
      router.push(item.path);
    }
  };

  // 服务端渲染时返回占位符，避免 hydration 不匹配
  if (!mounted) {
    return (
      <Sider
        width={220}
        style={{
          background: '#001529',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
        }}
      >
        <div style={{ height: 64 }} />
      </Sider>
    );
  }

  return (
    <Sider
      width={220}
      style={{
        background: '#001529',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        智枢AI 代理后台
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={({ key }) => handleMenuClick(key)}
        style={{ borderRight: 0 }}
        items={menuItems}
      />
    </Sider>
  );
};

export default AgentNavbar;
