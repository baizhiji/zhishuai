'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Modal,
  Form,
  Card,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Typography,
  Badge,
  Switch,
  Spin,
  Empty,
  message,
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
  ReloadOutlined,
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
    id: '1',
    name: '张三',
    phone: '138****1001',
    status: 'active',
    features: { media: true, recruitment: true, acquisition: true, sharing: true, referral: true },
    createdAt: '2024-01-10',
    expireAt: '2025-01-10',
    users: 45,
    published: 1200,
    acquired: 380,
  },
  {
    id: '2',
    name: '李四',
    phone: '139****2002',
    status: 'active',
    features: { media: true, recruitment: true, acquisition: false, sharing: true, referral: false },
    createdAt: '2024-02-15',
    expireAt: '2025-02-15',
    users: 20,
    published: 580,
    acquired: 0,
  },
  {
    id: '3',
    name: '王五',
    phone: '137****3003',
    status: 'frozen',
    features: { media: true, recruitment: false, acquisition: false, sharing: false, referral: false },
    createdAt: '2024-03-20',
    expireAt: '2024-06-20',
    users: 5,
    published: 45,
    acquired: 0,
  },
]

export default function AgentCustomersPage() {
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editVisible, setEditVisible] = useState(false)
  const [featureVisible, setFeatureVisible] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [form] = Form.useForm()
  const [createForm] = Form.useForm()
  const [featureForm] = Form.useForm()

  // 模拟加载数据
  useEffect(() => {
    const timer = setTimeout(() => {
      setCustomers(mockCustomers)
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

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

  const handleOpenFeatures = (customer: Customer) => {
    setEditCustomer(customer)
    featureForm.setFieldsValue({
      name: customer.name,
      phone: customer.phone,
      features: customer.features
    })
    setFeatureVisible(true)
  }

  const handleSaveFeatures = () => {
    featureForm.validateFields().then((values) => {
      setCustomers((prev) => 
        prev.map((c) => c.id === editCustomer?.id ? { ...c, features: values.features } : c)
      )
      message.success('功能权限已更新')
      setFeatureVisible(false)
    })
  }

  const handleOpenCreateModal = () => {
    createForm.resetFields()
    createForm.setFieldsValue({
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

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setCustomers(mockCustomers)
      setLoading(false)
      message.success('数据已刷新')
    }, 500)
  }

  const columns: ColumnsType<Customer> = [
    {
      title: '用户信息',
      key: 'user',
      render: (_, record) => (
        <Space>
          <TeamOutlined style={{ color: '#52c41a', fontSize: 18 }} />
          <div>
            <div style={{ fontWeight: 600, color: '#262626' }}>{record.name}</div>
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
      width: 220,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.features.media && <Tag color="cyan">自媒体</Tag>}
          {record.features.recruitment && <Tag color="purple">招聘</Tag>}
          {record.features.acquisition && <Tag color="orange">获客</Tag>}
          {record.features.sharing && <Tag color="green">分享</Tag>}
          {record.features.referral && <Tag color="gold">转介</Tag>}
          {!record.features.media && !record.features.recruitment && !record.features.acquisition && 
           !record.features.sharing && !record.features.referral && (
            <Text type="secondary" style={{ fontSize: 12 }}>暂无权限</Text>
          )}
        </Space>
      ),
    },
    {
      title: '数据统计',
      key: 'data',
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text type="secondary" style={{ fontSize: 12 }}>用户: <span style={{ color: '#1890ff' }}>{record.users}</span></Text>
          <Text type="secondary" style={{ fontSize: 12 }}>发布: <span style={{ color: '#52c41a' }}>{record.published}</span></Text>
          <Text type="secondary" style={{ fontSize: 12 }}>获客: <span style={{ color: '#faad14' }}>{record.acquired}</span></Text>
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
      width: 240,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type={record.status === 'active' ? 'default' : 'primary'}
            size="small"
            icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record)}
            style={record.status === 'active' ? {} : { background: '#52c41a', borderColor: '#52c41a' }}
          >
            {record.status === 'active' ? '冻结' : '解冻'}
          </Button>
          <Button
            type="primary"
            ghost
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleOpenFeatures(record)}
          >
            功能
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
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
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
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
    const frozen = customers.filter((c) => c.status === 'frozen').length
    const totalUsers = customers.reduce((sum, c) => sum + c.users, 0)
    return { total, active, frozen, totalUsers }
  }, [customers])

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>终端客户管理</Title>
          <Text type="secondary">管理终端客户账号，设置功能权限、冻结/解冻</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
            开通客户
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic 
              title="客户总数" 
              value={stats.total} 
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic 
              title="正常" 
              value={stats.active} 
              valueStyle={{ color: '#52c41a' }}
              suffix={<span style={{ fontSize: 14, color: '#8c8c8c' }}>户</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic 
              title="已冻结" 
              value={stats.frozen} 
              valueStyle={{ color: '#ff4d4f' }}
              suffix={<span style={{ fontSize: 14, color: '#8c8c8c' }}>户</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic 
              title="总用户数" 
              value={stats.totalUsers} 
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据表格 */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input.Search 
              placeholder="搜索姓名或手机号" 
              onChange={(e) => setSearchText(e.target.value)} 
              style={{ width: 220 }}
              allowClear
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            />
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
              <Option value="all">全部状态</Option>
              <Option value="active">正常</Option>
              <Option value="frozen">已冻结</Option>
            </Select>
          </Space>
        </div>

        <Spin spinning={loading}>
          <Table 
            columns={columns} 
            dataSource={filteredCustomers} 
            rowKey="id" 
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            locale={{
              emptyText: (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span>
                      {searchText || statusFilter !== 'all' ? '未找到匹配的客户' : '暂无客户数据'}
                    </span>
                  }
                >
                  {!searchText && statusFilter === 'all' && (
                    <Button type="primary" onClick={handleOpenCreateModal}>开通第一个客户</Button>
                  )}
                </Empty>
              )
            }}
          />
        </Spin>
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
          <Form.Item name="name" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号码' }]}>
            <Input placeholder="请输入手机号码" />
          </Form.Item>
          <Form.Item name="expireMonths" label="有效时间" rules={[{ required: true, message: '请选择有效时间' }]}>
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="客户姓名">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="features" label="功能权限" style={{ marginBottom: 0 }}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Space>
                    <Tag color="cyan">自媒体</Tag>
                    <Text>自媒体运营</Text>
                  </Space>
                  <Form.Item name={['features', 'media']} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Space>
                    <Tag color="purple">招聘</Tag>
                    <Text>招聘助手</Text>
                  </Space>
                  <Form.Item name={['features', 'recruitment']} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Space>
                    <Tag color="orange">获客</Tag>
                    <Text>智能获客</Text>
                  </Space>
                  <Form.Item name={['features', 'acquisition']} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Space>
                    <Tag color="green">分享</Tag>
                    <Text>推荐分享</Text>
                  </Space>
                  <Form.Item name={['features', 'sharing']} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <Space>
                    <Tag color="gold">转介</Tag>
                    <Text>转介绍</Text>
                  </Space>
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
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, max: 20, message: '用户名长度2-20个字符' }
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号码（登录账号）"
            rules={[
              { required: true, message: '请输入手机号码' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
            ]}
          >
            <Input placeholder="请输入11位手机号码" maxLength={11} />
          </Form.Item>

          <Form.Item
            name="expireMonths"
            label="有效时间"
            rules={[{ required: true, message: '请选择有效时间' }]}
          >
            <Select placeholder="请选择">
              {expireOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="status" label="初始状态" initialValue="active">
            <Select>
              <Option value="active">正常</Option>
              <Option value="frozen">冻结</Option>
            </Select>
          </Form.Item>

          <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <Space>
              <Tag color="green">提示</Tag>
              <Text type="secondary">
                登录账号：手机号码<br />
                初始密码：<span style={{ color: '#faad14' }}>123456</span>（用户自行修改）
              </Text>
            </Space>
          </Card>
        </Form>
      </Modal>
    </div>
  )
}
