'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, Row, Col, Button, Space, Typography, Avatar, Dropdown } from 'antd'
import {
  VideoCameraOutlined,
  ShoppingOutlined,
  UserOutlined,
  ThunderboltOutlined,
  ShareAltOutlined,
  TeamOutlined,
  SettingOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/lib/store'
import { getGradientColor } from '@/utils'

const { Title, Text } = Typography

interface ModuleCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  path: string
  priority: number
  color: string
}

const modules: ModuleCard[] = [
  {
    id: 'media',
    title: '自媒体板块',
    description: 'AI内容生成、矩阵账号管理、批量发布、数据统计',
    icon: <VideoCameraOutlined className="text-4xl" />,
    path: '/media',
    priority: 5,
    color: 'from-blue-500 to-purple-600',
  },
  {
    id: 'ecommerce',
    title: '电商板块',
    description: '智能详情页生成、多店铺管理、自动上架、价格监控',
    icon: <ShoppingOutlined className="text-4xl" />,
    path: '/e-commerce',
    priority: 5,
    color: 'from-green-500 to-teal-600',
  },
  {
    id: 'hr',
    title: 'HR功能',
    description: '职位发布、AI简历筛选、自动回复、面试安排',
    icon: <UserOutlined className="text-4xl" />,
    path: '/hr',
    priority: 4,
    color: 'from-orange-500 to-red-600',
  },
  {
    id: 'customer',
    title: '获客功能',
    description: '潜在客户发现、自动发送信息、二维码发送、转化统计',
    icon: <ThunderboltOutlined className="text-4xl" />,
    path: '/customer',
    priority: 5,
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'referral',
    title: '推荐分享',
    description: '二维码生成、推荐链接生成、推荐追踪',
    icon: <ShareAltOutlined className="text-4xl" />,
    path: '/referral',
    priority: 4,
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'introduction',
    title: '转介绍',
    description: '我的推荐、推荐管理',
    icon: <TeamOutlined className="text-4xl" />,
    path: '/introduction',
    priority: 4,
    color: 'from-yellow-500 to-orange-600',
  },
  {
    id: 'account',
    title: '账号管理',
    description: '用户管理、代理商管理、客户管理',
    icon: <CustomerServiceOutlined className="text-4xl" />,
    path: '/account',
    priority: 3,
    color: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'system',
    title: '系统配置',
    description: 'API配置、知识库管理、APP定制',
    icon: <SettingOutlined className="text-4xl" />,
    path: '/system',
    priority: 3,
    color: 'from-emerald-500 to-green-600',
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const userMenuItems = [
    {
      key: 'profile',
      label: '个人资料',
      icon: <UserOutlined />,
      onClick: () => router.push('/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                type="text"
                icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="mr-4"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">智枢AI</h1>
                <p className="text-xs text-gray-500">智能商业平台</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Button type="text" className="flex items-center space-x-2">
                  <Avatar icon={<UserOutlined />} />
                  <span className="text-sm font-medium text-gray-700">
                    {user?.username || '用户'}
                  </span>
                </Button>
              </Dropdown>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <Title level={2}>欢迎回来，{user?.username || '用户'}！</Title>
          <Text type="secondary">选择下方功能板块开始您的智能之旅</Text>
        </div>

        {/* 功能模块卡片 */}
        <Row gutter={[24, 24]}>
          {modules.map((module, index) => (
            <Col xs={24} sm={12} lg={6} key={module.id}>
              <Card
                hoverable
                className={`h-full card-hover overflow-hidden bg-gradient-to-br ${module.color}`}
                styles={{
                  body: { padding: '24px' },
                }}
                onClick={() => router.push(module.path)}
              >
                <div className="text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-white/20 rounded-lg p-3">
                      {module.icon}
                    </div>
                    {module.priority === 5 && (
                      <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded-full">
                        核心
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-2">{module.title}</h3>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {module.description}
                  </p>

                  <div className="mt-4 flex items-center text-sm opacity-80">
                    <span>立即使用</span>
                    <svg
                      className="ml-2 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 统计数据概览 */}
        <div className="mt-12">
          <Title level={3}>数据概览</Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
                  <div className="text-sm text-gray-500">自媒体账号</div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">0</div>
                  <div className="text-sm text-gray-500">电商店铺</div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">0</div>
                  <div className="text-sm text-gray-500">已发布内容</div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
                  <div className="text-sm text-gray-500">潜在客户</div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <Text type="secondary">© 2024 智枢AI. 保留所有权利。</Text>
            <Space>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                隐私政策
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                服务条款
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                帮助中心
              </a>
            </Space>
          </div>
        </div>
      </footer>
    </div>
  )
}
