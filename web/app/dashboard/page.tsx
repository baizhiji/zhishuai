'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Space, Typography, Row, Col, Progress, Table, Tag, Badge, Statistic, Divider, Alert } from 'antd'
import {
  RobotOutlined,
  TeamOutlined,
  ShopOutlined,
  SettingOutlined,
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SyncOutlined,
  ReloadOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // 模拟刷新数据
  const handleRefresh = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
  }

  // 统计卡片数据
  const stats = [
    {
      title: 'AI生成内容',
      value: 1284,
      suffix: '篇',
      icon: <RobotOutlined className="text-4xl" />,
      color: 'from-blue-500 to-blue-600',
      trend: 12.5,
      trendUp: true,
      loading: false,
    },
    {
      title: '矩阵账号',
      value: 56,
      suffix: '个',
      icon: <TeamOutlined className="text-4xl" />,
      color: 'from-green-500 to-green-600',
      trend: 8.3,
      trendUp: true,
      loading: false,
    },
    {
      title: '管理店铺',
      value: 23,
      suffix: '家',
      icon: <ShopOutlined className="text-4xl" />,
      color: 'from-purple-500 to-purple-600',
      trend: -2.1,
      trendUp: false,
      loading: false,
    },
    {
      title: '系统状态',
      value: '正常',
      suffix: '',
      icon: <CheckCircleOutlined className="text-4xl" />,
      color: 'from-orange-500 to-orange-600',
      trend: 0,
      trendUp: true,
      loading: false,
    },
  ]

  // 快捷入口
  const shortcuts = [
    {
      title: 'AI内容生成',
      description: '使用AI生成高质量内容',
      icon: <RobotOutlined className="text-3xl" />,
      link: '/media/ai-create',
      color: 'bg-blue-100',
      iconColor: 'text-blue-500',
    },
    {
      title: '矩阵账号管理',
      description: '统一管理多个平台账号',
      icon: <TeamOutlined className="text-3xl" />,
      link: '/media/accounts',
      color: 'bg-green-100',
      iconColor: 'text-green-500',
    },
    {
      title: '多店铺管理',
      description: '集中管理电商店铺',
      icon: <ShopOutlined className="text-3xl" />,
      link: '/e-commerce/shops',
      color: 'bg-purple-100',
      iconColor: 'text-purple-500',
    },
    {
      title: '系统设置',
      description: '配置系统参数',
      icon: <SettingOutlined className="text-3xl" />,
      link: '/system',
      color: 'bg-orange-100',
      iconColor: 'text-orange-500',
    },
  ]

  // 最新活动
  const activities = [
    {
      id: '1',
      type: 'success',
      title: '成功发布 10 条内容到抖音',
      time: '10分钟前',
    },
    {
      id: '2',
      type: 'processing',
      title: '正在同步淘宝店铺数据',
      time: '30分钟前',
    },
    {
      id: '3',
      type: 'warning',
      title: '发现 5 个竞品价格变动',
      time: '1小时前',
    },
    {
      id: '4',
      type: 'default',
      title: '新增 3 个潜在客户',
      time: '2小时前',
    },
  ]

  // 快速链接
  const quickLinks = [
    { title: '批量发布', link: '/media/publish', count: 1284 },
    { title: '价格监控', link: '/e-commerce/price-monitor', count: 89 },
    { title: '客户发现', link: '/customer/discovery', count: 567 },
    { title: '用户管理', link: '/system/users', count: 12 },
  ]

  const columns = [
    {
      title: '活动',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      render: (time: string) => <Text type="secondary">{time}</Text>,
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: any) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          success: { text: '成功', color: 'success' },
          processing: { text: '进行中', color: 'processing' },
          warning: { text: '警告', color: 'warning' },
          default: { text: '默认', color: 'default' },
        }
        const s = statusMap[record.type]
        return <Badge status={record.type} text={s.text} />
      },
    },
  ]

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <Title level={2} className="mb-2">欢迎回来 👋</Title>
          <Text type="secondary">这是您的智枢AI工作台，概览您的工作进展</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={loading}
        >
          刷新数据
        </Button>
      </div>

      {/* 系统公告 */}
      <div className="mb-6">
        <Alert
          message="🎉 系统更新"
          description="智枢AI系统已完成全新升级，新增客户管理和电商板块功能，快来体验吧！"
          type="success"
          showIcon
          closable
          className="mb-6"
        />
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        {stats.map((stat, index) => (
          <Col xs={12} sm={6} key={index}>
            <Card className="h-full hover:shadow-lg transition-shadow duration-300" styles={{ body: { padding: '24px' } }}>
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white`}
                >
                  {stat.icon}
                </div>
                {stat.trend !== 0 && (
                  <div
                    className={`flex items-center text-sm ${
                      stat.trendUp ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.trendUp ? (
                      <ArrowUpOutlined className="mr-1" />
                    ) : (
                      <ArrowDownOutlined className="mr-1" />
                    )}
                    {Math.abs(stat.trend)}%
                  </div>
                )}
              </div>

              <div className="mb-2">
                <Text type="secondary" className="text-sm">
                  {stat.title}
                </Text>
              </div>

              <div className="flex items-baseline">
                <Statistic
                  value={stat.value}
                  suffix={stat.suffix}
                  valueStyle={{ fontSize: '24px', fontWeight: 600 }}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 快捷入口 */}
      <Row gutter={[16, 16]} className="mb-6">
        {shortcuts.map((shortcut, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card
              className="h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              styles={{ body: { padding: '24px' } }}
              onClick={() => router.push(shortcut.link)}
            >
              <div className={`flex flex-col items-center text-center`}>
                <div className={`p-4 rounded-full ${shortcut.color} mb-4`}>
                  <div className={shortcut.iconColor}>{shortcut.icon}</div>
                </div>
                <Title level={5} className="mb-2">
                  {shortcut.title}
                </Title>
                <Text type="secondary" className="text-sm">
                  {shortcut.description}
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} className="mb-6">
        {/* 最新活动 */}
        <Col xs={24} lg={16}>
          <Card
            title="最新活动"
            extra={
              <Button type="link" onClick={() => router.push('/analytics/activities')}>
                查看全部
              </Button>
            }
            className="h-full"
          >
            <Table
              dataSource={activities}
              columns={columns}
              pagination={false}
              rowKey="id"
            />
          </Card>
        </Col>

        {/* 快速链接 */}
        <Col xs={24} lg={8}>
          <Card title="快速链接" className="h-full">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {quickLinks.map((link, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => router.push(link.link)}
                >
                  <div>
                    <div className="font-medium mb-1">{link.title}</div>
                    <Text type="secondary" className="text-sm">
                      {link.count} 项
                    </Text>
                  </div>
                  <ArrowRightOutlined />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 数据概览 */}
      <div>
        <Card title="数据概览">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <div className="text-center p-4">
                <Progress
                  type="circle"
                  percent={75}
                  strokeColor="#52c41a"
                  format={(percent) => `${percent}%`}
                />
                <div className="mt-3">
                  <Text type="secondary">本月目标完成度</Text>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="text-center p-4">
                <Progress
                  type="circle"
                  percent={60}
                  strokeColor="#1890ff"
                  format={(percent) => `${percent}%`}
                />
                <div className="mt-3">
                  <Text type="secondary">账号活跃度</Text>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="text-center p-4">
                <Progress
                  type="circle"
                  percent={85}
                  strokeColor="#722ed1"
                  format={(percent) => `${percent}%`}
                />
                <div className="mt-3">
                  <Text type="secondary">店铺转化率</Text>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  )
}
