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
  Badge,
  Divider,
  Switch,
  Statistic,
  Tooltip,
} from 'antd'
import {
  ArrowLeftOutlined,
  ShopOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  ShoppingOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography
const { TextArea } = Input

interface Shop {
  id: string
  name: string
  platform: string
  shopId: string
  accessToken: string
  status: 'active' | 'inactive' | 'error'
  products: number
  orders: number
  revenue: number
  lastSyncTime: string
  createdAt: string
}

interface SyncLog {
  id: string
  shopName: string
  platform: string
  status: 'success' | 'failed' | 'pending'
  products: number
  orders: number
  syncedAt: string
  message: string
}

export default function ShopsPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)

  // 店铺列表
  const [shops, setShops] = useState<Shop[]>([
    {
      id: '1',
      name: '数码官方旗舰店',
      platform: 'taobao',
      shopId: 'TB123456789',
      accessToken: '••••••••••••••••',
      status: 'active',
      products: 156,
      orders: 89,
      revenue: 158000,
      lastSyncTime: '2024-01-16 10:30:00',
      createdAt: '2024-01-01 09:00:00',
    },
    {
      id: '2',
      name: '时尚专营店',
      platform: 'jd',
      shopId: 'JD987654321',
      accessToken: '••••••••••••••••',
      status: 'active',
      products: 234,
      orders: 156,
      revenue: 234000,
      lastSyncTime: '2024-01-16 09:15:00',
      createdAt: '2024-01-05 14:20:00',
    },
    {
      id: '3',
      name: '好物优选',
      platform: 'pinduoduo',
      shopId: 'PDD456789123',
      accessToken: '••••••••••••••••',
      status: 'error',
      products: 89,
      orders: 45,
      revenue: 67000,
      lastSyncTime: '2024-01-15 18:00:00',
      createdAt: '2024-01-10 11:00:00',
    },
    {
      id: '4',
      name: '生活百货',
      platform: 'douyin',
      shopId: 'DY789123456',
      accessToken: '••••••••••••••••',
      status: 'active',
      products: 67,
      orders: 34,
      revenue: 45000,
      lastSyncTime: '2024-01-16 08:45:00',
      createdAt: '2024-01-12 16:30:00',
    },
    {
      id: '5',
      name: '美食小店',
      platform: 'meituan',
      shopId: 'MT321654987',
      accessToken: '••••••••••••••••',
      status: 'inactive',
      products: 0,
      orders: 0,
      revenue: 0,
      lastSyncTime: '2024-01-14 12:00:00',
      createdAt: '2024-01-14 10:00:00',
    },
  ])

  // 同步日志
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([
    {
      id: '1',
      shopName: '数码官方旗舰店',
      platform: 'taobao',
      status: 'success',
      products: 156,
      orders: 89,
      syncedAt: '2024-01-16 10:30:00',
      message: '同步成功',
    },
    {
      id: '2',
      shopName: '时尚专营店',
      platform: 'jd',
      status: 'success',
      products: 234,
      orders: 156,
      syncedAt: '2024-01-16 09:15:00',
      message: '同步成功',
    },
    {
      id: '3',
      shopName: '好物优选',
      platform: 'pinduoduo',
      status: 'failed',
      products: 0,
      orders: 0,
      syncedAt: '2024-01-15 18:00:00',
      message: 'Access Token 已过期',
    },
  ])

  // 平台选项
  const platforms = [
    { id: 'taobao', name: '淘宝', icon: '🛍️', color: '#ff6b00' },
    { id: 'jd', name: '京东', icon: '🛒', color: '#e4393c' },
    { id: 'pinduoduo', name: '拼多多', icon: '📦', color: '#e02e24' },
    { id: 'douyin', name: '抖店', icon: '🎪', color: '#000000' },
    { id: 'meituan', name: '美团', icon: '🍔', color: '#ffc300' },
  ]

  // 统计数据
  const stats = {
    totalShops: shops.length,
    activeShops: shops.filter(s => s.status === 'active').length,
    totalProducts: shops.reduce((sum, s) => sum + s.products, 0),
    totalRevenue: shops.reduce((sum, s) => sum + s.revenue, 0),
  }

  // 添加店铺
  const handleAddShop = async (values: any) => {
    try {
      const newShop: Shop = {
        id: Date.now().toString(),
        name: values.shopName,
        platform: values.platform,
        shopId: values.shopId,
        accessToken: '••••••••••••••••',
        status: 'active',
        products: 0,
        orders: 0,
        revenue: 0,
        lastSyncTime: new Date().toLocaleString('zh-CN'),
        createdAt: new Date().toLocaleString('zh-CN'),
      }

      setShops([newShop, ...shops])
      Message.success('店铺添加成功！')
      setAddModalVisible(false)
      form.resetFields()
    } catch (error) {
      Message.error('添加失败，请重试')
    }
  }

  // 同步店铺
  const handleSync = async (shopId: string) => {
    setSyncing(shopId)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      const shopIndex = shops.findIndex(s => s.id === shopId)
      if (shopIndex !== -1) {
        const updatedShop = { ...shops[shopIndex], lastSyncTime: new Date().toLocaleString('zh-CN') }
        const newShops = [...shops]
        newShops[shopIndex] = updatedShop
        setShops(newShops)

        const newLog: SyncLog = {
          id: Date.now().toString(),
          shopName: updatedShop.name,
          platform: updatedShop.platform,
          status: 'success',
          products: updatedShop.products,
          orders: updatedShop.orders,
          syncedAt: new Date().toLocaleString('zh-CN'),
          message: '同步成功',
        }
        setSyncLogs([newLog, ...syncLogs])
      }

      Message.success('同步成功！')
    } catch (error) {
      Message.error('同步失败，请重试')
    } finally {
      setSyncing(null)
    }
  }

  // 批量同步
  const handleSyncAll = async () => {
    const activeShops = shops.filter(s => s.status === 'active')
    for (const shop of activeShops) {
      await handleSync(shop.id)
    }
    Message.success('所有店铺同步完成！')
  }

  // 查看详情
  const handleViewDetail = (shop: Shop) => {
    setSelectedShop(shop)
    setDetailModalVisible(true)
  }

  // 删除店铺
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个店铺吗？删除后将无法恢复。',
      onOk: () => {
        setShops(shops.filter(s => s.id !== id))
        Message.success('店铺已删除')
      },
    })
  }

  // 切换状态
  const handleToggleStatus = (id: string) => {
    setShops(shops.map(s => {
      if (s.id === id) {
        const newStatus = s.status === 'active' ? 'inactive' : 'active'
        Message.success(s.status === 'active' ? '店铺已停用' : '店铺已启用')
        return { ...s, status: newStatus as 'active' | 'inactive' | 'error' }
      }
      return s
    }))
  }

  const statusMap: Record<string, { text: string; color: string; icon: any }> = {
    active: { text: '正常', color: 'success', icon: <CheckCircleOutlined /> },
    inactive: { text: '停用', color: 'default', icon: <CloseCircleOutlined /> },
    error: { text: '异常', color: 'error', icon: <ExclamationCircleOutlined /> },
  }

  const columns = [
    {
      title: '店铺信息',
      key: 'shop',
      render: (_: any, record: Shop) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Text strong>{record.name}</Text>
            <Tag color="blue">{record.shopId}</Tag>
          </Space>
          <Text type="secondary" className="text-sm">创建于 {record.createdAt.split(' ')[0]}</Text>
        </Space>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => {
        const p = platforms.find(p => p.id === platform)
        return (
          <Space>
            <span className="text-2xl">{p?.icon}</span>
            <span>{p?.name}</span>
          </Space>
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
      title: '商品数',
      dataIndex: 'products',
      key: 'products',
      render: (count: number) => (
        <Space>
          <ShoppingOutlined />
          <Text>{count}</Text>
        </Space>
      ),
    },
    {
      title: '订单数',
      dataIndex: 'orders',
      key: 'orders',
      render: (count: number) => <Text>{count}</Text>,
    },
    {
      title: '收入',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => (
        <Text strong style={{ color: '#52c41a' }}>¥{revenue.toLocaleString()}</Text>
      ),
    },
    {
      title: '最后同步',
      dataIndex: 'lastSyncTime',
      key: 'lastSyncTime',
      render: (time: string) => <Text className="text-sm">{time}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Shop) => (
        <Space>
          <Tooltip title="同步">
            <Button
              type="link"
              size="small"
              icon={<SyncOutlined spin={syncing === record.id} />}
              loading={syncing === record.id}
              onClick={() => handleSync(record.id)}
            />
          </Tooltip>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const syncLogColumns = [
    {
      title: '店铺',
      dataIndex: 'shopName',
      key: 'shopName',
      render: (name: string, record: SyncLog) => (
        <Space>
          <span>{platforms.find(p => p.id === record.platform)?.icon}</span>
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'success' : status === 'failed' ? 'error' : 'default'}>
          {status === 'success' ? '成功' : status === 'failed' ? '失败' : '进行中'}
        </Tag>
      ),
    },
    {
      title: '商品数',
      dataIndex: 'products',
      key: 'products',
      render: (count: number) => <Text>{count}</Text>,
    },
    {
      title: '订单数',
      dataIndex: 'orders',
      key: 'orders',
      render: (count: number) => <Text>{count}</Text>,
    },
    {
      title: '同步时间',
      dataIndex: 'syncedAt',
      key: 'syncedAt',
      render: (time: string) => <Text className="text-sm">{time}</Text>,
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      render: (message: string) => <Text type={message === '同步成功' ? 'success' : 'danger'}>{message}</Text>,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/e-commerce')}
          className="mb-6"
        >
          返回电商板块
        </Button>

        {/* 标题 */}
        <div className="mb-8">
          <Title level={2}>多店铺管理</Title>
          <Text type="secondary">统一管理多个电商平台店铺，一键同步数据</Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="店铺总数"
                value={stats.totalShops}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="正常店铺"
                value={stats.activeShops}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="商品总数"
                value={stats.totalProducts}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总收入"
                value={stats.totalRevenue}
                prefix={<DollarOutlined />}
                suffix="元"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 店铺列表 */}
        <Card
          title="店铺列表"
          extra={
            <Space>
              <Button
                icon={<SyncOutlined />}
                onClick={handleSyncAll}
              >
                一键同步
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddModalVisible(true)}
              >
                添加店铺
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={shops}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            scroll={{ x: true }}
          />
        </Card>

        {/* 同步日志 */}
        <Card
          title="同步日志"
          className="mt-6"
          extra={
            <Text type="secondary">最近 {syncLogs.length} 次同步</Text>
          }
        >
          <Table
            columns={syncLogColumns}
            dataSource={syncLogs}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            scroll={{ x: true }}
          />
        </Card>

        {/* 添加店铺弹窗 */}
        <Modal
          title="添加店铺"
          open={addModalVisible}
          onCancel={() => setAddModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleAddShop}>
            <Form.Item
              label="选择平台"
              name="platform"
              rules={[{ required: true, message: '请选择平台' }]}
            >
              <Select placeholder="请选择平台" size="large">
                {platforms.map(platform => (
                  <Select.Option key={platform.id} value={platform.id}>
                    <Space>
                      <span>{platform.icon}</span>
                      <span>{platform.name}</span>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="店铺名称"
              name="shopName"
              rules={[{ required: true, message: '请输入店铺名称' }]}
            >
              <Input placeholder="请输入店铺名称" />
            </Form.Item>

            <Form.Item
              label="店铺ID"
              name="shopId"
              rules={[{ required: true, message: '请输入店铺ID' }]}
              tooltip="从平台后台获取的店铺ID"
            >
              <Input placeholder="请输入店铺ID" />
            </Form.Item>

            <Form.Item
              label="Access Token"
              name="accessToken"
              rules={[{ required: true, message: '请输入Access Token' }]}
              tooltip="从平台开放平台获取的授权令牌"
            >
              <Input.Password placeholder="请输入Access Token" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                添加店铺
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* 店铺详情弹窗 */}
        <Modal
          title="店铺详情"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          width={700}
        >
          {selectedShop && (
            <Space direction="vertical" size="large" className="w-full">
              <Card>
                <Space direction="vertical" size="middle" className="w-full">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card size="small">
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">店铺名称</Text>
                          <Text strong>{selectedShop.name}</Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">店铺ID</Text>
                          <Text>{selectedShop.shopId}</Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">平台</Text>
                          <Space>
                            <span className="text-2xl">{platforms.find(p => p.id === selectedShop.platform)?.icon}</span>
                            <span>{platforms.find(p => p.id === selectedShop.platform)?.name}</span>
                          </Space>
                        </Space>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">状态</Text>
                          <Space>
                            <Tag icon={statusMap[selectedShop.status].icon} color={statusMap[selectedShop.status].color}>
                              {statusMap[selectedShop.status].text}
                            </Tag>
                            <Switch
                              checked={selectedShop.status === 'active'}
                              onChange={() => handleToggleStatus(selectedShop.id)}
                            />
                          </Space>
                        </Space>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">商品数</Text>
                          <Text strong>{selectedShop.products}</Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">订单数</Text>
                          <Text strong>{selectedShop.orders}</Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">收入</Text>
                          <Text strong style={{ color: '#52c41a' }}>¥{selectedShop.revenue.toLocaleString()}</Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">创建时间</Text>
                          <Text>{selectedShop.createdAt}</Text>
                        </Space>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">最后同步</Text>
                          <Text>{selectedShop.lastSyncTime}</Text>
                        </Space>
                      </Card>
                    </Col>
                  </Row>

                  <Divider />

                  <Button
                    type="primary"
                    icon={<SyncOutlined />}
                    block
                    loading={syncing === selectedShop.id}
                    onClick={() => handleSync(selectedShop.id)}
                  >
                    立即同步
                  </Button>
                </Space>
              </Card>
            </Space>
          )}
        </Modal>
      </div>
    </div>
  )
}
