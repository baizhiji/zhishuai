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
} from 'antd'
import {
  DashboardOutlined,
  VideoCameraOutlined,
  TeamOutlined,
  ShoppingOutlined,
  UserOutlined,
  GiftOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserSwitchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'

const { Header, Content } = Layout

const { useToken } = theme

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
  const [collapsed, setCollapsed] = useState(false)

  // 导航菜单配置
  const navigationItems: NavigationItem[] = [
    {
      key: 'dashboard',
      label: '仪表盘',
      icon: <DashboardOutlined />,
      path: '/dashboard',
    },
    {
      key: 'media',
      label: '自媒体管理',
      icon: <VideoCameraOutlined />,
      children: [
        { key: 'media-accounts', label: '账号管理', icon: <TeamOutlined />, path: '/media/accounts' },
        { key: 'media-publish', label: '批量发布', icon: <GiftOutlined />, path: '/media/publish' },
        { key: 'media-materials', label: '素材管理', icon: <VideoCameraOutlined />, path: '/media/materials' },
        { key: 'media-analytics', label: '数据分析', icon: <BarChartOutlined />, path: '/media/analytics' },
        { key: 'media-comments', label: '评论管理', icon: <TeamOutlined />, path: '/media/comments' },
        { key: 'media-assistant', label: 'AI助手', icon: <UserOutlined />, path: '/media/assistant' },
      ],
    },
    {
      key: 'customer',
      label: '客户管理',
      icon: <TeamOutlined />,
      children: [
        { key: 'customer-list', label: '客户列表', icon: <TeamOutlined />, path: '/customer/list' },
        { key: 'customer-stats', label: '客户统计', icon: <BarChartOutlined />, path: '/customer/stats' },
        { key: 'customer-discovery', label: '渠道发现', icon: <GiftOutlined />, path: '/customer/discovery' },
        { key: 'customer-send', label: '群发消息', icon: <VideoCameraOutlined />, path: '/customer/send' },
        { key: 'customer-qrcode', label: '二维码推广', icon: <ShoppingOutlined />, path: '/customer/qrcode' },
      ],
    },
    {
      key: 'e-commerce',
      label: '电商管理',
      icon: <ShoppingOutlined />,
      children: [
        { key: 'ecommerce-shops', label: '商店管理', icon: <ShoppingOutlined />, path: '/e-commerce/shops' },
        { key: 'ecommerce-detail', label: '详情页优化', icon: <VideoCameraOutlined />, path: '/e-commerce/detail-page' },
        { key: 'ecommerce-price', label: '价格监控', icon: <BarChartOutlined />, path: '/e-commerce/price-monitor' },
        { key: 'ecommerce-auto', label: '自动发布', icon: <GiftOutlined />, path: '/e-commerce/auto-publish' },
        { key: 'ecommerce-sales', label: '销售统计', icon: <BarChartOutlined />, path: '/e-commerce/sales-stats' },
      ],
    },
    {
      key: 'hr',
      label: 'HR管理',
      icon: <UserOutlined />,
      children: [
        { key: 'hr-employees', label: '员工管理', icon: <UserOutlined />, path: '/hr/employees' },
        { key: 'hr-recruitment', label: '招聘管理', icon: <TeamOutlined />, path: '/hr/recruitment' },
        { key: 'hr-attendance', label: '考勤管理', icon: <DashboardOutlined />, path: '/hr/attendance' },
        { key: 'hr-salary', label: '薪资管理', icon: <BarChartOutlined />, path: '/hr/salary' },
        { key: 'hr-performance', label: '绩效管理', icon: <GiftOutlined />, path: '/hr/performance' },
      ],
    },
    {
      key: 'marketing',
      label: '营销管理',
      icon: <GiftOutlined />,
      children: [
        { key: 'marketing-campaigns', label: '营销活动', icon: <GiftOutlined />, path: '/marketing/campaigns' },
        { key: 'marketing-coupons', label: '优惠券', icon: <VideoCameraOutlined />, path: '/marketing/coupons' },
        { key: 'marketing-segments', label: '用户分群', icon: <TeamOutlined />, path: '/marketing/segments' },
        { key: 'marketing-automation', label: '营销自动化', icon: <DashboardOutlined />, path: '/marketing/automation' },
      ],
    },
    {
      key: 'analytics',
      label: '数据分析',
      icon: <BarChartOutlined />,
      children: [
        { key: 'analytics-overview', label: '数据概览', icon: <BarChartOutlined />, path: '/analytics/overview' },
        { key: 'analytics-reports', label: '报表中心', icon: <VideoCameraOutlined />, path: '/analytics/reports' },
        { key: 'analytics-funnel', label: '转化漏斗', icon: <GiftOutlined />, path: '/analytics/funnel' },
      ],
    },
    {
      key: 'system',
      label: '系统设置',
      icon: <SettingOutlined />,
      children: [
        { key: 'system-overview', label: '系统概况', icon: <DashboardOutlined />, path: '/system' },
        { key: 'system-settings', label: '系统设置', icon: <SettingOutlined />, path: '/system/settings' },
        { key: 'system-users', label: '用户管理', icon: <UserOutlined />, path: '/system/users' },
      ],
    },
  ]

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      label: '个人资料',
      icon: <UserOutlined />,
      onClick: () => router.push('/profile'),
    },
    {
      key: 'switch',
      label: '切换账号',
      icon: <UserSwitchOutlined />,
      onClick: () => router.push('/login'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        // 清除用户信息
        localStorage.removeItem('userInfo')
        localStorage.removeItem('token')
        router.push('/login')
      },
    },
  ]

  // 将嵌套菜单展平
  const flattenMenuItems = (items: NavigationItem[], prefix = ''): NavigationItem[] => {
    let result: NavigationItem[] = []
    items.forEach(item => {
      if (item.children) {
        result = result.concat(flattenMenuItems(item.children, item.key))
      } else {
        result.push(item)
      }
    })
    return result
  }

  const flatItems = flattenMenuItems(navigationItems)

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const matchedItem = flatItems.find(item => pathname === item.path)
    return matchedItem ? [matchedItem.key] : []
  }

  // 获取当前展开的菜单项
  const getOpenKeys = () => {
    const matchedItem = flatItems.find(item => pathname === item.path)
    if (matchedItem) {
      // 从 key 中提取父级 key
      const parts = matchedItem.key.split('-')
      if (parts.length > 1) {
        return [parts[0]]
      }
    }
    return []
  }

  // 菜单点击处理
  const handleMenuClick = ({ key }: { key: string }) => {
    const item = flatItems.find(i => i.key === key)
    if (item) {
      router.push(item.path)
    }
  }

  return (
    <Layout className="min-h-screen">
      {/* 侧边栏 */}
      <Layout.Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
        trigger={
          collapsed ? (
            <MenuUnfoldOutlined style={{ fontSize: '16px' }} />
          ) : (
            <MenuFoldOutlined style={{ fontSize: '16px' }} />
          )
        }
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center justify-center border-b"
          style={{ borderColor: token.colorBorderSecondary }}
        >
          {!collapsed ? (
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
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorSuccess})`,
              }}
            >
              <span className="text-white font-bold text-sm">智</span>
            </div>
          )}
        </div>

        {/* 导航菜单 */}
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          style={{ border: 'none' }}
          items={navigationItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            children: item.children?.map(child => ({
              key: child.key,
              icon: child.icon,
              label: child.label,
            })),
          }))}
          onClick={handleMenuClick}
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
              {navigationItems.find(item =>
                item.children?.some(child => child.path === pathname) || item.path === pathname
              )?.label || '智枢AI工作台'}
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
