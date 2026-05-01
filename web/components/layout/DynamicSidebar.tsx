'use client';

/**
 * 动态侧边栏导航组件
 * 根据用户角色和功能开关动态显示菜单
 */

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Badge, Dropdown, Avatar, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  VideoCameraOutlined,
  TeamOutlined,
  ShareAltOutlined,
  GiftOutlined,
  SettingOutlined,
  BankOutlined,
  ContactsOutlined,
  ControlOutlined,
  SkinOutlined,
  BarChartOutlined,
  FileTextOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuOutlined,
  CloseOutlined,
  UserOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useUser } from '@/components/auth';
import { UserRole, Permission } from '@/lib/permissions/config';

const { Sider } = Layout;
const { Text } = Typography;

// 菜单项接口
interface MenuItemData {
  key: string;
  label: string;
  icon?: string;
  path?: string;
  permission?: Permission;
  featureKey?: string;
  children?: MenuItemData[];
}

// 图标映射
const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <DashboardOutlined />,
  VideoCamera: <VideoCameraOutlined />,
  Team: <TeamOutlined />,
  ShareAlt: <ShareAltOutlined />,
  Gift: <GiftOutlined />,
  Setting: <SettingOutlined />,
  Bank: <BankOutlined />,
  Contacts: <ContactsOutlined />,
  Control: <ControlOutlined />,
  Skin: <SkinOutlined />,
  BarChart: <BarChartOutlined />,
  FileText: <FileTextOutlined />,
  Bell: <BellOutlined />,
  Logout: <LogoutOutlined />,
  User: <UserOutlined />,
  ExperimentOutlined: <ExperimentOutlined />,
  Menu: <MenuOutlined />,
};

// 菜单key前缀映射
const prefixMap: Record<string, string> = {
  'media': '/media',
  'recruitment': '/recruitment',
  'acquisition': '/acquisition',
  'share': '/share',
  'my': '/my',
  'account': '/account',
  'admin': '/admin',
  'agent': '/agent',
  'system': '/system',
  'ecommerce': '/ecommerce',
  'crm': '/crm',
  'marketing': '/marketing',
};

// 客户菜单
const customerMenus: MenuItemData[] = [
  {
    key: 'dashboard',
    label: '数据大盘',
    icon: 'Dashboard',
    path: '/dashboard',
  },
  {
    key: 'media',
    label: '自媒体运营',
    icon: 'VideoCamera',
    featureKey: 'media_factory',
    children: [
      { key: 'media-factory', label: 'AI内容工厂', path: '/media/factory', featureKey: 'media_factory' },
      { key: 'media-matrix', label: '矩阵管理', path: '/media/matrix', featureKey: 'media_matrix' },
      { key: 'media-publish', label: '发布中心', path: '/media/publish', featureKey: 'media_publish' },
      { key: 'media-report', label: '数据报表', path: '/media/report' },
      { key: 'media-digital-human', label: '数字人视频', path: '/media/digital-humans', featureKey: 'media_digital_human' },
      { key: 'materials', label: '素材库', path: '/materials' },
    ],
  },
  {
    key: 'recruitment',
    label: '招聘助手',
    icon: 'Team',
    featureKey: 'recruitment',
    children: [
      { key: 'recruitment-board', label: '招聘看板', path: '/recruitment/board', featureKey: 'recruitment' },
      { key: 'recruitment-publish', label: '职位发布', path: '/recruitment/publish', featureKey: 'recruitment' },
      { key: 'recruitment-screen', label: '简历筛选', path: '/recruitment/screen', featureKey: 'recruitment' },
      { key: 'recruitment-reply', label: '自动回复', path: '/recruitment/reply', featureKey: 'recruitment' },
      { key: 'recruitment-interview', label: '面试管理', path: '/recruitment/interview', featureKey: 'recruitment' },
      { key: 'recruitment-stats', label: '招聘统计', path: '/recruitment/stats', featureKey: 'recruitment' },
    ],
  },
  {
    key: 'acquisition',
    label: '智能获客',
    icon: 'ShareAlt',
    featureKey: 'acquisition',
    children: [
      { key: 'acquisition-board', label: '获客看板', path: '/acquisition/board', featureKey: 'acquisition' },
      { key: 'acquisition-discover', label: '潜客发现', path: '/acquisition/discover', featureKey: 'acquisition' },
      { key: 'acquisition-task', label: '引流任务', path: '/acquisition/task', featureKey: 'acquisition' },
      { key: 'acquisition-stats', label: '获客统计', path: '/acquisition/stats', featureKey: 'acquisition' },
    ],
  },
  {
    key: 'share',
    label: '推荐分享',
    icon: 'Gift',
    featureKey: 'share',
    children: [
      { key: 'share-board', label: '推荐分享看板', path: '/share/board', featureKey: 'share' },
      { key: 'share-code', label: '二维码生成', path: '/share/code', featureKey: 'share' },
      { key: 'share-track', label: '推荐追踪', path: '/share/track', featureKey: 'share' },
    ],
  },
  {
    key: 'my',
    label: '转介绍',
    icon: 'Gift',
    children: [
      { key: 'my-referral', label: '我的推荐', path: '/my/referral' },
    ],
  },
  {
    key: 'account',
    label: '账号与配置',
    icon: 'Setting',
    children: [
      { key: 'account-info', label: '账号信息', path: '/account' },
      { key: 'account-api', label: 'API密钥', path: '/account/api' },
      { key: 'account-log', label: '操作日志', path: '/account/log' },
      { key: 'account-recharge', label: '充值中心', path: '/account/recharge' },
    ],
  },
];

// Admin菜单
const adminMenus: MenuItemData[] = [
  { key: 'admin-analytics', label: '数据大盘', icon: 'Dashboard', path: '/admin/analytics' },
  { key: 'admin-tenants', label: '租户管理', icon: 'Bank', path: '/admin/tenants' },
  { key: 'admin-agents', label: '代理商管理', icon: 'Contacts', path: '/admin/agents' },
  { key: 'admin-features', label: '功能开关', icon: 'Control', path: '/admin/features' },
  { key: 'admin-branding', label: '贴牌配置', icon: 'Skin', path: '/admin/branding' },
  {
    key: 'system',
    label: '系统配置',
    icon: 'Setting',
    children: [
      { key: 'system-settings', label: '系统设置', path: '/system/settings' },
      { key: 'system-users', label: '用户管理', path: '/system/users' },
    ],
  },
];

// Agent菜单
const agentMenus: MenuItemData[] = [
  { key: 'agent-analytics', label: '数据大盘', icon: 'Dashboard', path: '/agent/analytics' },
  { key: 'agent-tenants', label: '客户管理', icon: 'Team', path: '/agent/tenants' },
  { key: 'agent-referrals', label: '推荐数据', icon: 'ShareAlt', path: '/agent/referrals' },
  { key: 'agent-usage', label: '使用报表', icon: 'BarChart', path: '/agent/usage' },
  { key: 'agent-tickets', label: '工单处理', icon: 'FileText', path: '/agent/tickets' },
  {
    key: 'account',
    label: '账号与配置',
    icon: 'Setting',
    children: [
      { key: 'account-info', label: '账号信息', path: '/account' },
      { key: 'account-recharge', label: '充值中心', path: '/account/recharge' },
    ],
  },
];

interface DynamicSidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export default function DynamicSidebar({ collapsed, onCollapse }: DynamicSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isFeatureEnabled, logout } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 根据角色获取菜单
  const getMenus = (): MenuItemData[] => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return adminMenus;
      case UserRole.AGENT:
        return agentMenus;
      default:
        return customerMenus;
    }
  };

  // 过滤菜单（根据功能开关）
  const filterMenus = (menus: MenuItemData[]): MenuItemData[] => {
    return menus.filter(menu => {
      if (menu.featureKey && !isFeatureEnabled(menu.featureKey)) {
        return false;
      }
      if (menu.children && menu.children.length > 0) {
        const filteredChildren = filterMenus(menu.children);
        if (filteredChildren.length === 0) {
          return false;
        }
        menu.children = filteredChildren;
      }
      return true;
    });
  };

  // 转换菜单为antd格式
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformMenu = (menus: MenuItemData[]): any[] => {
    return menus.map(menu => {
      const item: Record<string, any> = {
        key: menu.key,
        label: menu.label,
        icon: menu.icon ? iconMap[menu.icon] : undefined,
      };

      if (menu.path) {
        item.onClick = () => {
          router.push(menu.path!);
          setMobileOpen(false);
        };
      }

      if (menu.children && menu.children.length > 0) {
        item.children = transformMenu(menu.children);
      }

      return item;
    });
  };

  // 获取当前选中的菜单key
  const getSelectedKeys = (): string[] => {
    const path = pathname;
    for (const [prefix, menuPath] of Object.entries(prefixMap)) {
      if (path.startsWith(menuPath)) {
        return [prefix];
      }
    }
    if (path === '/dashboard' || path === '/') {
      return ['dashboard'];
    }
    return [];
  };

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => router.push('/account'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => router.push('/settings'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        router.push('/login');
      },
    },
  ];

  // 过滤后的菜单
  const filteredMenus = filterMenus(getMenus());
  const menuItems = transformMenu(filteredMenus);
  const selectedKeys = getSelectedKeys();

  // 角色标签
  const roleLabels: Record<UserRole, { text: string; color: string }> = {
    [UserRole.ADMIN]: { text: '总后台', color: '#722ed1' },
    [UserRole.AGENT]: { text: '代理商', color: '#1890ff' },
    [UserRole.CUSTOMER]: { text: '终端客户', color: '#52c41a' },
  };

  // 侧边栏内容
  const siderContent = (
    <div className="sidebar-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Logo区域 */}
      <div className="sidebar-header" style={{
        padding: collapsed ? '16px 8px' : '16px 20px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExperimentOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <span style={{ fontSize: 18, fontWeight: 600, color: '#262626' }}>智枢AI</span>
          </div>
        )}
        {collapsed && <ExperimentOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
      </div>

      {/* 菜单区域 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={selectedKeys}
          items={menuItems}
          theme="light"
          inlineCollapsed={collapsed}
          style={{ border: 'none' }}
        />
      </div>

      {/* 用户信息区域 */}
      <div className="sidebar-footer" style={{
        padding: collapsed ? '12px 8px' : '12px 16px',
        borderTop: '1px solid #f0f0f0',
      }}>
        <Dropdown menu={{ items: userMenuItems }} placement="topRight" trigger={['click']}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}>
            <Avatar
              size={collapsed ? 32 : 40}
              style={{ backgroundColor: '#1890ff' }}
              icon={<UserOutlined />}
            />
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#262626' }}>
                  {user?.name || '用户'}
                </div>
                <Badge
                  status="processing"
                  text={
                    <Text style={{ fontSize: 12 }} type="secondary">
                      {roleLabels[user?.role || UserRole.CUSTOMER].text}
                    </Text>
                  }
                />
              </div>
            )}
          </div>
        </Dropdown>
      </div>
    </div>
  );

  return (
    <>
      {/* 移动端汉堡按钮 */}
      <div
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        style={{
          display: 'none',
          position: 'fixed',
          top: 12,
          left: 12,
          zIndex: 1001,
          width: 44,
          height: 44,
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <MenuOutlined style={{ fontSize: 20 }} />
      </div>

      {/* 移动端遮罩 */}
      {mobileOpen && (
        <div
          style={{
            display: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 999,
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 桌面端侧边栏 */}
      <Sider
        width={220}
        collapsedWidth={64}
        collapsed={collapsed}
        onCollapse={onCollapse}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          overflow: 'hidden',
        }}
        className="desktop-sider"
      >
        {siderContent}
      </Sider>

      {/* 移动端侧边栏 */}
      <Sider
        width={280}
        collapsed={!mobileOpen}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
        }}
        className="mobile-sider"
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px' }}>
          <CloseOutlined onClick={() => setMobileOpen(false)} style={{ cursor: 'pointer' }} />
        </div>
        {siderContent}
      </Sider>

      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-sider {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
          .mobile-sider {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-sider {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
