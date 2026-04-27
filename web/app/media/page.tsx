'use client'

import { useRouter } from 'next/navigation'
import { Card, Row, Col, Button, Typography, Breadcrumb } from 'antd'
import {
  ArrowLeftOutlined,
  VideoCameraOutlined,
  UsergroupAddOutlined,
  SendOutlined,
  BarChartOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

interface FeatureCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  path: string
  color: string
}

const features: FeatureCard[] = [
  {
    id: 'generate',
    title: 'AI内容生成',
    description: '基于热点话题和行业特点，自动生成视频、图文、短视频内容',
    icon: <VideoCameraOutlined className="text-5xl" />,
    path: '/media/generate',
    color: 'from-blue-500 to-purple-600',
  },
  {
    id: 'accounts',
    title: '矩阵账号管理',
    description: '管理抖音、快手、小红书、视频号等多个平台账号',
    icon: <UsergroupAddOutlined className="text-5xl" />,
    path: '/media/accounts',
    color: 'from-green-500 to-teal-600',
  },
  {
    id: 'publish',
    title: '批量发布',
    description: '一键上传到各平台，自动填写标题、描述和标签',
    icon: <SendOutlined className="text-5xl" />,
    path: '/media/publish',
    color: 'from-orange-500 to-red-600',
  },
  {
    id: 'stats',
    title: '数据统计',
    description: '查看发布记录、播放量、点赞、评论、分享等数据',
    icon: <BarChartOutlined className="text-5xl" />,
    path: '/media/stats',
    color: 'from-pink-500 to-rose-600',
  },
]

export default function MediaManagementPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 面包屑导航 */}
        <Breadcrumb className="mb-6">
          <Breadcrumb.Item onClick={() => router.push('/dashboard')} className="cursor-pointer">
            首页
          </Breadcrumb.Item>
          <Breadcrumb.Item>自媒体板块</Breadcrumb.Item>
        </Breadcrumb>

        {/* 返回按钮 */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/dashboard')}
          className="mb-6"
        >
          返回首页
        </Button>

        {/* 标题区域 */}
        <div className="mb-8">
          <Title level={2} className="mb-2">
            自媒体板块
          </Title>
          <Text type="secondary" className="text-lg">
            抖音、快手、小红书、视频号一站式管理
          </Text>
        </div>

        {/* 功能卡片 */}
        <Row gutter={[24, 24]}>
          {features.map((feature) => (
            <Col xs={24} sm={12} lg={6} key={feature.id}>
              <Card
                hoverable
                className={`h-full card-hover overflow-hidden bg-gradient-to-br ${feature.color}`}
                styles={{
                  body: { padding: '24px' },
                }}
                onClick={() => router.push(feature.path)}
              >
                <div className="text-white">
                  <div className="mb-6">
                    <div className="bg-white/20 rounded-lg p-4 inline-block">
                      {feature.icon}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="mt-6 flex items-center text-sm opacity-80">
                    <span>立即使用</span>
                    <svg
                      className="ml-2 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 平台说明 */}
        <div className="mt-12 bg-white rounded-lg p-6 shadow-md">
          <Title level={4} className="mb-4">
            支持的平台
          </Title>
          <Row gutter={[16, 16]}>
            {[
              { name: '抖音', icon: '🎵', desc: '短视频平台' },
              { name: '快手', icon: '📹', desc: '短视频社区' },
              { name: '小红书', icon: '📕', desc: '生活方式平台' },
              { name: '视频号', icon: '🎬', desc: '微信视频号' },
            ].map((platform) => (
              <Col xs={12} sm={6} key={platform.name}>
                <Card className="text-center">
                  <div className="text-4xl mb-2">{platform.icon}</div>
                  <div className="font-semibold mb-1">{platform.name}</div>
                  <div className="text-xs text-gray-500">{platform.desc}</div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </div>
  )
}
