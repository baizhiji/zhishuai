'use client'

import React from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Table,
  Progress,
  Tag,
  Space,
  Button
} from 'antd'
import {
  UserOutlined,
  RiseOutlined,
  AppstoreOutlined,
  TeamOutlined,
  TrophyOutlined,
  DollarOutlined,
  AreaChartOutlined,
  ApiOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

// Mock 数据
const agentStats = [
  { key: '1', name: '华东代理商', customers: 456, active: 398, revenue: 125000, growth: 15 },
  { key: '2', name: '华南代理商', customers: 389, active: 342, revenue: 98000, growth: 12 },
  { key: '3', name: '西南代理商', customers: 215, active: 189, revenue: 56000, growth: 8 },
  { key: '4', name: '华北代理商', customers: 178, active: 156, revenue: 45000, growth: -3 },
  { key: '5', name: '西北代理商', customers: 98, active: 89, revenue: 32000, growth: 22 }
]

const topFeatures = [
  { name: '自媒体运营', usage: 1568, percent: 95 },
  { name: '招聘助手', usage: 1245, percent: 78 },
  { name: '智能获客', usage: 892, percent: 62 },
  { name: '推荐分享', usage: 756, percent: 48 },
  { name: '转介绍', usage: 534, percent: 35 }
]

const apiUsage = [
  { date: '2024-01', calls: 125000, cost: 2500 },
  { date: '2024-02', calls: 145000, cost: 2900 },
  { date: '2024-03', calls: 168000, cost: 3360 },
  { date: '2024-04', calls: 182000, cost: 3640 },
  { date: '2024-05', calls: 195000, cost: 3900 },
  { date: '2024-06', calls: 210000, cost: 4200 }
]

const columns: ColumnsType<typeof agentStats[0]> = [
  {
    title: '代理商',
    dataIndex: 'name',
    key: 'name',
    render: (text) => <Text strong>{text}</Text>
  },
  {
    title: '客户总数',
    dataIndex: 'customers',
    key: 'customers',
    sorter: (a, b) => a.customers - b.customers,
    render: (val) => <Text>{val}</Text>
  },
  {
    title: '活跃客户',
    dataIndex: 'active',
    key: 'active',
    render: (val, record) => (
      <Space>
        <Text>{val}</Text>
        <Text type="secondary">({((val / record.customers) * 100).toFixed(0)}%)</Text>
      </Space>
    )
  },
  {
    title: '营收(元)',
    dataIndex: 'revenue',
    key: 'revenue',
    sorter: (a, b) => a.revenue - b.revenue,
    render: (val) => <Text style={{ color: '#52c41a' }}>¥{val.toLocaleString()}</Text>
  },
  {
    title: '增长率',
    dataIndex: 'growth',
    key: 'growth',
    sorter: (a, b) => a.growth - b.growth,
    render: (val) => (
      <Text style={{ color: val >= 0 ? '#52c41a' : '#ff4d4f' }}>
        {val >= 0 ? '+' : ''}{val}%
      </Text>
    )
  },
  {
    title: '趋势',
    key: 'trend',
    render: (_, record) => (
      <Progress 
        percent={Math.min((record.active / record.customers) * 100, 100)} 
        size="small"
        showInfo={false}
        strokeColor={record.growth >= 0 ? '#52c41a' : '#ff4d4f'}
      />
    )
  }
]

export default function AdminAnalytics() {
  const totalCustomers = agentStats.reduce((sum, a) => sum + a.customers, 0)
  const totalActive = agentStats.reduce((sum, a) => sum + a.active, 0)
  const totalRevenue = agentStats.reduce((sum, a) => sum + a.revenue, 0)

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">Admin 数据大盘</Title>
        <Text type="secondary">全平台统计：总客户数、活跃度、功能使用排行、API调用量</Text>
      </div>

      {/* 核心指标 */}
      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Card>
            <Statistic
              title="总客户数"
              value={totalCustomers}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃客户"
              value={totalActive}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              suffix={<Text type="secondary">({((totalActive / totalCustomers) * 100).toFixed(0)}%)</Text>}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总营收"
              value={totalRevenue}
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
              formatter={(value) => `¥${Number(value).toLocaleString()}`}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月API调用"
              value={210000}
              prefix={<ApiOutlined style={{ color: '#722ed1' }} />}
              suffix={<Text type="secondary">次</Text>}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* 代理商业绩排行 */}
        <Col span={14}>
          <Card 
            title={
              <Space>
                <TrophyOutlined style={{ color: '#faad14' }} />
                <span>代理商业绩排行</span>
              </Space>
            }
          >
            <Table
              rowKey="key"
              columns={columns}
              dataSource={agentStats}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* 功能使用排行 */}
        <Col span={10}>
          <Card 
            title={
              <Space>
                <AppstoreOutlined style={{ color: '#1890ff' }} />
                <span>功能使用排行</span>
              </Space>
            }
          >
            {topFeatures.map((f, i) => (
              <div key={f.name} style={{ marginBottom: 16 }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{i + 1}. {f.name}</Text>
                  <Text type="secondary">{f.usage}次</Text>
                </Space>
                <Progress 
                  percent={f.percent} 
                  size="small"
                  strokeColor={i === 0 ? '#1890ff' : i === 1 ? '#52c41a' : i === 2 ? '#faad14' : '#722ed1'}
                />
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* API调用趋势 */}
      <Row gutter={24} className="mt-4">
        <Col span={24}>
          <Card 
            title={
              <Space>
                <AreaChartOutlined style={{ color: '#722ed1' }} />
                <span>API调用趋势</span>
              </Space>
            }
          >
            <Table
              dataSource={apiUsage}
              rowKey="date"
              pagination={false}
              columns={[
                { title: '月份', dataIndex: 'date', key: 'date' },
                { 
                  title: '调用次数', 
                  dataIndex: 'calls', 
                  key: 'calls',
                  render: (val) => val.toLocaleString()
                },
                { 
                  title: '费用(元)', 
                  dataIndex: 'cost', 
                  key: 'cost',
                  render: (val) => `¥${val.toLocaleString()}`
                },
                {
                  title: '趋势',
                  key: 'trend',
                  render: (_, record, index) => {
                    if (index === 0) return <Tag>--</Tag>
                    const prev = apiUsage[index - 1]
                    const growth = ((record.calls - prev.calls) / prev.calls * 100).toFixed(1)
                    return (
                      <Text style={{ color: growth >= '0' ? '#52c41a' : '#ff4d4f' }}>
                        {growth >= '0' ? '+' : ''}{growth}%
                      </Text>
                    )
                  }
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
