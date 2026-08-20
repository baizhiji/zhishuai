'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Modal, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ContactsOutlined,
  ApiOutlined,
  NotificationOutlined,
  SettingOutlined,
  LockOutlined,
  LogoutOutlined,
  FileTextOutlined,
  HistoryOutlined,
  CustomerServiceOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const { Sider } = Layout;

const AdminNavbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 路径→菜单键位映射
  const pathKeyMap: Record<string, string> = {
    '/admin/dashboard': 'admin-dashboard',
    '/admin/tenants': 'admin-tenants',
    '/admin/agents': 'admin-agents',
    '/admin/api-providers': 'admin-api-providers',
    '/admin/announcement': 'admin-announcement',
    '/admin/logs': 'admin-logs',
    '/admin/version': 'admin-version',
    '/admin/support': 'admin-support',
    '/admin/api-stats': 'admin-api-stats',
    '/admin/settings/security': 'change-password',
  };

  const menuItems: MenuProps['items'] = [
    { key: 'admin-dashboard', icon: <DashboardOutlined />, label: '数据总览' },
    { key: 'admin-tenants', icon: <TeamOutlined />, label: '客户管理' },
    { key: 'admin-agents', icon: <ContactsOutlined />, label: '代理商管理' },
    { key: 'admin-api-providers', icon: <ApiOutlined />, label: 'API 服务商' },
    { key: 'admin-announcement', icon: <NotificationOutlined />, label: '系统公告' },
    { key: 'admin-logs', icon: <FileTextOutlined />, label: '操作日志' },
    { key: 'admin-version', icon: <HistoryOutlined />, label: '版本管理' },
    { key: 'admin-support', icon: <CustomerServiceOutlined />, label: '客服配置' },
    { key: 'admin-api-stats', icon: <BarChartOutlined />, label: 'API 统计' },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      children: [
        { key: 'change-password', icon: <LockOutlined />, label: '修改密码' },
        { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
      ],
    },
  ];

  const getSelectedKeys = (): string[] => {
    // 精确匹配
    if (pathKeyMap[pathname]) return [pathKeyMap[pathname]];
    // 前缀匹配（如 /admin/tenants/xxx）
    for (const [p, k] of Object.entries(pathKeyMap)) {
      if (pathname.startsWith(p)) return [k];
    }
    return ['admin-dashboard'];
  };

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'change-password') {
      router.push('/admin/settings/security');
      return;
    }
    if (e.key === 'logout') {
      handleLogout();
      return;
    }
    const reverseMap: Record<string, string> = {};
    for (const [p, k] of Object.entries(pathKeyMap)) reverseMap[k] = p;
    const target = reverseMap[e.key];
    if (target) router.push(target);
  };

  const handleLogout = () => {
    Modal.confirm({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      okText: '确认退出',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await logout();
        message.success('已退出登录');
        router.push('/login');
      },
    });
  };

  return (
    <>
      <Sider
        width={220}
        className="zs-sidebar"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Logo */}
        <div className="zs-sidebar-logo">
          <span className="logo-mark">智</span>
          <span>
            <div className="logo-title">智枢 AI</div>
            <div className="logo-sub">总后台管理</div>
          </span>
        </div>

        {/* 导航菜单 */}
        {mounted && (
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={getSelectedKeys()}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ borderRight: 0, paddingTop: 8, flex: 1 }}
          />
        )}
      </Sider>
    </>
  );
};

export default AdminNavbar;
