'use client'

import { Card, Typography, Table, Button, Space, Input, Tag } from 'antd'
import { PlusOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function KnowledgeBasePage() {
  const columns = [
    { title: '知识库名称', dataIndex: 'name', key: 'name' },
    { title: '文档数量', dataIndex: 'docCount', key: 'docCount' },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={status === 'active' ? 'success' : 'default'}>{status === 'active' ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" icon={<EyeOutlined />}>查看</Button>
          <Button type="link" icon={<DeleteOutlined />} danger>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <Title level={2} className="mb-0">知识库管理</Title>
        <Button type="primary" icon={<PlusOutlined />}>创建知识库</Button>
      </div>

      <Card>
        <Table
          dataSource={[
            { name: '产品介绍', docCount: 12, updatedAt: '2024-03-25', status: 'active' },
          ]}
          columns={columns}
          rowKey="name"
        />
      </Card>
    </div>
  )
}
