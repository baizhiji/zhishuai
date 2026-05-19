'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Badge, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  RobotOutlined,
  CustomerServiceOutlined,
  UserOutlined,
  WarningOutlined,
  PictureOutlined,
  FileTextOutlined,
  RiseOutlined,
  DollarOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  ToolOutlined,
  ShareAltOutlined,
  HistoryOutlined,
  KeyOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { request } from '@/utils/request';

const { Sider } = Layout;
const { Text } = Typography;

const CustomerNavbar: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      try {
        setUserInfo(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
      path: '/customer/dashboard',
    },
    {
      key: 'ai-chat',
      icon: <RobotOutlined />,
      label: 'AI对话',
      path: '/agent/ai-chat',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'matrix',
      label: '自媒体运营',
      icon: <PictureOutlined />,
      children: [
        { key: 'matrix-accounts', label: '账号授权', path: '/media/matrix/accounts' },
        { key: 'matrix-publish', label: '内容发布', path: '/media/matrix/publish' },
        { key: 'matrix-schedule', label: '定时发布', path: '/media/matrix/schedule' },
        { key: 'hot-topics', label: '热点话题', path: '/media/hot-topics' },
        { key: 'matrix-stats', label: '数据报表', path: '/media/matrix/stats' },
        { key: 'matrix-auto', label: '自动化', path: '/media/matrix/automation' },
      ],
    },
    {
      key: 'recruitment',
      label: '招聘助手',
      icon: <CustomerServiceOutlined />,
      children: [
        { key: 'recruit-platforms', label: '平台授权', path: '/customer/recruitment/platforms' },
        { key: 'recruit-post', label: '发布职位', path: '/recruitment/posts' },
        { key: 'recruit-resume', label: '简历管理', path: '/recruitment/resumes' },
        { key: 'recruit-auto', label: '自动沟通', path: '/recruitment/auto' },
        { key: 'recruit-interview', label: '面试管理', path: '/customer/interview' },
        { key: 'recruit-dashboard', label: '招聘看板', path: '/customer/recruitment-dashboard' },
      ],
    },
    {
      key: 'acquisition',
      label: '智能获客',
      icon: <UserOutlined />,
      children: [
        { key: 'acquire-task', label: '获客任务', path: '/acquisition/tasks' },
        { key: 'acquire-leads', label: '线索管理', path: '/acquisition/leads' },
        { key: 'acquire-dashboard', label: '获客看板', path: '/customer/acquisition-dashboard' },
      ],
    },
    {
      key: 'referral',
      label: '推荐分享',
      icon: <ShareAltOutlined />,
      children: [
        { key: 'referral-share', label: '推荐推广', path: '/customer/referral' },
        { key: 'referral-records', label: '推荐记录', path: '/share/records' },
      ],
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'materials',
      icon: <FileTextOutlined />,
      label: '素材库',
      path: '/customer/materials',
    },
    {
      key: 'employees',
      icon: <TeamOutlined />,
      label: '员工管理',
      path: '/customer/employees',
    },
    {
      key: 'tickets',
      icon: <WarningOutlined />,
      label: '工单管理',
      path: '/customer/tickets',
    },
    {
      key: 'reports',
      icon: <RiseOutlined />,
      label: '数据报表',
      path: '/analytics/reports',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'login-logs',
      icon: <HistoryOutlined />,
      label: '登录日志',
      path: '/customer/login-logs',
    },
    {
      key: 'api-keys',
      icon: <KeyOutlined />,
      label: 'API管理',
      path: '/customer/api-keys',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      path: '/customer/settings',
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: '帮助中心',
      path: '/help',
    },
  ];

  useEffect(() => {
    const current = menuItems.find(item => 
      item.path && pathname.startsWith(item.path)
    );
    if (current) {
      setSelectedKey(current.key as string);
    }
  }, [pathname]);

  const handleMenuClick = (key: string) => {
    const findItem = (items: any[]): any => {
      for (const item of items) {
        if (item.key === key) return item;
        if (item.children) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    const item = findItem(menuItems);
    if (item && item.path) {
      router.push(item.path);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userInfo');
    router.push('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息', onClick: () => router.push('/profile') },
    { key: 'settings', icon: <ToolOutlined />, label: '设置', onClick: () => router.push('/customer/settings') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ];

  return (
    <Sider 
      width={220} 
      style={{
        background: '#001529',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        overflow: 'auto',
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
        智枢AI 客户后台
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

export default CustomerNavbar;
