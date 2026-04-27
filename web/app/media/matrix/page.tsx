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
  Modal,
  Form,
  Input,
  Select,
  message,
  Avatar,
  Switch,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  EyeOutlined,
  SyncOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

interface Account {
  id: string
  platform: string
  accountName: string
  avatar: string
  fans: number
  status: 'active' | 'inactive' | 'expired'
  lastSync: string
  autoPublish: boolean
}

export default function MatrixManagementPage() {
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      platform: 'douyin',
      accountName: '智枢AI官方',
      avatar: '/placeholder-avatar.jpg',
      fans: 12580,
      status: 'active',
      lastSync: '2024-03-25 10:30:00',
      autoPublish: true,
    },
    {
      id: '2',
      platform: 'xiaohongshu',
      accountName: '智枢AI助手',
      avatar: '/placeholder-avatar.jpg',
      fans: 8642,
      status: 'active',
      lastSync: '2024-03-24 15:20:00',
      autoPublish: true,
    },
    {
      id: '3',
      platform: 'weixin',
      accountName: '智枢AI视频号',
      avatar: '/placeholder-avatar.jpg',
      fans: 5320,
      status: 'inactive',
      lastSync: '2024-03-23 09:15:00',
      autoPublish: false,
    },
  ])

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()

  const platformOptions = [
    { label: '抖音', value: 'douyin' },
    { label: '快手', value: 'kuaishou' },
    { label: '小红书', value: 'xiaohongshu' },
    { label: '视频号', value: 'weixin' },
    { label: 'B站', value: 'bilibili' },
  ]

  const statusConfig = {
    active: { text: '正常', color: 'success' },
    inactive: { text: '未授权', color: 'warning' },
    expired: { text: '已过期', color: 'error' },
  }

  const columns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 120,
      render: (platform: string) => {
        const config = {
          douyin: { label: '抖音', color: 'black' },
          kuaishou: { label: '快手', color: 'orange' },
          xiaohongshu: { label: '小红书', color: 'red' },
          weixin: { label: '视频号', color: 'green' },
          bilibili: { label: 'B站', color: 'blue' },
        }
        const conf = config[platform as keyof typeof config]
        return <Tag color={conf.color}>{conf.label}</Tag>
      },
    },
    {
      title: '账号信息',
      dataIndex: 'accountName',
      key: 'accountName',
      render: (name: string, record: Account) => (
        <Space>
          <Avatar src={record.avatar} icon={<LinkOutlined />} />
          <div>
            <div className="font-medium">{name}</div>
            <Text type="secondary" className="text-xs">{record.fans.toLocaleString()} 粉丝</Text>
          </div>
        </Space>
      ),
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
      title: '自动发布',
      dataIndex: 'autoPublish',
      key: 'autoPublish',
      width: 100,
      render: (autoPublish: boolean, record: Account) => (
        <Switch
          checked={autoPublish}
          onChange={(checked) => {
            setAccounts(accounts.map(a =>
              a.id === record.id ? { ...a, autoPublish: checked } : a
            ))
            message.success(checked ? '已开启自动发布' : '已关闭自动发布')
          }}
        />
      ),
    },
    {
      title: '最后同步',
      dataIndex: 'lastSync',
      key: 'lastSync',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_: any, record: Account) => (
        <Space size="small">
          <Button
            type="link"
            icon={<SyncOutlined />}
            onClick={() => message.success('正在同步数据...')}
          >
            同步
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => message.success('编辑功能开发中')}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: '确定要删除这个账号吗？',
                onOk: () => {
                  setAccounts(accounts.filter(a => a.id !== record.id))
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

  const handleAdd = () => {
    setIsModalVisible(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const newAccount: Account = {
        id: Date.now().toString(),
        ...values,
        avatar: '/placeholder-avatar.jpg',
        fans: 0,
        status: 'active',
        lastSync: new Date().toLocaleString(),
        autoPublish: values.autoPublish ?? true,
      }
      setAccounts([...accounts, newAccount])
      setIsModalVisible(false)
      form.resetFields()
      message.success('添加成功')
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleBatchSync = () => {
    message.success('正在批量同步所有账号...')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">矩阵管理</Title>
        <Text type="secondary">
          管理多平台账号，支持一键发布和数据分析
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">{accounts.length}</div>
              <div className="text-gray-600 text-sm">已绑定账号</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {accounts.reduce((sum, a) => sum + a.fans, 0).toLocaleString()}
              </div>
              <div className="text-gray-600 text-sm">总粉丝数</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">
                {accounts.filter(a => a.autoPublish).length}
              </div>
              <div className="text-gray-600 text-sm">自动发布中</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">3</div>
              <div className="text-gray-600 text-sm">支持平台</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title="账号列表"
        extra={
          <Space>
            <Button icon={<SyncOutlined />} onClick={handleBatchSync}>
              批量同步
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加账号
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={accounts}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      {/* 添加账号弹窗 */}
      <Modal
        title="添加账号"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="选择平台"
            name="platform"
            rules={[{ required: true, message: '请选择平台' }]}
          >
            <Select options={platformOptions} />
          </Form.Item>
          <Form.Item
            label="账号名称"
            name="accountName"
            rules={[{ required: true, message: '请输入账号名称' }]}
          >
            <Input placeholder="请输入账号名称" />
          </Form.Item>
          <Form.Item
            label="开启自动发布"
            name="autoPublish"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
          <Divider />
          <div className="bg-blue-50 p-4 rounded">
            <Title level={5}>授权说明</Title>
            <Text type="secondary">
              点击确定后，将跳转到{form.getFieldValue('platform')}授权页面，请完成授权流程
            </Text>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
