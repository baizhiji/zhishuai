'use client'

import React, { useState, useEffect } from 'react'
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
import { Line, Pie, Column } from '@ant-design/charts'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

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
  const [overview, setOverview] = useState(mockData.overview)
  const [platformStats, setPlatformStats] = useState(mockData.platformStats)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const lineConfig = {
    data: mockData.publishTrend,
    height: 280,
    xField: 'date',
    yField: 'count',
    smooth: true,
    color: '#1890ff',
    point: { size: 5, shape: 'circle' },
    area: { style: { fill: 'l(270) 0:#ffffff 1:#1890ff', fillOpacity: 0.2 } },
    xAxis: { label: { formatter: (v: string) => dayjs(v).format('MM/DD') } },
    yAxis: { label: { formatter: (v: string) => `${v}条` } },
  }

  const pieConfig = {
    data: [
      { type: '抖音', value: 45 },
      { type: '快手', value: 32 },
      { type: '小红书', value: 28 },
      { type: '视频号', value: 18 },
    ],
    height: 200,
    radius: 0.8,
    innerRadius: 0.6,
    colorField: 'type',
    color: ['#fe4c4c', '#ffc53d', '#73d13d', '#1890ff'],
    label: { text: 'type', style: { fontWeight: 'bold' } },
    legend: { color: { title: false, position: 'right' } },
  }

  const columns: ColumnsType<typeof mockData.recentPublish[0]> = [
    {
      title: '内容标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{text}</span>
          <Tag color={record.platform === '抖音' ? 'red' : record.platform === '快手' ? 'orange' : record.platform === '小红书' ? 'green' : 'blue'}>
            {record.platform}
          </Tag>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === '已发布' ? 'success' : 'warning'}>{status}</Tag>
      ),
    },
    {
      title: '播放/浏览',
      dataIndex: 'views',
      key: 'views',
      render: (v: number) => <Text style={{ color: '#1890ff' }}>{v.toLocaleString()}</Text>,
    },
    {
      title: '点赞',
      dataIndex: 'likes',
      key: 'likes',
      render: (v: number) => <Text style={{ color: '#52c41a' }}>{v.toLocaleString()}</Text>,
    },
    {
      title: '评论',
      dataIndex: 'comments',
      key: 'comments',
      render: (v: number) => <Text style={{ color: '#722ed1' }}>{v}</Text>,
    },
    {
      title: '发布时间',
      dataIndex: 'time',
      key: 'time',
      render: (t: string) => <Text type="secondary">{t}</Text>,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Spin spinning={loading} tip="加载数据中...">
        {/* 页面标题 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>数据大盘</Title>
          <Text type="secondary">实时掌握业务运营情况</Text>
        </div>

        {/* 核心指标 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card loading={loading} hoverable>
              <Statistic
                title="团队总人数"
                value={overview.totalUsers}
                prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                suffix={<span style={{ fontSize: 14, color: '#52c41a' }}><RiseOutlined /> +{overview.growth}%</span>}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card loading={loading} hoverable>
              <Statistic
                title="活跃用户"
                value={overview.activeUsers}
                prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                suffix={<span style={{ fontSize: 14, color: '#8c8c8c' }}>人</span>}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card loading={loading} hoverable>
              <Statistic
                title="今日浏览量"
                value={overview.todayViews}
                prefix={<EyeOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card loading={loading} hoverable>
              <Statistic
                title="今日获客"
                value={overview.todayPublish}
                prefix={<VideoCameraOutlined style={{ color: '#faad14' }} />}
                suffix={<span style={{ fontSize: 14, color: '#8c8c8c' }}>条</span>}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={24}>
          {/* 发布趋势 */}
          <Col span={16}>
            <Card
              title={
                <Space>
                  <LineChartOutlined style={{ color: '#1890ff' }} />
                  <span>发布趋势</span>
                </Space>
              }
              extra={<RangePicker size="small" style={{ width: 240 }} />}
              loading={loading}
            >
              <Line {...lineConfig} />
            </Card>
          </Col>

          {/* 平台分布 */}
          <Col span={8}>
            <Card
              title={
                <Space>
                  <BarChartOutlined style={{ color: '#722ed1' }} />
                  <span>平台账号分布</span>
                </Space>
              }
              loading={loading}
            >
              <Pie {...pieConfig} />
              <div style={{ marginTop: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {platformStats.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>{p.platform}</Text>
                      <Text strong>{p.accounts} 个</Text>
                    </div>
                  ))}
                </Space>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 招聘数据 */}
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={4}>
            <Card loading={loading} hoverable>
              <Statistic
                title="已发布职位"
                value={mockData.recruitmentStats.posted}
                valueStyle={{ fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card loading={loading} hoverable>
              <Statistic
                title="浏览次数"
                value={mockData.recruitmentStats.viewed}
                valueStyle={{ fontSize: 24, color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card loading={loading} hoverable>
              <Statistic
                title="投递简历"
                value={mockData.recruitmentStats.applied}
                valueStyle={{ fontSize: 24, color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card loading={loading} hoverable>
              <Statistic
                title="邀约面试"
                value={mockData.recruitmentStats.interviewed}
                valueStyle={{ fontSize: 24, color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card loading={loading} hoverable>
              <Statistic
                title="成功入职"
                value={mockData.recruitmentStats.hired}
                valueStyle={{ fontSize: 24, color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card loading={loading} hoverable>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>转化率</Text>
                <Progress
                  percent={Math.round(mockData.recruitmentStats.hired / mockData.recruitmentStats.applied * 100)}
                  size="small"
                  strokeColor="#52c41a"
                />
              </div>
            </Card>
          </Col>
        </Row>

        {/* 最新发布 */}
        <Card
          title={
            <Space>
              <VideoCameraOutlined style={{ color: '#1890ff' }} />
              <span>最新发布</span>
            </Space>
          }
          style={{ marginTop: 24 }}
          loading={loading}
        >
          <Table
            columns={columns}
            dataSource={mockData.recentPublish}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        </Card>
      </Spin>
    </div>
  )
}
