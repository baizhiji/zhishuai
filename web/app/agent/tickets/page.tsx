'use client'

import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  Timeline,
  Avatar,
  Popconfirm
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  MessageOutlined,
  UserOutlined,
  FileTextOutlined,
  MailOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text, TextArea } = Typography
const { Option } = Select
const { TabPane } = Tabs

// 工单类型
interface Ticket {
  key: string
  id: string
  title: string
  type: string
  customer: string
  company: string
  status: 'pending' | 'approved' | 'rejected'
  priority: 'low' | 'medium' | 'high'
  createTime: string
  updateTime: string
  description: string
}

// Mock 数据
const mockTickets: Ticket[] = [
  {
    key: '1',
    id: 'T202504001',
    title: '申请开通数字人仓库功能',
    type: 'feature',
    customer: '张经理',
    company: '上海某科技有限公司',
    status: 'pending',
    priority: 'medium',
    createTime: '2025-04-29 10:30',
    updateTime: '2025-04-29 10:30',
    description: '公司业务扩展，需要使用数字人视频功能来制作产品宣传视频，请尽快开通。'
  },
  {
    key: '2',
    id: 'T202504002',
    title: '申请开通智能获客功能',
    type: 'feature',
    customer: '王主管',
    company: '北京某文化传媒',
    status: 'pending',
    priority: 'high',
    createTime: '2025-04-29 09:15',
    updateTime: '2025-04-29 09:15',
    description: '需要拓展客户渠道，申请开通智能获客模块，包括潜客发现和引流任务功能。'
  },
  {
    key: '3',
    id: 'T202503015',
    title: '申请开通简历筛选功能',
    type: 'feature',
    customer: '李总监',
    company: '杭州某网络公司',
    status: 'approved',
    priority: 'medium',
    createTime: '2025-04-25 14:20',
    updateTime: '2025-04-26 09:30',
    description: '公司正在大量招聘，需要使用AI简历筛选功能提高招聘效率。'
  },
  {
    key: '4',
    id: 'T202503012',
    title: '申请增加API调用额度',
    type: 'quota',
    customer: '陈总',
    company: '广州某信息科技',
    status: 'approved',
    priority: 'high',
    createTime: '2025-04-22 16:45',
    updateTime: '2025-04-23 10:15',
    description: '当前API额度不足，申请将API调用额度从10万次提升到30万次/月。'
  },
  {
    key: '5',
    id: 'T202503008',
    title: '申请开通面试管理功能',
    type: 'feature',
    customer: '刘经理',
    company: '深圳某电商公司',
    status: 'rejected',
    priority: 'low',
    createTime: '2025-04-20 11:00',
    updateTime: '2025-04-21 15:30',
    description: '希望开通面试管理功能来管理招聘流程。'
  }
]

// Mock 工单处理记录
const mockTicketHistory = [
  { time: '2025-04-29 10:30', action: '提交申请', operator: '张经理' },
  { time: '2025-04-29 14:20', action: '查看详情', operator: '代理商' },
  { time: '2025-04-29 16:45', action: '添加备注：需要确认公司资质', operator: '代理商' }
]

export default function TicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const [activeTab, setActiveTab] = useState<string>('pending')
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [form] = Form.useForm()

  // 统计数据
  const stats = {
    pending: tickets.filter(t => t.status === 'pending').length,
    approved: tickets.filter(t => t.status === 'approved').length,
    rejected: tickets.filter(t => t.status === 'rejected').length
  }

  // 筛选工单
  const filteredTickets = activeTab === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === activeTab)

  // 查看详情
  const handleViewDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setDetailVisible(true)
  }

  // 审批通过
  const handleApprove = (ticket: Ticket) => {
    setTickets(prev => prev.map(t => 
      t.key === ticket.key 
        ? { ...t, status: 'approved', updateTime: new Date().toLocaleString() }
        : t
    ))
    message.success(`已通过申请：${ticket.title}`)
    setDetailVisible(false)
  }

  // 审批拒绝
  const handleReject = (ticket: Ticket, reason: string) => {
    setTickets(prev => prev.map(t => 
      t.key === ticket.key 
        ? { ...t, status: 'rejected', updateTime: new Date().toLocaleString() }
        : t
    ))
    message.info(`已拒绝申请：${ticket.title}`)
    setDetailVisible(false)
  }

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      pending: { color: 'orange', text: '待处理', icon: <ClockCircleOutlined /> },
      approved: { color: 'green', text: '已通过', icon: <CheckCircleOutlined /> },
      rejected: { color: 'red', text: '已拒绝', icon: <CloseCircleOutlined /> }
    }
    const item = map[status]
    return <Tag color={item.color} icon={item.icon}>{item.text}</Tag>
  }

  // 获取类型标签
  const getTypeTag = (type: string) => {
    const map: Record<string, { color: string; text: string }> = {
      feature: { color: 'blue', text: '功能申请' },
      quota: { color: 'purple', text: '额度申请' },
      tech: { color: 'cyan', text: '技术支持' }
    }
    const item = map[type]
    return <Tag color={item.color}>{item.text}</Tag>
  }

  // 获取优先级标签
  const getPriorityTag = (priority: string) => {
    const map: Record<string, { color: string; text: string }> = {
      low: { color: 'default', text: '低' },
      medium: { color: 'orange', text: '中' },
      high: { color: 'red', text: '高' }
    }
    const item = map[priority]
    return <Tag color={item.color}>{item.text}</Tag>
  }

  const columns: ColumnsType<Ticket> = [
    {
      title: '工单编号',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text code>{id}</Text>
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Ticket) => (
        <div>
          <div style={{ fontWeight: 500 }}>{title}</div>
          <Space size={4} className="mt-1">
            {getTypeTag(record.type)}
            {getPriorityTag(record.priority)}
          </Space>
        </div>
      )
    },
    {
      title: '申请人',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.customer}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.company}</Text>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: '待处理', value: 'pending' },
        { text: '已通过', value: 'approved' },
        { text: '已拒绝', value: 'rejected' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          {record.status === 'pending' && (
            <>
              <Button 
                type="link" 
                size="small" 
                onClick={() => handleApprove(record)}
                style={{ color: '#52c41a' }}
              >
                通过
              </Button>
              <Button 
                type="link" 
                size="small" 
                onClick={() => handleReject(record, '')}
                style={{ color: '#ff4d4f' }}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">工单/申请处理</Title>
        <Text type="secondary">接收客户的功能开通申请，审批通过或拒绝</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Card>
            <Statistic 
              title="待处理" 
              value={stats.pending} 
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="已通过" 
              value={stats.approved} 
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="已拒绝" 
              value={stats.rejected} 
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 工单列表 */}
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            { key: 'pending', label: `待处理 (${stats.pending})` },
            { key: 'approved', label: `已通过 (${stats.approved})` },
            { key: 'rejected', label: `已拒绝 (${stats.rejected})` },
            { key: 'all', label: '全部' }
          ]}
        />
        <Table
          rowKey="key"
          columns={columns}
          dataSource={filteredTickets}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="工单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          selectedTicket?.status === 'pending' ? (
            <Space>
              <Button onClick={() => setDetailVisible(false)}>取消</Button>
              <Button 
                danger 
                onClick={() => {
                  form.validateFields().then(values => {
                    handleReject(selectedTicket, values.reason)
                  })
                }}
              >
                拒绝
              </Button>
              <Button 
                type="primary" 
                onClick={() => handleApprove(selectedTicket)}
              >
                通过
              </Button>
            </Space>
          ) : (
            <Button onClick={() => setDetailVisible(false)}>关闭</Button>
          )
        }
        width={700}
      >
        {selectedTicket && (
          <div>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="工单编号">
                    <Text code>{selectedTicket.id}</Text>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="状态">
                    {getStatusTag(selectedTicket.status)}
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="标题">
                <Text strong>{selectedTicket.title}</Text>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="申请人">
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      {selectedTicket.customer}
                    </Space>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="公司">
                    <Text>{selectedTicket.company}</Text>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="申请类型">
                    {getTypeTag(selectedTicket.type)}
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="优先级">
                    {getPriorityTag(selectedTicket.priority)}
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="申请说明">
                <div style={{ 
                  padding: 12, 
                  background: '#f5f5f5', 
                  borderRadius: 4 
                }}>
                  {selectedTicket.description}
                </div>
              </Form.Item>

              {selectedTicket.status === 'pending' && (
                <Form.Item 
                  name="reason" 
                  label="拒绝原因（拒绝时必填）"
                >
                  <Input.TextArea rows={3} placeholder="请输入拒绝原因" />
                </Form.Item>
              )}
            </Form>

            {/* 处理历史 */}
            {selectedTicket.status !== 'pending' && (
              <div className="mt-4">
                <Title level={5}>处理历史</Title>
                <Timeline
                  items={mockTicketHistory.map(item => ({
                    color: item.action.includes('通过') ? 'green' : 
                           item.action.includes('拒绝') ? 'red' : 'blue',
                    children: (
                      <div>
                        <Text strong>{item.action}</Text>
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.operator} · {item.time}
                          </Text>
                        </div>
                      </div>
                    )
                  }))}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
