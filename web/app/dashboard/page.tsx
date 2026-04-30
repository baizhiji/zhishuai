'use client'

import { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Statistic, Progress, Table, Tag, Space, List, Avatar } from 'antd'
import {
  VideoCameraOutlined,
  TeamOutlined,
  UserAddOutlined,
  ShareAltOutlined,
  RiseOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography

// 模拟统计数据
const mockStats = {
  media: {
    totalPublished: 1256,
    todayPublished: 23,
    totalViews: 895420,
    totalLikes: 45230,
    totalComments: 8920,
    totalShares: 3420,
    followers: 12580,
    growth: 12.5,
  },
  recruitment: {
    totalJobs: 45,
    activeJobs: 12,
    totalApplications: 892,
    newApplications: 23,
    interviews: 18,
    hired: 5,
    successRate: 28,
  },
  acquisition: {
    totalLeads: 3456,
    todayLeads: 89,
    sentMessages: 12340,
    replies: 2890,
    scans: 1234,
    conversions: 456,
    replyRate: 23.4,
  },
  share: {
    totalCodes: 156,
    totalScans: 4523,
    activeUsers: 892,
    newUsers: 45,
    growth: 8.7,
  },
}

// 模拟发布记录
const recentPublishes = [
  { id: 1, title: 'AI如何改变我们的工作方式', platform: '抖音', views: 12500, likes: 890, time: '2小时前' },
  { id: 2, title: '短视频剪辑技巧分享', platform: '快手', views: 8900, likes: 560, time: '4小时前' },
  { id: 3, title: '智能营销解决方案', platform: '小红书', views: 5600, likes: 420, time: '6小时前' },
  { id: 4, title: '企业数字化转型指南', platform: '视频号', views: 3200, likes: 280, time: '8小时前' },
]

// 模拟获客记录
const recentLeads = [
  { id: 1, name: '张经理', industry: '教育培训', interest: '高', time: '10分钟前' },
  { id: 2, name: '李总监', industry: '电商运营', interest: '中', time: '30分钟前' },
  { id: 3, name: '王老板', industry: '实体零售', interest: '高', time: '1小时前' },
  { id: 4, name: '赵女士', industry: '咨询服务', interest: '低', time: '2小时前' },
]

// 模拟面试安排
const upcomingInterviews = [
  { id: 1, candidate: '陈小明', position: '产品经理', time: '14:00', status: '待面试' },
  { id: 2, candidate: '林大力', position: '运营主管', time: '15:30', status: '待面试' },
  { id: 3, candidate: '周小华', position: '市场专员', time: '16:00', status: '待面试' },
]

export default function DataDashboardPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟加载数据
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const publishColumns = [
    { title: '内容标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '平台', dataIndex: 'platform', key: 'platform', width: 80,
      render: (platform: string) => (
        <Tag color={
          platform === '抖音' ? 'magenta' :
          platform === '快手' ? 'orange' :
          platform === '小红书' ? 'red' : 'blue'
        }>{platform}</Tag>
      )
    },
    { title: '播放', dataIndex: 'views', key: 'views', width: 80,
      render: (v: number) => <Space><EyeOutlined />{v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}</Space>
    },
    { title: '点赞', dataIndex: 'likes', key: 'likes', width: 80,
      render: (v: number) => <Space><LikeOutlined />{v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}</Space>
    },
    { title: '时间', dataIndex: 'time', key: 'time', width: 80 },
  ]

  const leadsColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '行业', dataIndex: 'industry', key: 'industry' },
    { title: '意向度', dataIndex: 'interest', key: 'interest', width: 80,
      render: (interest: string) => (
        <Tag color={interest === '高' ? 'green' : interest === '中' ? 'orange' : 'default'}>{interest}</Tag>
      )
    },
    { title: '时间', dataIndex: 'time', key: 'time', width: 100 },
  ]

  const interviewColumns = [
    { title: '候选人', dataIndex: 'candidate', key: 'candidate' },
    { title: '岗位', dataIndex: 'position', key: 'position' },
    { title: '时间', dataIndex: 'time', key: 'time', width: 80 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: () => <Tag color="blue">待面试</Tag>
    },
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Title level={2} className="mb-2">数据大盘</Title>
        <Text type="secondary">实时监控各模块核心业务数据</Text>
      </div>

      {/* 自媒体运营统计 */}
      <Card className="mb-4" title={
        <Space>
          <VideoCameraOutlined className="text-blue-500" />
          <span>自媒体运营</span>
        </Space>
      }>
        <Row gutter={16}>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="总发布量"
              value={mockStats.media.totalPublished}
              prefix={<VideoCameraOutlined />}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="今日发布"
              value={mockStats.media.todayPublished}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="总播放量"
              value={mockStats.media.totalViews}
              suffix="次"
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="总获赞"
              value={mockStats.media.totalLikes}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="总评论"
              value={mockStats.media.totalComments}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="总分享"
              value={mockStats.media.totalShares}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="粉丝数"
              value={mockStats.media.followers}
              suffix="↑"
              valueStyle={{ color: '#cf1322' }}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="粉丝增长"
              value={mockStats.media.growth}
              suffix="%"
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
              loading={loading}
            />
          </Col>
        </Row>
      </Card>

      {/* 招聘助手统计 */}
      <Card className="mb-4" title={
        <Space>
          <TeamOutlined className="text-purple-500" />
          <span>招聘助手</span>
        </Space>
      }>
        <Row gutter={16}>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="总职位数"
              value={mockStats.recruitment.totalJobs}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="在招职位"
              value={mockStats.recruitment.activeJobs}
              valueStyle={{ color: '#1890ff' }}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="简历总数"
              value={mockStats.recruitment.totalApplications}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="新增简历"
              value={mockStats.recruitment.newApplications}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="安排面试"
              value={mockStats.recruitment.interviews}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="已入职"
              value={mockStats.recruitment.hired}
              valueStyle={{ color: '#52c41a' }}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <div className="ant-statistic-title">招聘成功率</div>
            <Progress
              percent={mockStats.recruitment.successRate}
              status="active"
              strokeColor="#52c41a"
            />
          </Col>
        </Row>
      </Card>

      {/* 智能获客统计 */}
      <Card className="mb-4" title={
        <Space>
          <UserAddOutlined className="text-orange-500" />
          <span>智能获客</span>
        </Space>
      }>
        <Row gutter={16}>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="潜客总数"
              value={mockStats.acquisition.totalLeads}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="今日新增"
              value={mockStats.acquisition.todayLeads}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="发送消息"
              value={mockStats.acquisition.sentMessages}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="收到回复"
              value={mockStats.acquisition.replies}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="扫码数"
              value={mockStats.acquisition.scans}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="转化数"
              value={mockStats.acquisition.conversions}
              valueStyle={{ color: '#52c41a' }}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="回复率"
              value={mockStats.acquisition.replyRate}
              suffix="%"
              loading={loading}
            />
          </Col>
        </Row>
      </Card>

      {/* 推荐分享统计 */}
      <Card className="mb-4" title={
        <Space>
          <ShareAltOutlined className="text-green-500" />
          <span>推荐分享</span>
        </Space>
      }>
        <Row gutter={16}>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="生成码数"
              value={mockStats.share.totalCodes}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="扫码次数"
              value={mockStats.share.totalScans}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="活跃用户"
              value={mockStats.share.activeUsers}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="新增用户"
              value={mockStats.share.newUsers}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              loading={loading}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="增长趋势"
              value={mockStats.share.growth}
              suffix="%"
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
              loading={loading}
            />
          </Col>
        </Row>
      </Card>

      {/* 实时动态 */}
      <Row gutter={16}>
        {/* 最新发布 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined className="text-green-500" />
                <span>最新发布</span>
              </Space>
            }
            extra={<a href="/media/publish">查看更多</a>}
            className="mb-4"
          >
            <Table
              dataSource={recentPublishes}
              columns={publishColumns}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loading}
            />
          </Card>
        </Col>

        {/* 获客动态 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <UserAddOutlined className="text-orange-500" />
                <span>获客动态</span>
              </Space>
            }
            extra={<a href="/acquisition">查看更多</a>}
            className="mb-4"
          >
            <Table
              dataSource={recentLeads}
              columns={leadsColumns}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loading}
            />
          </Card>
        </Col>

        {/* 面试安排 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined className="text-blue-500" />
                <span>面试安排</span>
              </Space>
            }
            extra={<a href="/recruitment/interview">查看更多</a>}
            className="mb-4"
          >
            <Table
              dataSource={upcomingInterviews}
              columns={interviewColumns}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loading}
            />
          </Card>
        </Col>

        {/* 快捷操作 */}
        <Col xs={24} lg={12}>
          <Card title="快捷操作">
            <Row gutter={8}>
              <Col span={12}>
                <Card size="small" className="bg-blue-50 hover:bg-blue-100 cursor-pointer">
                  <Space>
                    <VideoCameraOutlined className="text-xl text-blue-500" />
                    <Text>新建发布任务</Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="bg-purple-50 hover:bg-purple-100 cursor-pointer">
                  <Space>
                    <TeamOutlined className="text-xl text-purple-500" />
                    <Text>发布新职位</Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="bg-orange-50 hover:bg-orange-100 cursor-pointer mt-2">
                  <Space>
                    <UserAddOutlined className="text-xl text-orange-500" />
                    <Text>创建获客任务</Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="bg-green-50 hover:bg-green-100 cursor-pointer mt-2">
                  <Space>
                    <ShareAltOutlined className="text-xl text-green-500" />
                    <Text>生成推广码</Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
