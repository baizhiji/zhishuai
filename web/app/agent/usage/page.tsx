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
  DatePicker,
  Button,
  Progress
} from 'antd'
import {
  UploadOutlined,
  MessageOutlined,
  TeamOutlined,
  ShoppingOutlined,
  DownloadOutlined,
  ReloadOutlined,
  LineChartOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dynamic from 'next/dynamic'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

// Mock 数据
interface UsageRecord {
  key: string
  customer: string
  company: string
  apiCalls: number
  publishCount: number
  resumeCount: number
  prospectCount: number
  messageCount: number
  orderValue: number
  lastActive: string
}

const mockUsageData: UsageRecord[] = [
  { key: '1', customer: '陈总', company: '广州某信息科技', apiCalls: 12580, publishCount: 456, resumeCount: 89, prospectCount: 234, messageCount: 1890, orderValue: 12500, lastActive: '2025-04-29' },
  { key: '2', customer: '李总监', company: '杭州某网络公司', apiCalls: 9870, publishCount: 328, resumeCount: 67, prospectCount: 198, messageCount: 1456, orderValue: 9800, lastActive: '2025-04-29' },
  { key: '3', customer: '张经理', company: '上海某科技有限公司', apiCalls: 6540, publishCount: 234, resumeCount: 45, prospectCount: 123, messageCount: 890, orderValue: 6500, lastActive: '2025-04-28' },
  { key: '4', customer: '刘经理', company: '深圳某电商公司', apiCalls: 4320, publishCount: 189, resumeCount: 34, prospectCount: 98, messageCount: 567, orderValue: 4300, lastActive: '2025-04-27' },
  { key: '5', customer: '王主管', company: '北京某文化传媒', apiCalls: 2890, publishCount: 145, resumeCount: 23, prospectCount: 67, messageCount: 345, orderValue: 2900, lastActive: '2025-04-26' }
]

// Mock 趋势数据
const mockTrendData = {
  months: ['2025-01', '2025-02', '2025-03', '2025-04'],
  apiCalls: [28000, 32000, 38000, 45000],
  publish: [980, 1200, 1350, 1680],
  resumes: [180, 230, 290, 350],
  prospects: [450, 580, 720, 890],
  messages: [3200, 4100, 5200, 6500]
}

export default function UsageReport() {
  const [timeRange, setTimeRange] = useState<string>('30d')
  const [moduleFilter, setModuleFilter] = useState<string>('all')

  // 统计数据
  const stats = {
    totalApiCalls: 45000,
    totalPublish: 1680,
    totalResumes: 350,
    totalProspects: 890,
    totalMessages: 6500,
    totalOrders: 36500
  }

  // 趋势图配置
  const trendOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['API调用', '发布量', '简历数', '潜客数']
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
        name: 'API调用',
        type: 'line',
        data: mockTrendData.apiCalls,
        smooth: true,
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '发布量',
        type: 'line',
        data: mockTrendData.publish,
        smooth: true,
        itemStyle: { color: '#52c41a' }
      },
      {
        name: '简历数',
        type: 'line',
        data: mockTrendData.resumes,
        smooth: true,
        itemStyle: { color: '#722ed1' }
      },
      {
        name: '潜客数',
        type: 'line',
        data: mockTrendData.prospects,
        smooth: true,
        itemStyle: { color: '#fa8c16' }
      }
    ]
  }

  const columns: ColumnsType<UsageRecord> = [
    {
      title: '客户',
      key: 'customer',
      render: (_, record) => (
        <Space>
          <TeamOutlined style={{ color: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.customer}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.company}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'API调用',
      dataIndex: 'apiCalls',
      key: 'apiCalls',
      sorter: (a, b) => a.apiCalls - b.apiCalls,
      render: (calls: number) => (
        <Tag color="blue">{calls.toLocaleString()}</Tag>
      )
    },
    {
      title: '发布量',
      dataIndex: 'publishCount',
      key: 'publishCount',
      sorter: (a, b) => a.publishCount - b.publishCount,
      render: (count: number) => (
        <Tag color="green">{count}</Tag>
      )
    },
    {
      title: '简历处理',
      dataIndex: 'resumeCount',
      key: 'resumeCount',
      sorter: (a, b) => a.resumeCount - b.resumeCount,
      render: (count: number) => (
        <Tag color="purple">{count}</Tag>
      )
    },
    {
      title: '潜客发现',
      dataIndex: 'prospectCount',
      key: 'prospectCount',
      sorter: (a, b) => a.prospectCount - b.prospectCount,
      render: (count: number) => (
        <Tag color="orange">{count}</Tag>
      )
    },
    {
      title: '消息发送',
      dataIndex: 'messageCount',
      key: 'messageCount',
      sorter: (a, b) => a.messageCount - b.messageCount,
      render: (count: number) => (
        <Tag color="cyan">{count}</Tag>
      )
    },
    {
      title: '客户价值',
      dataIndex: 'orderValue',
      key: 'orderValue',
      sorter: (a, b) => a.orderValue - b.orderValue,
      render: (value: number) => (
        <Text strong style={{ color: '#faad14' }}>¥{value.toLocaleString()}</Text>
      )
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (date: string) => (
        <Text type="secondary">{date}</Text>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">使用数据报表</Title>
        <Text type="secondary">查看名下客户的功能调用量，可导出用于客户活跃度分析</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-4">
        <Col span={4}>
          <Card>
            <Statistic 
              title="API调用" 
              value={stats.totalApiCalls} 
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="发布量" 
              value={stats.totalPublish} 
              prefix={<UploadOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="简历处理" 
              value={stats.totalResumes} 
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="潜客发现" 
              value={stats.totalProspects} 
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="消息发送" 
              value={stats.totalMessages} 
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="客户价值" 
              value={stats.totalOrders} 
              prefix={<DownloadOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      {/* 趋势图 */}
      <Card className="mb-4" 
        extra={
          <Space>
            <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }}>
              <Option value="7d">近7天</Option>
              <Option value="30d">近30天</Option>
              <Option value="90d">近90天</Option>
            </Select>
            <Button icon={<DownloadOutlined />}>导出报表</Button>
          </Space>
        }
      >
        <ReactECharts option={trendOption} style={{ height: 300 }} />
      </Card>

      {/* 客户使用明细 */}
      <Card 
        title="客户使用明细"
        extra={
          <Space>
            <Select value={moduleFilter} onChange={setModuleFilter} style={{ width: 120 }}>
              <Option value="all">全部模块</Option>
              <Option value="media">自媒体</Option>
              <Option value="recruitment">招聘</Option>
              <Option value="acquisition">获客</Option>
            </Select>
            <Button icon={<ReloadOutlined />}>刷新</Button>
          </Space>
        }
      >
        <Table
          rowKey="key"
          columns={columns}
          dataSource={mockUsageData}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>
    </div>
  )
}
