'use client'

import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Modal,
  Form,
  message,
  Avatar,
  Switch,
  Popconfirm
} from 'antd'
import {
  UserOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  ExclamationCircleOutlined,
  SettingOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { Option } = Select

// 租户类型
interface Tenant {
  key: string
  id: string
  name: string
  company: string
  phone: string
  agent: string
  agentName: string
  package: string
  features: string[]
  status: 'active' | 'frozen' | 'expired'
  balance: number
  expireDate: string
  createTime: string
}

// Mock 数据
const mockTenants: Tenant[] = [
  {
    key: '1',
    id: 'T001',
    name: '陈总',
    company: '广州某信息科技有限公司',
    phone: '138****1234',
    agent: 'A001',
    agentName: '华东代理商',
    package: '旗舰版',
    features: ['media', 'recruitment', 'acquisition', 'referral'],
    status: 'active',
    balance: 12500,
    expireDate: '2026-04-29',
    createTime: '2025-01-15'
  },
  {
    key: '2',
    id: 'T002',
    name: '李总监',
    company: '杭州某网络科技有限公司',
    phone: '139****5678',
    agent: 'A002',
    agentName: '华南代理商',
    package: '专业版',
    features: ['media', 'recruitment'],
    status: 'active',
    balance: 9800,
    expireDate: '2026-03-20',
    createTime: '2025-02-10'
  },
  {
    key: '3',
    id: 'T003',
    name: '张经理',
    company: '上海某文化传媒有限公司',
    phone: '136****9012',
    agent: 'A001',
    agentName: '华东代理商',
    package: '基础版',
    features: ['media'],
    status: 'frozen',
    balance: 0,
    expireDate: '2025-05-01',
    createTime: '2025-04-01'
  },
  {
    key: '4',
    id: 'T004',
    name: '刘经理',
    company: '深圳某电子商务有限公司',
    phone: '137****3456',
    agent: 'A003',
    agentName: '西南代理商',
    package: '旗舰版',
    features: ['media', 'recruitment', 'acquisition', 'referral', 'share'],
    status: 'active',
    balance: 23000,
    expireDate: '2026-06-15',
    createTime: '2024-12-01'
  },
  {
    key: '5',
    id: 'T005',
    name: '王主管',
    company: '北京某科技有限公司',
    phone: '135****7890',
    agent: 'A002',
    agentName: '华南代理商',
    package: '专业版',
    features: ['media', 'recruitment', 'share'],
    status: 'expired',
    balance: 0,
    expireDate: '2025-04-20',
    createTime: '2025-03-20'
  }
]

// 功能列表
const allFeatures = [
  { key: 'media', name: '自媒体运营' },
  { key: 'recruitment', name: '招聘助手' },
  { key: 'acquisition', name: '智能获客' },
  { key: 'referral', name: '转介绍' },
  { key: 'share', name: '推荐分享' }
]

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editVisible, setEditVisible] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [form] = Form.useForm()

  // 筛选数据
  const filteredTenants = tenants.filter(t => {
    const matchSearch = searchText === '' || 
      t.name.includes(searchText) || 
      t.company.includes(searchText) ||
      t.phone.includes(searchText)
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    return matchSearch && matchStatus
  })

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      active: { color: 'green', text: '正常' },
      frozen: { color: 'orange', text: '已冻结' },
      expired: { color: 'red', text: '已到期' }
    }
    const item = map[status]
    return <Tag color={item.color}>{item.text}</Tag>
  }

  // 冻结/解冻
  const handleToggleStatus = (tenant: Tenant) => {
    setTenants(prev => prev.map(t => 
      t.key === tenant.key 
        ? { ...t, status: t.status === 'frozen' ? 'active' : 'frozen' }
        : t
    ))
    message.success(tenant.status === 'frozen' ? '已解冻' : '已冻结')
  }

  // 删除
  const handleDelete = (tenant: Tenant) => {
    setTenants(prev => prev.filter(t => t.key !== tenant.key))
    message.success('删除成功')
  }

  // 编辑
  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    form.setFieldsValue({
      ...tenant,
      features: tenant.features
    })
    setEditVisible(true)
  }

  // 保存编辑
  const handleSave = () => {
    form.validateFields().then(values => {
      setTenants(prev => prev.map(t => 
        t.key === selectedTenant?.key 
          ? { ...t, ...values }
          : t
      ))
      message.success('保存成功')
      setEditVisible(false)
    })
  }

  // 强制开关功能
  const handleToggleFeature = (tenant: Tenant, feature: string) => {
    const hasFeature = tenant.features.includes(feature)
    setTenants(prev => prev.map(t => 
      t.key === tenant.key 
        ? { 
            ...t, 
            features: hasFeature 
              ? t.features.filter(f => f !== feature)
              : [...t.features, feature]
          }
        : t
    ))
    message.success(hasFeature ? '已关闭功能' : '已开启功能')
  }

  const columns: ColumnsType<Tenant> = [
    {
      title: '客户',
      key: 'customer',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.company}</Text>
          </div>
        </Space>
      )
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '代理商',
      key: 'agent',
      render: (_, record) => (
        <Tag color="blue">{record.agentName}</Tag>
      )
    },
    {
      title: '套餐',
      dataIndex: 'package',
      key: 'package',
      render: (pkg: string) => {
        const color = pkg === '旗舰版' ? 'red' : pkg === '专业版' ? 'orange' : 'default'
        return <Tag color={color}>{pkg}</Tag>
      }
    },
    {
      title: '功能开关',
      key: 'features',
      render: (_, record) => (
        <Space size={4} wrap>
          {allFeatures.map(f => (
            <Switch
              key={f.key}
              size="small"
              checked={record.features.includes(f.key)}
              onChange={() => handleToggleFeature(record, f.key)}
              checkedChildren={f.name[0]}
              unCheckedChildren={f.name[0]}
            />
          ))}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: '正常', value: 'active' },
        { text: '已冻结', value: 'frozen' },
        { text: '已到期', value: 'expired' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      sorter: (a, b) => a.balance - b.balance,
      render: (balance: number) => (
        <Text strong style={{ color: '#faad14' }}>¥{balance.toLocaleString()}</Text>
      )
    },
    {
      title: '到期时间',
      dataIndex: 'expireDate',
      key: 'expireDate'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<SettingOutlined />}
            onClick={() => handleEdit(record)}
          >
            设置
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={record.status === 'frozen' ? <UnlockOutlined /> : <LockOutlined />}
            onClick={() => handleToggleStatus(record)}
            style={{ color: record.status === 'frozen' ? '#52c41a' : '#faad14' }}
          >
            {record.status === 'frozen' ? '解冻' : '冻结'}
          </Button>
          <Popconfirm
            title="确定删除该客户？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">租户管理</Title>
        <Text type="secondary">查看所有代理商和客户列表，强制开关功能、调整套餐、冻结/解冻</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Card>
            <Typography>
              <Typography.Text type="secondary">客户总数</Typography.Text>
              <Typography.Title level={2} style={{ margin: 0 }}>1,286</Typography.Title>
            </Typography>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Typography>
              <Typography.Text type="secondary">本月新增</Typography.Text>
              <Typography.Title level={2} style={{ margin: 0, color: '#52c41a' }}>89</Typography.Title>
            </Typography>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Typography>
              <Typography.Text type="secondary">活跃客户</Typography.Text>
              <Typography.Title level={2} style={{ margin: 0, color: '#1890ff' }}>1,102</Typography.Text>
            </Typography>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Typography>
              <Typography.Text type="secondary">冻结/到期</Typography.Text>
              <Typography.Title level={2} style={{ margin: 0, color: '#ff4d4f' }}>184</Typography.Title>
            </Typography>
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card className="mb-4"
        extra={
          <Space>
            <Input 
              placeholder="搜索客户/公司/手机号" 
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 240 }}
            />
            <Select 
              value={statusFilter} 
              onChange={setStatusFilter}
              style={{ width: 120 }}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">正常</Option>
              <Option value="frozen">已冻结</Option>
              <Option value="expired">已到期</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />}>新增客户</Button>
          </Space>
        }
      >
        <Table
          rowKey="key"
          columns={columns}
          dataSource={filteredTenants}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title="客户设置"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        onOk={handleSave}
        width={600}
      >
        <Form 
          form={form} 
          layout="vertical"
          initialValues={selectedTenant || undefined}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="客户名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="company" label="公司名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="package" label="套餐" rules={[{ required: true }]}>
                <Select>
                  <Option value="基础版">基础版</Option>
                  <Option value="专业版">专业版</Option>
                  <Option value="旗舰版">旗舰版</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="balance" label="余额">
                <Input type="number" prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expireDate" label="到期时间">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="features" label="功能权限">
            <Select mode="multiple" placeholder="选择开通的功能">
              {allFeatures.map(f => (
                <Option key={f.key} value={f.key}>{f.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
