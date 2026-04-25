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
  Row,
  Col,
  Statistic,
  DatePicker,
  Divider,
  Progress,
  Tooltip,
  Badge,
  Alert,
} from 'antd'
import {
  ArrowLeftOutlined,
  DollarOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  MinusOutlined,
  PlusOutlined,
  SearchOutlined,
  BellOutlined,
  FilterOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

interface CompetitorProduct {
  id: string
  name: string
  platform: string
  price: number
  originalPrice: number
  priceChange: number
  priceChangePercent: number
  lowestPrice: number
  highestPrice: number
  ourPrice: number
  priceGap: number
  priceGapPercent: number
  trend: 'up' | 'down' | 'stable'
  lastUpdated: string
}

interface PriceAlert {
  id: string
  productName: string
  competitorName: string
  platform: string
  alertType: 'price_above' | 'price_below' | 'price_change'
  threshold: number
  currentPrice: number
  status: 'active' | 'triggered' | 'expired'
  createdAt: string
  triggeredAt?: string
}

export default function PriceMonitorPage() {
  const router = useRouter()
  const [form] = Form.useForm()

  // 竞品价格数据
  const [competitorProducts, setCompetitorProducts] = useState<CompetitorProduct[]>([
    {
      id: '1',
      name: '无线蓝牙耳机 Pro',
      platform: 'taobao',
      price: 279,
      originalPrice: 299,
      priceChange: -20,
      priceChangePercent: -6.69,
      lowestPrice: 269,
      highestPrice: 329,
      ourPrice: 299,
      priceGap: 20,
      priceGapPercent: 7.18,
      trend: 'down',
      lastUpdated: '2024-01-16 10:30:00',
    },
    {
      id: '2',
      name: '智能手表 S2',
      platform: 'jd',
      price: 949,
      originalPrice: 899,
      priceChange: 50,
      priceChangePercent: 5.56,
      lowestPrice: 849,
      highestPrice: 999,
      ourPrice: 899,
      priceGap: -50,
      priceGapPercent: -5.27,
      trend: 'up',
      lastUpdated: '2024-01-16 09:45:00',
    },
    {
      id: '3',
      name: '便携式充电宝 10000mAh',
      platform: 'pinduoduo',
      price: 89,
      originalPrice: 99,
      priceChange: -10,
      priceChangePercent: -10.1,
      lowestPrice: 79,
      highestPrice: 119,
      ourPrice: 99,
      priceGap: 10,
      priceGapPercent: 11.24,
      trend: 'down',
      lastUpdated: '2024-01-16 09:15:00',
    },
    {
      id: '4',
      name: '智能家居摄像头',
      platform: 'douyin',
      price: 189,
      originalPrice: 199,
      priceChange: -10,
      priceChangePercent: -5.03,
      lowestPrice: 179,
      highestPrice: 219,
      ourPrice: 199,
      priceGap: 10,
      priceGapPercent: 5.29,
      trend: 'down',
      lastUpdated: '2024-01-16 08:30:00',
    },
    {
      id: '5',
      name: '无线蓝牙耳机 Pro',
      platform: 'jd',
      price: 309,
      originalPrice: 309,
      priceChange: 0,
      priceChangePercent: 0,
      lowestPrice: 289,
      highestPrice: 339,
      ourPrice: 299,
      priceGap: -10,
      priceGapPercent: -3.24,
      trend: 'stable',
      lastUpdated: '2024-01-16 08:00:00',
    },
  ])

  // 价格提醒
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([
    {
      id: '1',
      productName: '无线蓝牙耳机 Pro',
      competitorName: '竞品A',
      platform: 'taobao',
      alertType: 'price_below',
      threshold: 280,
      currentPrice: 279,
      status: 'triggered',
      createdAt: '2024-01-15 14:00:00',
      triggeredAt: '2024-01-16 10:30:00',
    },
    {
      id: '2',
      productName: '智能手表 S2',
      competitorName: '竞品B',
      platform: 'jd',
      alertType: 'price_above',
      threshold: 950,
      currentPrice: 949,
      status: 'active',
      createdAt: '2024-01-15 16:00:00',
    },
    {
      id: '3',
      productName: '便携式充电宝 10000mAh',
      competitorName: '竞品C',
      platform: 'pinduoduo',
      alertType: 'price_change',
      threshold: 15,
      currentPrice: 89,
      status: 'active',
      createdAt: '2024-01-16 08:00:00',
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

  // 统计数据
  const stats = {
    totalProducts: competitorProducts.length,
    avgPriceGap: competitorProducts.reduce((sum, p) => sum + p.priceGapPercent, 0) / competitorProducts.length,
    priceUp: competitorProducts.filter(p => p.trend === 'up').length,
    priceDown: competitorProducts.filter(p => p.trend === 'down').length,
    activeAlerts: priceAlerts.filter(a => a.status === 'active').length,
  }

  // 处理筛选
  const handleFilter = async (values: any) => {
    console.log('筛选条件：', values)
    // 这里应该调用API获取筛选后的数据
  }

  // 添加价格提醒
  const handleAddAlert = () => {
    // 打开添加提醒的弹窗
  }

  const trendMap: Record<string, { icon: any; color: string; text: string }> = {
    up: { icon: <TrendingUpOutlined />, color: '#ff4d4f', text: '上涨' },
    down: { icon: <TrendingDownOutlined />, color: '#52c41a', text: '下跌' },
    stable: { icon: <MinusOutlined />, color: '#faad14', text: '持平' },
  }

  const alertStatusMap: Record<string, { text: string; color: string }> = {
    active: { text: '生效中', color: 'processing' },
    triggered: { text: '已触发', color: 'success' },
    expired: { text: '已过期', color: 'default' },
  }

  const columns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
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
      title: '竞品价格',
      key: 'price',
      render: (_: any, record: CompetitorProduct) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '16px' }}>¥{record.price}</Text>
          <Space size="small">
            <Tag icon={trendMap[record.trend].icon} color={trendMap[record.trend].color}>
              {record.trend === 'up' ? '+' : ''}{record.priceChangePercent.toFixed(1)}%
            </Tag>
            <Text type="secondary" className="text-sm">¥{record.originalPrice}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '我们的价格',
      dataIndex: 'ourPrice',
      key: 'ourPrice',
      render: (price: number) => <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>¥{price}</Text>,
    },
    {
      title: '价差',
      key: 'priceGap',
      render: (_: any, record: CompetitorProduct) => (
        <Space direction="vertical" size={0}>
          <Text
            strong
            style={{
              color: record.priceGap > 0 ? '#52c41a' : record.priceGap < 0 ? '#ff4d4f' : '#faad14',
              fontSize: '16px'
            }}
          >
            {record.priceGap > 0 ? '+' : ''}{record.priceGap}
          </Text>
          <Text type="secondary" className="text-sm">
            {record.priceGapPercent > 0 ? '+' : ''}{record.priceGapPercent.toFixed(1)}%
          </Text>
        </Space>
      ),
    },
    {
      title: '价格区间',
      key: 'priceRange',
      render: (_: any, record: CompetitorProduct) => (
        <Space direction="vertical" size={0} style={{ width: 120 }}>
          <Text type="secondary" className="text-xs">最低：¥{record.lowestPrice}</Text>
          <Progress
            percent={((record.price - record.lowestPrice) / (record.highestPrice - record.lowestPrice)) * 100}
            size="small"
            showInfo={false}
            strokeColor="#1890ff"
          />
          <Text type="secondary" className="text-xs">最高：¥{record.highestPrice}</Text>
        </Space>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (time: string) => <Text className="text-sm">{time}</Text>,
    },
  ]

  const alertColumns = [
    {
      title: '商品',
      dataIndex: 'productName',
      key: 'productName',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: '竞品',
      dataIndex: 'competitorName',
      key: 'competitorName',
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
      title: '提醒类型',
      dataIndex: 'alertType',
      key: 'alertType',
      render: (type: string) => {
        const typeMap: Record<string, { text: string; color: string }> = {
          price_above: { text: '价格高于', color: 'red' },
          price_below: { text: '价格低于', color: 'green' },
          price_change: { text: '价格变化', color: 'blue' },
        }
        const t = typeMap[type]
        return <Tag color={t.color}>{t.text}</Tag>
      },
    },
    {
      title: '阈值',
      dataIndex: 'threshold',
      key: 'threshold',
      render: (threshold: number, record: PriceAlert) => (
        <Text>¥{threshold} {record.alertType === 'price_change' ? '%' : ''}</Text>
      ),
    },
    {
      title: '当前价格',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (price: number) => <Text strong>¥{price}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const s = alertStatusMap[status]
        return <Badge status={status === 'active' ? 'processing' : status === 'triggered' ? 'success' : 'default'} text={s.text} />
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => <Text className="text-sm">{time}</Text>,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
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
          <Title level={2}>价格监控</Title>
          <Text type="secondary">实时监控竞品价格，智能分析价格趋势</Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="监控商品"
                value={stats.totalProducts}
                prefix={<SearchOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="平均价差"
                value={stats.avgPriceGap.toFixed(1)}
                suffix="%"
                prefix={<DollarOutlined />}
                valueStyle={{ color: stats.avgPriceGap > 0 ? '#52c41a' : '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Row gutter={8}>
                <Col span={12}>
                  <Statistic
                    title="价格下跌"
                    value={stats.priceDown}
                    prefix={<TrendingDownOutlined />}
                    valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="价格上涨"
                    value={stats.priceUp}
                    prefix={<TrendingUpOutlined />}
                    valueStyle={{ color: '#ff4d4f', fontSize: '20px' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="生效提醒"
                value={stats.activeAlerts}
                prefix={<BellOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 价格建议 */}
        {competitorProducts.some(p => p.priceGapPercent < -5) && (
          <Alert
            message="价格建议"
            description={
              <Space direction="vertical" size="small">
                <Text>检测到 {competitorProducts.filter(p => p.priceGapPercent < -5).length} 个商品价格高于竞品超过5%，建议考虑降价策略以保持竞争力。</Text>
                <Text type="secondary" className="text-sm">
                  平均需降价 {Math.abs(competitorProducts.filter(p => p.priceGapPercent < -5).reduce((sum, p) => sum + p.priceGapPercent, 0) / competitorProducts.filter(p => p.priceGapPercent < -5).length).toFixed(1)}%
                </Text>
              </Space>
            }
            type="warning"
            showIcon
            className="mb-6"
          />
        )}

        {/* 筛选条件 */}
        <Card className="mb-6">
          <Form form={form} layout="inline" onFinish={handleFilter}>
            <Form.Item name="keyword" label="关键词">
              <Input placeholder="商品名称" prefix={<SearchOutlined />} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="platform" label="平台">
              <Select placeholder="全部平台" style={{ width: 150 }} allowClear>
                {platforms.map(p => (
                  <Select.Option key={p.id} value={p.id}>{p.icon} {p.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="trend" label="趋势">
              <Select placeholder="全部趋势" style={{ width: 150 }} allowClear>
                <Select.Option value="up">上涨</Select.Option>
                <Select.Option value="down">下跌</Select.Option>
                <Select.Option value="stable">持平</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" icon={<FilterOutlined />}>筛选</Button>
                <Button>重置</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* 竞品价格 */}
        <Card
          title="竞品价格监控"
          extra={
            <Button icon={<PlusOutlined />} onClick={handleAddAlert}>
              添加提醒
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={competitorProducts}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            scroll={{ x: true }}
          />
        </Card>

        {/* 价格提醒 */}
        <Card
          title="价格提醒"
          className="mt-6"
          extra={
            <Text type="secondary">共 {priceAlerts.length} 条提醒</Text>
          }
        >
          <Table
            columns={alertColumns}
            dataSource={priceAlerts}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            scroll={{ x: true }}
          />
        </Card>
      </div>
    </div>
  )
}
