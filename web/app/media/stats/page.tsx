'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Card,
  Row,
  Col,
  Typography,
  Table,
  Select,
  DatePicker,
  Statistic,
  Space,
  Tag,
  message,
  Progress,
  Dropdown,
} from 'antd'
import {
  ArrowLeftOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  ShareAltOutlined,
  UserAddOutlined,
  FireOutlined,
  DownloadOutlined,
  BarChartOutlined,
  LineChartOutlined,
} from '@ant-design/icons'
import { MediaContent } from '@/types'
import { getPlatformIcon, getPlatformName, formatNumber } from '@/utils'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

export default function StatsPage() {
  const router = useRouter()
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [dateRange, setDateRange] = useState<any>(null)

  const platforms = [
    { id: 'all', name: '全部平台', icon: '📱' },
    { id: 'douyin', name: '抖音', icon: '🎵' },
    { id: 'kuaishou', name: '快手', icon: '📹' },
    { id: 'xiaohongshu', name: '小红书', icon: '📕' },
    { id: 'video', name: '视频号', icon: '🎬' },
  ]

  // 模拟统计数据
  const statsData = {
    totalViews: 1258900,
    totalLikes: 45670,
    totalComments: 12340,
    totalShares: 8900,
    fansGrowth: 2340,
    publishCount: 45,
  }

  // 模拟发布记录
  const publishRecords: MediaContent[] = [
    {
      id: '1',
      title: '最新科技产品评测',
      description: '深度解析2024年最值得购买的科技产品...',
      content: '详细内容',
      type: 'video',
      tags: ['科技', '数码', '评测'],
      platform: 'douyin',
      publishStatus: 'published',
      publishTime: new Date('2024-03-15'),
      coverImage: 'https://via.placeholder.com/120',
      stats: {
        views: 125000,
        likes: 5600,
        comments: 890,
        shares: 340,
      },
      createdAt: new Date('2024-03-15'),
      updatedAt: new Date('2024-03-15'),
    },
    {
      id: '2',
      title: '美食制作教程',
      description: '教你在家做出餐厅级的美味佳肴...',
      content: '详细内容',
      type: 'video',
      tags: ['美食', '教程', '生活'],
      platform: 'kuaishou',
      publishStatus: 'published',
      publishTime: new Date('2024-03-14'),
      coverImage: 'https://via.placeholder.com/120',
      stats: {
        views: 89000,
        likes: 3400,
        comments: 560,
        shares: 210,
      },
      createdAt: new Date('2024-03-14'),
      updatedAt: new Date('2024-03-14'),
    },
    {
      id: '3',
      title: '旅行攻略分享',
      description: '说走就走的旅行，发现美丽世界...',
      content: '详细内容',
      type: 'image',
      tags: ['旅行', '攻略', '生活'],
      platform: 'xiaohongshu',
      publishStatus: 'published',
      publishTime: new Date('2024-03-13'),
      coverImage: 'https://via.placeholder.com/120',
      stats: {
        views: 67000,
        likes: 2800,
        comments: 450,
        shares: 180,
      },
      createdAt: new Date('2024-03-13'),
      updatedAt: new Date('2024-03-13'),
    },
    {
      id: '4',
      title: '知识科普短视频',
      description: '探索科学奥秘，了解宇宙知识...',
      content: '详细内容',
      type: 'video',
      tags: ['科普', '知识', '教育'],
      platform: 'video',
      publishStatus: 'published',
      publishTime: new Date('2024-03-12'),
      coverImage: 'https://via.placeholder.com/120',
      stats: {
        views: 45000,
        likes: 1900,
        comments: 320,
        shares: 120,
      },
      createdAt: new Date('2024-03-12'),
      updatedAt: new Date('2024-03-12'),
    },
  ]

  // 模拟热门内容排行
  const hotContent = [...publishRecords].sort(
    (a, b) => b.stats.views - a.stats.views
  )

  const handleExportData = () => {
    message.info('正在导出数据报表...')
    // TODO: 调用导出API
    setTimeout(() => {
      message.success('数据报表导出成功！')
    }, 1000)
  }

  const handleRefresh = () => {
    message.info('正在刷新数据...')
    // TODO: 调用刷新API
    setTimeout(() => {
      message.success('数据已刷新！')
    }, 1000)
  }

  const columns = [
    {
      title: '内容',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: MediaContent) => (
        <Space>
          <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
            {record.coverImage && (
              <img
                src={record.coverImage}
                alt={title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <Text strong ellipsis style={{ maxWidth: 200 }}>
              {title}
            </Text>
            <br />
            <Text type="secondary" className="text-xs">
              {record.tags.join(', ')}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => (
        <Space>
          <span className="text-xl">{getPlatformIcon(platform)}</span>
          <span>{getPlatformName(platform)}</span>
        </Space>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'publishTime',
      key: 'publishTime',
      render: (date: Date) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '播放量',
      dataIndex: ['stats', 'views'],
      key: 'views',
      render: (views: number) => formatNumber(views),
      sorter: (a: MediaContent, b: MediaContent) => a.stats.views - b.stats.views,
    },
    {
      title: '点赞',
      dataIndex: ['stats', 'likes'],
      key: 'likes',
      render: (likes: number) => formatNumber(likes),
    },
    {
      title: '评论',
      dataIndex: ['stats', 'comments'],
      key: 'comments',
      render: (comments: number) => formatNumber(comments),
    },
    {
      title: '分享',
      dataIndex: ['stats', 'shares'],
      key: 'shares',
      render: (shares: number) => formatNumber(shares),
    },
    {
      title: '互动率',
      key: 'interactionRate',
      render: (_: any, record: MediaContent) => {
        const total = record.stats.views
        const interaction =
          record.stats.likes + record.stats.comments + record.stats.shares
        const rate = total > 0 ? ((interaction / total) * 100).toFixed(2) : '0.00'
        return `${rate}%`
      },
    },
  ]

  const hotColumns = [
    {
      title: '排名',
      key: 'rank',
      render: (_: any, __: any, index: number) => (
        <Tag color={index < 3 ? 'gold' : 'default'} className="text-base">
          {index + 1}
        </Tag>
      ),
    },
    {
      title: '内容标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: MediaContent) => (
        <Space>
          <span className="text-xl">{getPlatformIcon(record.platform)}</span>
          <Text ellipsis style={{ maxWidth: 150 }}>
            {title}
          </Text>
        </Space>
      ),
    },
    {
      title: '播放量',
      dataIndex: ['stats', 'views'],
      key: 'views',
      render: (views: number) => formatNumber(views),
    },
    {
      title: '趋势',
      key: 'trend',
      render: () => <Tag color="green">↑ 热门</Tag>,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/media')}
          className="mb-6"
        >
          返回自媒体板块
        </Button>

        {/* 标题 */}
        <div className="mb-8">
          <Title level={2}>数据统计</Title>
          <Text type="secondary">查看自媒体内容发布数据和分析报告</Text>
        </div>

        {/* 筛选栏 */}
        <Card className="mb-6">
          <Row gutter={16} align="middle">
            <Col xs={24} sm={8}>
              <Text className="mr-2">选择平台：</Text>
              <Select
                style={{ width: 200 }}
                value={selectedPlatform}
                onChange={setSelectedPlatform}
              >
                {platforms.map((platform) => (
                  <Select.Option key={platform.id} value={platform.id}>
                    <Space>
                      <span className="text-lg">{platform.icon}</span>
                      <span>{platform.name}</span>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <Text className="mr-2">时间范围：</Text>
              <RangePicker onChange={setDateRange} style={{ width: 240 }} />
            </Col>
            <Col xs={24} sm={8} className="text-right">
              <Space>
                <Button icon={<BarChartOutlined />} onClick={handleRefresh}>
                  刷新数据
                </Button>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExportData}
                >
                  导出报表
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={8} md={6}>
            <Card>
              <Statistic
                title="总播放量"
                value={statsData.totalViews}
                valueStyle={{ color: '#1890ff' }}
                prefix={<EyeOutlined />}
                formatter={(value) => formatNumber(Number(value))}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card>
              <Statistic
                title="总点赞数"
                value={statsData.totalLikes}
                valueStyle={{ color: '#f5222d' }}
                prefix={<LikeOutlined />}
                formatter={(value) => formatNumber(Number(value))}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card>
              <Statistic
                title="总评论数"
                value={statsData.totalComments}
                valueStyle={{ color: '#faad14' }}
                prefix={<MessageOutlined />}
                formatter={(value) => formatNumber(Number(value))}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card>
              <Statistic
                title="总分享数"
                value={statsData.totalShares}
                valueStyle={{ color: '#52c41a' }}
                prefix={<ShareAltOutlined />}
                formatter={(value) => formatNumber(Number(value))}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card>
              <Statistic
                title="粉丝增长"
                value={statsData.fansGrowth}
                valueStyle={{ color: '#722ed1' }}
                prefix={<UserAddOutlined />}
                formatter={(value) => formatNumber(Number(value))}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card>
              <Statistic
                title="发布数量"
                value={statsData.publishCount}
                valueStyle={{ color: '#eb2f96' }}
                prefix={<LineChartOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          {/* 发布记录 */}
          <Col xs={24} lg={16}>
            <Card
              title="发布记录"
              extra={
                <Space>
                  <Text type="secondary">共 {publishRecords.length} 条</Text>
                </Space>
              }
            >
              <Table
                columns={columns}
                dataSource={publishRecords}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                }}
              />
            </Card>
          </Col>

          {/* 热门内容排行 */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <FireOutlined style={{ color: '#ff4d4f' }} />
                  <span>热门内容排行</span>
                </Space>
              }
              extra={
                <Text type="secondary">
                  Top {hotContent.length}
                </Text>
              }
            >
              <Table
                columns={hotColumns}
                dataSource={hotContent}
                rowKey="id"
                pagination={false}
                showHeader={false}
                size="small"
              />
            </Card>

            {/* 平台分布 */}
            <Card title="平台分布" className="mt-6">
              <Space direction="vertical" className="w-full">
                {['douyin', 'kuaishou', 'xiaohongshu', 'video'].map((platform) => (
                  <div key={platform}>
                    <div className="flex justify-between mb-1">
                      <Space>
                        <span className="text-xl">{getPlatformIcon(platform)}</span>
                        <Text>{getPlatformName(platform)}</Text>
                      </Space>
                      <Text type="secondary">
                        {publishRecords.filter((r) => r.platform === platform).length} 条
                      </Text>
                    </div>
                    <Progress
                      percent={
                        (publishRecords.filter((r) => r.platform === platform).length /
                          publishRecords.length) *
                        100
                      }
                      showInfo={false}
                    />
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}
