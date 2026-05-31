'use client'

import { useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Progress, Select, DatePicker, Space, Typography } from 'antd'
import {
  ApartmentOutlined,
  UserOutlined,
  TeamOutlined,
  RiseOutlined,
  LineChartOutlined,
  BarChartOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const { Title, Text } = Typography

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<string>('7d')

  // 核心指标
  const stats = {
    totalAgents: 35,
    newAgents: 5,
    totalCustomers: 12580,
    newCustomers: 1256,
    activeCustomers: 9820,
    activeRate: 78.1,
  }

  // 趋势数据
  const trendData = [
    { date: '周一', 代理商: 3, 客户: 156 },
    { date: '周二', 代理商: 4, 客户: 189 },
    { date: '周三', 代理商: 2, 客户: 167 },
    { date: '周四', 代理商: 5, 客户: 201 },
    { date: '周五', 代理商: 3, 客户: 178 },
    { date: '周六', 代理商: 1, 客户: 89 },
    { date: '周日', 代理商: 1, 客户: 67 },
  ]

  // 平台分布
  const platformData = [
    { platform: '华东地区', count: 456, rate: 36.2 },
    { platform: '华南地区', count: 389, rate: 30.9 },
    { platform: '华北地区', count: 312, rate: 24.8 },
    { platform: '西南地区', count: 123, rate: 9.8 },
  ]

  // 功能使用率
  const featureUsage = [
    { name: '自媒体运营', usage: 85, users: 856 },
    { name: '招聘助手', usage: 62, users: 523 },
    { name: '智能获客', usage: 45, users: 389 },
    { name: '推荐分享', usage: 28, users: 234 },
  ]

  // 区域排行
  const regionRanking = [
    { id: 1, region: '华东大区', agents: 15, customers: 456, growth: 18.5 },
    { id: 2, region: '华南大区', agents: 12, customers: 389, growth: 12.3 },
    { id: 3, region: '华北区域', agents: 8, customers: 312, growth: 15.8 },
    { id: 4, region: '西南区域', agents: 5, customers: 123, growth: 8.2 },
  ]

  const rankingColumns = [
    { title: '排名', dataIndex: 'id', key: 'id', width: 60, render: (id: number) => <Tag color={id === 1 ? 'gold' : id === 2 ? 'silver' : id === 3 ? 'bronze' : 'default'}>{id}</Tag> },
    { title: '区域', dataIndex: 'region', key: 'region', width: 120 },
    { title: '代理商', dataIndex: 'agents', key: 'agents', width: 100 },
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
          <Text type="secondary">开发者总后台 - 全局数据监控</Text>
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
              title="代理商总数"
              value={stats.totalAgents}
              suffix={<span style={{ fontSize: 14, color: '#52c41a' }}>+{stats.newAgents}</span>}
              prefix={<ApartmentOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="客户总数"
              value={stats.totalCustomers}
              suffix={<span style={{ fontSize: 14, color: '#52c41a' }}>+{stats.newCustomers}</span>}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="活跃客户"
              value={stats.activeCustomers}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="活跃率"
              value={stats.activeRate}
              suffix="%"
              prefix={<RiseOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card bordered={false} title={<><LineChartOutlined style={{ marginRight: 8 }} />增长趋势</>}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="代理商" stroke="#1890ff" strokeWidth={2} />
                <Line type="monotone" dataKey="客户" stroke="#722ed1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card bordered={false} title={<><BarChartOutlined style={{ marginRight: 8 }} />区域分布</>}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis dataKey="platform" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#1890ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 功能使用和排行 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card bordered={false} title="功能使用率">
            {featureUsage.map((item, index) => (
              <div key={index} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{item.name}</Text>
                  <Text type="secondary">{item.users} 用户</Text>
                </div>
                <Progress percent={item.usage} strokeColor="#1890ff" />
              </div>
            ))}
          </Card>
        </Col>
        <Col span={12}>
          <Card bordered={false} title={<><CheckCircleOutlined style={{ marginRight: 8 }} />区域排行</>}>
            <Table
              dataSource={regionRanking}
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
