'use client'

import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Modal,
  Form,
  Upload,
  Select,
  message,
  Popconfirm,
  Descriptions,
  Divider,
  Badge,
  Statistic,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  MobileOutlined,
  AppstoreOutlined,
  UserOutlined,
  GlobalOutlined,
  UnlockOutlined,
  LockOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

// 贴牌商类型
interface BrandingTenant {
  key: string
  id: string
  name: string
  appName: string
  logo: string
  welcomeText: string
  companyName: string
  status: 'active' | 'frozen'
  agentCount: number
  customerCount: number
  createTime: string
}

// 代理商/终端用户类型（属于贴牌商）
interface SubUser {
  key: string
  id: string
  name: string
  phone: string
  type: 'agent' | 'customer'
  status: 'active' | 'frozen'
  createTime: string
}

// Mock 贴牌商数据
const mockBrandingTenants: BrandingTenant[] = [
  {
    key: '1',
    id: 'B001',
    name: '智创科技',
    appName: '智创AI助手',
    logo: '',
    welcomeText: '欢迎使用智创AI助手',
    companyName: '智创科技有限公司',
    status: 'active',
    agentCount: 5,
    customerCount: 128,
    createTime: '2024-01-15'
  },
  {
    key: '2',
    id: 'B002',
    name: '云智互联',
    appName: '云智SaaS',
    logo: '',
    welcomeText: '欢迎使用云智SaaS平台',
    companyName: '云智互联网络科技公司',
    status: 'active',
    agentCount: 3,
    customerCount: 86,
    createTime: '2024-03-20'
  },
  {
    key: '3',
    id: 'B003',
    name: '未来智联',
    appName: '未来AI',
    logo: '',
    welcomeText: '连接未来，从这里开始',
    companyName: '未来智联科技有限公司',
    status: 'frozen',
    agentCount: 2,
    customerCount: 45,
    createTime: '2024-06-10'
  }
]

// Mock 用户数据
const mockUsers: SubUser[] = [
  { key: '1', id: 'U001', name: '张经理', phone: '138****1001', type: 'agent', status: 'active', createTime: '2024-01-20' },
  { key: '2', id: 'U002', name: '李总', phone: '139****2002', type: 'customer', status: 'active', createTime: '2024-02-15' },
  { key: '3', id: 'U003', name: '王老板', phone: '137****3003', type: 'customer', status: 'active', createTime: '2024-03-10' },
]

export default function BrandingConfig() {
  const [brandingTenants, setBrandingTenants] = useState<BrandingTenant[]>(mockBrandingTenants)
  const [users, setUsers] = useState<SubUser[]>(mockUsers)
  const [createVisible, setCreateVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [userVisible, setUserVisible] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<BrandingTenant | null>(null)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [createUserForm] = Form.useForm()

  // Logo上传配置
  const logoUploadProps: UploadProps = {
    name: 'file',
    action: '#',
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        editForm.setFieldsValue({ logo: e.target?.result as string })
        message.success('Logo上传成功')
      }
      reader.readAsDataURL(file)
      return false
    }
  }

  // 新增贴牌商
  const handleCreate = () => {
    createForm.validateFields().then(values => {
      const newTenant: BrandingTenant = {
        key: `B${Date.now()}`,
        id: `B${(brandingTenants.length + 1).toString().padStart(3, '0')}`,
        ...values,
        logo: '',
        status: 'active',
        agentCount: 0,
        customerCount: 0,
        createTime: new Date().toISOString().split('T')[0]
      }
      setBrandingTenants(prev => [...prev, newTenant])
      message.success(`已开通贴牌商：${values.name}，初始密码：123456`)
      setCreateVisible(false)
    })
  }

  // 编辑贴牌商
  const handleEdit = (tenant: BrandingTenant) => {
    setSelectedTenant(tenant)
    editForm.setFieldsValue(tenant)
    setEditVisible(true)
  }

  const handleSaveEdit = () => {
    editForm.validateFields().then(values => {
      setBrandingTenants(prev => prev.map(t => t.key === selectedTenant?.key ? { ...t, ...values } : t))
      message.success('贴牌配置已保存')
      setEditVisible(false)
    })
  }

  // 删除贴牌商
  const handleDelete = (tenant: BrandingTenant) => {
    setBrandingTenants(prev => prev.filter(t => t.key !== tenant.key))
    message.success(`${tenant.name} 已删除`)
  }

  // 冻结/解冻
  const handleToggleStatus = (tenant: BrandingTenant) => {
    setBrandingTenants(prev => prev.map(t => 
      t.key === tenant.key ? { ...t, status: t.status === 'active' ? 'frozen' : 'active' } : t
    ))
    message.success(`${tenant.name} 已${tenant.status === 'active' ? '冻结' : '解冻'}`)
  }

  // 开通下级用户
  const handleOpenUsers = (tenant: BrandingTenant) => {
    setSelectedTenant(tenant)
    setUserVisible(true)
  }

  const handleCreateUser = () => {
    createUserForm.validateFields().then(values => {
      const newUser: SubUser = {
        key: `U${Date.now()}`,
        id: `U${(users.length + 1).toString().padStart(3, '0')}`,
        ...values,
        status: 'active',
        createTime: new Date().toISOString().split('T')[0]
      }
      setUsers(prev => [...prev, newUser])
      // 更新贴牌商的用户计数
      if (selectedTenant) {
        setBrandingTenants(prev => prev.map(t => ({
          ...t,
          agentCount: values.type === 'agent' ? t.agentCount + 1 : t.agentCount,
          customerCount: values.type === 'customer' ? t.customerCount + 1 : t.customerCount
        })))
      }
      message.success(`已开通用户：${values.name}，初始密码：123456`)
      createUserForm.resetFields()
    })
  }

  const columns: ColumnsType<BrandingTenant> = [
    {
      title: '贴牌商',
      key: 'tenant',
      render: (_, record) => (
        <Space>
          {record.logo ? (
            <img src={record.logo} alt="logo" style={{ width: 40, height: 40, borderRadius: 8 }} />
          ) : (
            <AppstoreOutlined style={{ fontSize: 32, color: '#1890ff' }} />
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.id}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'APP名称',
      dataIndex: 'appName',
      key: 'appName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={status === 'active' ? 'success' : 'error'} text={status === 'active' ? '正常' : '已冻结'} />
      )
    },
    {
      title: '下级用户',
      key: 'users',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary">代理商: {record.agentCount}</Text>
          <Text type="secondary">终端客户: {record.customerCount}</Text>
        </Space>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<UserOutlined />} onClick={() => handleOpenUsers(record)}>
            用户
          </Button>
          <Button type="text" size="small" icon={<SettingOutlined />} onClick={() => handleEdit(record)}>
            配置
          </Button>
          <Button 
            type="text" 
            size="small" 
            icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'active' ? '冻结' : '解冻'}
          </Button>
          <Popconfirm title="确定删除该贴牌商？" onConfirm={() => handleDelete(record)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const userColumns: ColumnsType<SubUser> = [
    {
      title: '用户信息',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Tag color={record.type === 'agent' ? 'blue' : 'green'}>
            {record.type === 'agent' ? '代理' : '客户'}
          </Tag>
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={status === 'active' ? 'success' : 'error'} text={status === 'active' ? '正常' : '已冻结'} />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">贴牌商管理</Title>
          <Text type="secondary">开通独立品牌的APP总后台，可自定义名称、LOGO、欢迎语等信息，并开通下级代理商和终端用户</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
          开通贴牌商
        </Button>
      </div>

      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <Statistic title="贴牌商总数" value={brandingTenants.length} prefix={<AppstoreOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="正常运营" 
              value={brandingTenants.filter(t => t.status === 'active').length} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="总下级用户" 
              value={brandingTenants.reduce((sum, t) => sum + t.agentCount + t.customerCount, 0)} 
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table columns={columns} dataSource={brandingTenants} rowKey="key" pagination={false} />
      </Card>

      {/* 开通贴牌商 */}
      <Modal
        title="开通贴牌商"
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => setCreateVisible(false)}
        okText="确认开通"
        cancelText="取消"
        width={500}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="name" label="贴牌商名称" rules={[{ required: true, message: '请输入贴牌商名称' }]}>
            <Input placeholder="如：智创科技有限公司" />
          </Form.Item>
          <Form.Item name="appName" label="APP名称" rules={[{ required: true, message: '请输入APP名称' }]}>
            <Input placeholder="如：智创AI助手" />
          </Form.Item>
          <Form.Item name="welcomeText" label="欢迎语" initialValue="欢迎使用">
            <Input placeholder="用户登录后显示的欢迎语" />
          </Form.Item>
          <Form.Item name="companyName" label="底部公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
            <Input placeholder="APP底部显示的公司名称" />
          </Form.Item>
          <Divider />
          <Text type="secondary">初始管理员账号：{createForm.getFieldValue('name') || 'xxx'}@admin</Text>
          <br />
          <Text type="secondary">初始密码：123456（用户自行修改）</Text>
        </Form>
      </Modal>

      {/* 编辑贴牌配置 */}
      <Modal
        title="贴牌配置"
        open={editVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditVisible(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <Divider orientation="horizontal">基本信息</Divider>
          <Form.Item name="name" label="贴牌商名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="appName" label="APP名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <Divider orientation="horizontal">界面配置</Divider>
          <Form.Item name="welcomeText" label="欢迎语">
            <Input placeholder="用户登录后显示的欢迎语" />
          </Form.Item>
          <Form.Item name="companyName" label="底部公司名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <Divider orientation="horizontal">Logo上传</Divider>
          <Form.Item name="logo" label="Logo">
            <Space direction="vertical">
              <Upload {...logoUploadProps}>
                <Button icon={<PlusOutlined />}>上传Logo</Button>
              </Upload>
              <Text type="secondary">建议尺寸：200x60px，支持PNG、JPG格式</Text>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 下级用户管理 */}
      <Modal
        title={`${selectedTenant?.name} - 用户管理`}
        open={userVisible}
        onCancel={() => setUserVisible(false)}
        footer={null}
        width={800}
      >
        <div className="mb-4 flex justify-between">
          <Text type="secondary">代理商: {selectedTenant?.agentCount} | 终端客户: {selectedTenant?.customerCount}</Text>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => createUserForm.resetFields()}>
            开通用户
          </Button>
        </div>
        
        <Card className="mb-4">
          <Form form={createUserForm} layout="inline">
            <Form.Item name="type" label="类型" rules={[{ required: true }]}>
              <Select style={{ width: 120 }}>
                <Option value="customer">终端客户</Option>
                <Option value="agent">代理商</Option>
              </Select>
            </Form.Item>
            <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
              <Input placeholder="姓名" />
            </Form.Item>
            <Form.Item name="phone" label="手机" rules={[{ required: true }]}>
              <Input placeholder="手机号码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleCreateUser}>开通</Button>
            </Form.Item>
          </Form>
        </Card>

        <Table columns={userColumns} dataSource={users} rowKey="key" size="small" pagination={false} />
      </Modal>
    </div>
  )
}
