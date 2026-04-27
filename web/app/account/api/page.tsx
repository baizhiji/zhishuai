'use client'

import { Card, Typography, Table, Tag, Button, Space, Form, Input, Select, Switch } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'

const { Title } = Typography

interface APIProvider {
  id: string
  name: string
  type: string
  apiKey: string
  status: 'active' | 'inactive'
  lastUsed: string
}

export default function APIConfigPage() {
  const providers: APIProvider[] = [
    {
      id: '1',
      name: '阿里云百炼',
      type: 'LLM',
      apiKey: 'sk-****************',
      status: 'active',
      lastUsed: '2024-03-25 10:30',
    },
    {
      id: '2',
      name: '火山引擎',
      type: 'Image',
      apiKey: 'sk-****************',
      status: 'active',
      lastUsed: '2024-03-24 15:20',
    },
  ]

  const columns = [
    { title: '服务商名称', dataIndex: 'name', key: 'name' },
    { title: '服务类型', dataIndex: 'type', key: 'type' },
    { title: 'API Key', dataIndex: 'apiKey', key: 'apiKey' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    { title: '最后使用', dataIndex: 'lastUsed', key: 'lastUsed' },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" icon={<EditOutlined />}>编辑</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <Title level={2} className="mb-0">API服务商配置</Title>
        <Button type="primary" icon={<PlusOutlined />}>添加服务商</Button>
      </div>

      <Card>
        <Table dataSource={providers} columns={columns} rowKey="id" />
      </Card>
    </div>
  )
}
