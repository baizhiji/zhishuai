'use client'

import { useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Progress, Select, DatePicker, Space, Typography } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  RiseOutlined,
  LineChartOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  MessageOutlined,
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const { Title, Text } = Typography

export default function AgentAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<string>('7d')

  // 核心指标
  const stats = {
    totalCustomers: 1256,
    newCustomers: 156,
    activeCustomers: 982,
    activeRate: 78.2,
    tickets: 23,
    pendingTickets: 5,
  }

  // 趋势数据
  const trendData = [
    { date: '周一', 新增客户: 45, 活跃客户: 234 },
    { date: '周二', 新增客户: 52, 活跃客户: 267 },
    { date: '周三', 新增客户: 48, 活跃客户: 245 },
    { date: '周四', 新增客户: 61, 活跃客户: 289 },
    { date: '周五', 新增客户: 55, 活跃客户: 278 },
    { date: '周六', 新增客户: 28, 活跃客户: 156 },
    { date: '周日', 新增客户: 21, 活跃客户: 123 },
  ]

  // 功能分布
  const featureData = [
    { feature: '自媒体运营', count: 456, rate: 36.3 },
    { feature: '招聘助手', count: 312, rate: 24.8 },
    { feature: '智能获客', count: 289, rate: 23.0 },
    { feature: '推荐分享', count: 199, rate: 15.9 },
  ]

  // 工单统计
  const ticketStats = [
    { status: '待处理', count: 5, color: '#ff4d4f' },
    { status: '处理中', count: 8, color: '#fa8c16' },
    { status: '已完成', count: 10, color: '#52c41a' },
  ]

  // 客户排行
  const customerRanking = [
    { id: 1, name: '张三', phone: '138****0011', customers: 89, growth: 15.2 },
    { id: 2, name: '李四', phone: '139****0022', customers: 76, growth: 12.8 },
    { id: 3, name: '王五', phone: '137****0033', customers: 65, growth: 10.5 },
    { id: 4, name: '赵六', phone: '136****0044', customers: 54, growth: 8.3 },
  ]

  const rankingColumns = [
    { title: '排名', dataIndex: 'id', key: 'id', width: 60, render: (id: number) => <Tag color={id === 1 ? 'gold' : id === 2 ? 'silver' : id === 3 ? 'bronze' : 'default'}>{id}</Tag> },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '手机', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '客户数', dataIndex: 'customers', key: 'customers', width: 100 },
    {
      title: '增长率',
      dataIndex: 'growth',
      key: 'growth',
      width: 100,
      render: (growth: number) => <Text type="success">+{growth}%</Text>
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>数据大盘</Title>
          <Text type="secondary">区域代理后台 - 客户数据分析</Text>
        </div>
        <Space>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120 }}
            options={[
              { value: '7d', label: '近7天' },
              { value: '30d', label: '近30天' },
              { value: '90d', label: '近3个月' },
            ]}
          />
          <DatePicker.RangePicker />
        </Space>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="客户总数"
              value={stats.totalCustomers}
              suffix={<span style={{ fontSize: 14, color: '#52c41a' }}>+{stats.newCustomers}</span>}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="活跃客户"
              value={stats.activeCustomers}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="活跃率"
              value={stats.activeRate}
              suffix="%"
              prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="待处理工单"
              value={stats.pendingTickets}
              prefix={<MessageOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card bordered={false} title={<><LineChartOutlined style={{ marginRight: 8 }} />客户增长趋势</>}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="新增客户" stroke="#1890ff" strokeWidth={2} />
                <Line type="monotone" dataKey="活跃客户" stroke="#722ed1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card bordered={false} title={<><BarChartOutlined style={{ marginRight: 8 }} />功能分布</>}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis dataKey="feature" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#722ed1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 工单和排行 */}
      <Row gutter={16}>
        <Col span={8}>
          <Card bordered={false} title="工单统计">
            {ticketStats.map((item, index) => (
              <div key={index} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{item.status}</Text>
                  <Text style={{ color: item.color }}>{item.count}</Text>
                </div>
                <Progress percent={Math.round((item.count / stats.tickets) * 100)} strokeColor={item.color} />
              </div>
            ))}
          </Card>
        </Col>
        <Col span={16}>
          <Card bordered={false} title={<><CheckCircleOutlined style={{ marginRight: 8 }} />客户排行</>}>
            <Table
              dataSource={customerRanking}
              columns={rankingColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
