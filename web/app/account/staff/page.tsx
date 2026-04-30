'use client'

import { useState } from 'react'
import { Card, Typography, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm, InputNumber, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface Staff {
  id: string
  name: string
  phone: string
  email: string
  role: string
  department: string
  status: 'active' | 'inactive'
  createdAt: string
  lastLogin?: string
}

const departments = ['运营部', '销售部', '技术部', '人事部', '财务部', '市场部', '客服部']
const roles = ['超级管理员', '管理员', '运营专员', '客服专员', '财务专员', '普通员工']
const statusOptions = [
  { label: '正常', value: 'active', color: 'success' },
  { label: '禁用', value: 'inactive', color: 'default' },
]

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<Staff[]>([
    { id: '1', name: '王五', phone: '13812349012', email: 'wangwu@example.com', role: '运营专员', department: '运营部', status: 'active', createdAt: '2024-03-25', lastLogin: '2024-04-30 14:30' },
    { id: '2', name: '李明', phone: '13912345678', email: 'liming@example.com', role: '客服专员', department: '客服部', status: 'active', createdAt: '2024-02-15', lastLogin: '2024-04-30 09:15' },
    { id: '3', name: '张伟', phone: '13712349876', email: 'zhangwei@example.com', role: '管理员', department: '技术部', status: 'active', createdAt: '2024-01-10', lastLogin: '2024-04-29 18:45' },
    { id: '4', name: '赵丽', phone: '13612348765', email: 'zhaoli@example.com', role: '财务专员', department: '财务部', status: 'active', createdAt: '2024-03-01', lastLogin: '2024-04-28 16:20' },
    { id: '5', name: '孙强', phone: '13512347654', email: 'sunqiang@example.com', role: '运营专员', department: '运营部', status: 'inactive', createdAt: '2024-02-20', lastLogin: '2024-03-15 10:00' },
    { id: '6', name: '周敏', phone: '13412346543', email: 'zhoumin@example.com', role: '普通员工', department: '市场部', status: 'active', createdAt: '2024-04-05', lastLogin: '2024-04-30 11:30' },
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => <Tag color="blue">{dept}</Tag>,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colorMap: Record<string, string> = {
          '超级管理员': 'red',
          '管理员': 'orange',
          '运营专员': 'green',
          '客服专员': 'cyan',
          '财务专员': 'purple',
          '普通员工': 'default',
        }
        return <Tag color={colorMap[role] || 'default'}>{role}</Tag>
      },
    },
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
    { title: '最后登录', dataIndex: 'lastLogin', key: 'lastLogin', render: (t: string) => t || '-' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Staff) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该员工？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleAdd = () => {
    setEditingStaff(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff)
    form.setFieldsValue(staff)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setStaffList(staffList.filter(s => s.id !== id))
    message.success('删除成功')
  }

  const handleModalOk = () => {
    form.validateFields().then(values => {
      if (editingStaff) {
        // 编辑
        setStaffList(staffList.map(s => s.id === editingStaff.id ? { ...s, ...values } : s))
        message.success('编辑成功')
      } else {
        // 新增
        const newStaff: Staff = {
          id: Date.now().toString(),
          ...values,
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
        }
        setStaffList([newStaff, ...staffList])
        message.success('添加成功')
      }
      setIsModalOpen(false)
    })
  }

  // 筛选数据
  const filteredData = staffList.filter(item => {
    const matchSearch = !searchText || 
      item.name.includes(searchText) || 
      item.phone.includes(searchText) || 
      item.email.includes(searchText)
    const matchDept = !departmentFilter || item.department === departmentFilter
    const matchStatus = !statusFilter || item.status === statusFilter
    return matchSearch && matchDept && matchStatus
  })

  // 统计信息
  const stats = {
    total: staffList.length,
    active: staffList.filter(s => s.status === 'active').length,
    inactive: staffList.filter(s => s.status === 'inactive').length,
  }

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">员工管理</Title>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card size="small">
            <Space>
              <TeamOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <div>
                <div><Text type="secondary">员工总数</Text></div>
                <Text strong style={{ fontSize: '20px' }}>{stats.total}</Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Space>
              <Tag color="success">正常</Tag>
              <div>
                <div><Text type="secondary">在职</Text></div>
                <Text strong style={{ fontSize: '20px' }}>{stats.active}</Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Space>
              <Tag color="default">禁用</Tag>
              <div>
                <div><Text type="secondary">禁用</Text></div>
                <Text strong style={{ fontSize: '20px' }}>{stats.inactive}</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card className="mb-6">
        <Space wrap className="mb-4">
          <Input 
            placeholder="搜索姓名/手机/邮箱" 
            prefix={<SearchOutlined />} 
            style={{ width: 200 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <Select 
            placeholder="选择部门" 
            style={{ width: 120 }} 
            allowClear
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={departments.map(d => ({ label: d, value: d }))}
          />
          <Select 
            placeholder="选择状态" 
            style={{ width: 100 }} 
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
        </Space>
        <div className="flex justify-end">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加员工
          </Button>
        </div>
      </Card>

      {/* 表格 */}
      <Card>
        <Table 
          dataSource={filteredData} 
          columns={columns} 
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      {/* 添加/编辑 Modal */}
      <Modal
        title={editingStaff ? '编辑员工' : '添加员工'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
                <Input placeholder="请输入手机号" maxLength={11} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email', message: '请输入正确的邮箱' }]}>
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="部门" name="department" rules={[{ required: true, message: '请选择部门' }]}>
                <Select placeholder="请选择部门" options={departments.map(d => ({ label: d, value: d }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
                <Select placeholder="请选择角色" options={roles.map(r => ({ label: r, value: r }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="状态" name="status" initialValue="active">
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>
          {!editingStaff && (
            <Text type="secondary">初始密码默认为：123456</Text>
          )}
        </Form>
      </Modal>
    </div>
  )
}
