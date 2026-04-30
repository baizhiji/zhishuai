'use client'

import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Tag,
  Space,
  Select,
  Progress
} from 'antd'
import {
  UserOutlined,
  TrophyOutlined,
  RiseOutlined,
  ArrowUpOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dynamic from 'next/dynamic'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

const { Title, Text } = Typography
const { Option } = Select

// Mock 数据
interface ReferralItem {
  key: string
  rank: number
  customer: string
  company: string
  referCount: number
  activeCount: number
  month: string
}

const mockReferrals: ReferralItem[] = [
  { key: '1', rank: 1, customer: '陈总', company: '广州某信息科技', referCount: 35, activeCount: 28, month: '2025-04' },
  { key: '2', rank: 2, customer: '李总监', company: '杭州某网络公司', referCount: 28, activeCount: 22, month: '2025-04' },
  { key: '3', rank: 3, customer: '张经理', company: '上海某科技有限公司', referCount: 12, activeCount: 10, month: '2025-04' },
  { key: '4', rank: 4, customer: '刘经理', company: '深圳某电商公司', referCount: 8, activeCount: 6, month: '2025-04' },
  { key: '5', rank: 5, customer: '王主管', company: '北京某文化传媒', referCount: 5, activeCount: 4, month: '2025-04' }
]

// Mock 月度趋势
const mockTrendData = {
  months: ['2025-01', '2025-02', '2025-03', '2025-04'],
  referCount: [25, 32, 45, 88],
  activeCount: [18, 24, 36, 70]
}

export default function ReferralDashboard() {
  const [timeRange, setTimeRange] = useState<string>('30d')

  // 统计数据
  const stats = {
    totalRefer: 88,
    totalActive: 70,
    activeRate: 79.5,
    thisMonth: 28,
    lastMonth: 20,
    growth: 40
  }

  // 图表配置
  const trendOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['推荐人数', '活跃用户']
    },
    xAxis: {
      type: 'category',
      data: mockTrendData.months
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '推荐人数',
        type: 'bar',
        data: mockTrendData.referCount,
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '活跃用户',
        type: 'bar',
        data: mockTrendData.activeCount,
        itemStyle: { color: '#52c41a' }
      }
    ]
  }

  const columns: ColumnsType<ReferralItem> = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      render: (rank: number) => {
        return rank <= 3 ? (
          <Tag color={rank === 1 ? 'gold' : rank === 2 ? 'default' : 'orange'}>
            {rank}
          </Tag>
        ) : (
          <Tag>{rank}</Tag>
        )
      }
    },
    {
      title: '客户',
      key: 'customer',
      render: (_, record) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.customer}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.company}</Text>
          </div>
        </Space>
      )
    },
    {
      title: '推荐人数',
      dataIndex: 'referCount',
      key: 'referCount',
      sorter: (a, b) => a.referCount - b.referCount,
      render: (count: number) => (
        <Text strong style={{ color: '#1890ff' }}>{count}</Text>
      )
    },
    {
      title: '活跃用户',
      dataIndex: 'activeCount',
      key: 'activeCount',
      render: (count: number, record) => (
        <div>
          <Text>{count}</Text>
          <Progress 
            percent={Math.round(count / record.referCount * 100)} 
            size="small" 
            showInfo={false}
            strokeColor="#52c41a"
          />
        </div>
      )
    },
    {
      title: '活跃率',
      key: 'activeRate',
      render: (_, record) => {
        const rate = Math.round(record.activeCount / record.referCount * 100)
        return <Tag color={rate >= 80 ? 'success' : rate >= 60 ? 'processing' : 'warning'}>{rate}%</Tag>
      }
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">推荐数据看板</Title>
        <Text type="secondary">查看名下所有客户的推荐总人数、活跃用户数统计</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Card>
            <Statistic 
              title="推荐总人数" 
              value={stats.totalRefer} 
              prefix={<UserOutlined />}
              suffix={<span style={{ fontSize: 14, color: '#52c41a' }}>人</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="活跃用户数" 
              value={stats.totalActive} 
              prefix={<TrophyOutlined />}
              suffix={<span style={{ fontSize: 14, color: '#52c41a' }}>人</span>}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="本月新增" 
              value={stats.thisMonth} 
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <span style={{ fontSize: 14 }}>
                  <ArrowUpOutlined style={{ color: '#52c41a' }} /> {stats.growth}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="活跃率" 
              value={stats.activeRate} 
              suffix={<span style={{ fontSize: 14, color: '#52c41a' }}>%</span>}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={16} className="mb-4">
        <Col span={24}>
          <Card 
            title="推荐趋势" 
            extra={
              <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }}>
                <Option value="7d">近7天</Option>
                <Option value="30d">近30天</Option>
                <Option value="90d">近90天</Option>
              </Select>
            }
          >
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {/* 排行榜 */}
      <Card title="客户推荐排行榜">
        <Table
          rowKey="key"
          columns={columns}
          dataSource={mockReferrals}
          pagination={false}
        />
      </Card>
    </div>
  )
}
