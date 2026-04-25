'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Layout,
  Menu,
  Dropdown,
  Avatar,
  Space,
  Button,
  theme,
  Card,
  Row,
  Col,
  Typography,
} from 'antd'
import {
  HomeOutlined,
  VideoCameraOutlined,
  ShopOutlined,
  TeamOutlined,
  UserAddOutlined,
  ShareAltOutlined,
  RobotOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons'

const { Header, Content } = Layout
const { useToken } = theme
const { Title } = Typography

export default function Navbar({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token } = useToken()

  // 7个核心版块
  const modules = [
    {
      key: 'media',
      title: '自媒体版块',
      icon: <VideoCameraOutlined className="text-4xl" />,
      description: '智能内容生成与矩阵发布',
      path: '/media',
      color: 'from-blue-500 to-blue-600',
    },
    {
      key: 'ecommerce',
      title: '电商版块',
      icon: <ShopOutlined className="text-4xl" />,
      description: '智能详情页生成与上架',
      path: '/ecommerce',
      color: 'from-green-500 to-green-600',
    },
    {
      key: 'hr',
      title: 'HR 功能',
      icon: <TeamOutlined className="text-4xl" />,
      description: 'AI 招聘与简历筛选',
      path: '/hr',
      color: 'from-purple-500 to-purple-600',
    },
    {
      key: 'acquisition',
      title: '获客功能',
      icon: <UserAddOutlined className="text-4xl" />,
      description: '精准获客与自动引流',
      path: '/acquisition',
      color: 'from-orange-500 to-orange-600',
    },
    {
      key: 'share',
      title: '推荐分享',
      icon: <ShareAltOutlined className="text-4xl" />,
      description: '短视频一键发布裂变',
      path: '/share',
      color: 'from-pink-500 to-pink-600',
    },
    {
      key: 'referral',
      title: '转介绍',
      icon: <UserOutlined className="text-4xl" />,
      description: '推荐智枢AI获取奖励',
      path: '/referral',
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      key: 'ai',
      title: 'AI 能力',
      icon: <RobotOutlined className="text-4xl" />,
      description: '文本、图像、视频生成',
      path: '/ai',
      color: 'from-indigo-500 to-indigo-600',
    },
  ]

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
      onClick: () => router.push('/referral'),
    },
    {
      key: 'settings',
      label: '设置',
      icon: <SettingOutlined />,
      onClick: () => router.push('/settings'),
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
        localStorage.removeItem('userInfo')
        localStorage.removeItem('token')
        console.log('已退出登录')
      },
    },
  ]

  // 导航菜单
  const navItems = [
    {
      key: 'home',
      label: '首页',
      icon: <HomeOutlined />,
      onClick: () => router.push('/'),
    },
  ]

  return (
    <Layout className="min-h-screen">
      {/* 侧边栏 */}
      <Layout.Sider
        width={200}
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
          selectedKeys={[router.pathname === '/' ? 'home' : '']}
          style={{ border: 'none' }}
          items={navItems}
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
              {router.pathname === '/' ? '首页' : ''}
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
