'use client'

import { useState } from 'react'
import { Card, Typography, Table, Button, Space, Tag, Modal, Form, Input, Select, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title } = Typography

interface Staff {
  id: string
  name: string
  phone: string
  email: string
  role: string
  department: string
  status: 'active' | 'inactive'
  createdAt: string
}

export default function StaffManagementPage() {
  const [staff] = useState<Staff[]>([
    {
      id: '1',
      name: '王五',
      phone: '138****9012',
      email: 'wangwu@example.com',
      role: '运营专员',
      department: '运营部',
      status: 'active',
      createdAt: '2024-03-25',
    },
  ])

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '角色', dataIndex: 'role', key: 'role' },
    { title: '部门', dataIndex: 'department', key: 'department' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <Title level={2} className="mb-0">员工管理</Title>
        <Button type="primary" icon={<PlusOutlined />}>添加员工</Button>
      </div>

      <Card>
        <Table dataSource={staff} columns={columns} rowKey="id" />
      </Card>
    </div>
  )
}
