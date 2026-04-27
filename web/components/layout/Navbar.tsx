'use client'

import { useState, useEffect } from 'react'
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
  Image,
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
import { useAuth } from '@/contexts/AuthContext'

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
  const { user, logout } = useAuth()

  // 开发阶段默认为customer角色
  const [currentRole, setCurrentRole] = useState<Role>(user?.role || 'customer')
  // 受控的菜单展开状态
  const [openKeys, setOpenKeys] = useState<string[]>([])

  // 当路由变化时，更新菜单展开状态
  useEffect(() => {
    const navItems = getNavigationItems(currentRole)
    const newOpenKeys = getOpenKeys(navItems, pathname)
    setOpenKeys(newOpenKeys)
  }, [pathname, currentRole])

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
              { key: 'media-content', label: '内容管理', icon: <HomeOutlined />, path: '/media/content' },
              { key: 'media-matrix', label: '矩阵管理', icon: <TeamOutlined />, path: '/media/matrix' },
              { key: 'media-data', label: '数据统计', icon: <PieChartOutlined />, path: '/media/data' },
              { key: 'media-publish', label: '一键发布', icon: <ThunderboltOutlined />, path: '/media/publish' },
            ],
          },
          {
            key: 'acquisition',
            label: '获客工具',
            icon: <UserAddOutlined />,
            children: [
              { key: 'acquisition-form', label: '表单获客', icon: <ApiOutlined />, path: '/acquisition/form' },
              { key: 'acquisition-miniprogram', label: '小程序', icon: <ShopOutlined />, path: '/acquisition/miniprogram' },
              { key: 'acquisition-landing', label: '落地页', icon: <PictureOutlined />, path: '/acquisition/landing' },
            ],
          },
          {
            key: 'marketing',
            label: '营销推广',
            icon: <ShareAltOutlined />,
            children: [
              { key: 'marketing-coupon', label: '优惠券', icon: <ShopOutlined />, path: '/marketing/coupon' },
              { key: 'marketing-activity', label: '活动管理', icon: <ThunderboltOutlined />, path: '/marketing/activity' },
              { key: 'marketing-statistics', label: '数据统计', icon: <PieChartOutlined />, path: '/marketing/statistics' },
            ],
          },
          {
            key: 'hr',
            label: '招聘管理',
            icon: <TeamOutlined />,
            children: [
              { key: 'hr-resume', label: '简历库', icon: <UserOutlined />, path: '/hr/resume' },
              { key: 'hr-position', label: '职位管理', icon: <UserAddOutlined />, path: '/hr/position' },
              { key: 'hr-interview', label: '面试管理', icon: <VideoCameraOutlined />, path: '/hr/interview' },
            ],
          },
          {
            key: 'ecommerce',
            label: '电商管理',
            icon: <ShopOutlined />,
            children: [
              { key: 'ecommerce-products', label: '商品管理', icon: <PictureOutlined />, path: '/ecommerce/products' },
              { key: 'ecommerce-orders', label: '订单管理', icon: <ShopOutlined />, path: '/ecommerce/orders' },
              { key: 'ecommerce-finance', label: '财务对账', icon: <PieChartOutlined />, path: '/ecommerce/finance' },
            ],
          },
        ]
      case 'agent':
        return [
          {
            key: 'dashboard',
            label: '代理商管理台',
            icon: <PieChartOutlined />,
            path: '/agent/dashboard',
          },
          {
            key: 'crm',
            label: '客户管理',
            icon: <TeamOutlined />,
            children: [
              { key: 'crm-list', label: '客户列表', icon: <TeamOutlined />, path: '/crm/list' },
              { key: 'crm-funnel', label: '销售漏斗', icon: <PieChartOutlined />, path: '/crm/funnel' },
              { key: 'crm-tags', label: '标签管理', icon: <ApiOutlined />, path: '/crm/tags' },
            ],
          },
          {
            key: 'share',
            label: '推荐分享',
            icon: <ShareAltOutlined />,
            children: [
              { key: 'share-link', label: '分享链接', icon: <ShareAltOutlined />, path: '/share/link' },
              { key: 'share-reward', label: '奖励管理', icon: <ShopOutlined />, path: '/share/reward' },
              { key: 'share-statistics', label: '数据统计', icon: <PieChartOutlined />, path: '/share/statistics' },
            ],
          },
        ]
      case 'admin':
        return [
          {
            key: 'dashboard',
            label: '开发者总后台',
            icon: <PieChartOutlined />,
            path: '/admin/dashboard',
          },
          {
            key: 'system',
            label: '系统管理',
            icon: <SettingOutlined />,
            children: [
              { key: 'system-users', label: '用户管理', icon: <UserOutlined />, path: '/system/users' },
              { key: 'system-roles', label: '角色权限', icon: <TeamOutlined />, path: '/system/roles' },
              { key: 'system-settings', label: '系统设置', icon: <SettingOutlined />, path: '/system/settings' },
            ],
          },
          {
            key: 'account',
            label: '账号管理',
            icon: <UserOutlined />,
            children: [
              { key: 'account-staff', label: '员工管理', icon: <TeamOutlined />, path: '/account/staff' },
              { key: 'account-permissions', label: '权限管理', icon: <ApiOutlined />, path: '/account/permissions' },
            ],
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
      onClick: logout,
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
            <Image
              src="/logo.png"
              alt="智枢AI"
              width={32}
              height={32}
              preview={false}
              style={{ borderRadius: '6px' }}
            />
            <span className="font-bold text-lg" style={{ color: token.colorText }}>
              智枢AI
            </span>
          </Space>
        </div>

        {/* 导航菜单 */}
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys(navItems, pathname)}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
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
                <span style={{ color: token.colorText }}>{user?.name || '用户'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content
          style={{
            background: `linear-gradient(135deg, ${token.colorBgLayout} 0%, ${token.colorBgContainer} 100%)`,
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1 }}>{children}</div>

          {/* 版权信息 */}
          <div
            className="text-center py-4 border-t"
            style={{
              background: token.colorBgContainer,
              borderColor: token.colorBorderSecondary,
              color: token.colorTextSecondary,
              fontSize: '12px',
            }}
          >
            <div className="mb-1">智枢 AI SaaS 系统版权所属：上海百智集网络科技有限公司</div>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
