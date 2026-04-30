'use client'

import React, { useState, useMemo } from 'react'
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Typography,
  Badge,
} from 'antd'
import {
  SearchOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

interface Tenant {
  id: string
  name: string
  type: 'agent' | 'customer'
  status: 'active' | 'frozen'
  package: 'basic' | 'pro' | 'enterprise'
  features: {
    media: boolean
    recruitment: boolean
    acquisition: boolean
    sharing: boolean
    referral: boolean
  }
  createdAt: string
  expireAt: string
  users: number
  published: number
  acquired: number
}

const mockTenants: Tenant[] = [
  {
    id: '1',
    name: '上海分公司',
    type: 'agent',
    status: 'active',
    package: 'enterprise',
    features: { media: true, recruitment: true, acquisition: true, sharing: true, referral: true },
    createdAt: '2024-01-01',
    expireAt: '2025-01-01',
    users: 50,
    published: 1250,
    acquired: 380,
  },
  {
    id: '2',
    name: '北京科技有限公司',
    type: 'customer',
    status: 'active',
    package: 'pro',
    features: { media: true, recruitment: true, acquisition: false, sharing: true, referral: false },
    createdAt: '2024-02-15',
    expireAt: '2025-02-15',
    users: 20,
    published: 580,
    acquired: 0,
  },
  {
    id: '3',
    name: '广州贸易公司',
    type: 'customer',
    status: 'frozen',
    package: 'basic',
    features: { media: true, recruitment: false, acquisition: false, sharing: false, referral: false },
    createdAt: '2024-03-20',
    expireAt: '2024-06-20',
    users: 5,
    published: 45,
    acquired: 0,
  },
  {
    id: '4',
    name: '深圳分公司',
    type: 'agent',
    status: 'active',
    package: 'enterprise',
    features: { media: true, recruitment: true, acquisition: true, sharing: true, referral: true },
    createdAt: '2024-01-15',
    expireAt: '2025-01-15',
    users: 35,
    published: 890,
    acquired: 420,
  },
  {
    id: '5',
    name: '杭州创意工作室',
    type: 'customer',
    status: 'active',
    package: 'pro',
    features: { media: true, recruitment: false, acquisition: true, sharing: true, referral: true },
    createdAt: '2024-04-10',
    expireAt: '2025-04-10',
    users: 12,
    published: 320,
    acquired: 156,
  },
]

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [editVisible, setEditVisible] = useState(false)
  const [editTenant, setEditTenant] = useState<Tenant | null>(null)
  const [form] = Form.useForm()

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        !searchText || t.name.toLowerCase().includes(searchText.toLowerCase())
      const matchStatus = statusFilter === 'all' || t.status === statusFilter
      const matchType = typeFilter === 'all' || t.type === typeFilter
      return matchSearch && matchStatus && matchType
    })
  }, [tenants, searchText, statusFilter, typeFilter])

  const handleToggleStatus = (tenant: Tenant) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === tenant.id ? { ...t, status: t.status === 'active' ? 'frozen' : 'active' } : t))
    )
    message.success(`${tenant.name} 已${tenant.status === 'active' ? '冻结' : '解冻'}`)
  }

  const handleEdit = (tenant: Tenant) => {
    setEditTenant(tenant)
    form.setFieldsValue(tenant)
    setEditVisible(true)
  }

  const handleSave = () => {
    form.validateFields().then((values) => {
      setTenants((prev) => prev.map((t) => (t.id === editTenant?.id ? { ...t, ...values } : t)))
      message.success('租户信息已更新')
      setEditVisible(false)
    })
  }

  const handleDelete = (tenant: Tenant) => {
    setTenants((prev) => prev.filter((t) => t.id !== tenant.id))
    message.success(`${tenant.name} 已删除`)
  }

  const columns: ColumnsType<Tenant> = [
    {
      title: '租户名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space>
          <TeamOutlined style={{ color: record.type === 'agent' ? '#1890ff' : '#52c41a' }} />
          <span>{name}</span>
          <Tag color={record.type === 'agent' ? 'blue' : 'green'}>
            {record.type === 'agent' ? '代理' : '客户'}
          </Tag>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Badge
          status={status === 'active' ? 'success' : 'error'}
          text={status === 'active' ? '正常' : '已冻结'}
        />
      ),
    },
    {
      title: '套餐',
      dataIndex: 'package',
      key: 'package',
      width: 100,
      render: (pkg: string) => {
        const colors: Record<string, string> = { basic: 'default', pro: 'blue', enterprise: 'purple' }
        const names: Record<string, string> = { basic: '基础版', pro: '专业版', enterprise: '企业版' }
        return <Tag color={colors[pkg]}>{names[pkg]}</Tag>
      },
    },
    {
      title: '功能',
      key: 'features',
      width: 200,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.features.media && <Tag color="cyan">自媒体</Tag>}
          {record.features.recruitment && <Tag color="purple">招聘</Tag>}
          {record.features.acquisition && <Tag color="orange">获客</Tag>}
          {record.features.sharing && <Tag color="green">分享</Tag>}
          {record.features.referral && <Tag color="gold">转介</Tag>}
        </Space>
      ),
    },
    {
      title: '数据',
      key: 'data',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary">用户: {record.users}</Text>
          <Text type="secondary">发布: {record.published}</Text>
          <Text type="secondary">获客: {record.acquired}</Text>
        </Space>
      ),
    },
    {
      title: '到期时间',
      dataIndex: 'expireAt',
      key: 'expireAt',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'active' ? '冻结' : '解冻'}
          </Button>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除 ${record.name} 吗？此操作不可恢复。`}
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const stats = useMemo(() => {
    const total = tenants.length
    const active = tenants.filter((t) => t.status === 'active').length
    const agents = tenants.filter((t) => t.type === 'agent').length
    const customers = tenants.filter((t) => t.type === 'customer').length
    return { total, active, agents, customers }
  }, [tenants])

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">租户管理</Title>
        <Text type="secondary">查看所有代理商和客户列表，强制开关功能、调整套餐、冻结/解冻</Text>
      </div>

      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic title="总租户数" value={stats.total} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="正常" value={stats.active} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="代理商" value={stats.agents} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="终端客户" value={stats.customers} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card className="mb-6">
        <Space wrap className="mb-4">
          <Search placeholder="搜索租户名称" onChange={(e) => setSearchText(e.target.value)} style={{ width: 200 }} />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
            <Option value="all">全部状态</Option>
            <Option value="active">正常</Option>
            <Option value="frozen">已冻结</Option>
          </Select>
          <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 120 }}>
            <Option value="all">全部类型</Option>
            <Option value="agent">代理商</Option>
            <Option value="customer">客户</Option>
          </Select>
        </Space>

        <Table columns={columns} dataSource={filteredTenants} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="编辑租户"
        open={editVisible}
        onOk={handleSave}
        onCancel={() => setEditVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="租户名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="package" label="套餐" rules={[{ required: true }]}>
            <Select>
              <Option value="basic">基础版</Option>
              <Option value="pro">专业版</Option>
              <Option value="enterprise">企业版</Option>
            </Select>
          </Form.Item>
          <Form.Item name="expireAt" label="到期时间" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
