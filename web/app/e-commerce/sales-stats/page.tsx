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
  Divider,
  Progress,
  Tooltip,
  Empty,
} from 'antd'
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  LineChartOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
  PercentageOutlined,
  FilterOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

interface SalesData {
  id: string
  period: string
  orders: number
  revenue: number
  customers: number
  avgOrderValue: number
  conversionRate: number
  returnRate: number
}

interface ProductSales {
  id: string
  productName: string
  category: string
  orders: number
  revenue: number
  profit: number
  profitRate: number
  returnOrders: number
  returnRate: number
  avgPrice: number
  stock: number
}

interface PlatformSales {
  platform: string
  platformName: string
  icon: string
  orders: number
  revenue: number
  conversionRate: number
  avgOrderValue: number
  growth: number
}

export default function SalesStatsPage() {
  const router = useRouter()
  const [form] = Form.useForm()

  // 销售数据（按时间）
  const [salesData, setSalesData] = useState<SalesData[]>([
    {
      id: '1',
      period: '2024-01-15',
      orders: 125,
      revenue: 45600,
      customers: 98,
      avgOrderValue: 364.8,
      conversionRate: 3.2,
      returnRate: 2.5,
    },
    {
      id: '2',
      period: '2024-01-14',
      orders: 98,
      revenue: 38200,
      customers: 76,
      avgOrderValue: 389.8,
      conversionRate: 2.8,
      returnRate: 3.1,
    },
    {
      id: '3',
      period: '2024-01-13',
      orders: 112,
      revenue: 42800,
      customers: 89,
      avgOrderValue: 382.1,
      conversionRate: 3.1,
      returnRate: 2.8,
    },
    {
      id: '4',
      period: '2024-01-12',
      orders: 87,
      revenue: 32100,
      customers: 65,
      avgOrderValue: 369.0,
      conversionRate: 2.6,
      returnRate: 3.5,
    },
    {
      id: '5',
      period: '2024-01-11',
      orders: 145,
      revenue: 52300,
      customers: 118,
      avgOrderValue: 360.7,
      conversionRate: 3.5,
      returnRate: 2.2,
    },
    {
      id: '6',
      period: '2024-01-10',
      orders: 103,
      revenue: 39500,
      customers: 82,
      avgOrderValue: 383.5,
      conversionRate: 2.9,
      returnRate: 3.0,
    },
    {
      id: '7',
      period: '2024-01-09',
      orders: 92,
      revenue: 34800,
      customers: 71,
      avgOrderValue: 378.3,
      conversionRate: 2.7,
      returnRate: 3.3,
    },
  ])

  // 商品销售
  const [productSales, setProductSales] = useState<ProductSales[]>([
    {
      id: '1',
      productName: '无线蓝牙耳机 Pro',
      category: '数码配件',
      orders: 156,
      revenue: 46644,
      profit: 12000,
      profitRate: 25.7,
      returnOrders: 4,
      returnRate: 2.6,
      avgPrice: 299,
      stock: 100,
    },
    {
      id: '2',
      productName: '智能手表 S2',
      category: '智能穿戴',
      orders: 89,
      revenue: 80011,
      profit: 22000,
      profitRate: 27.5,
      returnOrders: 3,
      returnRate: 3.4,
      avgPrice: 899,
      stock: 50,
    },
    {
      id: '3',
      productName: '便携式充电宝 10000mAh',
      category: '数码配件',
      orders: 234,
      revenue: 23166,
      profit: 5600,
      profitRate: 24.2,
      returnOrders: 8,
      returnRate: 3.4,
      avgPrice: 99,
      stock: 200,
    },
    {
      id: '4',
      productName: '智能家居摄像头',
      category: '智能家居',
      orders: 67,
      revenue: 13333,
      profit: 3200,
      profitRate: 24.0,
      returnOrders: 2,
      returnRate: 3.0,
      avgPrice: 199,
      stock: 80,
    },
    {
      id: '5',
      productName: '多功能数据线',
      category: '数码配件',
      orders: 312,
      revenue: 9360,
      profit: 2100,
      profitRate: 22.4,
      returnOrders: 12,
      returnRate: 3.8,
      avgPrice: 30,
      stock: 500,
    },
  ])

  // 平台销售
  const [platformSales, setPlatformSales] = useState<PlatformSales[]>([
    {
      platform: 'taobao',
      platformName: '淘宝',
      icon: '🛍️',
      orders: 285,
      revenue: 106500,
      conversionRate: 3.2,
      avgOrderValue: 373.7,
      growth: 12.5,
    },
    {
      platform: 'jd',
      platformName: '京东',
      icon: '🛒',
      orders: 198,
      revenue: 82500,
      conversionRate: 3.8,
      avgOrderValue: 416.7,
      growth: 8.3,
    },
    {
      platform: 'pinduoduo',
      platformName: '拼多多',
      icon: '📦',
      orders: 356,
      revenue: 35244,
      conversionRate: 2.8,
      avgOrderValue: 99.0,
      growth: 25.6,
    },
    {
      platform: 'douyin',
      platformName: '抖店',
      icon: '🎪',
      orders: 89,
      revenue: 26711,
      conversionRate: 2.5,
      avgOrderValue: 300.1,
      growth: 45.2,
    },
    {
      platform: 'meituan',
      platformName: '美团',
      icon: '🍔',
      orders: 45,
      revenue: 8955,
      conversionRate: 3.0,
      avgOrderValue: 199.0,
      growth: 18.7,
    },
  ])

  // 平台选项
  const platforms = [
    { id: 'taobao', name: '淘宝', icon: '🛍️' },
    { id: 'jd', name: '京东', icon: '🛒' },
    { id: 'pinduoduo', name: '拼多多', icon: '📦' },
    { id: 'douyin', name: '抖店', icon: '🎪' },
    { id: 'meituan', name: '美团', icon: '🍔' },
  ]

  // 汇总统计
  const summaryStats = {
    totalOrders: salesData.reduce((sum, d) => sum + d.orders, 0),
    totalRevenue: salesData.reduce((sum, d) => sum + d.revenue, 0),
    totalCustomers: salesData.reduce((sum, d) => sum + d.customers, 0),
    avgConversionRate: (salesData.reduce((sum, d) => sum + d.conversionRate, 0) / salesData.length).toFixed(1),
    avgReturnRate: (salesData.reduce((sum, d) => sum + d.returnRate, 0) / salesData.length).toFixed(1),
    avgOrderValue: (salesData.reduce((sum, d) => sum + d.avgOrderValue, 0) / salesData.length).toFixed(0),
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

  const salesColumns = [
    {
      title: '日期',
      dataIndex: 'period',
      key: 'period',
      render: (date: string) => <Text>{date}</Text>,
    },
    {
      title: '订单数',
      dataIndex: 'orders',
      key: 'orders',
      render: (count: number) => (
        <Space>
          <ShoppingOutlined />
          <Text>{count}</Text>
        </Space>
      ),
    },
    {
      title: '收入',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => (
        <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>¥{revenue.toLocaleString()}</Text>
      ),
    },
    {
      title: '客户数',
      dataIndex: 'customers',
      key: 'customers',
      render: (count: number) => (
        <Space>
          <UserOutlined />
          <Text>{count}</Text>
        </Space>
      ),
    },
    {
      title: '客单价',
      dataIndex: 'avgOrderValue',
      key: 'avgOrderValue',
      render: (value: number) => <Text>¥{value.toFixed(0)}</Text>,
    },
    {
      title: '转化率',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      render: (rate: number) => (
        <Tag color={rate > 3 ? 'green' : rate > 2.5 ? 'orange' : 'red'}>
          {rate.toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: '退货率',
      dataIndex: 'returnRate',
      key: 'returnRate',
      render: (rate: number) => (
        <Tag color={rate < 2.5 ? 'green' : rate < 3.5 ? 'orange' : 'red'}>
          {rate.toFixed(1)}%
        </Tag>
      ),
    },
  ]

  const productColumns = [
    {
      title: '商品',
      dataIndex: 'productName',
      key: 'productName',
      render: (name: string, record: ProductSales) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" className="text-sm">{record.category}</Text>
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
      title: '利润',
      dataIndex: 'profit',
      key: 'profit',
      render: (profit: number, record: ProductSales) => (
        <Space>
          <Text strong style={{ color: '#722ed1' }}>¥{profit.toLocaleString()}</Text>
          <Text type="secondary" className="text-sm">({record.profitRate.toFixed(1)}%)</Text>
        </Space>
      ),
    },
    {
      title: '退货',
      key: 'return',
      render: (_: any, record: ProductSales) => (
        <Space direction="vertical" size={0}>
          <Text>{record.returnOrders} 单</Text>
          <Text type="secondary" className="text-sm">{record.returnRate.toFixed(1)}%</Text>
        </Space>
      ),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => (
        <Tag color={stock < 50 ? 'red' : stock < 100 ? 'orange' : 'green'}>
          {stock}
        </Tag>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
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
          <Title level={2}>销量统计</Title>
          <Text type="secondary">全面分析销售数据，优化经营策略</Text>
        </div>

        {/* 筛选条件 */}
        <Card className="mb-6">
          <Form form={form} layout="inline" onFinish={handleFilter}>
            <Form.Item name="dateRange" label="时间范围">
              <DatePicker.RangePicker />
            </Form.Item>
            <Form.Item name="platform" label="平台">
              <Select placeholder="全部平台" style={{ width: 150 }} allowClear>
                {platforms.map(p => (
                  <Select.Option key={p.id} value={p.id}>{p.icon} {p.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="category" label="分类">
              <Select placeholder="全部分类" style={{ width: 150 }} allowClear>
                <Select.Option value="digital">数码配件</Select.Option>
                <Select.Option value="smart">智能穿戴</Select.Option>
                <Select.Option value="home">智能家居</Select.Option>
                <Select.Option value="audio">影音娱乐</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" icon={<FilterOutlined />}>查询</Button>
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
                title="总订单数"
                value={summaryStats.totalOrders}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#1890ff' }}
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
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总客户数"
                value={summaryStats.totalCustomers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="客单价"
                value={summaryStats.avgOrderValue}
                prefix="¥"
                suffix="元"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="平均转化率"
                value={summaryStats.avgConversionRate}
                suffix="%"
                prefix={<PercentageOutlined />}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="平均退货率"
                value={summaryStats.avgReturnRate}
                suffix="%"
                prefix={<LineChartOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="环比增长"
                value={12.5}
                suffix="%"
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="客单价变化"
                value={-3.2}
                suffix="%"
                prefix={<FallOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          {/* 左侧：销售趋势 */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <LineChartOutlined />
                  <span>销售趋势（近7天）</span>
                </Space>
              }
            >
              <Table
                columns={salesColumns}
                dataSource={salesData}
                rowKey="id"
                pagination={false}
                scroll={{ x: true }}
              />
            </Card>
          </Col>

          {/* 右侧：平台表现 */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <BarChartOutlined />
                  <span>平台表现</span>
                </Space>
              }
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {platformSales.map((platform) => (
                  <Card key={platform.platform} size="small" hoverable>
                    <Space direction="vertical" size="small" className="w-full">
                      <Space className="w-full justify-between">
                        <Space>
                          <span className="text-2xl">{platform.icon}</span>
                          <Space direction="vertical" size={0}>
                            <Text strong>{platform.platformName}</Text>
                            <Text type="secondary" className="text-sm">
                              {platform.orders} 单 | ¥{platform.revenue.toLocaleString()}
                            </Text>
                          </Space>
                        </Space>
                        <Space>
                          {platform.growth > 0 ? (
                            <Tag icon={<RiseOutlined />} color="green">
                              +{platform.growth}%
                            </Tag>
                          ) : (
                            <Tag icon={<FallOutlined />} color="red">
                              {platform.growth}%
                            </Tag>
                          )}
                        </Space>
                      </Space>

                      <Row gutter={[8, 8]} className="mt-2">
                        <Col span={8}>
                          <Card size="small" styles={{ body: { padding: '8px' } }}>
                            <Text type="secondary" className="text-xs">转化率</Text>
                            <div className="font-semibold">{platform.conversionRate.toFixed(1)}%</div>
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card size="small" styles={{ body: { padding: '8px' } }}>
                            <Text type="secondary" className="text-xs">客单价</Text>
                            <div className="font-semibold">¥{platform.avgOrderValue.toFixed(0)}</div>
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card size="small" styles={{ body: { padding: '8px' } }}>
                            <Text type="secondary" className="text-xs">占比</Text>
                            <div className="font-semibold">
                              {((platform.revenue / summaryStats.totalRevenue) * 100).toFixed(1)}%
                            </div>
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

        {/* 商品销售排行 */}
        <Card
          title="商品销售排行"
          className="mt-6"
          extra={
            <Text type="secondary">TOP 5 商品</Text>
          }
        >
          {productSales.length > 0 ? (
            <Table
              columns={productColumns}
              dataSource={productSales}
              rowKey="id"
              pagination={false}
              scroll={{ x: true }}
            />
          ) : (
            <Empty description="暂无销售数据" />
          )}
        </Card>
      </div>
    </div>
  )
}
