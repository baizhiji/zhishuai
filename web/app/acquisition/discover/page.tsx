'use client'

import { useState } from 'react'
import { Card, Typography, Button, Space, Table, Tag, Input, Select } from 'antd'
import { UserAddOutlined, SendOutlined, FileTextOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface PotentialCustomer {
  id: string
  name: string
  phone: string
  company: string
  industry: string
  interestLevel: 'high' | 'medium' | 'low'
  source: string
  status: 'new' | 'contacted' | 'converted' | 'lost'
  discoveredAt: string
}

export default function CustomerDiscoveryPage() {
  const [customers] = useState<PotentialCustomer[]>([
    {
      id: '1',
      name: '李四',
      phone: '139****5678',
      company: '某某科技有限公司',
      industry: '互联网',
      interestLevel: 'high',
      source: 'AI推荐',
      status: 'new',
      discoveredAt: '2024-03-25',
    },
  ])

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '公司', dataIndex: 'company', key: 'company' },
    { title: '行业', dataIndex: 'industry', key: 'industry' },
    {
      title: '意向度',
      dataIndex: 'interestLevel',
      key: 'interestLevel',
      render: (level: string) => {
        const config = { high: { color: 'success', text: '高' }, medium: { color: 'warning', text: '中' }, low: { color: 'default', text: '低' } }
        const c = config[level as keyof typeof config]
        return <Tag color={c.color}>{c.text}</Tag>
      },
    },
    { title: '来源', dataIndex: 'source', key: 'source' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag>{status}</Tag>,
    },
    { title: '发现时间', dataIndex: 'discoveredAt', key: 'discoveredAt' },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" icon={<FileTextOutlined />}>查看</Button>
          <Button type="link" icon={<SendOutlined />}>联系</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Title level={2} className="mb-2">潜客发现</Title>
      <Text type="secondary" className="mb-6 block">AI智能发现潜在客户</Text>

      <Card>
        <Table dataSource={customers} columns={columns} rowKey="id" />
      </Card>
    </div>
  )
}
