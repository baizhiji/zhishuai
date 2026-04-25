'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Message,
  Modal,
  Row,
  Col,
  Badge,
  Divider,
  Checkbox,
  Radio,
  Progress,
  Statistic,
} from 'antd'
import {
  ArrowLeftOutlined,
  SendOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  ScheduleOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography
const { TextArea } = Input

interface MessageTemplate {
  id: string
  name: string
  content: string
  platform: string
  tags: string[]
  createdAt: string
  usageCount: number
}

interface SendingRecord {
  id: string
  customerName: string
  customerUsername: string
  platform: string
  templateName: string
  status: 'pending' | 'sent' | 'failed' | 'read'
  sentAt?: string
  readAt?: string
  scheduledTime?: string
}

export default function CustomerSendPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerId = searchParams.get('customerId')
  const [form] = Form.useForm()
  const [sending, setSending] = useState(false)
  const [sendingProgress, setSendingProgress] = useState(0)

  // 消息模板
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: '1',
      name: '合作意向模板',
      content: '您好！我是[公司名称]，很欣赏您的内容，想探讨合作机会，期待回复！',
      platform: 'douyin',
      tags: ['合作', '引流'],
      createdAt: '2024-01-15 10:00:00',
      usageCount: 25,
    },
    {
      id: '2',
      name: '产品推广模板',
      content: '您好！我们有优质产品想与您合作推广，互利共赢，期待您的回复！',
      platform: 'xiaohongshu',
      tags: ['推广', '产品'],
      createdAt: '2024-01-14 15:30:00',
      usageCount: 18,
    },
    {
      id: '3',
      name: '商务洽谈模板',
      content: '您好！看到您的内容质量很高，想和您建立长期合作关系，方便的话请联系我们。',
      platform: 'bilibili',
      tags: ['商务', '长期'],
      createdAt: '2024-01-13 09:20:00',
      usageCount: 32,
    },
  ])

  // 发送记录
  const [sendingRecords, setSendingRecords] = useState<SendingRecord[]>([
    {
      id: '1',
      customerName: '科技小王子',
      customerUsername: '@techking',
      platform: 'douyin',
      templateName: '合作意向模板',
      status: 'sent',
      sentAt: '2024-01-15 10:30:00',
    },
    {
      id: '2',
      customerName: '美食日记',
      customerUsername: '@foodie_daily',
      platform: 'xiaohongshu',
      templateName: '产品推广模板',
      status: 'read',
      sentAt: '2024-01-14 14:20:00',
      readAt: '2024-01-14 15:45:00',
    },
    {
      id: '3',
      customerName: '运动达人',
      customerUsername: '@fitness_pro',
      platform: 'bilibili',
      templateName: '商务洽谈模板',
      status: 'pending',
      scheduledTime: '2024-01-20 10:00:00',
    },
  ])

  // 统计数据
  const stats = {
    total: sendingRecords.length,
    sent: sendingRecords.filter(r => r.status === 'sent').length,
    read: sendingRecords.filter(r => r.status === 'read').length,
    pending: sendingRecords.filter(r => r.status === 'pending').length,
  }

  // 平台选项
  const platforms = [
    { id: 'douyin', name: '抖音', icon: '🎵' },
    { id: 'xiaohongshu', name: '小红书', icon: '📕' },
    { id: 'bilibili', name: 'B站', icon: '📺' },
    { id: 'kuaishou', name: '快手', icon: '📹' },
    { id: 'weibo', name: '微博', icon: '📱' },
  ]

  // 模拟客户列表
  const customers = [
    { id: '1', name: '科技小王子', username: '@techking', platform: 'douyin' },
    { id: '2', name: '美食日记', username: '@foodie_daily', platform: 'xiaohongshu' },
    { id: '3', name: '运动达人', username: '@fitness_pro', platform: 'bilibili' },
  ]

  // 选择模板
  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      form.setFieldsValue({
        messageContent: template.content,
        platform: template.platform,
      })
    }
  }

  // 发送信息
  const handleSend = async (values: any) => {
    setSending(true)
    setSendingProgress(0)

    try {
      // 模拟发送进度
      const interval = setInterval(() => {
        setSendingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 20
        })
      }, 500)

      await new Promise(resolve => setTimeout(resolve, 3000))

      clearInterval(interval)
      setSendingProgress(100)

      // 添加发送记录
      const newRecord: SendingRecord = {
        id: Date.now().toString(),
        customerName: '模拟客户',
        customerUsername: '@simulated_user',
        platform: values.platform,
        templateName: '自定义消息',
        status: 'sent',
        sentAt: new Date().toLocaleString('zh-CN'),
      }

      setSendingRecords([newRecord, ...sendingRecords])
      Message.success('消息发送成功！')

      form.resetFields()
    } catch (error) {
      Message.error('发送失败，请重试')
    } finally {
      setSending(false)
      setSendingProgress(0)
    }
  }

  // 删除模板
  const handleDeleteTemplate = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个模板吗？',
      onOk: () => {
        setTemplates(templates.filter(t => t.id !== id))
        Message.success('模板已删除')
      },
    })
  }

  // 复制模板
  const handleCopyTemplate = (template: MessageTemplate) => {
    const newTemplate: MessageTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (副本)`,
      createdAt: new Date().toLocaleString('zh-CN'),
      usageCount: 0,
    }
    setTemplates([newTemplate, ...templates])
    Message.success('模板已复制')
  }

  // 保存新模板
  const handleSaveTemplate = () => {
    const content = form.getFieldValue('messageContent')
    if (!content) {
      Message.warning('请先输入消息内容')
      return
    }

    Modal.confirm({
      title: '保存为模板',
      content: (
        <Input
          placeholder="请输入模板名称"
          id="templateNameInput"
        />
      ),
      onOk: () => {
        const templateName = (document.getElementById('templateNameInput') as HTMLInputElement)?.value
        if (!templateName) {
          Message.warning('请输入模板名称')
          return false
        }

        const newTemplate: MessageTemplate = {
          id: Date.now().toString(),
          name: templateName,
          content,
          platform: form.getFieldValue('platform') || 'douyin',
          tags: [],
          createdAt: new Date().toLocaleString('zh-CN'),
          usageCount: 0,
        }

        setTemplates([newTemplate, ...templates])
        Message.success('模板已保存')
      },
    })
  }

  const statusMap: Record<string, { text: string; color: string; icon: any }> = {
    pending: { text: '待发送', color: 'default', icon: <ClockCircleOutlined /> },
    sent: { text: '已发送', color: 'processing', icon: <SendOutlined /> },
    read: { text: '已读', color: 'success', icon: <CheckCircleOutlined /> },
    failed: { text: '发送失败', color: 'error', icon: <PauseCircleOutlined /> },
  }

  const columns = [
    {
      title: '客户',
      key: 'customer',
      render: (_: any, record: SendingRecord) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.customerName}</Text>
          <Text type="secondary" className="text-sm">{record.customerUsername}</Text>
        </Space>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => {
        const p = platforms.find(p => p.id === platform)
        return (
          <Space>
            <span className="text-xl">{p?.icon}</span>
            <span>{p?.name}</span>
          </Space>
        )
      },
    },
    {
      title: '模板',
      dataIndex: 'templateName',
      key: 'templateName',
      render: (name: string) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const s = statusMap[status]
        return (
          <Tag icon={s.icon} color={s.color}>
            {s.text}
          </Tag>
        )
      },
    },
    {
      title: '发送时间',
      dataIndex: 'sentAt',
      key: 'sentAt',
      render: (date?: string) => (
        <Text className="text-sm">{date || '-'}</Text>
      ),
    },
    {
      title: '已读时间',
      dataIndex: 'readAt',
      key: 'readAt',
      render: (date?: string) => (
        <Text className="text-sm">{date || '-'}</Text>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/customer')}
          className="mb-6"
        >
          返回客户管理
        </Button>

        {/* 标题 */}
        <div className="mb-8">
          <Title level={2}>自动发送信息</Title>
          <Text type="secondary">批量发送引流信息，管理发送记录</Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总发送"
                value={stats.total}
                prefix={<SendOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="已读"
                value={stats.read}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="待发送"
                value={stats.pending}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="已发送"
                value={stats.sent}
                prefix={<PlayCircleOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          {/* 左侧：发送表单 */}
          <Col xs={24} lg={12}>
            <Card title="发送消息">
              <Form form={form} layout="vertical" onFinish={handleSend}>
                <Form.Item
                  label="选择平台"
                  name="platform"
                  rules={[{ required: true, message: '请选择平台' }]}
                >
                  <Select placeholder="请选择平台" size="large">
                    {platforms.map(platform => (
                      <Select.Option key={platform.id} value={platform.id}>
                        <Space>
                          <span>{platform.icon}</span>
                          <span>{platform.name}</span>
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="消息模板"
                  tooltip="选择已有模板，或自定义消息内容"
                >
                  <Select
                    placeholder="选择模板（可选）"
                    allowClear
                    onChange={handleSelectTemplate}
                  >
                    {templates.map(template => (
                      <Select.Option key={template.id} value={template.id}>
                        <Space>
                          <Text>{template.name}</Text>
                          <Badge count={template.usageCount} showZero size="small" />
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="消息内容"
                  name="messageContent"
                  rules={[{ required: true, message: '请输入消息内容' }]}
                >
                  <TextArea
                    rows={6}
                    placeholder="输入要发送的消息内容，支持变量：[公司名称]、[产品名称]等"
                    maxLength={500}
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  label="发送方式"
                  name="sendMode"
                  initialValue="now"
                >
                  <Radio.Group>
                    <Radio value="now">
                      <Space>
                        <PlayCircleOutlined />
                        <span>立即发送</span>
                      </Space>
                    </Radio>
                    <Radio value="scheduled">
                      <Space>
                        <ScheduleOutlined />
                        <span>定时发送</span>
                      </Space>
                    </Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  label="发送间隔"
                  name="sendInterval"
                  initialValue={60}
                  tooltip="批量发送时，每条消息之间的间隔时间（秒），避免被平台检测"
                >
                  <Input suffix="秒" type="number" min={30} max={300} />
                </Form.Item>

                {sending && (
                  <div className="mb-4">
                    <Text strong>发送进度：</Text>
                    <Progress percent={sendingProgress} status="active" />
                  </div>
                )}

                <Space className="w-full" direction="vertical">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={sending}
                    block
                    size="large"
                    icon={<SendOutlined />}
                    className="bg-gradient-to-r from-green-500 to-teal-600 border-0"
                  >
                    {sending ? '发送中...' : '发送消息'}
                  </Button>
                  <Button
                    icon={<PlusOutlined />}
                    block
                    onClick={handleSaveTemplate}
                  >
                    保存为模板
                  </Button>
                </Space>
              </Form>
            </Card>
          </Col>

          {/* 右侧：消息模板 */}
          <Col xs={24} lg={12}>
            <Card
              title="消息模板"
              extra={<Badge count={templates.length} showZero color="green" />}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {templates.map(template => (
                  <Card
                    key={template.id}
                    size="small"
                    hoverable
                    styles={{ body: { padding: '16px' } }}
                  >
                    <Space direction="vertical" size="small" className="w-full">
                      <Space className="w-full justify-between">
                        <Space>
                          <Text strong>{template.name}</Text>
                          <Badge count={template.usageCount} showZero size="small" />
                        </Space>
                        <Space>
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => handleCopyTemplate(template)}
                          >
                            复制
                          </Button>
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            删除
                          </Button>
                        </Space>
                      </Space>

                      <Text ellipsis className="text-sm">
                        {template.content}
                      </Text>

                      <Space size="small">
                        <Tag>{platforms.find(p => p.id === template.platform)?.name}</Tag>
                        {template.tags.map(tag => (
                          <Tag key={tag} color="blue" className="text-xs">{tag}</Tag>
                        ))}
                      </Space>
                    </Space>
                  </Card>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 发送记录 */}
        <Card
          title="发送记录"
          className="mt-6"
          extra={
            <Space>
              <Text type="secondary">共 {sendingRecords.length} 条记录</Text>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={sendingRecords}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            scroll={{ x: true }}
          />
        </Card>
      </div>
    </div>
  )
}
