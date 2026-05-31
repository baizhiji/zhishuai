'use client'

import { useState } from 'react'
import { Card, Row, Col, Table, Tag, Select, DatePicker, Space, Typography, Progress } from 'antd'
import {
  UserAddOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const { Title, Text } = Typography

export default function ReferralsPage() {
  const [timeRange, setTimeRange] = useState<string>('7d')

  // 核心指标
  const stats = {
    totalReferrals: 156,
    activeUsers: 128,
    conversions: 128,
    conversionRate: 82,
  }

  // 趋势数据
  const trendData = [
    { date: '周一', 推荐: 23, 活跃用户: 18, 转化: 15 },
    { date: '周二', 推荐: 25, 活跃用户: 20, 转化: 17 },
    { date: '周三', 推荐: 21, 活跃用户: 17, 转化: 14 },
    { date: '周四', 推荐: 28, 活跃用户: 23, 转化: 19 },
    { date: '周五', 推荐: 32, 活跃用户: 26, 转化: 22 },
    { date: '周六', 推荐: 15, 活跃用户: 12, 转化: 10 },
    { date: '周日', 推荐: 12, 活跃用户: 10, 转化: 8 },
  ]

  // 推荐记录
  const recordColumns = [
    { title: '推荐人', dataIndex: 'referrer', key: 'referrer', width: 120 },
    { title: '推荐时间', dataIndex: 'time', key: 'time', width: 180 },
    { title: '被推荐人', dataIndex: 'referred', key: 'referred', width: 120 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: string) => (
        <Tag color={status === '成功' ? 'success' : status === '待激活' ? 'warning' : 'default'}>
          {status}
        </Tag>
      )
    },
    { title: '注册时间', dataIndex: 'registerTime', key: 'registerTime', width: 180 },
  ]

  const recordData = [
    { key: '1', referrer: '张三', time: '2024-03-25 14:30', referred: '李四', status: '成功', registerTime: '2024-03-25 15:00' },
    { key: '2', referrer: '张三', time: '2024-03-24 11:20', referred: '王五', status: '成功', registerTime: '2024-03-24 12:00' },
    { key: '3', referrer: '李四', time: '2024-03-23 09:15', referred: '赵六', status: '待激活', registerTime: '-' },
    { key: '4', referrer: '王五', time: '2024-03-22 16:45', referred: '钱七', status: '成功', registerTime: '2024-03-22 17:30' },
    { key: '5', referrer: '李四', time: '2024-03-21 10:00', referred: '孙八', status: '成功', registerTime: '2024-03-21 11:00' },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>推荐数据</Title>
          <Text type="secondary">推荐分享数据统计与分析</Text>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserAddOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>总推荐数</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>{stats.totalReferrals}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TeamOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>活跃用户</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{stats.activeUsers}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#fff7e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>成功转化</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>{stats.conversions}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f9f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RiseOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>转化率</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#722ed1' }}>{stats.conversionRate}%</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 趋势图表 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card bordered={false} title="推荐趋势">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="推荐" stroke="#1890ff" strokeWidth={2} />
                <Line type="monotone" dataKey="活跃用户" stroke="#52c41a" strokeWidth={2} />
                <Line type="monotone" dataKey="转化" stroke="#fa8c16" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 推荐记录 */}
      <Card bordered={false} title="推荐记录">
        <Table
          dataSource={recordData}
          columns={recordColumns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
