'use client'

import { Card, Row, Col, Typography, Statistic, Table, Tag, Select, DatePicker, Space } from 'antd'
import {
  EyeOutlined,
  LikeOutlined,
  CommentOutlined,
  ShareAltOutlined,
  UserAddOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import { Line, Column } from '@ant-design/plots'
import React from 'react'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

export default function DataReportPage() {
  const mockLineData = [
    { date: '03-19', views: 1200, likes: 80, comments: 20, shares: 15 },
    { date: '03-20', views: 1450, likes: 95, comments: 25, shares: 18 },
    { date: '03-21', views: 1100, likes: 70, comments: 18, shares: 12 },
    { date: '03-22', views: 1680, likes: 110, comments: 28, shares: 22 },
    { date: '03-23', views: 1520, likes: 95, comments: 24, shares: 19 },
    { date: '03-24', views: 1890, likes: 125, comments: 32, shares: 25 },
    { date: '03-25', views: 2100, likes: 140, comments: 35, shares: 28 },
  ]

  const mockColumnData = [
    { platform: '抖音', views: 8500, likes: 560, comments: 140, shares: 112 },
    { platform: '快手', views: 4200, likes: 280, comments: 70, shares: 56 },
    { platform: '小红书', views: 3100, likes: 210, comments: 52, shares: 42 },
    { platform: '视频号', views: 2800, likes: 180, comments: 48, shares: 38 },
  ]

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => <Tag>{platform}</Tag>,
    },
    {
      title: '浏览量',
      dataIndex: 'views',
      key: 'views',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '点赞数',
      dataIndex: 'likes',
      key: 'likes',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '评论数',
      dataIndex: 'comments',
      key: 'comments',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '分享数',
      dataIndex: 'shares',
      key: 'shares',
      render: (val: number) => val.toLocaleString(),
    },
    { title: '发布时间', dataIndex: 'publishTime', key: 'publishTime' },
  ]

  const mockTableData = [
    { title: 'AI产品介绍视频', platform: '抖音', views: 12580, likes: 820, comments: 205, shares: 164, publishTime: '2024-03-25 10:30' },
    { title: '产品宣传图文', platform: '小红书', views: 8642, likes: 560, comments: 140, shares: 112, publishTime: '2024-03-24 15:20' },
    { title: '数字人讲解视频', platform: '视频号', views: 5320, likes: 340, comments: 85, shares: 68, publishTime: '2024-03-23 09:15' },
  ]

  const lineConfig = {
    data: mockLineData,
    xField: 'date',
    yField: 'views',
    seriesField: 'type',
    smooth: true,
    legend: { position: 'top' },
    interactions: [{ type: 'tooltip' }],
  }

  const columnConfig = {
    data: mockColumnData,
    xField: 'platform',
    yField: 'value',
    seriesField: 'metric',
    isGroup: true,
    legend: { position: 'top' },
  }

  const seriesData = mockColumnData.flatMap(d => [
    { ...d, value: d.views, metric: '浏览量' },
    { ...d, value: d.likes, metric: '点赞数' },
    { ...d, value: d.comments, metric: '评论数' },
  ])

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">数据报表</Title>
          <Text type="secondary">查看多平台内容发布效果和数据趋势</Text>
        </div>
        <Space>
          <Select
            defaultValue="all"
            style={{ width: 150 }}
            options={[
              { label: '全部平台', value: 'all' },
              { label: '抖音', value: 'douyin' },
              { label: '快手', value: 'kuaishou' },
              { label: '小红书', value: 'xiaohongshu' },
            ]}
          />
          <RangePicker />
        </Space>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总浏览量"
              value={18600}
              prefix={<EyeOutlined />}
              suffix={<span className="text-green-500 text-sm"><ArrowUpOutlined /> 12.5%</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总点赞数"
              value={1230}
              prefix={<LikeOutlined />}
              suffix={<span className="text-green-500 text-sm"><ArrowUpOutlined /> 8.3%</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总评论数"
              value={308}
              prefix={<CommentOutlined />}
              suffix={<span className="text-red-500 text-sm"><ArrowDownOutlined /> 2.1%</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总分享数"
              value={245}
              prefix={<ShareAltOutlined />}
              suffix={<span className="text-green-500 text-sm"><ArrowUpOutlined /> 15.7%</span>}
            />
          </Card>
        </Col>
      </Row>

      <Card title="数据趋势" className="mb-6">
        <Line
          {...lineConfig}
          seriesField={undefined}
          color={ ['#1890ff', '#52c41a', '#faad14', '#f5222d'] }
          data={mockLineData.flatMap(d => [
            { ...d, type: '浏览量', value: d.views },
            { ...d, type: '点赞数', value: d.likes },
            { ...d, type: '评论数', value: d.comments },
            { ...d, type: '分享数', value: d.shares },
          ])}
          yField="value"
          tooltip={{ fields: ['date', 'type', 'value'] }}
        />
      </Card>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="平台对比">
            <Column
              data={seriesData}
              xField="platform"
              yField="value"
              seriesField="metric"
              isGroup
              legend={{ position: 'top' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="内容排行">
            <Table
              dataSource={mockTableData}
              columns={columns}
              rowKey="title"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
