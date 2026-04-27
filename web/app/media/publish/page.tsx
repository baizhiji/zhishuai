'use client'

import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Table,
  Tag,
  Select,
  message,
  Modal,
  Checkbox,
  Input,
  Form,
  Image,
} from 'antd'
import {
  SendOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

interface PublishTask {
  id: string
  type: string
  title: string
  content: string
  thumbnail?: string
  platforms: string[]
  scheduledTime?: string
  status: 'pending' | 'scheduled' | 'published' | 'failed'
  createdAt: string
}

export default function PublishCenterPage() {
  const [tasks, setTasks] = useState<PublishTask[]>([
    {
      id: '1',
      type: 'text',
      title: '抖音文案 - AI智能生成',
      content: '这是一段关于AI技术的抖音文案...',
      platforms: ['douyin', 'xiaohongshu'],
      status: 'published',
      createdAt: '2024-03-25 10:30:00',
    },
    {
      id: '2',
      type: 'image',
      title: '产品宣传图',
      content: '生成的产品宣传图片',
      thumbnail: '/placeholder-image.jpg',
      platforms: ['weixin'],
      scheduledTime: '2024-03-26 12:00:00',
      status: 'scheduled',
      createdAt: '2024-03-25 09:00:00',
    },
  ])

  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false)
  const [form] = Form.useForm()

  const platformOptions = [
    { label: '抖音', value: 'douyin' },
    { label: '快手', value: 'kuaishou' },
    { label: '小红书', value: 'xiaohongshu' },
    { label: '视频号', value: 'weixin' },
    { label: 'B站', value: 'bilibili' },
  ]

  const platformLabel: Record<string, string> = {
    douyin: '抖音',
    kuaishou: '快手',
    xiaohongshu: '小红书',
    weixin: '视频号',
    bilibili: 'B站',
  }

  const statusConfig = {
    pending: { text: '待发布', color: 'default' },
    scheduled: { text: '已定时', color: 'processing' },
    published: { text: '已发布', color: 'success' },
    failed: { text: '失败', color: 'error' },
  }

  const typeConfig = {
    text: { label: '文本', color: 'blue' },
    image: { label: '图片', color: 'green' },
    video: { label: '视频', color: 'purple' },
    'digital-human': { label: '数字人', color: 'orange' },
  }

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => {
        const config = typeConfig[type as keyof typeof typeConfig]
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '发布平台',
      dataIndex: 'platforms',
      key: 'platforms',
      render: (platforms: string[]) => (
        <Space size={4}>
          {platforms.map((p) => (
            <Tag key={p}>{platformLabel[p]}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '定时发布',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      render: (time: string) => (time ? time : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig]
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: PublishTask) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => message.success('查看详情')}
          >
            查看
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              icon={<SendOutlined />}
              onClick={() => message.success('发布成功')}
            >
              发布
            </Button>
          )}
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: '确定要删除这个任务吗？',
                onOk: () => {
                  setTasks(tasks.filter(t => t.id !== record.id))
                  message.success('删除成功')
                },
              })
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const handleBatchPublish = () => {
    message.success('批量发布功能开发中')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">发布中心</Title>
        <Text type="secondary">
          从素材库选择内容，一键发布到多个平台
        </Text>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {tasks.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-gray-600 text-sm">待发布</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">
                {tasks.filter(t => t.status === 'scheduled').length}
              </div>
              <div className="text-gray-600 text-sm">定时任务</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {tasks.filter(t => t.status === 'published').length}
              </div>
              <div className="text-gray-600 text-sm">已发布</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {tasks.filter(t => t.status === 'failed').length}
              </div>
              <div className="text-gray-600 text-sm">发布失败</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title="发布任务"
        extra={
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => message.success('从素材库选择')}>
              从素材库选择
            </Button>
            <Button type="primary" icon={<SendOutlined />} onClick={handleBatchPublish}>
              批量发布
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={tasks}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>
    </div>
  )
}
