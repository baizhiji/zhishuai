'use client'

import { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Statistic, Table, Tag, Space, Progress } from 'antd'
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import {
  VideoCameraOutlined,
  TeamOutlined,
  UserAddOutlined,
  ShareAltOutlined,
  ArrowUpOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  RiseOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

// 颜色配置
const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96']

// 模拟数据
const weeklyData = [
  { name: '周一', 发布: 12, 播放: 8500, 获客: 45, 招聘: 8 },
  { name: '周二', 发布: 18, 播放: 12000, 获客: 62, 招聘: 12 },
  { name: '周三', 发布: 15, 播放: 9800, 获客: 55, 招聘: 10 },
  { name: '周四', 发布: 22, 播放: 15000, 获客: 78, 招聘: 15 },
  { name: '周五', 发布: 20, 播放: 13500, 获客: 68, 招聘: 14 },
  { name: '周六', 发布: 25, 播放: 18000, 获客: 85, 招聘: 18 },
  { name: '周日', 发布: 23, 播放: 16500, 获客: 72, 招聘: 16 },
]

// 平台分布
const platformData = [
  { name: '抖音', value: 35, color: '#fe2c55' },
  { name: '快手', value: 25, color: '#ff4906' },
  { name: '小红书', value: 22, color: '#ff2442' },
  { name: '视频号', value: 12, color: '#07c160' },
  { name: '其他', value: 6, color: '#8c8c8c' },
]

// 招聘来源分布
const recruitmentSourceData = [
  { name: 'BOSS直聘', value: 42 },
  { name: '前程无忧', value: 28 },
  { name: '智联招聘', value: 18 },
  { name: '其他', value: 12 },
]

// 获客渠道分布
const acquisitionChannelData = [
  { name: '抖音', value: 35 },
  { name: '快手', value: 28 },
  { name: '小红书', value: 22 },
  { name: 'B站', value: 15 },
]

// 内容类型分布
const contentTypeData = [
  { name: '短视频', value: 45 },
  { name: '图文', value: 30 },
  { name: '数字人', value: 15 },
  { name: '其他', value: 10 },
]

// 招聘进度分布
const interviewStatusData = [
  { name: '待面试', value: 25, color: '#1890ff' },
  { name: '面试中', value: 35, color: '#faad14' },
  { name: '待入职', value: 15, color: '#52c41a' },
  { name: '已入职', value: 15, color: '#722ed1' },
  { name: '已拒绝', value: 10, color: '#f5222d' },
]

// KPI 目标完成度
const kpiData = [
  { name: '发布量', target: 150, actual: 135, rate: 90 },
  { name: '获客数', target: 500, actual: 405, rate: 81 },
  { name: '招聘完成', target: 20, actual: 18, rate: 90 },
  { name: '互动量', target: 10000, actual: 8500, rate: 85 },
]

// 近期发布记录
const recentPublishes = [
  { id: 1, title: 'AI如何改变工作方式', platform: '抖音', views: 12500, likes: 890, status: '已发布' },
  { id: 2, title: '短视频剪辑技巧', platform: '快手', views: 8900, likes: 560, status: '已发布' },
  { id: 3, title: '智能营销解决方案', platform: '小红书', views: 5600, likes: 420, status: '已发布' },
  { id: 4, title: '企业数字化转型', platform: '视频号', views: 3200, likes: 280, status: '已发布' },
]

// 核心统计数据
const statsData = {
  media: { total: 1256, today: 23, growth: 12.5 },
  recruitment: { jobs: 45, resumes: 892, interviews: 18 },
  acquisition: { leads: 3456, sent: 12340, replyRate: 23.4 },
  share: { codes: 156, scans: 4523, users: 892 },
}

export default function DataDashboardPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const publishColumns = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '平台', dataIndex: 'platform', key: 'platform', width: 90,
      render: (platform: string) => {
        const colorMap: Record<string, string> = { '抖音': 'magenta', '快手': 'orange', '小红书': 'red', '视频号': 'green' }
        return <Tag color={colorMap[platform] || 'default'}>{platform}</Tag>
      }
    },
    { title: '播放', dataIndex: 'views', key: 'views', width: 90,
      render: (v: number) => <Text>{v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}</Text>
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: () => <Tag color="success">已发布</Tag>
    },
  ]

  // 饼图中心文字
  const renderCenterText = (value: number, label: string) => (
    <text>
      <tspan x="50%" y="45%" textAnchor="middle" className="text-2xl font-bold fill-gray-800">
        {value.toLocaleString()}
      </tspan>
      <tspan x="50%" y="60%" textAnchor="middle" className="text-sm fill-gray-500">
        {label}
      </tspan>
    </text>
  )

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* 页面标题 */}
      <div className="mb-6">
        <Title level={2} className="mb-1">数据大盘</Title>
        <Text type="secondary">实时监控业务数据，掌握运营状况</Text>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <Statistic
              title={<span className="text-white/80">今日发布</span>}
              value={statsData.media.today}
              prefix={<VideoCameraOutlined />}
              suffix={<ArrowUpOutlined className="text-green-300" />}
              valueStyle={{ color: '#fff' }}
              loading={loading}
            />
            <div className="mt-2 text-white/70 text-sm">
              较昨日 +{statsData.media.growth}%
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <Statistic
              title={<span className="text-white/80">新增简历</span>}
              value={statsData.recruitment.resumes}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#fff' }}
              loading={loading}
            />
            <div className="mt-2 text-white/70 text-sm">
              待处理 {statsData.recruitment.interviews} 场面试
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <Statistic
              title={<span className="text-white/80">新增潜客</span>}
              value={statsData.acquisition.leads}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#fff' }}
              loading={loading}
            />
            <div className="mt-2 text-white/70 text-sm">
              回复率 {statsData.acquisition.replyRate}%
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <Statistic
              title={<span className="text-white/80">扫码次数</span>}
              value={statsData.share.scans}
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: '#fff' }}
              loading={loading}
            />
            <div className="mt-2 text-white/70 text-sm">
              活跃用户 {statsData.share.users}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 趋势图表 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={16}>
          <Card title="本周数据趋势" className="h-full">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorPublish" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#faad14" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#faad14" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="发布" stroke="#1890ff" fillOpacity={1} fill="url(#colorPublish)" />
                <Area yAxisId="right" type="monotone" dataKey="播放" stroke="#52c41a" fillOpacity={1} fill="url(#colorViews)" />
                <Area yAxisId="right" type="monotone" dataKey="获客" stroke="#faad14" fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="KPI 完成度" className="h-full">
            <div className="space-y-4">
              {kpiData.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <Text>{item.name}</Text>
                    <Text type="secondary">{item.actual} / {item.target}</Text>
                  </div>
                  <Progress
                    percent={item.rate}
                    strokeColor={item.rate >= 90 ? '#52c41a' : item.rate >= 70 ? '#faad14' : '#f5222d'}
                    showInfo={false}
                    size="small"
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 分布图表 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card title="平台分布">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2">
              {platformData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm mb-1">
                  <Space>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <Text>{item.name}</Text>
                  </Space>
                  <Text strong>{item.value}%</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="内容类型">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={contentTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {contentTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2">
              {contentTypeData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm mb-1">
                  <Space>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <Text>{item.name}</Text>
                  </Space>
                  <Text strong>{item.value}%</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="招聘进度">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={interviewStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {interviewStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2">
              {interviewStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm mb-1">
                  <Space>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <Text>{item.name}</Text>
                  </Space>
                  <Text strong>{item.value}%</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="获客渠道">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={acquisitionChannelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={60} />
                <Tooltip />
                <Bar dataKey="value" fill="#faad14" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 发布对比柱状图 & 最新发布 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="各平台发布对比">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="发布" fill="#1890ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="招聘" fill="#722ed1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最新发布记录" extra={<a href="/media/publish">查看更多</a>}>
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
      </Row>
    </div>
  )
}
