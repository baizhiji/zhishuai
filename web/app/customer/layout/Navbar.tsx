'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Layout,
  Menu,
  Avatar,
  Space,
  Button,
  Dropdown,
  theme,
  Image,
  Modal,
  Radio,
} from 'antd'
import {
  PieChartOutlined,
  VideoCameraOutlined,
  TeamOutlined,
  UserAddOutlined,
  ShareAltOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  AppstoreOutlined,
  QrcodeOutlined,
  MessageOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/contexts/AuthContext'

const { Sider, Header, Content } = Layout
const { useToken } = theme

// 角色类型
type Role = 'admin' | 'agent' | 'customer'

// 角色选项
const roleOptions = [
  { value: 'admin' as Role, label: '开发者总后台', icon: '👑' },
  { value: 'agent' as Role, label: '区域代理后台', icon: '🏢' },
  { value: 'customer' as Role, label: '终端客户后台', icon: '👤' },
]

interface NavigationItem {
  key: string
  label: string
  icon: React.ReactNode
  path?: string
  children?: NavigationItem[]
}

// 导航菜单配置
function getNavigationItems(role: Role): NavigationItem[] {
  switch (role) {
    case 'customer':
      return [
        {
          key: 'dashboard',
          label: '数据大盘',
          icon: <PieChartOutlined />,
          path: '/',
        },
        {
          key: 'materials',
          label: '素材库',
          icon: <FileTextOutlined />,
          path: '/customer/materials',
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
            { key: 'recruit-platforms', label: '平台授权', icon: <QrcodeOutlined />, path: '/customer/recruitment/platforms' },
            { key: 'recruit-auto', label: '自动沟通', icon: <MessageOutlined />, path: '/customer/recruitment/auto' },
            { key: 'recruitment-publish', label: '职位发布', icon: <ShareAltOutlined />, path: '/recruitment/publish' },
            { key: 'recruitment-screen', label: '简历筛选', icon: <UserAddOutlined />, path: '/recruitment/screen' },
            { key: 'recruitment-reply', label: '自动回复', icon: <ThunderboltOutlined />, path: '/recruitment/reply' },
            { key: 'recruitment-interview', label: '面试管理', icon: <TeamOutlined />, path: '/recruitment/interview' },
            { key: 'recruitment-board', label: '招聘看板', icon: <PieChartOutlined />, path: '/recruitment/board' },
          ],
        },
        {
          key: 'acquisition',
          label: '智能获客',
          icon: <UserAddOutlined />,
          children: [
            { key: 'acquisition-discover', label: '潜客发现', icon: <UserAddOutlined />, path: '/acquisition/discover' },
            { key: 'acquisition-task', label: '引流任务', icon: <ShareAltOutlined />, path: '/acquisition/task' },
            { key: 'acquisition-board', label: '获客看板', icon: <PieChartOutlined />, path: '/acquisition/board' },
          ],
        },
        {
          key: 'share',
          label: '推荐分享',
          icon: <ShareAltOutlined />,
          children: [
            { key: 'share-code', label: '码生成', icon: <QrcodeOutlined />, path: '/share/code' },
            { key: 'share-track', label: '推荐追踪', icon: <PieChartOutlined />, path: '/share/track' },
            { key: 'share-board', label: '分享看板', icon: <ShareAltOutlined />, path: '/share/board' },
          ],
        },
        {
          key: 'employees',
          label: '员工管理',
          icon: <TeamOutlined />,
          path: '/customer/employees',
        },
        {
          key: 'tickets',
          label: '工单管理',
          icon: <FileTextOutlined />,
          path: '/customer/tickets',
        },
        {
          key: 'reports',
          label: '数据报表',
          icon: <PieChartOutlined />,
          path: '/analytics/reports',
        },
        {
          key: 'login-logs',
          label: '登录日志',
          icon: <FileTextOutlined />,
          path: '/customer/login-logs',
        },
        {
          key: 'api-keys',
          label: 'API管理',
          icon: <AppstoreOutlined />,
          path: '/customer/api-keys',
        },
        {
          key: 'settings',
          label: '设置',
          icon: <SettingOutlined />,
          path: '/customer/settings',
        },
        {
          key: 'help',
          label: '帮助中心',
          icon: <AppstoreOutlined />,
          path: '/help',
        },
      ]
    case 'agent':
      return [
        { key: 'agent-tenants', label: '租户管理', icon: <TeamOutlined />, path: '/agent/tenants' },
        { key: 'agent-agents', label: '代理商管理', icon: <TeamOutlined />, path: '/agent/agents' },
        { key: 'agent-dashboard', label: '数据看板', icon: <PieChartOutlined />, path: '/agent/dashboard' },
        { key: 'agent-tickets', label: '工单处理', icon: <FileTextOutlined />, path: '/agent/tickets' },
      ]
    case 'admin':
      return [
        { key: 'admin-tenants', label: '租户管理', icon: <TeamOutlined />, path: '/admin/tenants' },
        { key: 'admin-agents', label: '代理商管理', icon: <TeamOutlined />, path: '/admin/agents' },
        { key: 'admin-dashboard', label: '数据大盘', icon: <PieChartOutlined />, path: '/admin/analytics' },
        { key: 'admin-logs', label: '操作日志', icon: <FileTextOutlined />, path: '/admin/logs' },
      ]
    default:
      return []
  }
}

// 获取当前选中的菜单项
function getSelectedKeys(items: NavigationItem[], path: string): string[] {
  for (const item of items) {
    if (item.path && path.startsWith(item.path)) {
      return [item.key]
    }
    if (item.children) {
      for (const child of item.children) {
        if (child.path && path.startsWith(child.path)) {
          return [child.key]
        }
      }
    }
  }
  return []
}

// 获取当前展开的菜单项
function getOpenKeysForPath(items: NavigationItem[], path: string): string[] {
  for (const item of items) {
    if (item.children) {
      for (const child of item.children) {
        if (child.path && path.startsWith(child.path)) {
          return [item.key]
        }
      }
    }
  }
  return []
}

export default function Navbar({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { token } = useToken()
  const { user, logout, isAdmin } = useAuth()

  // Logo 图片加载状态
  const [logoError, setLogoError] = useState(false)

  // 角色切换弹窗状态
  const [roleModalVisible, setRoleModalVisible] = useState(false)

  // 从 localStorage 读取保存的角色
  const getSavedRole = (): Role => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('viewing_role')
      if (saved && ['admin', 'agent', 'customer'].includes(saved)) {
        return saved as Role
      }
    }
    return user?.role as Role || 'customer'
  }

  // 当前查看的角色
  const [currentRole, setCurrentRole] = useState<Role>(getSavedRole)

  // 监听用户角色变化
  useEffect(() => {
    if (user?.role) {
      const savedRole = getSavedRole()
      if (!localStorage.getItem('viewing_role')) {
        setCurrentRole(user.role as Role)
      } else {
        setCurrentRole(savedRole)
      }
    }
  }, [user?.role])

  // 切换角色
  const handleRoleSwitch = (role: Role) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('viewing_role', role)
    }
    setCurrentRole(role)
    setRoleModalVisible(false)
    if (role === 'admin') {
      router.push('/admin/tenants')
    } else if (role === 'agent') {
      router.push('/agent/tenants')
    } else {
      router.push('/')
    }
  }

  // 导航菜单项
  const navItems = useMemo(() => getNavigationItems(currentRole), [currentRole])

  // 菜单展开状态
  const [openKeys, setOpenKeys] = useState<string[]>([])

  // 路由变化时自动更新菜单展开状态
  useEffect(() => {
    const keysFromPath = getOpenKeysForPath(navItems, pathname)
    if (keysFromPath.length > 0) {
      setOpenKeys(keysFromPath)
    }
  }, [pathname, navItems])

  // 用户手动展开/折叠菜单
  const handleOpenChange = useCallback((keys: string[]) => {
    setOpenKeys(keys)
  }, [])

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
      onClick: () => router.push('/customer/settings'),
    },
    {
      key: 'role-switch',
      label: '切换角色视角',
      icon: <SwapOutlined />,
      children: roleOptions.map(opt => ({
        key: `role-${opt.value}`,
        label: (
          <Space>
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
            {currentRole === opt.value && <span style={{ color: '#52c41a' }}>当前</span>}
          </Space>
        ),
        onClick: () => handleRoleSwitch(opt.value),
      })),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: logout,
    },
  ]

  // 获取角色显示文本
  const getRoleDisplayText = (role: Role) => {
    switch (role) {
      case 'admin': return '开发者总后台'
      case 'agent': return '区域代理'
      case 'customer': return '终端客户'
      default: return '未知角色'
    }
  }

  return (
    <Layout className="min-h-screen">
      {/* 侧边栏 - 白色风格 */}
      <Sider
        width={240}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Space>
            {logoError ? (
              <div
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: token.colorPrimary,
                  borderRadius: 6,
                }}
              >
                <AppstoreOutlined style={{ color: '#fff', fontSize: 18 }} />
              </div>
            ) : (
              <Image
                src="/logo.png"
                alt="智枢AI"
                width={32}
                height={32}
                preview={false}
                style={{ borderRadius: 6 }}
                onError={() => setLogoError(true)}
              />
            )}
            <span
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: token.colorText,
              }}
            >
              智枢AI
            </span>
          </Space>
        </div>

        {/* 导航菜单 - 白色主题 */}
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys(navItems, pathname)}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
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
      </Sider>

      {/* 主内容区域 */}
      <Layout>
        {/* 顶部导航栏 - 白色风格 */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 14, color: token.colorTextSecondary }}>
              当前角色：{getRoleDisplayText(currentRole)}
            </span>
            {isAdmin && (
              <Button
                type="link"
                icon={<SwapOutlined />}
                size="small"
                onClick={() => setRoleModalVisible(true)}
              >
                切换
              </Button>
            )}
          </div>

          {/* 用户信息 */}
          <Space size="middle">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space
                style={{
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 4,
                }}
                className="hover:bg-gray-50"
              >
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  style={{ background: token.colorPrimary }}
                />
                <span style={{ color: token.colorText }}>
                  {user?.name || '用户'}
                </span>
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
            style={{
              textAlign: 'center',
              padding: '16px 0',
              borderTop: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorBgContainer,
              color: token.colorTextSecondary,
              fontSize: 12,
            }}
          >
            <div style={{ marginBottom: 4 }}>
              智枢 AI SaaS 系统版权所属：上海百智集网络科技有限公司
            </div>
          </div>
        </Content>

      </Layout>

      {/* 角色切换弹窗 */}
      <Modal
        title="切换角色视角"
        open={roleModalVisible}
        onCancel={() => setRoleModalVisible(false)}
        footer={null}
        width={400}
      >
        <div style={{ paddingTop: 16 }}>
          <p style={{ color: '#666', marginBottom: 16 }}>
            当前账号角色：<strong>{user?.role === 'admin' ? '管理员' : user?.role === 'agent' ? '代理商' : '客户'}</strong>
          </p>
          <Radio.Group
            value={currentRole}
            onChange={(e) => handleRoleSwitch(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {roleOptions.map(opt => (
              <Radio.Button
                key={opt.value}
                value={opt.value}
                style={{
                  height: 'auto',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  borderRadius: 8,
                }}
              >
                <Space>
                  <span style={{ fontSize: 20 }}>{opt.icon}</span>
                  <span style={{ fontWeight: 500 }}>{opt.label}</span>
                  {currentRole === opt.value && (
                    <span style={{ color: '#52c41a', fontSize: 12 }}>(当前)</span>
                  )}
                </Space>
              </Radio.Button>
            ))}
          </Radio.Group>
        </div>
      </Modal>
    </Layout>
  )
}
