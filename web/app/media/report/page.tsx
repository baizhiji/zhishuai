'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Select,
  DatePicker,
  Space,
  Button,
  Typography,
  Progress,
} from 'antd'
import {
  EyeOutlined,
  LikeOutlined,
  CommentOutlined,
  ShareAltOutlined,
  UserAddOutlined,
  ReloadOutlined,
  DownloadOutlined,
  LineChartOutlined,
  BarChartOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function DataReportPage() {
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [timeRange, setTimeRange] = useState<string>('7d')

  // 统计数据
  const stats = {
    totalViews: 18600,
    totalLikes: 1230,
    totalComments: 308,
    totalShares: 245,
    totalFans: 26542,
    interactionRate: 9.6,
  }

  // 趋势数据（最近7天）
  const trendData = [
    { date: '03-19', 浏览量: 2100, 点赞数: 140, 评论数: 32, 分享数: 28 },
    { date: '03-20', 浏览量: 2800, 点赞数: 185, 评论数: 45, 分享数: 35 },
    { date: '03-21', 浏览量: 2400, 点赞数: 160, 评论数: 38, 分享数: 30 },
    { date: '03-22', 浏览量: 3200, 点赞数: 210, 评论数: 52, 分享数: 42 },
    { date: '03-23', 浏览量: 2900, 点赞数: 195, 评论数: 48, 分享数: 38 },
    { date: '03-24', 浏览量: 3100, 点赞数: 205, 评论数: 50, 分享数: 40 },
    { date: '03-25', 浏览量: 3100, 点赞数: 135, 评论数: 43, 分享数: 32 },
  ]

  // 粉丝增长数据
  const fansGrowthData = [
    { date: '03-19', 粉丝数: 25800 },
    { date: '03-20', 粉丝数: 25950 },
    { date: '03-21', 粉丝数: 26080 },
    { date: '03-22', 粉丝数: 26200 },
    { date: '03-23', 粉丝数: 26320 },
    { date: '03-24', 粉丝数: 26450 },
    { date: '03-25', 粉丝数: 26542 },
  ]

  // 平台分布数据
  const platformData = [
    { platform: '抖音', views: 8500, rate: 45.7 },
    { platform: '小红书', views: 4200, rate: 22.6 },
    { platform: '视频号', views: 3100, rate: 16.7 },
    { platform: '快手', views: 2800, rate: 15.0 },
  ]

  // 内容表现数据
  const contentList = [
    { id: '1', title: 'AI产品介绍视频', platform: 'douyin', views: 12580, likes: 820, comments: 205, shares: 164, publishTime: '2024-03-25 10:30' },
    { id: '2', title: '产品宣传图文', platform: 'xiaohongshu', views: 8642, likes: 560, comments: 140, shares: 112, publishTime: '2024-03-24 15:20' },
    { id: '3', title: '数字人讲解视频', platform: 'weixin', views: 5320, likes: 340, comments: 85, shares: 68, publishTime: '2024-03-23 09:15' },
    { id: '4', title: '新品发布预告', platform: 'douyin', views: 9860, likes: 650, comments: 180, shares: 145, publishTime: '2024-03-22 14:00' },
    { id: '5', title: '用户案例分享', platform: 'kuaishou', views: 4280, likes: 280, comments: 65, shares: 52, publishTime: '2024-03-21 11:30' },
  ]

  // 表格列配置
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (platform: string) => {
        const platformMap: Record<string, { label: string; color: string }> = {
          douyin: { label: '抖音', color: '#333333' },
          kuaishou: { label: '快手', color: '#FF4906' },
          xiaohongshu: { label: '小红书', color: '#FF2442' },
          weixin: { label: '视频号', color: '#07C160' },
        }
        const config = platformMap[platform] || { label: platform, color: 'default' }
        return <Tag style={{ backgroundColor: config.color, color: '#fff', border: 'none' }}>{config.label}</Tag>
      },
    },
    {
      title: '浏览量',
      dataIndex: 'views',
      key: 'views',
      width: 100,
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '点赞数',
      dataIndex: 'likes',
      key: 'likes',
      width: 80,
      render: (val: number) => <Text type="success">{val.toLocaleString()}</Text>,
    },
    {
      title: '评论数',
      dataIndex: 'comments',
      key: 'comments',
      width: 80,
      render: (val: number) => <Text type="warning">{val.toLocaleString()}</Text>,
    },
    {
      title: '分享数',
      dataIndex: 'shares',
      key: 'shares',
      width: 80,
      render: (val: number) => <Text type="danger">{val.toLocaleString()}</Text>,
    },
    {
      title: '互动率',
      key: 'interaction',
      width: 80,
      render: (_: any, record: any) => {
        const rate = ((record.likes + record.comments + record.shares) / record.views * 100).toFixed(1)
        return <Text type="secondary">{rate}%</Text>
      },
    },
    { title: '发布时间', dataIndex: 'publishTime', key: 'publishTime', width: 150 },
  ]

  // 刷新数据
  const handleRefresh = () => {
    // 刷新逻辑
  }

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题和操作栏 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>数据报表</Title>
          <Text type="secondary">查看多平台内容发布效果和数据趋势</Text>
        </div>
        <Space wrap>
          <Select
            value={selectedPlatform}
            onChange={setSelectedPlatform}
            style={{ width: 120 }}
            options={[
              { label: '全部平台', value: 'all' },
              { label: '抖音', value: 'douyin' },
              { label: '快手', value: 'kuaishou' },
              { label: '小红书', value: 'xiaohongshu' },
              { label: '视频号', value: 'weixin' },
            ]}
          />
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 100 }}
            options={[
              { value: '7d', label: '近7天' },
              { value: '30d', label: '近30天' },
              { value: '90d', label: '近3个月' },
            ]}
          />
          <DatePicker.RangePicker />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
          <Button type="primary" icon={<DownloadOutlined />}>导出报表</Button>
        </Space>
      </div>

      {/* 核心统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card bordered={false}>
            <Statistic
              title="总浏览量"
              value={stats.totalViews}
              prefix={<EyeOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false}>
            <Statistic
              title="总点赞数"
              value={stats.totalLikes}
              prefix={<LikeOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false}>
            <Statistic
              title="总评论数"
              value={stats.totalComments}
              prefix={<CommentOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false}>
            <Statistic
              title="总分享数"
              value={stats.totalShares}
              prefix={<ShareAltOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false}>
            <Statistic
              title="总粉丝数"
              value={stats.totalFans}
              prefix={<UserAddOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false}>
            <Statistic
              title="互动率"
              value={stats.interactionRate}
              suffix="%"
              prefix={<RiseOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据趋势和分布 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {/* 数据趋势图 */}
        <Col span={16}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <LineChartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              <Text strong>数据趋势（最近7天）</Text>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#8c8c8c" fontSize={12} />
                <YAxis stroke="#8c8c8c" fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0' }}
                  formatter={(value: any) => value.toLocaleString()}
                />
                <Line type="monotone" dataKey="浏览量" stroke="#1890ff" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="点赞数" stroke="#52c41a" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="评论数" stroke="#faad14" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="分享数" stroke="#eb2f96" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 平台分布 */}
        <Col span={8}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <BarChartOutlined style={{ marginRight: 8, color: '#722ed1' }} />
              <Text strong>平台分布</Text>
            </div>
            <Space direction="vertical" className="w-full" size="middle" style={{ width: '100%' }}>
              {platformData.map((item, index) => (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Space>
                      <span style={{ 
                        display: 'inline-block', 
                        width: 12, 
                        height: 12, 
                        borderRadius: 2, 
                        backgroundColor: ['#1890ff', '#eb2f96', '#faad14', '#52c41a'][index]
                      }} />
                      <Text>{item.platform}</Text>
                    </Space>
                    <Text type="secondary">{item.views.toLocaleString()} ({item.rate}%)</Text>
                  </div>
                  <Progress 
                    percent={item.rate} 
                    showInfo={false}
                    strokeColor={['#1890ff', '#eb2f96', '#faad14', '#52c41a'][index]}
                    trailColor="#f0f0f0"
                    size="small"
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 粉丝增长趋势 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <UserAddOutlined style={{ marginRight: 8, color: '#722ed1' }} />
              <Text strong>粉丝增长趋势</Text>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={fansGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#8c8c8c" fontSize={12} />
                <YAxis stroke="#8c8c8c" fontSize={12} domain={['dataMin - 500', 'dataMax + 500']} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0' }}
                  formatter={(value: any) => value.toLocaleString()}
                />
                <defs>
                  <linearGradient id="colorFans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#722ed1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#722ed1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="粉丝数" stroke="#722ed1" fillOpacity={1} fill="url(#colorFans)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 内容转化漏斗 */}
        <Col span={12}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <LineChartOutlined style={{ marginRight: 8, color: '#13c2c2' }} />
              <Text strong>内容转化漏斗</Text>
            </div>
            <Row gutter={16} align="middle" style={{ padding: '20px 0' }}>
              <Col span={4}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>18,600</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>浏览量</Text>
                </div>
              </Col>
              <Col span={4}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>2,232</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>点击数</Text>
                </div>
              </Col>
              <Col span={4}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>1,230</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>点赞数</Text>
                </div>
              </Col>
              <Col span={4}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#eb2f96' }}>308</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>评论数</Text>
                </div>
              </Col>
              <Col span={4}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>245</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>分享数</Text>
                </div>
              </Col>
              <Col span={4}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#13c2c2' }}>542</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>新增粉丝</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 内容表现排行 */}
      <Card bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text strong>内容表现排行</Text>
          <Text type="secondary">共 {contentList.length} 条内容</Text>
        </div>
        <Table
          columns={columns}
          dataSource={contentList}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5, showSizeChanger: false }}
        />
      </Card>
    </div>
  )
}
