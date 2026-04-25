'use client'

import { useRouter } from 'next/navigation'
import { Card, Row, Col, Button, Typography, Breadcrumb, Tabs, Table, Tag } from 'antd'
import { ArrowLeftOutlined, UserOutlined, TeamOutlined, CustomerServiceOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const mockUsers = [
  { id: '1', name: '用户A', phone: '138****0001', role: 'customer', status: 'active', features: ['media', 'ecommerce'] },
  { id: '2', name: '用户B', phone: '138****0002', role: 'agent', status: 'active', features: ['media', 'ecommerce', 'hr'] },
]

const mockAgents = [
  { id: '1', name: '代理商A', phone: '139****0001', customers: 10, commission: 5000, status: 'active' },
  { id: '2', name: '代理商B', phone: '139****0002', customers: 8, commission: 4000, status: 'active' },
]

const mockCustomers = [
  { id: '1', name: '客户A', phone: '137****0001', plan: '基础版', status: 'active', expiry: '2024-12-31' },
  { id: '2', name: '客户B', phone: '137****0002', plan: '专业版', status: 'active', expiry: '2025-06-30' },
]

export default function AccountPage() {
  const router = useRouter()

  const userColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const config = { admin: { color: 'red', text: '管理员' }, agent: { color: 'blue', text: '代理商' }, customer: { color: 'green', text: '客户' } }
        const { color, text } = config[role as keyof typeof config] || { color: 'default', text: role }
        return <Tag color={color}>{text}</Tag>
      },
    },
    { title: '功能权限', dataIndex: 'features', key: 'features', render: (features: string[]) => features.map(f => <Tag key={f}>{f}</Tag>) },
  ]

  const agentColumns = [
    { title: '代理商', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '客户数', dataIndex: 'customers', key: 'customers' },
    { title: '佣金', dataIndex: 'commission', key: 'commission', render: (v: number) => `¥${v}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '活跃' : '停用'}</Tag> },
  ]

  const customerColumns = [
    { title: '客户', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '套餐', dataIndex: 'plan', key: 'plan' },
    { title: '到期时间', dataIndex: 'expiry', key: 'expiry' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '正常' : '过期'}</Tag> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <Breadcrumb.Item onClick={() => router.push('/dashboard')} className="cursor-pointer">首页</Breadcrumb.Item>
          <Breadcrumb.Item>账号管理</Breadcrumb.Item>
        </Breadcrumb>

        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/dashboard')} className="mb-6">
          返回首页
        </Button>

        <div className="mb-8">
          <Title level={2}>账号管理</Title>
          <Text type="secondary">管理用户、代理商和客户账号</Text>
        </div>

        <Card>
          <Tabs
            items={[
              { key: 'users', label: <span><UserOutlined /> 用户管理</span>, children: <Table columns={userColumns} dataSource={mockUsers} rowKey="id" /> },
              { key: 'agents', label: <span><TeamOutlined /> 代理商管理</span>, children: <Table columns={agentColumns} dataSource={mockAgents} rowKey="id" /> },
              { key: 'customers', label: <span><CustomerServiceOutlined /> 客户管理</span>, children: <Table columns={customerColumns} dataSource={mockCustomers} rowKey="id" /> },
            ]}
          />
        </Card>
      </div>
    </div>
  )
}
