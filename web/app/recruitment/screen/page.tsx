'use client'

import { useState } from 'react'
import { Card, Row, Col, Typography, Table, Tag, Space, Button, Input, Select } from 'antd'
import { UserOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface Resume {
  id: string
  name: string
  position: string
  experience: string
  education: string
  phone: string
  email: string
  matchScore: number
  status: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'hired'
  createdAt: string
}

export default function ResumeScreenPage() {
  const [resumes] = useState<Resume[]>([
    {
      id: '1',
      name: '张三',
      position: '前端开发工程师',
      experience: '4年',
      education: '本科',
      phone: '138****1234',
      email: 'zhangsan@example.com',
      matchScore: 92,
      status: 'pending',
      createdAt: '2024-03-25',
    },
  ])

  const statusConfig = {
    pending: { text: '待处理', color: 'default' },
    reviewed: { text: '已查看', color: 'blue' },
    interview: { text: '面试中', color: 'processing' },
    rejected: { text: '已拒绝', color: 'error' },
    hired: { text: '已录用', color: 'success' },
  }

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '应聘职位', dataIndex: 'position', key: 'position' },
    { title: '工作年限', dataIndex: 'experience', key: 'experience' },
    { title: '学历', dataIndex: 'education', key: 'education' },
    {
      title: '匹配度',
      dataIndex: 'matchScore',
      key: 'matchScore',
      render: (score: number) => (
        <Tag color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'default'}>
          {score}%
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig]
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    { title: '投递时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" icon={<EyeOutlined />}>查看</Button>
          <Button type="link" icon={<CheckOutlined />}>通过</Button>
          <Button type="link" danger icon={<CloseOutlined />}>拒绝</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Title level={2} className="mb-2">简历筛选</Title>
      <Text type="secondary" className="mb-6 block">AI自动筛选和评分简历</Text>

      <Card>
        <Table dataSource={resumes} columns={columns} rowKey="id" />
      </Card>
    </div>
  )
}
