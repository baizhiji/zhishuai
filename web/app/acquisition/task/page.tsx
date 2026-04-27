'use client'

import { useState } from 'react'
import { Card, Typography, Button, Space, Table, Tag, Form, Input, Select, Modal, message } from 'antd'
import { PlusOutlined, SendOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface Task {
  id: string
  name: string
  type: 'content' | 'activity' | 'promotion'
  platform: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  targetAudience: string
  createdAt: string
}

export default function AcquisitionTaskPage() {
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      name: '新品推广活动',
      type: 'promotion',
      platform: 'douyin',
      status: 'running',
      targetAudience: '25-35岁白领',
      createdAt: '2024-03-25',
    },
  ])

  const columns = [
    { title: '任务名称', dataIndex: 'name', key: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const config = { content: { label: '内容引流', color: 'blue' }, activity: { label: '活动引流', color: 'green' }, promotion: { label: '推广引流', color: 'purple' } }
        const c = config[type as keyof typeof config]
        return <Tag color={c.color}>{c.label}</Tag>
      },
    },
    { title: '平台', dataIndex: 'platform', key: 'platform' },
    { title: '目标人群', dataIndex: 'targetAudience', key: 'targetAudience' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = { draft: { label: '草稿', color: 'default' }, running: { label: '运行中', color: 'success' }, paused: { label: '已暂停', color: 'warning' }, completed: { label: '已完成', color: 'default' } }
        const c = config[status as keyof typeof config]
        return <Tag color={c.color}>{c.label}</Tag>
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link">查看</Button>
          <Button type="link">暂停</Button>
          <Button type="link" danger>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">引流任务</Title>
          <Text type="secondary">创建和管理获客引流任务</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />}>创建任务</Button>
      </div>

      <Card>
        <Table dataSource={tasks} columns={columns} rowKey="id" />
      </Card>
    </div>
  )
}
