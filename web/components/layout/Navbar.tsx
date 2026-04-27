'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Layout,
  Menu,
  Dropdown,
  Avatar,
  Space,
  Button,
  theme,
  Card,
} from 'antd'
import {
  HomeOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  TeamOutlined,
  UserAddOutlined,
  ShareAltOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  ShopOutlined,
  PieChartOutlined,
  ApiOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'

const { Header, Content } = Layout
const { useToken } = theme

// 角色类型
type Role = 'admin' | 'agent' | 'customer'

interface NavigationItem {
  key: string
  label: string
  icon: React.ReactNode
  path?: string
  children?: NavigationItem[]
}

export default function Navbar({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { token } = useToken()

  // 开发阶段默认为customer角色
  const [currentRole, setCurrentRole] = useState<Role>('customer')

  // 根据角色获取导航菜单
  const getNavigationItems = (role: Role): NavigationItem[] => {
    switch (role) {
      case 'customer':
        return [
          {
            key: 'dashboard',
            label: '工作台',
            icon: <PieChartOutlined />,
            path: '/',
          },
          {
            key: 'materials',
            label: '素材库',
            icon: <PictureOutlined />,
            path: '/materials',
          },
          {
            key: 'media',
            label: '自媒体运营',
            icon: <VideoCameraOutlined />,
            children: [
              { key: 'media-factory', label: '内容工厂', icon: <ThunderboltOutlined />, path: '/media/factory' },
              { key: 'media-matrix', label: '矩阵管理', icon: <TeamOutlined />, path: '/media/matrix' },
              { key: 'media-publish', label: '发布中心', icon: <ShareAltOutlined />, path: '/media/publish' },
              { key: 'media-report', label: '数据报表', icon: <PieChartOutlined />, path: '/media/report' },
            ],
          },
          {
            key: 'recruitment',
            label: '招聘助手',
            icon: <TeamOutlined />,
            children: [
              { key: 'recruitment-publish', label: '职位发布', icon: <ShareAltOutlined />, path: '/recruitment/publish' },
              { key: 'recruitment-screen', label: '简历筛选', icon: <UserAddOutlined />, path: '/recruitment/screen' },
              { key: 'recruitment-reply', label: '自动回复', icon: <ThunderboltOutlined />, path: '/recruitment/reply' },
              { key: 'recruitment-interview', label: '面试管理', icon: <TeamOutlined />, path: '/recruitment/interview' },
              { key: 'recruitment-stats', label: '招聘看板', icon: <PieChartOutlined />, path: '/recruitment/stats' },
            ],
          },
          {
            key: 'acquisition',
            label: '智能获客',
            icon: <UserAddOutlined />,
            children: [
              { key: 'acquisition-discover', label: '潜客发现', icon: <UserAddOutlined />, path: '/acquisition/discover' },
              { key: 'acquisition-task', label: '引流任务', icon: <ShareAltOutlined />, path: '/acquisition/task' },
              { key: 'acquisition-stats', label: '获客看板', icon: <PieChartOutlined />, path: '/acquisition/stats' },
            ],
          },
          {
            key: 'share',
            label: '推荐分享',
            icon: <ShareAltOutlined />,
            children: [
              { key: 'share-code', label: '码生成', icon: <PictureOutlined />, path: '/share/code' },
              { key: 'share-track', label: '推荐追踪', icon: <PieChartOutlined />, path: '/share/track' },
            ],
          },
          {
            key: 'account',
            label: '账号与配置',
            icon: <SettingOutlined />,
            children: [
              { key: 'account-staff', label: '员工管理', icon: <TeamOutlined />, path: '/account/staff' },
              { key: 'account-api', label: 'API服务商配置', icon: <ApiOutlined />, path: '/account/api' },
              { key: 'account-knowledge', label: '知识库管理', icon: <ThunderboltOutlined />, path: '/account/knowledge' },
              { key: 'account-log', label: '操作日志', icon: <PieChartOutlined />, path: '/account/log' },
            ],
          },
          {
            key: 'settings',
            label: '系统设置',
            icon: <SettingOutlined />,
            children: [
              { key: 'settings-company', label: '公司信息', icon: <TeamOutlined />, path: '/settings/company' },
              { key: 'settings-security', label: '安全设置', icon: <SettingOutlined />, path: '/settings/security' },
              { key: 'settings-theme', label: '主题设置', icon: <PictureOutlined />, path: '/settings/theme' },
            ],
          },
          // 预留扩展
          {
            key: 'ecommerce',
            label: '电商运营',
            icon: <ShopOutlined />,
            children: [
              { key: 'ecommerce-placeholder', label: '即将上线', icon: <ShopOutlined />, path: '/ecommerce' },
            ],
          },
          {
            key: 'crm',
            label: '客户管理',
            icon: <TeamOutlined />,
            children: [
              { key: 'crm-placeholder', label: '即将上线', icon: <TeamOutlined />, path: '/crm' },
            ],
          },
          {
            key: 'hr',
            label: '员工管理',
            icon: <TeamOutlined />,
            children: [
              { key: 'hr-placeholder', label: '即将上线', icon: <TeamOutlined />, path: '/hr' },
            ],
          },
          {
            key: 'marketing',
            label: '营销功能',
            icon: <ShareAltOutlined />,
            children: [
              { key: 'marketing-placeholder', label: '即将上线', icon: <ShareAltOutlined />, path: '/marketing' },
            ],
          },
        ]
      case 'agent':
        return [
          {
            key: 'customers',
            label: '客户管理',
            icon: <TeamOutlined />,
            children: [
              { key: 'customer-list', label: '客户列表', icon: <TeamOutlined />, path: '/agent/customers' },
              { key: 'customer-feature', label: '功能开关管理', icon: <SettingOutlined />, path: '/agent/features' },
            ],
          },
          {
            key: 'data',
            label: '数据看板',
            icon: <PieChartOutlined />,
            children: [
              { key: 'referral-data', label: '推荐数据', icon: <ShareAltOutlined />, path: '/agent/referral' },
              { key: 'usage-data', label: '使用数据', icon: <PieChartOutlined />, path: '/agent/usage' },
            ],
          },
        ]
      case 'admin':
        return [
          {
            key: 'tenants',
            label: '租户管理',
            icon: <TeamOutlined />,
            children: [
              { key: 'tenant-list', label: '租户列表', icon: <TeamOutlined />, path: '/admin/tenants' },
              { key: 'tenant-agents', label: '代理商管理', icon: <TeamOutlined />, path: '/admin/agents' },
            ],
          },
          {
            key: 'features',
            label: '功能开关总控',
            icon: <SettingOutlined />,
            path: '/admin/features',
          },
          {
            key: 'branding',
            label: '贴牌配置',
            icon: <PictureOutlined />,
            path: '/admin/branding',
          },
          {
            key: 'data',
            label: '数据大盘',
            icon: <PieChartOutlined />,
            path: '/admin/data',
          },
          {
            key: 'system',
            label: '系统配置',
            icon: <SettingOutlined />,
            path: '/admin/system',
          },
        ]
      default:
        return []
    }
  }

  // 获取当前选中的菜单项
  const getSelectedKeys = (items: NavigationItem[], path: string): string[] => {
    for (const item of items) {
      if (item.path === path) {
        return [item.key]
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.path === path) {
            return [child.key]
          }
        }
      }
    }
    return []
  }

  // 获取当前展开的菜单项
  const getOpenKeys = (items: NavigationItem[], path: string): string[] => {
    for (const item of items) {
      if (item.children) {
        for (const child of item.children) {
          if (child.path === path) {
            return [item.key]
          }
        }
      }
    }
    return []
  }

  const navItems = getNavigationItems(currentRole)

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      label: '个人资料',
      icon: <UserOutlined />,
      onClick: () => {
        console.log('查看个人资料')
      },
    },
    {
      key: 'referral',
      label: '我的转介绍',
      icon: <ShareAltOutlined />,
      onClick: () => router.push('/my/referral'),
    },
    {
      key: 'settings',
      label: '设置',
      icon: <SettingOutlined />,
      onClick: () => router.push('/settings'),
    },
    ...(currentRole === 'customer' ? [
      {
        key: 'role-switch',
        label: `切换角色 (${currentRole})`,
        icon: <TeamOutlined />,
        children: [
          { key: 'role-admin', label: 'Admin (开发者)', onClick: () => setCurrentRole('admin') },
          { key: 'role-agent', label: 'Agent (代理)', onClick: () => setCurrentRole('agent') },
          { key: 'role-customer', label: 'Customer (客户)', onClick: () => setCurrentRole('customer') },
        ],
      },
    ] : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        localStorage.removeItem('userInfo')
        localStorage.removeItem('token')
        console.log('已退出登录')
      },
    },
  ]

  return (
    <Layout className="min-h-screen">
      {/* 侧边栏 */}
      <Layout.Sider
        width={240}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center justify-center border-b"
          style={{ borderColor: token.colorBorderSecondary }}
        >
          <Space>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorSuccess})`,
              }}
            >
              <span className="text-white font-bold text-sm">智</span>
            </div>
            <span className="font-bold text-lg" style={{ color: token.colorText }}>
              智枢AI
            </span>
          </Space>
        </div>

        {/* 导航菜单 */}
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys(navItems, pathname)}
          defaultOpenKeys={getOpenKeys(navItems, pathname)}
          style={{ border: 'none' }}
          items={navItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            children: item.children?.map(child => ({
              key: child.key,
              icon: child.icon,
              label: child.label,
              onClick: child.path ? () => router.push(child.path!) : undefined,
            })),
            onClick: item.path ? () => router.push(item.path!) : undefined,
          }))}
        />
      </Layout.Sider>

      {/* 主内容区域 */}
      <Layout>
        {/* 顶部导航栏 */}
        <Header
          style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: token.colorTextSecondary }}>
              当前角色：{currentRole === 'admin' ? '开发者总后台' : currentRole === 'agent' ? '区域代理' : '终端客户'}
            </span>
          </div>

          {/* 用户信息 */}
          <Space size="middle">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                <Avatar size={32} icon={<UserOutlined />} style={{ background: token.colorPrimary }} />
                <span style={{ color: token.colorText }}>管理员</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content
          style={{
            background: `linear-gradient(135deg, ${token.colorBgLayout} 0%, ${token.colorBgContainer} 100%)`,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
