'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Modal,
  Form,
  Select,
  message,
  Drawer,
  Descriptions,
  Statistic,
  Row,
  Col,
  Dropdown,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  QrcodeOutlined,
  LinkOutlined,
  EllipsisOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { MediaPlatform } from '@/types'
import { getPlatformIcon, getPlatformName } from '@/utils'

const { Title, Text } = Typography

export default function AccountsPage() {
  const router = useRouter()
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<MediaPlatform | null>(null)
  const [form] = Form.useForm()

  // 模拟账号数据
  const [accounts, setAccounts] = useState<MediaPlatform[]>([
    {
      id: '1',
      name: '抖音',
      icon: '🎵',
      type: 'douyin',
      userId: 'douyin_001',
      nickname: '科技达人',
      avatar: 'https://via.placeholder.com/64',
      fansCount: 125000,
      status: 'connected',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: '快手',
      icon: '📹',
      type: 'kuaishou',
      userId: 'kuaishou_001',
      nickname: '美食分享家',
      avatar: 'https://via.placeholder.com/64',
      fansCount: 89000,
      status: 'connected',
      createdAt: new Date('2024-02-01'),
    },
    {
      id: '3',
      name: '小红书',
      icon: '📕',
      type: 'xiaohongshu',
      userId: 'xiaohongshu_001',
      nickname: '生活博主',
      avatar: 'https://via.placeholder.com/64',
      fansCount: 67000,
      status: 'expired',
      createdAt: new Date('2024-01-20'),
    },
    {
      id: '4',
      name: '视频号',
      icon: '🎬',
      type: 'video',
      userId: 'video_001',
      nickname: '知识科普',
      avatar: 'https://via.placeholder.com/64',
      fansCount: 43000,
      status: 'connected',
      createdAt: new Date('2024-02-10'),
    },
  ])

  const platformOptions = [
    { value: 'douyin', label: '抖音', icon: '🎵' },
    { value: 'kuaishou', label: '快手', icon: '📹' },
    { value: 'xiaohongshu', label: '小红书', icon: '📕' },
    { value: 'video', label: '视频号', icon: '🎬' },
  ]

  const getStatusConfig = (status: string) => {
    const configs = {
      connected: { color: 'success', text: '已连接', icon: <CheckCircleOutlined /> },
      disconnected: { color: 'default', text: '未连接', icon: <CloseCircleOutlined /> },
      expired: { color: 'warning', text: '已过期', icon: <ExclamationCircleOutlined /> },
    }
    return configs[status as keyof typeof configs] || configs.disconnected
  }

  const handleAddAccount = async (values: any) => {
    try {
      // TODO: 调用添加账号API
      // const response = await apiClient.post('/media/accounts', values)

      message.success('账号添加成功！')
      setModalVisible(false)
      form.resetFields()

      // 模拟添加账号
      const newAccount: MediaPlatform = {
        id: Date.now().toString(),
        name: getPlatformName(values.type),
        icon: getPlatformIcon(values.type),
        type: values.type,
        userId: `${values.type}_${Date.now()}`,
        nickname: values.nickname,
        avatar: 'https://via.placeholder.com/64',
        fansCount: 0,
        status: 'connected',
        createdAt: new Date(),
      }

      setAccounts([newAccount, ...accounts])
    } catch (error: any) {
      message.error(error.message || '添加失败，请重试')
    }
  }

  const handleDeleteAccount = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该账号吗？删除后将无法恢复。',
      onOk: () => {
        setAccounts(accounts.filter((acc) => acc.id !== id))
        message.success('账号已删除')
      },
    })
  }

  const handleRefreshAccount = (id: string) => {
    message.info('正在刷新账号状态...')
    // TODO: 调用刷新API
    setTimeout(() => {
      message.success('账号状态已刷新')
    }, 1000)
  }

  const showDetail = (account: MediaPlatform) => {
    setSelectedPlatform(account)
    setDetailVisible(true)
  }

  const columns = [
    {
      title: '平台',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Space>
          <span className="text-2xl">{getPlatformIcon(type)}</span>
          <span className="font-medium">{getPlatformName(type)}</span>
        </Space>
      ),
    },
    {
      title: '账号昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      render: (nickname: string, record: MediaPlatform) => (
        <Space>
          <UserOutlined />
          <span>{nickname}</span>
        </Space>
      ),
    },
    {
      title: '粉丝数',
      dataIndex: 'fansCount',
      key: 'fansCount',
      render: (count: number) => `${(count / 10000).toFixed(1)}万`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = getStatusConfig(status)
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        )
      },
    },
    {
      title: '添加时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MediaPlatform) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => showDetail(record)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleRefreshAccount(record.id)}
          >
            刷新
          </Button>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'delete',
                  label: '删除账号',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDeleteAccount(record.id),
                },
              ],
            }}
          >
            <Button type="link" size="small" icon={<EllipsisOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/media')}
          className="mb-6"
        >
          返回自媒体板块
        </Button>

        {/* 标题 */}
        <div className="mb-8">
          <Title level={2}>矩阵账号管理</Title>
          <Text type="secondary">管理多个平台的自媒体账号</Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总账号数"
                value={accounts.length}
                valueStyle={{ color: '#1890ff' }}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="已连接"
                value={accounts.filter((a) => a.status === 'connected').length}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总粉丝数"
                value={accounts.reduce((sum, acc) => sum + (acc.fansCount || 0), 0)}
                valueStyle={{ color: '#faad14' }}
                formatter={(value) => `${(value / 10000).toFixed(1)}万`}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="已过期"
                value={accounts.filter((a) => a.status === 'expired').length}
                valueStyle={{ color: '#f5222d' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 账号列表 */}
        <Card
          title="账号列表"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              添加账号
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={accounts}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个账号`,
            }}
          />
        </Card>

        {/* 添加账号弹窗 */}
        <Modal
          title="添加账号"
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            form.resetFields()
          }}
          footer={null}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleAddAccount}>
            <Form.Item
              label="选择平台"
              name="type"
              rules={[{ required: true, message: '请选择平台' }]}
            >
              <Select size="large" placeholder="请选择要添加的平台">
                {platformOptions.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    <Space>
                      <span className="text-xl">{option.icon}</span>
                      <span>{option.label}</span>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="账号昵称"
              name="nickname"
              rules={[{ required: true, message: '请输入账号昵称' }]}
            >
              <Input placeholder="请输入账号昵称" />
            </Form.Item>

            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <Text type="secondary">
                <QrcodeOutlined /> 请使用手机APP扫描二维码进行登录授权
              </Text>
            </div>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                确认添加
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* 账号详情抽屉 */}
        <Drawer
          title="账号详情"
          placement="right"
          width={600}
          open={detailVisible}
          onClose={() => setDetailVisible(false)}
        >
          {selectedPlatform && (
            <div>
              <div className="text-center mb-6">
                <div className="text-6xl mb-2">{getPlatformIcon(selectedPlatform.type)}</div>
                <Title level={4}>{selectedPlatform.nickname}</Title>
                {getStatusConfig(selectedPlatform.status).icon}
              </div>

              <Descriptions column={1} bordered>
                <Descriptions.Item label="平台">
                  {getPlatformName(selectedPlatform.type)}
                </Descriptions.Item>
                <Descriptions.Item label="账号ID">
                  {selectedPlatform.userId}
                </Descriptions.Item>
                <Descriptions.Item label="粉丝数">
                  {(selectedPlatform.fansCount || 0).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  {getStatusConfig(selectedPlatform.status).text}
                </Descriptions.Item>
                <Descriptions.Item label="添加时间">
                  {new Date(selectedPlatform.createdAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
              </Descriptions>

              <div className="mt-6">
                <Space direction="vertical" className="w-full">
                  <Button
                    type="primary"
                    icon={<LinkOutlined />}
                    block
                    onClick={() => {
                      message.info('正在跳转到平台主页...')
                      window.open(`https://www.${selectedPlatform.type}.com`)
                    }}
                  >
                    访问平台主页
                  </Button>
                  <Button
                    icon={<QrcodeOutlined />}
                    block
                    onClick={() => message.info('二维码已生成')}
                  >
                    生成二维码
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    block
                    onClick={() => {
                      handleDeleteAccount(selectedPlatform.id)
                      setDetailVisible(false)
                    }}
                  >
                    删除账号
                  </Button>
                </Space>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </div>
  )
}
