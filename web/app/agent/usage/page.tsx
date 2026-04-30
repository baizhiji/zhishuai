'use client'

import { useState } from 'react'
import { Card, Row, Col, Table, Tag, Select, DatePicker, Space, Typography, Progress } from 'antd'
import {
  VideoCameraOutlined,
  FileTextOutlined,
  MessageOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const { Title, Text } = Typography

export default function UsageReportPage() {
  const [timeRange, setTimeRange] = useState<string>('7d')

  // 核心指标
  const stats = {
    contentGeneration: 1258,
    articleWriting: 856,
    smartReply: 2340,
    customerService: 890,
  }

  // 趋势数据
  const trendData = [
    { date: '周一', 内容生成: 180, 文章写作: 120, 智能回复: 320, 客服: 130 },
    { date: '周二', 内容生成: 195, 文章写作: 135, 智能回复: 350, 客服: 145 },
    { date: '周三', 内容生成: 175, 文章写作: 118, 智能回复: 310, 客服: 120 },
    { date: '周四', 内容生成: 210, 文章写作: 145, 智能回复: 380, 客服: 155 },
    { date: '周五', 内容生成: 225, 文章写作: 158, 智能回复: 420, 客服: 165 },
    { date: '周六', 内容生成: 145, 文章写作: 98, 智能回复: 280, 客服: 90 },
    { date: '周日', 内容生成: 128, 文章写作: 82, 智能回复: 280, 客服: 85 },
  ]

  // 使用记录
  const recordColumns = [
    { title: '用户', dataIndex: 'user', key: 'user', width: 120 },
    { title: '功能', dataIndex: 'feature', key: 'feature', width: 120,
      render: (feature: string) => (
        <Tag color="blue">{feature}</Tag>
      )
    },
    { title: '调用次数', dataIndex: 'count', key: 'count', width: 100 },
    { title: '消耗积分', dataIndex: 'points', key: 'points', width: 100 },
    { title: '时间', dataIndex: 'time', key: 'time', width: 180 },
  ]

  const recordData = [
    { key: '1', user: '张三', feature: '内容生成', count: 25, points: 500, time: '2024-03-25 14:30' },
    { key: '2', user: '李四', feature: '智能回复', count: 45, points: 225, time: '2024-03-25 13:20' },
    { key: '3', user: '王五', feature: '文章写作', count: 18, points: 360, time: '2024-03-25 11:15' },
    { key: '4', user: '赵六', feature: '客服', count: 32, points: 160, time: '2024-03-25 10:00' },
    { key: '5', user: '钱七', feature: '内容生成', count: 38, points: 760, time: '2024-03-25 09:30' },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>使用报表</Title>
          <Text type="secondary">功能使用数据统计与分析</Text>
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
                <VideoCameraOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>内容生成</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>{stats.contentGeneration}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileTextOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>文章写作</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{stats.articleWriting}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#fff7e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>智能回复</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>{stats.smartReply}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f9f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CustomerServiceOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>客服</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#722ed1' }}>{stats.customerService}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 趋势图表 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card bordered={false} title="使用趋势">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="内容生成" stroke="#1890ff" strokeWidth={2} />
                <Line type="monotone" dataKey="文章写作" stroke="#52c41a" strokeWidth={2} />
                <Line type="monotone" dataKey="智能回复" stroke="#fa8c16" strokeWidth={2} />
                <Line type="monotone" dataKey="客服" stroke="#722ed1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 使用记录 */}
      <Card bordered={false} title="使用记录">
        <Table
          dataSource={recordData}
          columns={recordColumns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
