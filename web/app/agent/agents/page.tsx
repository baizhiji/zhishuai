'use client'

import React, { useState, useMemo } from 'react'
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
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
  Descriptions,
  Statistic,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  GlobalOutlined,
  SettingOutlined,
  LockOutlined,
  UnlockOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

// 代理商类型
interface Agent {
  key: string
  id: string
  name: string
  phone: string
  customerCount: number
  commission: number
  status: 'active' | 'frozen'
  features: string[]
  createTime: string
  expireAt: string
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

// 功能列表
const allFeatures = [
  { key: 'media', name: '自媒体运营' },
  { key: 'recruitment', name: '招聘助手' },
  { key: 'acquisition', name: '智能获客' },
  { key: 'referral', name: '转介绍' },
  { key: 'share', name: '推荐分享' }
]

// Mock 数据
const mockAgents: Agent[] = [
  {
    key: '1',
    id: 'SA001',
    name: '上海区域代理',
    phone: '138****1001',
    customerCount: 156,
    commission: 15,
    status: 'active',
    features: ['media', 'recruitment', 'acquisition', 'referral', 'share'],
    createTime: '2024-06-01',
    expireAt: '2025-06-01'
  },
  {
    key: '2',
    id: 'SA002',
    name: '浦东新区代理',
    phone: '139****2002',
    customerCount: 89,
    commission: 12,
    status: 'active',
    features: ['media', 'recruitment', 'referral', 'share'],
    createTime: '2024-07-15',
    expireAt: '2025-07-15'
  },
  {
    key: '3',
    id: 'SA003',
    name: '浦西区域代理',
    phone: '137****3003',
    customerCount: 67,
    commission: 10,
    status: 'frozen',
    features: ['media', 'recruitment'],
    createTime: '2024-09-01',
    expireAt: '2025-09-01'
  },
]

export default function AgentAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents)
  const [editVisible, setEditVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [featureVisible, setFeatureVisible] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [form] = Form.useForm()
  const [featureForm] = Form.useForm()

  // 新增/编辑
  const handleEdit = (agent?: Agent) => {
    if (agent) {
      setSelectedAgent(agent)
      form.setFieldsValue(agent)
    } else {
      setSelectedAgent(null)
      form.resetFields()
    }
    setEditVisible(true)
  }

  // 保存
  const handleSave = () => {
    form.validateFields().then(values => {
      if (selectedAgent) {
        setAgents(prev => prev.map(a => 
          a.key === selectedAgent.key ? { ...a, ...values } : a
        ))
        message.success('保存成功')
      } else {
        const newAgent: Agent = {
          ...values,
          key: `SA${Date.now()}`,
          id: `SA${(agents.length + 1).toString().padStart(3, '0')}`,
          customerCount: 0,
          features: ['media'],
          createTime: dayjs().format('YYYY-MM-DD'),
        }
        setAgents(prev => [...prev, newAgent])
        message.success(`已开通代理商：${values.name}，登录账号：${values.phone}，初始密码：123456`)
      }
      setEditVisible(false)
    })
  }

  // 删除
  const handleDelete = (agent: Agent) => {
    setAgents(prev => prev.filter(a => a.key !== agent.key))
    message.success('删除成功')
  }

  // 查看详情
  const handleViewDetail = (agent: Agent) => {
    setSelectedAgent(agent)
    setDetailVisible(true)
  }

  // 冻结/解冻
  const handleToggleStatus = (agent: Agent) => {
    setAgents(prev => prev.map(a => 
      a.key === agent.key ? { ...a, status: a.status === 'active' ? 'frozen' : 'active' } : a
    ))
    message.success(`${agent.name} 已${agent.status === 'active' ? '冻结' : '解冻'}`)
  }

  // 打开功能设置
  const handleOpenFeatures = (agent: Agent) => {
    setSelectedAgent(agent)
    featureForm.setFieldsValue({
      name: agent.name,
      phone: agent.phone,
      features: agent.features
    })
    setFeatureVisible(true)
  }

  // 保存功能设置
  const handleSaveFeatures = () => {
    featureForm.validateFields().then((values) => {
      setAgents((prev) => 
        prev.map(a => a.key === selectedAgent?.key ? { ...a, features: values.features } : a)
      )
      message.success('可售卖功能已更新')
      setFeatureVisible(false)
    })
  }

  // 开通代理商
  const handleOpenCreate = () => {
    form.resetFields()
    form.setFieldsValue({
      status: 'active',
      commission: 10,
      expireMonths: 12,
    })
    setCreateVisible(true)
  }

  // 获取功能标签
  const getFeatureTags = (features: string[]) => (
    <Space size={4} wrap>
      {allFeatures.map(f => (
        <Tag 
          key={f.key} 
          color={features.includes(f.key) ? 'blue' : 'default'}
        >
          {f.name}
        </Tag>
      ))}
    </Space>
  )

  const columns: ColumnsType<Agent> = [
    {
      title: '代理商',
      key: 'agent',
      render: (_, record) => (
        <Space>
          <GlobalOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
          </div>
        </Space>
      )
    },
    {
      title: '客户数',
      dataIndex: 'customerCount',
      key: 'customerCount',
      render: (count: number) => (
        <Text strong style={{ color: '#1890ff' }}>{count}</Text>
      )
    },
    {
      title: '可售卖功能',
      dataIndex: 'features',
      key: 'features',
      render: (features: string[]) => getFeatureTags(features)
    },
    {
      title: '分成比例',
      dataIndex: 'commission',
      key: 'commission',
      render: (commission: number) => (
        <Text strong style={{ color: '#faad14' }}>{commission}%</Text>
      )
    },
    {
      title: '到期时间',
      dataIndex: 'expireAt',
      key: 'expireAt',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? '正常' : '已冻结'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
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
          <Button
            type="text"
            size="small"
            icon={<UserOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该代理商？"
            onConfirm={() => handleDelete(record)}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const stats = useMemo(() => {
    const total = agents.length
    const active = agents.filter(a => a.status === 'active').length
    const totalCustomers = agents.reduce((sum, a) => sum + a.customerCount, 0)
    return { total, active, totalCustomers }
  }, [agents])

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">代理商管理</Title>
          <Text type="secondary">管理下级区域代理，设置代理分成比例、可售卖功能范围</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
          开通代理商
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <Statistic title="代理商总数" value={stats.total} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="正常" value={stats.active} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="客户总数" value={stats.totalCustomers} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          rowKey="key"
          columns={columns}
          dataSource={agents}
          pagination={false}
        />
      </Card>

      {/* 开通代理商 */}
      <Modal
        title="开通代理商"
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setCreateVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={() => {
            form.validateFields().then(values => {
              const { expireMonths, ...rest } = values
              const expireAt = expireMonths === -1 ? '2099-12-31' : dayjs().add(expireMonths, 'month').format('YYYY-MM-DD')
              
              const newAgent: Agent = {
                ...rest,
                key: `SA${Date.now()}`,
                id: `SA${(agents.length + 1).toString().padStart(3, '0')}`,
                customerCount: 0,
                features: ['media'],
                createTime: dayjs().format('YYYY-MM-DD'),
                expireAt,
              }
              setAgents(prev => [...prev, newAgent])
              message.success(`已开通代理商：${values.name}，登录账号：${values.phone}，初始密码：123456`)
              setCreateVisible(false)
            })
          }}>确认开通</Button>
        ]}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="代理商名称" rules={[{ required: true, message: '请输入代理商名称' }]}>
                <Input placeholder="请输入代理商名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号码（登录账号）" rules={[{ required: true, message: '请输入手机号码' }]}>
                <Input placeholder="请输入手机号码" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="commission" label="分成比例(%)" rules={[{ required: true, message: '请输入分成比例' }]}>
                <Input min={0} max={100} style={{ width: '100%' }} placeholder="0-100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expireMonths" label="有效时间" rules={[{ required: true, message: '请选择有效时间' }]}>
                <Select placeholder="选择有效时间">
                  {expireOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="初始状态">
                <Select>
                  <Option value="active">正常</Option>
                  <Option value="frozen">冻结</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Card size="small" className="mt-4">
            <Text type="secondary">
              登录账号：手机号码<br />
              初始密码：123456（代理商自行修改）
            </Text>
          </Card>
        </Form>
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑代理商"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        onOk={handleSave}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="代理商名称" rules={[{ required: true, message: '请输入代理商名称' }]}>
                <Input placeholder="请输入代理商名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
                <Input placeholder="请输入手机号码" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="commission" label="分成比例(%)" rules={[{ required: true, message: '请输入分成比例' }]}>
                <Input min={0} max={100} style={{ width: '100%' }} placeholder="0-100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expireAt" label="到期时间" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  <Option value="active">正常</Option>
                  <Option value="frozen">冻结</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="代理商详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          <Button onClick={() => setDetailVisible(false)}>关闭</Button>
        }
        width={700}
      >
        {selectedAgent && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="代理商ID">{selectedAgent.id}</Descriptions.Item>
            <Descriptions.Item label="代理商名称">{selectedAgent.name}</Descriptions.Item>
            <Descriptions.Item label="手机号码">{selectedAgent.phone}</Descriptions.Item>
            <Descriptions.Item label="分成比例">{selectedAgent.commission}%</Descriptions.Item>
            <Descriptions.Item label="客户数量">{selectedAgent.customerCount}</Descriptions.Item>
            <Descriptions.Item label="到期时间">{selectedAgent.expireAt}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={selectedAgent.status === 'active' ? 'green' : 'orange'}>
                {selectedAgent.status === 'active' ? '正常' : '已冻结'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="可售卖功能" span={2}>
              {getFeatureTags(selectedAgent.features)}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{selectedAgent.createTime}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 功能权限设置弹窗 */}
      <Modal
        title="可售卖功能设置"
        open={featureVisible}
        onCancel={() => setFeatureVisible(false)}
        onOk={handleSaveFeatures}
        okText="保存"
        cancelText="取消"
        width={500}
      >
        <Form form={featureForm} layout="vertical">
          <Form.Item name="name" label="代理商名称">
            <Input disabled />
          </Form.Item>
          <Form.Item name="phone" label="手机号码">
            <Input disabled />
          </Form.Item>
          <Form.Item name="features" label="可售卖功能">
            <Select mode="multiple" placeholder="选择可售卖的功能">
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
