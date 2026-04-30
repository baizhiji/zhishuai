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
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Descriptions
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  GlobalOutlined,
  AreaChartOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { Option } = Select

// 代理商类型
interface Agent {
  key: string
  id: string
  name: string
  region: string
  phone: string
  email: string
  customerCount: number
  commission: number
  status: 'active' | 'frozen'
  features: string[]
  createTime: string
}

// Mock 数据
const mockAgents: Agent[] = [
  {
    key: '1',
    id: 'A001',
    name: '华东代理商',
    region: '华东地区',
    phone: '138****1001',
    email: 'huadong@example.com',
    customerCount: 456,
    commission: 15,
    status: 'active',
    features: ['media', 'recruitment', 'acquisition', 'referral', 'share'],
    createTime: '2024-06-01'
  },
  {
    key: '2',
    id: 'A002',
    name: '华南代理商',
    region: '华南地区',
    phone: '139****2002',
    email: 'huanan@example.com',
    customerCount: 389,
    commission: 12,
    status: 'active',
    features: ['media', 'recruitment', 'referral', 'share'],
    createTime: '2024-07-15'
  },
  {
    key: '3',
    id: 'A003',
    name: '西南代理商',
    region: '西南地区',
    phone: '137****3003',
    email: 'xinan@example.com',
    customerCount: 215,
    commission: 10,
    status: 'active',
    features: ['media', 'recruitment'],
    createTime: '2024-09-01'
  },
  {
    key: '4',
    id: 'A004',
    name: '华北代理商',
    region: '华北地区',
    phone: '136****4004',
    email: 'huabei@example.com',
    customerCount: 178,
    commission: 12,
    status: 'frozen',
    features: ['media', 'recruitment', 'acquisition'],
    createTime: '2024-10-20'
  },
  {
    key: '5',
    id: 'A005',
    name: '西北代理商',
    region: '西北地区',
    phone: '135****5005',
    email: 'xibei@example.com',
    customerCount: 98,
    commission: 15,
    status: 'active',
    features: ['media', 'recruitment', 'referral'],
    createTime: '2024-12-01'
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

export default function AgentManagement() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents)
  const [editVisible, setEditVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [form] = Form.useForm()

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
          key: `A${Date.now()}`,
          id: `A${agents.length + 1}`.padStart(4, '0'),
          createTime: new Date().toISOString().split('T')[0]
        }
        setAgents(prev => [...prev, newAgent])
        message.success('新增成功')
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
            <Text type="secondary" style={{ fontSize: 12 }}>{record.id}</Text>
          </div>
        </Space>
      )
    },
    {
      title: '负责区域',
      dataIndex: 'region',
      key: 'region',
      render: (region: string) => <Tag icon={<AreaChartOutlined />}>{region}</Tag>
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div>{record.phone}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
        </div>
      )
    },
    {
      title: '客户数',
      dataIndex: 'customerCount',
      key: 'customerCount',
      sorter: (a, b) => a.customerCount - b.customerCount,
      render: (count: number) => (
        <Text strong style={{ color: '#1890ff' }}>{count}</Text>
      )
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
      title: '可售卖功能',
      dataIndex: 'features',
      key: 'features',
      render: (features: string[]) => getFeatureTags(features)
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
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<UserOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button 
            type="link" 
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
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
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
        <Title level={2} className="mb-2">代理商管理</Title>
        <Text type="secondary">创建/冻结区域代理账号，设置代理分成比例、可售卖功能范围</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Card>
            <Typography>
              <Typography.Text type="secondary">代理商总数</Typography.Text>
              <Typography.Title level={2} style={{ margin: 0 }}>{agents.length}</Typography.Title>
            </Typography>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Typography>
              <Typography.Text type="secondary">客户总数</Typography.Text>
              <Typography.Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                {agents.reduce((sum, a) => sum + a.customerCount, 0)}
              </Typography.Title>
            </Typography>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Typography>
              <Typography.Text type="secondary">本月新增</Typography.Text>
              <Typography.Title level={2} style={{ margin: 0, color: '#52c41a' }}>12</Typography.Title>
            </Typography>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Typography>
              <Typography.Text type="secondary">冻结中</Typography.Text>
              <Typography.Title level={2} style={{ margin: 0, color: '#ff4d4f' }}>
                {agents.filter(a => a.status === 'frozen').length}
              </Typography.Title>
            </Typography>
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card 
        className="mb-4"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => handleEdit()}
          >
            新增代理商
          </Button>
        }
      >
        <Table
          rowKey="key"
          columns={columns}
          dataSource={agents}
          pagination={false}
        />
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title={selectedAgent ? '编辑代理商' : '新增代理商'}
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        onOk={handleSave}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="代理商名称" rules={[{ required: true }]}>
                <Input placeholder="如：华东代理商" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="region" label="负责区域" rules={[{ required: true }]}>
                <Select placeholder="选择区域">
                  <Option value="华东地区">华东地区</Option>
                  <Option value="华南地区">华南地区</Option>
                  <Option value="华北地区">华北地区</Option>
                  <Option value="西南地区">西南地区</Option>
                  <Option value="西北地区">西北地区</Option>
                  <Option value="东北地区">东北地区</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="联系电话" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱" rules={[{ type: 'email' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="commission" label="分成比例(%)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  <Option value="active">正常</Option>
                  <Option value="frozen">冻结</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="features" label="可售卖功能">
            <Select mode="multiple" placeholder="选择可售卖的功能">
              {allFeatures.map(f => (
                <Option key={f.key} value={f.key}>{f.name}</Option>
              ))}
            </Select>
          </Form.Item>
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
            <Descriptions.Item label="负责区域">{selectedAgent.region}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selectedAgent.phone}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{selectedAgent.email}</Descriptions.Item>
            <Descriptions.Item label="分成比例">{selectedAgent.commission}%</Descriptions.Item>
            <Descriptions.Item label="客户数量">{selectedAgent.customerCount}</Descriptions.Item>
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
    </div>
  )
}
