'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Progress,
  Typography,
  Space,
  Spin,
  DatePicker,
} from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  RiseOutlined,
  DollarCircleOutlined,
  BarChartOutlined,
  LineChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

// 动态导入图表组件，禁用 SSR
const LineChart = dynamic(() => import('@ant-design/charts').then(mod => mod.Line), { ssr: false, loading: () => <Spin /> })
const PieChart = dynamic(() => import('@ant-design/charts').then(mod => mod.Pie), { ssr: false, loading: () => <Spin /> })

// Mock 数据
const mockData = {
  overview: {
    totalUsers: 1248,
    activeUsers: 892,
    todayViews: 45678,
    todayLikes: 2345,
    totalVideos: 89,
    todayPublish: 12,
    growth: 23.5,
  },
  platformStats: [
    { platform: '抖音', accounts: 45, views: 125680, likes: 8960, followers: 12580 },
    { platform: '快手', accounts: 32, views: 89650, likes: 5680, followers: 8960 },
    { platform: '小红书', accounts: 28, views: 67890, likes: 7890, followers: 6780 },
    { platform: '视频号', accounts: 18, views: 45670, likes: 3450, followers: 4560 },
  ],
  publishTrend: [
    { date: '2024-04-01', count: 28 },
    { date: '2024-04-02', count: 35 },
    { date: '2024-04-03', count: 42 },
    { date: '2024-04-04', count: 38 },
    { date: '2024-04-05', count: 45 },
    { date: '2024-04-06', count: 52 },
    { date: '2024-04-07', count: 48 },
  ],
  recruitmentStats: {
    posted: 156,
    viewed: 8960,
    applied: 458,
    interviewed: 89,
    hired: 23,
  },
  recentPublish: [
    { id: 1, title: 'AI技术如何改变内容创作', platform: '抖音', status: '已发布', views: 12580, likes: 896, comments: 45, time: '10:30' },
    { id: 2, title: '短视频运营实战技巧分享', platform: '快手', status: '已发布', views: 8960, likes: 568, comments: 32, time: '09:15' },
    { id: 3, title: '企业如何做好品牌营销', platform: '小红书', status: '待发布', views: 0, likes: 0, comments: 0, time: '14:00' },
    { id: 4, title: '新媒体运营从入门到精通', platform: '视频号', status: '已发布', views: 6780, likes: 345, comments: 28, time: '08:45' },
  ],
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // 折线图配置
  const lineConfig = {
    data: mockData.publishTrend,
    height: 300,
    padding: 'auto',
    xField: 'date',
    yField: 'count',
    smooth: true,
    color: '#1890ff',
    point: { size: 5, shape: 'circle', style: { fill: 'white', stroke: '#1890ff', lineWidth: 2 } },
    label: { style: { fontSize: 12 } },
    xAxis: { label: { formatter: (v: string) => v.slice(5) } },
    yAxis: { min: 0 },
  }

  // 饼图配置
  const pieData = mockData.platformStats.map(item => ({ type: item.platform, value: item.accounts }))
  const pieConfig = {
    data: pieData,
    height: 300,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: { type: 'spider', content: '{name}\n{percentage}' },
    legend: { position: 'right' as const },
    statistic: { title: { content: '总计' }, content: { content: '{y}' } },
  }

  // 表格列
  const columns: ColumnsType<any> = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '平台', dataIndex: 'platform', key: 'platform', width: 100,
      render: (platform: string) => (
        <Tag color={{ 抖音: '#fe2c55', 快手: '#ff4906', 小红书: '#ff2442', 视频号: '#07c160' }[platform] || 'default'}>
          {platform}
        </Tag>
      )
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: string) => (
        <Tag color={status === '已发布' ? 'success' : 'warning'}>{status}</Tag>
      )
    },
    { title: '浏览', dataIndex: 'views', key: 'views', width: 100, render: (v: number) => v.toLocaleString() },
    { title: '点赞', dataIndex: 'likes', key: 'likes', width: 100, render: (v: number) => v.toLocaleString() },
    { title: '评论', dataIndex: 'comments', key: 'comments', width: 80 },
    { title: '时间', dataIndex: 'time', key: 'time', width: 80 },
  ]

  return (
    <div style={{ padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>数据大盘</Title>
        <RangePicker value={dateRange} onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
      </div>

      {/* 核心指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable>
            <Statistic
              title={<Space><UserOutlined /> 总用户数</Space>}
              value={mockData.overview.totalUsers}
              suffix={<Text type="secondary">人</Text>}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
            <div style={{ marginTop: 8 }}>
              <Progress percent={71} size="small" showInfo={false} strokeColor="#52c41a" />
              <Text type="secondary" style={{ fontSize: 12 }}>活跃率 71.5%</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable>
            <Statistic
              title={<Space><EyeOutlined /> 今日浏览</Space>}
              value={mockData.overview.todayViews}
              formatter={(value) => (value as number).toLocaleString()}
              suffix={<Text type="secondary">次</Text>}
              prefix={<RiseOutlined style={{ color: '#1890ff' }} />}
            />
            <div style={{ marginTop: 8 }}>
              <Progress percent={23} size="small" showInfo={false} strokeColor="#1890ff" />
              <Text type="secondary" style={{ fontSize: 12 }}>较昨日 +23.5%</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable>
            <Statistic
              title={<Space><LikeOutlined /> 今日获赞</Space>}
              value={mockData.overview.todayLikes}
              formatter={(value) => (value as number).toLocaleString()}
              suffix={<Text type="secondary">次</Text>}
              prefix={<LikeOutlined style={{ color: '#eb2f96' }} />}
            />
            <div style={{ marginTop: 8 }}>
              <Progress percent={18} size="small" showInfo={false} strokeColor="#eb2f96" />
              <Text type="secondary" style={{ fontSize: 12 }}>较昨日 +18.2%</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable>
            <Statistic
              title={<Space><VideoCameraOutlined /> 已发布视频</Space>}
              value={mockData.overview.totalVideos}
              suffix={<Text type="secondary">个</Text>}
              prefix={<VideoCameraOutlined style={{ color: '#722ed1' }} />}
            />
            <div style={{ marginTop: 8 }}>
              <Progress percent={12} size="small" showInfo={false} strokeColor="#722ed1" />
              <Text type="secondary" style={{ fontSize: 12 }}>今日发布 12 个</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card 
            loading={loading} 
            hoverable
            title={<Space><LineChartOutlined /> 发布趋势</Space>}
          >
            <LineChart {...lineConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card 
            loading={loading} 
            hoverable
            title={<Space><BarChartOutlined /> 平台账号分布</Space>}
          >
            <PieChart {...pieConfig} />
          </Card>
        </Col>
      </Row>

      {/* 招聘数据 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card loading={loading} hoverable title={<Space><TeamOutlined /> 招聘数据概览</Space>}>
            <Row gutter={16}>
              <Col span={4}>
                <Statistic title="已发布职位" value={mockData.recruitmentStats.posted} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
              </Col>
              <Col span={4}>
                <Statistic title="浏览次数" value={mockData.recruitmentStats.viewed} formatter={(v) => (v as number).toLocaleString()} />
              </Col>
              <Col span={4}>
                <Statistic title="收到简历" value={mockData.recruitmentStats.applied} />
              </Col>
              <Col span={4}>
                <Statistic title="已面试" value={mockData.recruitmentStats.interviewed} />
              </Col>
              <Col span={4}>
                <Statistic title="已入职" value={mockData.recruitmentStats.hired} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
              </Col>
              <Col span={4}>
                <Progress type="circle" percent={15} size={60} format={(p) => `${p}%`} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 最新发布 */}
      <Card loading={loading} hoverable title={<Space><VideoCameraOutlined /> 最新发布</Space>}>
        <Table
          columns={columns}
          dataSource={mockData.recentPublish}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  )
}
