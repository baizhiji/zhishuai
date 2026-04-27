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
  Tooltip,
  Row,
  Col,
  Badge,
  Divider,
} from 'antd'
import {
  ArrowLeftOutlined,
  SearchOutlined,
  PlusOutlined,
  ExportOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

interface Customer {
  id: string
  name: string
  platform: string
  username: string
  topic: string
  followers: number
  engagement: number
  status: 'discovered' | 'contacted' | 'converted'
  discoveredAt: string
  lastContacted?: string
  notes: string
}

const { TextArea } = Input

export default function CustomerDiscoveryPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // 平台选项
  const platforms = [
    { id: 'douyin', name: '抖音', icon: '🎵' },
    { id: 'xiaohongshu', name: '小红书', icon: '📕' },
    { id: 'bilibili', name: 'B站', icon: '📺' },
    { id: 'kuaishou', name: '快手', icon: '📹' },
    { id: 'weibo', name: '微博', icon: '📱' },
  ]

  // 模拟已发现的客户
  const [discoveredCustomers, setDiscoveredCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: '科技小王子',
      platform: 'douyin',
      username: '@techking',
      topic: '科技数码',
      followers: 125000,
      engagement: 8.5,
      status: 'discovered',
      discoveredAt: '2024-01-15 10:30:00',
      notes: '粉丝质量高，适合合作推广',
    },
    {
      id: '2',
      name: '美食日记',
      platform: 'xiaohongshu',
      username: '@foodie_daily',
      topic: '美食',
      followers: 89000,
      engagement: 12.3,
      status: 'contacted',
      discoveredAt: '2024-01-14 14:20:00',
      lastContacted: '2024-01-16 09:00:00',
      notes: '已发送合作意向，等待回复',
    },
    {
      id: '3',
      name: '运动达人',
      platform: 'bilibili',
      username: '@fitness_pro',
      topic: '运动健身',
      followers: 67000,
      engagement: 6.8,
      status: 'converted',
      discoveredAt: '2024-01-10 16:45:00',
      lastContacted: '2024-01-12 11:30:00',
      notes: '已签约，每月2条合作视频',
    },
  ])

  // 执行搜索
  const handleSearch = async (values: any) => {
    setSearching(true)
    try {
      // 模拟搜索
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 模拟搜索结果
      const mockResults: Customer[] = [
        {
          id: Date.now().toString(),
          name: `用户${Math.floor(Math.random() * 1000)}`,
          platform: values.platform,
          username: `@user${Math.floor(Math.random() * 10000)}`,
          topic: values.keyword,
          followers: Math.floor(Math.random() * 200000) + 10000,
          engagement: parseFloat((Math.random() * 15).toFixed(1)),
          status: 'discovered',
          discoveredAt: new Date().toLocaleString('zh-CN'),
          notes: '',
        },
        {
          id: (Date.now() + 1).toString(),
          name: `博主${Math.floor(Math.random() * 1000)}`,
          platform: values.platform,
          username: `@blogger${Math.floor(Math.random() * 10000)}`,
          topic: values.keyword,
          followers: Math.floor(Math.random() * 200000) + 10000,
          engagement: parseFloat((Math.random() * 15).toFixed(1)),
          status: 'discovered',
          discoveredAt: new Date().toLocaleString('zh-CN'),
          notes: '',
        },
      ]

      setSearchResults(mockResults)
      Message.success(`发现 ${mockResults.length} 个潜在客户`)
    } catch (error) {
      Message.error('搜索失败，请重试')
    } finally {
      setSearching(false)
    }
  }

  // 添加到已发现列表
  const handleAddToDiscovered = (customer: Customer) => {
    setDiscoveredCustomers([customer, ...discoveredCustomers])
    setSearchResults(searchResults.filter(c => c.id !== customer.id))
    Message.success('已添加到客户列表')
  }

  // 查看详情
  const handleViewDetail = (customer: Customer) => {
    setSelectedCustomer(customer)
    setDetailModalVisible(true)
  }

  // 删除客户
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个客户吗？',
      onOk: () => {
        setDiscoveredCustomers(discoveredCustomers.filter(c => c.id !== id))
        Message.success('客户已删除')
      },
    })
  }

  // 导出客户
  const handleExport = () => {
    Message.success('客户数据已导出')
  }

  const statusMap: Record<string, { text: string; color: string }> = {
    discovered: { text: '已发现', color: 'default' },
    contacted: { text: '已联系', color: 'processing' },
    converted: { text: '已转化', color: 'success' },
  }

  const columns = [
    {
      title: '客户信息',
      key: 'customer',
      render: (_: any, record: Customer) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary" className="text-sm">{record.username}</Text>
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
            <span className="text-xl">{p?.icon}</span>
            <span>{p?.name}</span>
          </Space>
        )
      },
    },
    {
      title: '领域',
      dataIndex: 'topic',
      key: 'topic',
      render: (topic: string) => <Tag color="blue">{topic}</Tag>,
    },
    {
      title: '粉丝数',
      dataIndex: 'followers',
      key: 'followers',
      render: (followers: number) => (
        <Text>{(followers / 10000).toFixed(1)}万</Text>
      ),
    },
    {
      title: '互动率',
      dataIndex: 'engagement',
      key: 'engagement',
      render: (engagement: number) => (
        <Tag color={engagement > 10 ? 'green' : engagement > 5 ? 'orange' : 'red'}>
          {engagement}%
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const s = statusMap[status]
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    {
      title: '发现时间',
      dataIndex: 'discoveredAt',
      key: 'discoveredAt',
      render: (date: string) => <Text className="text-sm">{date.split(' ')[0]}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Customer) => (
        <Space>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/customer')}
          className="mb-6"
        >
          返回客户管理
        </Button>

        {/* 标题 */}
        <div className="mb-8">
          <Title level={2}>潜在客户发现</Title>
          <Text type="secondary">根据关键词、话题发现潜在优质客户</Text>
        </div>

        <Row gutter={[24, 24]}>
          {/* 左侧：搜索表单 */}
          <Col xs={24} lg={10}>
            <Card title="搜索设置" extra={<Badge count={searchResults.length} showZero color="blue" />}>
              <Form form={form} layout="vertical" onFinish={handleSearch}>
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
                  label="关键词/话题"
                  name="keyword"
                  rules={[{ required: true, message: '请输入关键词' }]}
                  tooltip="输入您想寻找的领域或话题，如：科技、美食、运动等"
                >
                  <Input
                    placeholder="例如：科技、美食、运动..."
                    size="large"
                    prefix={<SearchOutlined />}
                  />
                </Form.Item>

                <Form.Item
                  label="最小粉丝数"
                  name="minFollowers"
                  tooltip="设置粉丝数下限，过滤小号"
                >
                  <Input
                    placeholder="例如：10000"
                    suffix="人"
                    type="number"
                  />
                </Form.Item>

                <Form.Item
                  label="最小互动率"
                  name="minEngagement"
                  tooltip="设置互动率下限，过滤低质量账号"
                >
                  <Input
                    placeholder="例如：5"
                    suffix="%"
                    type="number"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={searching}
                    block
                    size="large"
                    icon={<SearchOutlined />}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
                  >
                    开始搜索
                  </Button>
                </Form.Item>
              </Form>

              {/* 搜索结果 */}
              {searchResults.length > 0 && (
                <>
                  <Divider orientation="left">搜索结果</Divider>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {searchResults.map(customer => (
                      <Card
                        key={customer.id}
                        size="small"
                        hoverable
                        actions={[
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => handleAddToDiscovered(customer)}
                          >
                            添加
                          </Button>,
                          <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetail(customer)}
                          >
                            查看
                          </Button>,
                        ]}
                      >
                        <Space direction="vertical" size={0} className="w-full">
                          <Space>
                            <Text strong>{customer.name}</Text>
                            <Tag>{customer.username}</Tag>
                          </Space>
                          <Text type="secondary" className="text-sm">
                            {customer.topic} | {(customer.followers / 10000).toFixed(1)}万粉丝 | {customer.engagement}%互动率
                          </Text>
                        </Space>
                      </Card>
                    ))}
                  </Space>
                </>
              )}
            </Card>
          </Col>

          {/* 右侧：已发现客户列表 */}
          <Col xs={24} lg={14}>
            <Card
              title="已发现客户"
              extra={
                <Button
                  icon={<ExportOutlined />}
                  onClick={handleExport}
                >
                  导出
                </Button>
              }
            >
              <Table
                columns={columns}
                dataSource={discoveredCustomers}
                rowKey="id"
                pagination={{ pageSize: 8 }}
                scroll={{ x: true }}
              />
            </Card>
          </Col>
        </Row>

        {/* 客户详情弹窗 */}
        <Modal
          title="客户详情"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          width={600}
        >
          {selectedCustomer && (
            <Space direction="vertical" size="large" className="w-full">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small">
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">客户名称</Text>
                      <Text strong>{selectedCustomer.name}</Text>
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">用户名</Text>
                      <Text>{selectedCustomer.username}</Text>
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">平台</Text>
                      <Text>{platforms.find(p => p.id === selectedCustomer.platform)?.name}</Text>
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">领域</Text>
                      <Tag color="blue">{selectedCustomer.topic}</Tag>
                    </Space>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">粉丝数</Text>
                      <Text strong>{(selectedCustomer.followers / 10000).toFixed(1)}万</Text>
                    </Space>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">互动率</Text>
                      <Text strong>{selectedCustomer.engagement}%</Text>
                    </Space>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">状态</Text>
                      <Tag color={statusMap[selectedCustomer.status].color}>
                        {statusMap[selectedCustomer.status].text}
                      </Tag>
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">发现时间</Text>
                      <Text>{selectedCustomer.discoveredAt}</Text>
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">最后联系</Text>
                      <Text>{selectedCustomer.lastContacted || '未联系'}</Text>
                    </Space>
                  </Card>
                </Col>
              </Row>

              <Card size="small" title="备注">
                <TextArea
                  value={selectedCustomer.notes}
                  rows={4}
                  placeholder="添加备注信息..."
                />
              </Card>

              <Space className="w-full justify-end">
                <Button onClick={() => router.push(`/customer/send?customerId=${selectedCustomer.id}`)}>
                  发送信息
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    Message.success('已标记为已联系')
                    setDetailModalVisible(false)
                  }}
                >
                  标记已联系
                </Button>
              </Space>
            </Space>
          )}
        </Modal>
      </div>
    </div>
  )
}
