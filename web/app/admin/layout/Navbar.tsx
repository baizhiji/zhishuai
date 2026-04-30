'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ApartmentOutlined,
  SettingOutlined,
  BgColorsOutlined,
  BarChartOutlined,
  ToolOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Sider } = Layout;

const AdminNavbar: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      key: 'analytics',
      icon: <DashboardOutlined />,
      label: '数据大盘',
      path: '/admin/analytics',
    },
    {
      key: 'tenants',
      icon: <UserOutlined />,
      label: '租户管理',
      path: '/admin/tenants',
    },
    {
      key: 'agents',
      icon: <ApartmentOutlined />,
      label: '代理商管理',
      path: '/admin/agents',
    },

    {
      key: 'branding',
      icon: <BgColorsOutlined />,
      label: '贴牌配置',
      path: '/admin/branding',
    },
    {
      key: 'config',
      icon: <ToolOutlined />,
      label: '系统配置',
      path: '/admin/config',
    },
    {
      key: 'logs',
      icon: <FileTextOutlined />,
      label: '操作日志',
      path: '/admin/logs',
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
        ⚙️ 总后台
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

export default AdminNavbar;
