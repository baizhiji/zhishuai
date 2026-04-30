'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  BarChartOutlined,
  WarningOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Sider } = Layout;

const AgentNavbar: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('');
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      key: 'analytics',
      icon: <DashboardOutlined />,
      label: '数据大盘',
      path: '/agent/analytics',
    },
    {
      key: 'tenants',
      icon: <TeamOutlined />,
      label: '终端客户',
      path: '/agent/tenants',
    },
    {
      key: 'referrals',
      icon: <BarChartOutlined />,
      label: '推荐数据',
      path: '/agent/referrals',
    },
    {
      key: 'usage',
      icon: <BarChartOutlined />,
      label: '使用报表',
      path: '/agent/usage',
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
      <div style={{ 
        height: 64, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        🏢 代理商后台
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
