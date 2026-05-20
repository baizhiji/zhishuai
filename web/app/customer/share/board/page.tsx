'use client'

import { useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Select, DatePicker, Progress, Typography } from 'antd'
import { 
  QrcodeOutlined, 
  ScanOutlined, 
  UserOutlined, 
  RiseOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const { Title, Text } = Typography

export default function ShareBoardPage() {
  const [timeRange, setTimeRange] = useState<string>('7d')

  // 统计数据
  const stats = {
    totalCodes: 234,
    activeCodes: 189,
    totalScans: 45678,
    todayScans: 1234,
    activeUsers: 8923,
    newUsers: 456,
    shareRate: 18.9,
    growthRate: 12.5,
  }

  // 趋势数据
  const trendData = [
    { date: '周一', 扫码: 5234, 用户: 567, 增长: 45 },
    { date: '周二', 扫码: 6123, 用户: 678, 增长: 52 },
    { date: '周三', 扫码: 5890, 用户: 623, 增长: 48 },
    { date: '周四', 扫码: 7234, 用户: 789, 增长: 61 },
    { date: '周五', 扫码: 8123, 用户: 856, 增长: 67 },
    { date: '周六', 扫码: 4567, 用户: 523, 增长: 38 },
    { date: '周日', 扫码: 3890, 用户: 445, 增长: 32 },
  ]

  // 平台分布
  const platformData = [
    { platform: '抖音', scans: 15678, users: 3124, rate: 34.3 },
    { platform: '快手', scans: 12345, users: 2456, rate: 27.0 },
    { platform: '小红书', scans: 9876, users: 1890, rate: 21.6 },
    { platform: '视频号', scans: 5678, users: 1234, rate: 12.4 },
    { platform: '其他', scans: 2101, users: 219, rate: 4.6 },
  ]

  // 推荐排行
  const rankData = [
    { rank: 1, name: '张明', codes: 45, scans: 1234, users: 234, growth: 23.5 },
    { rank: 2, name: '李华', codes: 38, scans: 1123, users: 198, growth: 21.2 },
    { rank: 3, name: '王芳', codes: 35, scans: 987, users: 176, growth: 18.9 },
    { rank: 4, name: '刘强', codes: 32, scans: 876, users: 156, growth: 16.5 },
    { rank: 5, name: '陈静', codes: 28, scans: 765, users: 134, growth: 14.2 },
  ]

  // 最新推荐
  const recentData = [
    { id: 1, user: '赵伟', phone: '138****5678', source: '抖音', time: '10分钟前', status: 'active' },
    { id: 2, user: '周丽', phone: '139****8765', source: '快手', time: '25分钟前', status: 'active' },
    { id: 3, user: '吴涛', phone: '136****2345', source: '小红书', time: '1小时前', status: 'inactive' },
    { id: 4, user: '郑雪', phone: '137****9876', source: '视频号', time: '2小时前', status: 'active' },
    { id: 5, user: '孙磊', phone: '135****3456', source: '抖音', time: '3小时前', status: 'active' },
  ]

  const columns = [
    { title: '推荐人', dataIndex: 'user', key: 'user', width: 100 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
    { 
      title: '来源平台', 
      dataIndex: 'source', 
      key: 'source',
      width: 100,
      render: (source: string) => {
        const color = source === '抖音' ? '#ff4d4f' : source === '快手' ? '#722ed1' : source === '小红书' ? '#eb2f96' : '#fa8c16'
        return <Tag color={color}>{source}</Tag>
      }
    },
    { title: '推荐时间', dataIndex: 'time', key: 'time', width: 120 },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '活跃' : '沉默'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: () => (
        <Space>
          <Button type="link" size="small">详情</Button>
        </Space>
      )
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>推荐分享看板</Title>
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
            <Statistic
              title="活跃二维码"
              value={stats.activeCodes}
              suffix={<span style={{ fontSize: 14 }}>/ {stats.totalCodes}</span>}
              prefix={<QrcodeOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="总扫码次数"
              value={stats.totalScans}
              suffix={
                <span style={{ fontSize: 14, color: '#52c41a' }}>
                  +{stats.todayScans} 今日
                </span>
              }
              prefix={<ScanOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="活跃用户"
              value={stats.activeUsers}
              suffix={
                <span style={{ fontSize: 14, color: '#722ed1' }}>
                  +{stats.newUsers} 新
                </span>
              }
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="增长趋势"
              value={stats.growthRate}
              suffix="%"
              prefix={<RiseOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card 
            title={<><RiseOutlined /> 推荐趋势</>}
            bordered={false}
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="扫码" stroke="#1890ff" strokeWidth={2} dot={{ fill: '#1890ff' }} />
                <Line yAxisId="left" type="monotone" dataKey="用户" stroke="#52c41a" strokeWidth={2} dot={{ fill: '#52c41a' }} />
                <Line yAxisId="right" type="monotone" dataKey="增长" stroke="#fa8c16" strokeWidth={2} dot={{ fill: '#fa8c16' }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            title={<><ScanOutlined /> 平台扫码分布</>}
            bordered={false}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="scans" fill="#1890ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 推荐排行和最新推荐 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title={<><TeamOutlined /> 推荐排行榜</>}
            bordered={false}
            extra={<Button type="link" icon={<ShareAltOutlined />}>导出</Button>}
          >
            <Table 
              dataSource={rankData}
              rowKey="rank"
              pagination={false}
              size="small"
              columns={[
                { 
                  title: '排名', 
                  dataIndex: 'rank', 
                  key: 'rank',
                  width: 60,
                  render: (rank: number) => (
                    <Tag color={rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default'}>
                      {rank}
                    </Tag>
                  )
                },
                { title: '推荐人', dataIndex: 'name', key: 'name', width: 80 },
                { title: '码数', dataIndex: 'codes', key: 'codes', width: 60 },
                { 
                  title: '扫码数', 
                  dataIndex: 'scans', 
                  key: 'scans',
                  width: 80,
                  render: (scans: number) => scans.toLocaleString()
                },
                { 
                  title: '转化用户', 
                  dataIndex: 'users', 
                  key: 'users',
                  width: 80,
                  render: (users: number) => users.toLocaleString()
                },
                { 
                  title: '增长率', 
                  dataIndex: 'growth', 
                  key: 'growth',
                  width: 80,
                  render: (growth: number) => (
                    <Text type="success">+{growth}%</Text>
                  )
                },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={<><UserOutlined /> 最新推荐用户</>}
            bordered={false}
            extra={<Button type="link">查看全部</Button>}
          >
            <Table 
              columns={columns} 
              dataSource={recentData} 
              rowKey="id" 
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 平台详情表格 */}
      <Card style={{ marginTop: 24 }} title={<><ShareAltOutlined /> 各平台详细数据</>}>
        <Table 
          dataSource={platformData}
          rowKey="platform"
          pagination={false}
          columns={[
            { title: '平台', dataIndex: 'platform', key: 'platform' },
            { 
              title: '扫码次数', 
              dataIndex: 'scans', 
              key: 'scans',
              render: (scans: number) => scans.toLocaleString()
            },
            { 
              title: '转化用户', 
              dataIndex: 'users', 
              key: 'users',
              render: (users: number) => users.toLocaleString()
            },
            { title: '占比', dataIndex: 'rate', key: 'rate', render: (rate: number) => `${rate}%` },
            { 
              title: '转化率', 
              key: 'conversion',
              render: (_: any, record: any) => `${((record.users / record.scans) * 100).toFixed(1)}%`
            },
            {
              title: '操作',
              key: 'action',
              render: () => (
                <Space>
                  <Button type="link" size="small" icon={<DownloadOutlined />}>导出</Button>
                </Space>
              )
            },
          ]}
        />
      </Card>
    </div>
  )
}
