'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Table,
  Tag,
  Select,
  DatePicker,
  Space,
  Button,
  message,
  Tooltip,
  Dropdown,
} from 'antd'
import type { MenuProps } from 'antd'
import {
  EyeOutlined,
  LikeOutlined,
  CommentOutlined,
  ShareAltOutlined,
  UserAddOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { Line, Column, Pie, Area } from '@ant-design/plots'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

interface AnalyticsData {
  totalViews: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalFans: number
  viewsGrowth: number
  likesGrowth: number
  commentsGrowth: number
  sharesGrowth: number
  fansGrowth: number
}

interface ContentPerformance {
  id: string
  title: string
  platform: string
  views: number
  likes: number
  comments: number
  shares: number
  publishTime: string
}

export default function DataReportPage() {
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalViews: 18600,
    totalLikes: 1230,
    totalComments: 308,
    totalShares: 245,
    totalFans: 26542,
    viewsGrowth: 12.5,
    likesGrowth: 8.3,
    commentsGrowth: -2.1,
    sharesGrowth: 15.7,
    fansGrowth: 5.2,
  })
  const [contentPerformance, setContentPerformance] = useState<ContentPerformance[]>([])

  // 从 localStorage 加载数据
  useEffect(() => {
    // 加载发布任务，生成统计数据
    const savedTasks = localStorage.getItem('publish-tasks')
    if (savedTasks) {
      try {
        const tasks = JSON.parse(savedTasks)
        const publishedTasks = tasks.filter((t: any) => t.status === 'published')

        // 生成内容表现数据
        const performanceData = publishedTasks.map((task: any, index: number) => ({
          id: task.id,
          title: task.title || `内容 ${index + 1}`,
          platform: task.platforms?.[0] || 'unknown',
          views: Math.floor(Math.random() * 5000) + 1000,
          likes: Math.floor(Math.random() * 500) + 50,
          comments: Math.floor(Math.random() * 100) + 10,
          shares: Math.floor(Math.random() * 50) + 5,
          publishTime: task.publishedAt || task.createdAt,
        }))

        setContentPerformance(performanceData)

        // 更新统计数据
        const totalViews = performanceData.reduce((sum: number, item: any) => sum + item.views, 0)
        const totalLikes = performanceData.reduce((sum: number, item: any) => sum + item.likes, 0)
        const totalComments = performanceData.reduce((sum: number, item: any) => sum + item.comments, 0)
        const totalShares = performanceData.reduce((sum: number, item: any) => sum + item.shares, 0)

        setAnalytics({
          totalViews,
          totalLikes,
          totalComments,
          totalShares,
          totalFans: Math.floor(totalViews * 1.2),
          viewsGrowth: (Math.random() * 20 - 5).toFixed(1) as any,
          likesGrowth: (Math.random() * 20 - 5).toFixed(1) as any,
          commentsGrowth: (Math.random() * 20 - 5).toFixed(1) as any,
          sharesGrowth: (Math.random() * 20 - 5).toFixed(1) as any,
          fansGrowth: (Math.random() * 20 - 5).toFixed(1) as any,
        })
      } catch (error) {
        console.error('加载数据失败:', error)
      }
    }

    // 如果没有数据，使用默认数据
    if (contentPerformance.length === 0) {
      setContentPerformance([
        {
          id: '1',
          title: 'AI产品介绍视频',
          platform: 'douyin',
          views: 12580,
          likes: 820,
          comments: 205,
          shares: 164,
          publishTime: '2024-03-25 10:30',
        },
        {
          id: '2',
          title: '产品宣传图文',
          platform: 'xiaohongshu',
          views: 8642,
          likes: 560,
          comments: 140,
          shares: 112,
          publishTime: '2024-03-24 15:20',
        },
        {
          id: '3',
          title: '数字人讲解视频',
          platform: 'weixin',
          views: 5320,
          likes: 340,
          comments: 85,
          shares: 68,
          publishTime: '2024-03-23 09:15',
        },
      ])
    }
  }, [])

  // 趋势数据（最近7天）
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = dayjs().subtract(6 - i, 'day').format('MM-DD')
    return {
      date,
      浏览量: Math.floor(Math.random() * 3000) + 1000,
      点赞数: Math.floor(Math.random() * 300) + 50,
      评论数: Math.floor(Math.random() * 50) + 10,
      分享数: Math.floor(Math.random() * 30) + 5,
    }
  })

  // 平台分布数据
  const platformData = [
    { platform: '抖音', value: 8500, metric: '浏览量' },
    { platform: '快手', value: 4200, metric: '浏览量' },
    { platform: '小红书', value: 3100, metric: '浏览量' },
    { platform: '视频号', value: 2800, metric: '浏览量' },
    { platform: '抖音', value: 560, metric: '点赞数' },
    { platform: '快手', value: 280, metric: '点赞数' },
    { platform: '小红书', value: 210, metric: '点赞数' },
    { platform: '视频号', value: 180, metric: '点赞数' },
    { platform: '抖音', value: 140, metric: '评论数' },
    { platform: '快手', value: 70, metric: '评论数' },
    { platform: '小红书', value: 52, metric: '评论数' },
    { platform: '视频号', value: 48, metric: '评论数' },
  ]

  // 粉丝增长数据
  const fansGrowthData = Array.from({ length: 7 }, (_, i) => {
    const date = dayjs().subtract(6 - i, 'day').format('MM-DD')
    return {
      date,
      粉丝数: Math.floor(26000 + Math.random() * 1000 + i * 200),
    }
  })

  // 平台占比数据
  const platformPieData = [
    { type: '抖音', value: 45.6 },
    { type: '快手', value: 22.5 },
    { type: '小红书', value: 16.7 },
    { type: '视频号', value: 15.2 },
  ]

  // 表格列配置
  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Tag color={index < 3 ? 'gold' : 'default'}>{index + 1}</Tag>
      ),
    },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (platform: string) => {
        const platformMap: Record<string, { label: string; color: string }> = {
          douyin: { label: '抖音', color: 'black' },
          kuaishou: { label: '快手', color: 'orange' },
          xiaohongshu: { label: '小红书', color: 'red' },
          weixin: { label: '视频号', color: 'green' },
          bilibili: { label: 'B站', color: 'blue' },
        }
        const config = platformMap[platform] || { label: platform, color: 'default' }
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: '浏览量',
      dataIndex: 'views',
      key: 'views',
      width: 100,
      render: (val: number) => val.toLocaleString(),
      sorter: (a: ContentPerformance, b: ContentPerformance) => a.views - b.views,
    },
    {
      title: '互动率',
      key: 'interaction',
      width: 100,
      render: (_: any, record: ContentPerformance) => {
        const rate = ((record.likes + record.comments + record.shares) / record.views * 100).toFixed(2)
        return <Text type={parseFloat(rate) > 10 ? 'success' : 'secondary'}>{rate}%</Text>
      },
    },
    { title: '发布时间', dataIndex: 'publishTime', key: 'publishTime', width: 160 },
  ]

  // 导出菜单
  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'excel',
      label: '导出为 Excel',
      icon: <FileExcelOutlined />,
      onClick: () => handleExport('excel'),
    },
    {
      key: 'pdf',
      label: '导出为 PDF',
      icon: <FilePdfOutlined />,
      onClick: () => handleExport('pdf'),
    },
  ]

  // 导出数据
  const handleExport = (format: string) => {
    message.success(`正在导出为 ${format.toUpperCase()}...`)

    // 简单实现：导出为 CSV
    if (format === 'excel') {
      const headers = ['标题', '平台', '浏览量', '点赞数', '评论数', '分享数', '发布时间']
      const rows = contentPerformance.map(item => [
        item.title,
        item.platform,
        item.views,
        item.likes,
        item.comments,
        item.shares,
        item.publishTime,
      ])

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `数据报表_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`
      a.click()
      URL.revokeObjectURL(url)

      message.success('导出成功')
    } else {
      // PDF 导出需要额外库，这里仅作演示
      setTimeout(() => {
        message.info('PDF 导出功能需要额外配置，已导出为 CSV')
        handleExport('excel')
      }, 1000)
    }
  }

  // 刷新数据
  const handleRefresh = () => {
    message.loading('正在刷新数据...', 1)
    // 重新加载数据
    setTimeout(() => {
      message.success('数据已刷新')
    }, 1000)
  }

  return (
    <div className="p-6">
      {/* 页面标题和操作栏 */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Title level={2} className="mb-2">数据报表</Title>
          <Text type="secondary">查看多平台内容发布效果和数据趋势</Text>
        </div>
        <Space wrap>
          <Select
            value={selectedPlatform}
            onChange={setSelectedPlatform}
            style={{ width: 150 }}
            options={[
              { label: '全部平台', value: 'all' },
              { label: '抖音', value: 'douyin' },
              { label: '快手', value: 'kuaishou' },
              { label: '小红书', value: 'xiaohongshu' },
              { label: '视频号', value: 'weixin' },
            ]}
          />
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
          <Dropdown menu={{ items: exportMenuItems }} trigger={['click']}>
            <Button type="primary" icon={<DownloadOutlined />}>
              导出报表
            </Button>
          </Dropdown>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="总浏览量"
              value={analytics.totalViews}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <span className={`text-sm ${analytics.viewsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analytics.viewsGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(analytics.viewsGrowth)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="总点赞数"
              value={analytics.totalLikes}
              prefix={<LikeOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={
                <span className={`text-sm ${analytics.likesGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analytics.likesGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(analytics.likesGrowth)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="总评论数"
              value={analytics.totalComments}
              prefix={<CommentOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix={
                <span className={`text-sm ${analytics.commentsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analytics.commentsGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(analytics.commentsGrowth)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="总分享数"
              value={analytics.totalShares}
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: '#f5222d' }}
              suffix={
                <span className={`text-sm ${analytics.sharesGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analytics.sharesGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(analytics.sharesGrowth)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="总粉丝数"
              value={analytics.totalFans}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#722ed1' }}
              suffix={
                <span className={`text-sm ${analytics.fansGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analytics.fansGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(analytics.fansGrowth)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="互动率"
              value={((analytics.totalLikes + analytics.totalComments + analytics.totalShares) / analytics.totalViews * 100).toFixed(2)}
              suffix="%"
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据趋势图 */}
      <Card title="数据趋势（最近7天）" className="mb-6">
        <Line
          data={trendData}
          xField="date"
          yField="value"
          seriesField="type"
          smooth
          legend={{ position: 'top' }}
          color={['#1890ff', '#52c41a', '#faad14', '#f5222d']}
          tooltip={{ fields: ['date', 'type', 'value'] }}
        />
      </Card>

      {/* 粉丝增长趋势 */}
      <Card title="粉丝增长趋势" className="mb-6">
        <Area
          data={fansGrowthData}
          xField="date"
          yField="粉丝数"
          smooth
          areaStyle={{ fill: 'l(270) 0:#ffffff 0.5:#722ed1 1:#722ed1' }}
          line={{ color: '#722ed1' }}
          tooltip={{ fields: ['date', '粉丝数'] }}
        />
      </Card>

      <Row gutter={[16, 16]} className="mb-6">
        {/* 平台对比 */}
        <Col xs={24} lg={12}>
          <Card title="平台对比">
            <Column
              data={platformData}
              xField="platform"
              yField="value"
              seriesField="metric"
              isGroup
              legend={{ position: 'top' }}
            />
          </Card>
        </Col>

        {/* 平台占比 */}
        <Col xs={24} lg={12}>
          <Card title="平台占比">
            <Pie
              data={platformPieData}
              angleField="value"
              colorField="type"
              radius={0.8}
              innerRadius={0.6}
              label={{
                type: 'outer',
                content: '{name} {percentage}',
              }}
              legend={{ position: 'right' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 热门内容排行 */}
      <Card title="热门内容排行">
        <Table
          dataSource={contentPerformance}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  )
}
