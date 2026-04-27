'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Avatar,
  Badge,
  Divider,
  Switch,
} from 'antd'
import {
  ArrowLeftOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

interface User {
  id: string
  username: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'active' | 'inactive' | 'locked'
  lastLogin?: string
  createdAt: string
}

export default function UsersPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // 用户列表
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      name: '系统管理员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-16 10:30:00',
      createdAt: '2024-01-01 09:00:00',
    },
    {
      id: '2',
      username: 'editor1',
      email: 'editor1@example.com',
      name: '内容编辑',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=editor1',
      role: 'editor',
      status: 'active',
      lastLogin: '2024-01-16 09:15:00',
      createdAt: '2024-01-05 14:20:00',
    },
    {
      id: '3',
      username: 'viewer1',
      email: 'viewer1@example.com',
      name: '访客用户',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer1',
      role: 'viewer',
      status: 'active',
      lastLogin: '2024-01-15 18:00:00',
      createdAt: '2024-01-10 11:00:00',
    },
    {
      id: '4',
      username: 'editor2',
      email: 'editor2@example.com',
      name: '内容编辑2',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=editor2',
      role: 'editor',
      status: 'inactive',
      lastLogin: '2024-01-12 12:00:00',
      createdAt: '2024-01-14 10:00:00',
    },
  ])

  // 角色选项
  const roles = [
    { id: 'admin', name: '管理员', color: 'red', description: '拥有所有权限' },
    { id: 'editor', name: '编辑', color: 'blue', description: '可以编辑内容' },
    { id: 'viewer', name: '访客', color: 'default', description: '只能查看' },
  ]

  // 统计数据
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    adminCount: users.filter(u => u.role === 'admin').length,
    editorCount: users.filter(u => u.role === 'editor').length,
  }

  // 添加用户
  const handleAddUser = async (values: any) => {
    try {
      const newUser: User = {
        id: Date.now().toString(),
        username: values.username,
        email: values.email,
        name: values.name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values.username}`,
        role: values.role,
        status: 'active',
        createdAt: new Date().toLocaleString('zh-CN'),
      }

      setUsers([newUser, ...users])
      Message.success('用户添加成功！')
      setAddModalVisible(false)
      form.resetFields()
    } catch (error) {
      Message.error('添加失败，请重试')
    }
  }

  // 编辑用户
  const handleEditUser = async (values: any) => {
    try {
      if (!selectedUser) return

      setUsers(users.map(u =>
        u.id === selectedUser.id
          ? { ...u, ...values }
          : u
      ))

      Message.success('用户更新成功！')
      setEditModalVisible(false)
      setSelectedUser(null)
      form.resetFields()
    } catch (error) {
      Message.error('更新失败，请重试')
    }
  }

  // 删除用户
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个用户吗？',
      onOk: () => {
        setUsers(users.filter(u => u.id !== id))
        Message.success('用户已删除')
      },
    })
  }

  // 切换状态
  const handleToggleStatus = (id: string) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const newStatus = u.status === 'active' ? 'inactive' : 'active'
        Message.success(u.status === 'active' ? '用户已停用' : '用户已启用')
        return { ...u, status: newStatus as 'active' | 'inactive' | 'locked' }
      }
      return u
    }))
  }

  // 重置密码
  const handleResetPassword = (username: string) => {
    Modal.confirm({
      title: '重置密码',
      content: `确定要重置用户 ${username} 的密码吗？`,
      onOk: () => {
        Message.success('密码已重置，新密码已发送至用户邮箱')
      },
    })
  }

  // 打开编辑弹窗
  const openEditModal = (user: User) => {
    setSelectedUser(user)
    form.setFieldsValue(user)
    setEditModalVisible(true)
  }

  const statusMap: Record<string, { text: string; color: string; icon: any }> = {
    active: { text: '正常', color: 'success', icon: <CheckCircleOutlined /> },
    inactive: { text: '停用', color: 'default', icon: <CloseCircleOutlined /> },
    locked: { text: '锁定', color: 'error', icon: <LockOutlined /> },
  }

  const columns = [
    {
      title: '用户信息',
      key: 'user',
      render: (_: any, record: User) => (
        <Space>
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            size={40}
          />
          <Space direction="vertical" size={0}>
            <Text strong>{record.name}</Text>
            <Text type="secondary" className="text-sm">@{record.username}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => <Text>{email}</Text>,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const r = roles.find(r => r.id === role)
        return (
          <Tag color={r?.color}>
            {r?.name}
          </Tag>
        )
      },
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
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (date?: string) => <Text className="text-sm">{date || '从未登录'}</Text>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => <Text className="text-sm">{date.split(' ')[0]}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<UnlockOutlined />}
            onClick={() => handleResetPassword(record.username)}
          >
            重置密码
          </Button>
          {record.role !== 'admin' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/system')}
          className="mb-6"
        >
          返回系统设置
        </Button>

        {/* 标题 */}
        <div className="mb-8">
          <Title level={2}>用户管理</Title>
          <Text type="secondary">管理系统用户、角色权限和访问控制</Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={6}>
            <Card>
              <Row gutter={8}>
                <Col span={16}>
                  <div className="text-gray-500 text-sm">总用户数</div>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </Col>
                <Col span={8} className="flex items-center justify-center">
                  <Avatar icon={<UserOutlined />} size={40} className="bg-blue-100" />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Row gutter={8}>
                <Col span={16}>
                  <div className="text-gray-500 text-sm">活跃用户</div>
                  <div className="text-2xl font-bold text-green-500">{stats.activeUsers}</div>
                </Col>
                <Col span={8} className="flex items-center justify-center">
                  <Avatar icon={<CheckCircleOutlined />} size={40} className="bg-green-100" />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Row gutter={8}>
                <Col span={16}>
                  <div className="text-gray-500 text-sm">管理员</div>
                  <div className="text-2xl font-bold text-red-500">{stats.adminCount}</div>
                </Col>
                <Col span={8} className="flex items-center justify-center">
                  <Avatar icon={<LockOutlined />} size={40} className="bg-red-100" />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Row gutter={8}>
                <Col span={16}>
                  <div className="text-gray-500 text-sm">编辑用户</div>
                  <div className="text-2xl font-bold text-blue-500">{stats.editorCount}</div>
                </Col>
                <Col span={8} className="flex items-center justify-center">
                  <Avatar icon={<EditOutlined />} size={40} className="bg-blue-100" />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* 角色说明 */}
        <Card className="mb-6">
          <Title level={5}>角色说明</Title>
          <Row gutter={[16, 16]}>
            {roles.map(role => (
              <Col xs={24} sm={8} key={role.id}>
                <Card size="small" className="h-full">
                  <Space direction="vertical" size="small" className="w-full">
                    <Space>
                      <Tag color={role.color}>{role.name}</Tag>
                      <Text type="secondary">{stats[role.id === 'admin' ? 'adminCount' : role.id === 'editor' ? 'editorCount' : 'totalUsers']} 用户</Text>
                    </Space>
                    <Text type="secondary">{role.description}</Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* 用户列表 */}
        <Card
          title="用户列表"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
            >
              添加用户
            </Button>
          }
        >
          <div className="mb-4">
            <Input
              placeholder="搜索用户名、邮箱或姓名"
              prefix={<SearchOutlined />}
              allowClear
            />
          </div>
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            scroll={{ x: true }}
          />
        </Card>

        {/* 添加用户弹窗 */}
        <Modal
          title="添加用户"
          open={addModalVisible}
          onCancel={() => setAddModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleAddUser}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="用户名"
                  name="username"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input placeholder="请输入用户名" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="姓名"
                  name="name"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input placeholder="请输入姓名" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>

            <Form.Item
              label="角色"
              name="role"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select placeholder="请选择角色">
                {roles.map(role => (
                  <Select.Option key={role.id} value={role.id}>
                    <Space>
                      <Tag color={role.color}>{role.name}</Tag>
                      <Text type="secondary">{role.description}</Text>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                添加用户
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* 编辑用户弹窗 */}
        <Modal
          title="编辑用户"
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false)
            setSelectedUser(null)
            form.resetFields()
          }}
          footer={null}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleEditUser}>
            <Form.Item
              label="姓名"
              name="name"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>

            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item
              label="角色"
              name="role"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select placeholder="请选择角色">
                {roles.map(role => (
                  <Select.Option key={role.id} value={role.id}>
                    <Space>
                      <Tag color={role.color}>{role.name}</Tag>
                      <Text type="secondary">{role.description}</Text>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                <Select.Option value="active">正常</Select.Option>
                <Select.Option value="inactive">停用</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  )
}
