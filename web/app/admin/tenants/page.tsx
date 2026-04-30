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
  message,
  Card,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Typography,
  Badge,
  DatePicker,
  Switch,
} from 'antd'
import {
  SearchOutlined,
  LockOutlined,
  UnlockOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

interface Tenant {
  id: string
  name: string
  phone: string
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
    name: '张经理',
    phone: '138****1001',
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
    name: '李总',
    phone: '139****2002',
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
    name: '王老板',
    phone: '137****3003',
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
    name: '赵经理',
    phone: '136****4004',
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
    name: '刘总',
    phone: '135****5005',
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
  const [featureVisible, setFeatureVisible] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [editTenant, setEditTenant] = useState<Tenant | null>(null)
  const [form] = Form.useForm()
  const [createForm] = Form.useForm()
  const [featureForm] = Form.useForm()

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        !searchText || t.name.toLowerCase().includes(searchText.toLowerCase()) || t.phone.includes(searchText)
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
      message.success('信息已更新')
      setEditVisible(false)
    })
  }

  const handleDelete = (tenant: Tenant) => {
    setTenants((prev) => prev.filter((t) => t.id !== tenant.id))
    message.success(`${tenant.name} 已删除`)
  }

  // 打开功能设置
  const handleOpenFeatures = (tenant: Tenant) => {
    setEditTenant(tenant)
    featureForm.setFieldsValue({
      name: tenant.name,
      phone: tenant.phone,
      features: tenant.features
    })
    setFeatureVisible(true)
  }

  // 保存功能设置
  const handleSaveFeatures = () => {
    featureForm.validateFields().then((values) => {
      setTenants((prev) => 
        prev.map((t) => t.id === editTenant?.id ? { ...t, features: values.features } : t)
      )
      message.success('功能权限已更新')
      setFeatureVisible(false)
    })
  }

  // 开通终端用户
  const handleOpenCreateModal = () => {
    createForm.resetFields()
    createForm.setFieldsValue({
      type: 'customer',
      package: 'basic',
      status: 'active',
      expireAt: dayjs().add(1, 'year'),
    })
    setCreateVisible(true)
  }

  const handleCreate = () => {
    createForm.validateFields().then((values) => {
      const newTenant: Tenant = {
        id: Date.now().toString(),
        name: values.name,
        phone: values.phone,
        type: values.type,
        status: values.status,
        package: values.package,
        features: {
          media: values.type === 'customer' ? true : false,
          recruitment: false,
          acquisition: false,
          sharing: false,
          referral: false,
        },
        createdAt: dayjs().format('YYYY-MM-DD'),
        expireAt: values.expireAt ? values.expireAt.format('YYYY-MM-DD') : dayjs().add(1, 'year').format('YYYY-MM-DD'),
        users: 0,
        published: 0,
        acquired: 0,
      }
      setTenants((prev) => [newTenant, ...prev])
      message.success(`已成功开通：${values.name}，初始密码：123456`)
      setCreateVisible(false)
    })
  }

  const columns: ColumnsType<Tenant> = [
    {
      title: '用户信息',
      key: 'user',
      render: (_, record) => (
        <Space>
          <TeamOutlined style={{ color: record.type === 'agent' ? '#1890ff' : '#52c41a' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
          </div>
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
      title: '功能权限',
      key: 'features',
      width: 200,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.features.media && <Tag color="cyan">自媒体</Tag>}
          {record.features.recruitment && <Tag color="purple">招聘</Tag>}
          {record.features.acquisition && <Tag color="orange">获客</Tag>}
          {record.features.sharing && <Tag color="green">分享</Tag>}
          {record.features.referral && <Tag color="gold">转介</Tag>}
          {!record.features.media && !record.features.recruitment && !record.features.acquisition && 
           !record.features.sharing && !record.features.referral && (
            <Text type="secondary">暂无权限</Text>
          )}
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
      width: 280,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'active' ? '冻结' : '解冻'}
          </Button>
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleOpenFeatures(record)}
          >
            功能
          </Button>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
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
            <Button type="text" size="small" danger icon={<DeleteOutlined />}>
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">用户管理</Title>
          <Text type="secondary">管理所有代理商和终端用户，开通账号、设置功能权限、冻结/解冻</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
          开通用户
        </Button>
      </div>

      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic title="总用户数" value={stats.total} prefix={<TeamOutlined />} />
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
          <Search placeholder="搜索姓名或手机号" onChange={(e) => setSearchText(e.target.value)} style={{ width: 200 }} />
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

      {/* 编辑基本信息 */}
      <Modal
        title="编辑用户信息"
        open={editVisible}
        onOk={handleSave}
        onCancel={() => setEditVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
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

      {/* 设置功能权限 */}
      <Modal
        title="功能权限设置"
        open={featureVisible}
        onOk={handleSaveFeatures}
        onCancel={() => setFeatureVisible(false)}
        okText="保存"
        cancelText="取消"
        width={500}
      >
        <Form form={featureForm} layout="vertical">
          <Form.Item name="name" label="用户姓名">
            <Input disabled />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input disabled />
          </Form.Item>
          <Form.Item name="features" label="功能权限" style={{ marginBottom: 0 }}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div className="flex justify-between items-center">
                  <Text>自媒体运营</Text>
                  <Form.Item name={['features', 'media']} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
                <div className="flex justify-between items-center">
                  <Text>招聘助手</Text>
                  <Form.Item name={['features', 'recruitment']} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
                <div className="flex justify-between items-center">
                  <Text>智能获客</Text>
                  <Form.Item name={['features', 'acquisition']} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
                <div className="flex justify-between items-center">
                  <Text>推荐分享</Text>
                  <Form.Item name={['features', 'sharing']} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
                <div className="flex justify-between items-center">
                  <Text>转介绍</Text>
                  <Form.Item name={['features', 'referral']} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </Space>
            </Card>
          </Form.Item>
        </Form>
      </Modal>

      {/* 开通用户 */}
      <Modal
        title="开通用户"
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => setCreateVisible(false)}
        okText="确认开通"
        cancelText="取消"
        width={500}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="type"
            label="用户类型"
            rules={[{ required: true }]}
          >
            <Select placeholder="选择用户类型">
              <Option value="customer">终端客户</Option>
              <Option value="agent">代理商</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号码"
            rules={[{ required: true, message: '请输入手机号码' }]}
          >
            <Input placeholder="请输入手机号码" />
          </Form.Item>

          <Form.Item
            name="package"
            label="套餐版本"
            rules={[{ required: true, message: '请选择套餐版本' }]}
          >
            <Select placeholder="请选择套餐">
              <Option value="basic">基础版</Option>
              <Option value="pro">专业版</Option>
              <Option value="enterprise">企业版</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="expireAt"
            label="到期时间"
            rules={[{ required: true, message: '请选择到期时间' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="选择到期时间" />
          </Form.Item>

          <Form.Item name="status" label="初始状态">
            <Select>
              <Option value="active">正常</Option>
              <Option value="frozen">冻结</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
