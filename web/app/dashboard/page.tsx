'use client'

import { useState } from 'react'
import { Card, Row, Col, DatePicker, Space, Typography, Statistic, Progress } from 'antd'
import {
  UserOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  VideoCameraOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart, Bar, Cell } from 'recharts'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<string>('7d')

  // 核心指标
  const stats = {
    totalUsers: 12580,
    activeUsers: 1567,
    posts: 892,
    interactions: 45680,
  }

  // 平台分布
  const platformData = [
    { name: '抖音', value: 35, color: '#fe2c55' },
    { name: '快手', value: 25, color: '#ff4906' },
    { name: '小红书', value: 20, color: '#ff2442' },
    { name: '微信', value: 12, color: '#07c160' },
    { name: '视频号', value: 8, color: '#69717f' },
  ]

  // 趋势数据
  const trendData = [
    { date: '周一', 用户增长: 120, 活跃用户: 980, 发布量: 85, 互动量: 3200 },
    { date: '周二', 用户增长: 135, 活跃用户: 1050, 发布量: 92, 互动量: 3580 },
    { date: '周三', 用户增长: 128, 活跃用户: 1100, 发布量: 88, 互动量: 3650 },
    { date: '周四', 用户增长: 142, 活跃用户: 1180, 发布量: 98, 互动量: 4100 },
    { date: '周五', 用户增长: 155, 活跃用户: 1250, 发布量: 105, 互动量: 4350 },
    { date: '周六', 用户增长: 88, 活跃用户: 890, 发布量: 65, 互动量: 2800 },
    { date: '周日', 用户增长: 75, 活跃用户: 820, 发布量: 58, 互动量: 2500 },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>数据大盘</Title>
          <Text type="secondary">运营数据汇总与分析</Text>
        </div>
        <Space>
          <RangePicker />
        </Space>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="活跃用户"
              value={stats.activeUsers}
              prefix={<EyeOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="发布量"
              value={stats.posts}
              prefix={<VideoCameraOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="互动量"
              value={stats.interactions}
              prefix={<LikeOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card bordered={false} title="用户活跃趋势">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="活跃用户" stroke="#52c41a" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="发布量" stroke="#722ed1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} title="平台分布">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {platformData.map((item) => (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>{item.name}</Text>
                    <Text strong>{item.value}%</Text>
                  </div>
                  <Progress percent={item.value} showInfo={false} strokeColor={item.color} />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 招聘数据 */}
      <Row gutter={16}>
        <Col span={24}>
          <Card bordered={false} title="招聘数据">
            <Row gutter={16}>
              <Col span={6}>
                <Card bordered={false} style={{ background: '#f0f5ff' }}>
                  <Statistic title="在招职位" value={58} />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered={false} style={{ background: '#f6ffed' }}>
                  <Statistic title="简历总数" value={1268} />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered={false} style={{ background: '#fff7e6' }}>
                  <Statistic title="待面试" value={86} />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered={false} style={{ background: '#f9f0ff' }}>
                  <Statistic title="入职人数" value={42} />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
