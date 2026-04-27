'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Form,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  DatePicker,
  Progress,
  Divider,
  Empty,
  Tooltip,
} from 'antd'
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TrendingUpOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

interface ConversionData {
  id: string
  period: string
  discovered: number
  contacted: number
  converted: number
  revenue: number
  conversionRate: number
}

interface PlatformPerformance {
  platform: string
  name: string
  icon: string
  discovered: number
  contacted: number
  converted: number
  conversionRate: number
  avgRevenue: number
}

interface TopCustomer {
  id: string
  name: string
  username: string
  platform: string
  topic: string
  followers: number
  engagementRate: number
  revenue: number
  convertedAt: string
}

export default function CustomerStatsPage() {
  const router = useRouter()
  const [form] = Form.useForm()

  // 转化数据（按时间）
  const [conversionData, setConversionData] = useState<ConversionData[]>([
    {
      id: '1',
      period: '2024-01-15',
      discovered: 125,
      contacted: 45,
      converted: 12,
      revenue: 18500,
      conversionRate: 26.67,
    },
    {
      id: '2',
      period: '2024-01-14',
      discovered: 98,
      contacted: 38,
      converted: 9,
      revenue: 13200,
      conversionRate: 23.68,
    },
    {
      id: '3',
      period: '2024-01-13',
      discovered: 112,
      contacted: 52,
      converted: 14,
      revenue: 21000,
      conversionRate: 26.92,
    },
    {
      id: '4',
      period: '2024-01-12',
      discovered: 87,
      contacted: 35,
      converted: 8,
      revenue: 11500,
      conversionRate: 22.86,
    },
    {
      id: '5',
      period: '2024-01-11',
      discovered: 145,
      contacted: 58,
      converted: 15,
      revenue: 22500,
      conversionRate: 25.86,
    },
    {
      id: '6',
      period: '2024-01-10',
      discovered: 103,
      contacted: 41,
      converted: 11,
      revenue: 16500,
      conversionRate: 26.83,
    },
    {
      id: '7',
      period: '2024-01-09',
      discovered: 92,
      contacted: 33,
      converted: 7,
      revenue: 10500,
      conversionRate: 21.21,
    },
  ])

  // 平台表现
  const [platformPerformance, setPlatformPerformance] = useState<PlatformPerformance[]>([
    {
      platform: 'douyin',
      name: '抖音',
      icon: '🎵',
      discovered: 285,
      contacted: 112,
      converted: 35,
      conversionRate: 31.25,
      avgRevenue: 1580,
    },
    {
      platform: 'xiaohongshu',
      name: '小红书',
      icon: '📕',
      discovered: 198,
      contacted: 87,
      converted: 22,
      conversionRate: 25.29,
      avgRevenue: 1250,
    },
    {
      platform: 'bilibili',
      name: 'B站',
      icon: '📺',
      discovered: 156,
      contacted: 65,
      converted: 16,
      conversionRate: 24.62,
      avgRevenue: 1650,
    },
    {
      platform: 'kuaishou',
      name: '快手',
      icon: '📹',
      discovered: 132,
      contacted: 54,
      converted: 12,
      conversionRate: 22.22,
      avgRevenue: 980,
    },
    {
      platform: 'weibo',
      name: '微博',
      icon: '📱',
      discovered: 91,
      contacted: 32,
      converted: 6,
      conversionRate: 18.75,
      avgRevenue: 890,
    },
  ])

  // 顶级客户
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([
    {
      id: '1',
      name: '科技小王子',
      username: '@techking',
      platform: 'douyin',
      topic: '科技数码',
      followers: 125000,
      engagementRate: 8.5,
      revenue: 35000,
      convertedAt: '2024-01-15',
    },
    {
      id: '2',
      name: '运动达人',
      username: '@fitness_pro',
      platform: 'bilibili',
      topic: '运动健身',
      followers: 89000,
      engagementRate: 12.3,
      revenue: 28000,
      convertedAt: '2024-01-12',
    },
    {
      id: '3',
      name: '美食日记',
      username: '@foodie_daily',
      platform: 'xiaohongshu',
      topic: '美食',
      followers: 67000,
      engagementRate: 9.8,
      revenue: 24500,
      convertedAt: '2024-01-14',
    },
    {
      id: '4',
      name: '数码测评师',
      username: '@digital_reviewer',
      platform: 'douyin',
      topic: '数码',
      followers: 98000,
      engagementRate: 7.2,
      revenue: 21000,
      convertedAt: '2024-01-13',
    },
    {
      id: '5',
      name: '生活方式博主',
      username: '@life_style',
      platform: 'xiaohongshu',
      topic: '生活',
      followers: 56000,
      engagementRate: 11.5,
      revenue: 18500,
      convertedAt: '2024-01-11',
    },
  ])

  // 汇总统计
  const summaryStats = {
    totalDiscovered: conversionData.reduce((sum, d) => sum + d.discovered, 0),
    totalContacted: conversionData.reduce((sum, d) => sum + d.contacted, 0),
    totalConverted: conversionData.reduce((sum, d) => sum + d.converted, 0),
    totalRevenue: conversionData.reduce((sum, d) => sum + d.revenue, 0),
    avgConversionRate: (conversionData.reduce((sum, d) => sum + d.conversionRate, 0) / conversionData.length).toFixed(1),
  }

  // 处理筛选
  const handleFilter = async (values: any) => {
    console.log('筛选条件：', values)
    // 这里应该调用API获取筛选后的数据
  }

  // 重置筛选
  const handleReset = () => {
    form.resetFields()
  }

  const conversionColumns = [
    {
      title: '日期',
      dataIndex: 'period',
      key: 'period',
      render: (date: string) => <Text>{date}</Text>,
    },
    {
      title: '发现数',
      dataIndex: 'discovered',
      key: 'discovered',
      render: (count: number) => <Text>{count}</Text>,
    },
    {
      title: '联系数',
      dataIndex: 'contacted',
      key: 'contacted',
      render: (count: number) => (
        <Space>
          <Text>{count}</Text>
          <Progress
            percent={Math.round((count / summaryStats.totalDiscovered) * 100)}
            size="small"
            format={() => ''}
            className="w-16"
          />
        </Space>
      ),
    },
    {
      title: '转化数',
      dataIndex: 'converted',
      key: 'converted',
      render: (count: number) => (
        <Text strong style={{ color: '#52c41a' }}>{count}</Text>
      ),
    },
    {
      title: '转化率',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      render: (rate: number) => (
        <Tag color={rate > 25 ? 'green' : rate > 20 ? 'orange' : 'red'}>
          {rate.toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: '收入',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => (
        <Text strong style={{ color: '#722ed1' }}>¥{revenue.toLocaleString()}</Text>
      ),
    },
  ]

  const topCustomerColumns = [
    {
      title: '客户信息',
      key: 'customer',
      render: (_: any, record: TopCustomer) => (
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
        const p = platformPerformance.find(p => p.platform === platform)
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
      dataIndex: 'engagementRate',
      key: 'engagementRate',
      render: (rate: number) => (
        <Tag color={rate > 10 ? 'green' : rate > 5 ? 'orange' : 'red'}>
          {rate}%
        </Tag>
      ),
    },
    {
      title: '收入',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => (
        <Text strong style={{ color: '#722ed1' }}>¥{revenue.toLocaleString()}</Text>
      ),
    },
    {
      title: '转化时间',
      dataIndex: 'convertedAt',
      key: 'convertedAt',
      render: (date: string) => <Text className="text-sm">{date}</Text>,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
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
          <Title level={2}>转化统计</Title>
          <Text type="secondary">查看客户转化数据，分析获客效果</Text>
        </div>

        {/* 筛选条件 */}
        <Card className="mb-6">
          <Form form={form} layout="inline" onFinish={handleFilter}>
            <Form.Item name="dateRange" label="时间范围">
              <RangePicker />
            </Form.Item>
            <Form.Item name="platform" label="平台">
              <Select placeholder="全部平台" style={{ width: 150 }}>
                {platformPerformance.map(p => (
                  <Select.Option key={p.platform} value={p.platform}>
                    {p.icon} {p.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select placeholder="全部状态" style={{ width: 150 }}>
                <Select.Option value="all">全部状态</Select.Option>
                <Select.Option value="discovered">已发现</Select.Option>
                <Select.Option value="contacted">已联系</Select.Option>
                <Select.Option value="converted">已转化</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" icon={<BarChartOutlined />}>
                  查询
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* 汇总统计 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总发现数"
                value={summaryStats.totalDiscovered}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="已联系"
                value={summaryStats.totalContacted}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="已转化"
                value={summaryStats.totalConverted}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总收入"
                value={summaryStats.totalRevenue}
                prefix={<DollarOutlined />}
                suffix="元"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          {/* 左侧：转化数据 */}
          <Col xs={24} lg={14}>
            <Card
              title={
                <Space>
                  <LineChartOutlined />
                  <span>转化趋势</span>
                </Space>
              }
              extra={
                <Space>
                  <Text type="secondary">近7天</Text>
                  <Text strong>平均转化率：{summaryStats.avgConversionRate}%</Text>
                </Space>
              }
            >
              <Table
                columns={conversionColumns}
                dataSource={conversionData}
                rowKey="id"
                pagination={false}
                scroll={{ x: true }}
              />
            </Card>
          </Col>

          {/* 右侧：平台表现 */}
          <Col xs={24} lg={10}>
            <Card
              title={
                <Space>
                  <PieChartOutlined />
                  <span>平台表现</span>
                </Space>
              }
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {platformPerformance.map((platform, index) => (
                  <Card key={platform.platform} size="small" hoverable>
                    <Space direction="vertical" size="small" className="w-full">
                      <Space className="w-full justify-between">
                        <Space>
                          <span className="text-2xl">{platform.icon}</span>
                          <Space direction="vertical" size={0}>
                            <Text strong>{platform.name}</Text>
                            <Text type="secondary" className="text-sm">
                              转化 {platform.converted} / 发现 {platform.discovered}
                            </Text>
                          </Space>
                        </Space>
                        <Tag color={platform.conversionRate > 25 ? 'green' : platform.conversionRate > 20 ? 'orange' : 'red'}>
                          {platform.conversionRate.toFixed(1)}%
                        </Tag>
                      </Space>

                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Progress
                            percent={platform.conversionRate}
                            strokeColor={{
                              '0%': '#108ee9',
                              '100%': '#87d068',
                            }}
                            size="small"
                          />
                        </div>
                        <Text className="text-sm">¥{platform.avgRevenue}</Text>
                      </div>

                      <Row gutter={[8, 8]} className="mt-2">
                        <Col span={8}>
                          <Card size="small" styles={{ body: { padding: '8px' } }}>
                            <Text type="secondary" className="text-xs">发现</Text>
                            <div className="font-semibold">{platform.discovered}</div>
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card size="small" styles={{ body: { padding: '8px' } }}>
                            <Text type="secondary" className="text-xs">联系</Text>
                            <div className="font-semibold">{platform.contacted}</div>
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card size="small" styles={{ body: { padding: '8px' } }}>
                            <Text type="secondary" className="text-xs">转化</Text>
                            <div className="font-semibold">{platform.converted}</div>
                          </Card>
                        </Col>
                      </Row>
                    </Space>
                  </Card>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 顶级客户 */}
        <Card
          title={
            <Space>
              <TrendingUpOutlined />
              <span>转化贡献TOP5</span>
            </Space>
          }
          className="mt-6"
          extra={
            <Tooltip title="按照贡献收入排序">
              <Text type="secondary">Top 5 转化客户</Text>
            </Tooltip>
          }
        >
          {topCustomers.length > 0 ? (
            <Table
              columns={topCustomerColumns}
              dataSource={topCustomers}
              rowKey="id"
              pagination={false}
              scroll={{ x: true }}
            />
          ) : (
            <Empty description="暂无转化数据" />
          )}
        </Card>

        {/* 转化漏斗 */}
        <Card
          title="转化漏斗"
          className="mt-6"
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={6}>
              <Card className="text-center" styles={{ body: { padding: '20px' } }}>
                <div className="mb-3">
                  <UserOutlined className="text-4xl text-blue-500" />
                </div>
                <div className="text-3xl font-bold mb-2">{summaryStats.totalDiscovered}</div>
                <Text type="secondary">发现客户</Text>
              </Card>
            </Col>

            <Col xs={0} sm={2} className="flex justify-center">
              <ArrowRightOutlined className="text-2xl text-gray-400" />
            </Col>

            <Col xs={24} sm={6}>
              <Card className="text-center" styles={{ body: { padding: '20px' } }}>
                <div className="mb-3">
                  <ClockCircleOutlined className="text-4xl text-orange-500" />
                </div>
                <div className="text-3xl font-bold mb-2">{summaryStats.totalContacted}</div>
                <Text type="secondary">已联系</Text>
                <div className="mt-2">
                  <Progress
                    percent={Math.round((summaryStats.totalContacted / summaryStats.totalDiscovered) * 100)}
                    size="small"
                    strokeColor="#faad14"
                  />
                </div>
              </Card>
            </Col>

            <Col xs={0} sm={2} className="flex justify-center">
              <ArrowRightOutlined className="text-2xl text-gray-400" />
            </Col>

            <Col xs={24} sm={6}>
              <Card className="text-center" styles={{ body: { padding: '20px' } }}>
                <div className="mb-3">
                  <CheckCircleOutlined className="text-4xl text-green-500" />
                </div>
                <div className="text-3xl font-bold mb-2">{summaryStats.totalConverted}</div>
                <Text type="secondary">已转化</Text>
                <div className="mt-2">
                  <Progress
                    percent={Math.round((summaryStats.totalConverted / summaryStats.totalContacted) * 100)}
                    size="small"
                    strokeColor="#52c41a"
                  />
                </div>
              </Card>
            </Col>

            <Col xs={0} sm={2} className="flex justify-center">
              <ArrowRightOutlined className="text-2xl text-gray-400" />
            </Col>

            <Col xs={24} sm={6}>
              <Card className="text-center bg-gradient-to-br from-purple-50 to-pink-50" styles={{ body: { padding: '20px' } }}>
                <div className="mb-3">
                  <DollarOutlined className="text-4xl text-purple-500" />
                </div>
                <div className="text-3xl font-bold mb-2">¥{summaryStats.totalRevenue.toLocaleString()}</div>
                <Text type="secondary">总收入</Text>
                <div className="mt-2">
                  <Text type="secondary" className="text-sm">
                    平均 ¥{Math.round(summaryStats.totalRevenue / summaryStats.totalConverted)} / 客户
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  )
}
