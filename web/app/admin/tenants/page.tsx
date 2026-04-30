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

interface Customer {
  id: string
  name: string
  phone: string
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

// 到期时间选项
const expireOptions = [
  { value: 1, label: '1个月' },
  { value: 3, label: '3个月' },
  { value: 6, label: '6个月' },
  { value: 12, label: '1年' },
  { value: 24, label: '2年' },
  { value: 36, label: '3年' },
  { value: -1, label: '永久' },
]

// Mock 数据
const mockCustomers: Customer[] = [
  {
    id: '2',
    name: '李总',
    phone: '139****2002',
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
    id: '5',
    name: '刘总',
    phone: '135****5005',
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

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editVisible, setEditVisible] = useState(false)
  const [featureVisible, setFeatureVisible] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [form] = Form.useForm()
  const [createForm] = Form.useForm()
  const [featureForm] = Form.useForm()

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !searchText || c.name.toLowerCase().includes(searchText.toLowerCase()) || c.phone.includes(searchText)
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [customers, searchText, statusFilter])

  const handleToggleStatus = (customer: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...c, status: c.status === 'active' ? 'frozen' : 'active' } : c))
    )
    message.success(`${customer.name} 已${customer.status === 'active' ? '冻结' : '解冻'}`)
  }

  const handleEdit = (customer: Customer) => {
    setEditCustomer(customer)
    form.setFieldsValue(customer)
    setEditVisible(true)
  }

  const handleSave = () => {
    form.validateFields().then((values) => {
      setCustomers((prev) => prev.map((c) => (c.id === editCustomer?.id ? { ...c, ...values } : c)))
      message.success('信息已更新')
      setEditVisible(false)
    })
  }

  const handleDelete = (customer: Customer) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customer.id))
    message.success(`${customer.name} 已删除`)
  }

  // 打开功能设置
  const handleOpenFeatures = (customer: Customer) => {
    setEditCustomer(customer)
    featureForm.setFieldsValue({
      name: customer.name,
      phone: customer.phone,
      features: customer.features
    })
    setFeatureVisible(true)
  }

  // 保存功能设置
  const handleSaveFeatures = () => {
    featureForm.validateFields().then((values) => {
      setCustomers((prev) => 
        prev.map((c) => c.id === editCustomer?.id ? { ...c, features: values.features } : c)
      )
      message.success('功能权限已更新')
      setFeatureVisible(false)
    })
  }

  // 开通终端客户
  const handleOpenCreateModal = () => {
    createForm.resetFields()
    createForm.setFieldsValue({
      package: 'basic',
      status: 'active',
      expireMonths: 12,
    })
    setCreateVisible(true)
  }

  const handleCreate = () => {
    createForm.validateFields().then((values) => {
      const expireValue = values.expireMonths
      const expireAt = expireValue === -1 ? '2099-12-31' : dayjs().add(expireValue, 'month').format('YYYY-MM-DD')
      
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: values.name,
        phone: values.phone,
        status: values.status,
        package: values.package,
        features: {
          media: true,
          recruitment: false,
          acquisition: false,
          sharing: false,
          referral: false,
        },
        createdAt: dayjs().format('YYYY-MM-DD'),
        expireAt,
        users: 0,
        published: 0,
        acquired: 0,
      }
      setCustomers((prev) => [newCustomer, ...prev])
      message.success(`已成功开通：${values.name}，登录账号：${values.phone}，初始密码：123456`)
      setCreateVisible(false)
    })
  }

  const columns: ColumnsType<Customer> = [
    {
      title: '用户信息',
      key: 'user',
      render: (_, record) => (
        <Space>
          <TeamOutlined style={{ color: '#52c41a' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
          </div>
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
      width: 260,
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
    const total = customers.length
    const active = customers.filter((c) => c.status === 'active').length
    const totalUsers = customers.reduce((sum, c) => sum + c.users, 0)
    return { total, active, totalUsers }
  }, [customers])

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">终端客户管理</Title>
          <Text type="secondary">管理所有终端客户，开通账号、设置功能权限、冻结/解冻</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
          开通客户
        </Button>
      </div>

      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <Statistic title="客户总数" value={stats.total} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="正常" value={stats.active} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="总用户数" value={stats.totalUsers} />
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
        </Space>

        <Table columns={columns} dataSource={filteredCustomers} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      {/* 编辑基本信息 */}
      <Modal
        title="编辑客户信息"
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
          <Form.Item name="expireMonths" label="有效时间" rules={[{ required: true }]}>
            <Select placeholder="选择有效时间">
              {expireOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
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
          <Form.Item name="name" label="客户姓名">
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

      {/* 开通客户 */}
      <Modal
        title="开通终端客户"
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => setCreateVisible(false)}
        okText="确认开通"
        cancelText="取消"
        width={500}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="name"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号码（登录账号）"
            rules={[{ required: true, message: '请输入手机号码' }]}
          >
            <Input placeholder="请输入手机号码" />
          </Form.Item>

          <Form.Item
            name="expireMonths"
            label="有效时间"
            rules={[{ required: true, message: '请选择有效时间' }]}
          >
            <Select placeholder="选择有效时间">
              {expireOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="status" label="初始状态">
            <Select>
              <Option value="active">正常</Option>
              <Option value="frozen">冻结</Option>
            </Select>
          </Form.Item>

          <Card size="small" className="mt-4">
            <Text type="secondary">
              登录账号：手机号码<br />
              初始密码：123456（用户自行修改）
            </Text>
          </Card>
        </Form>
      </Modal>
    </div>
  )
}
