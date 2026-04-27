'use client'

import { useRouter } from 'next/navigation'
import { Card, Row, Col, Button, Typography, Breadcrumb } from 'antd'
import {
  ArrowLeftOutlined,
  UserAddOutlined,
  FileSearchOutlined,
  MessageOutlined,
  CalendarOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

const features = [
  {
    id: 'job-publish',
    title: '职位发布',
    description: '自动发布到BOSS直聘、前程无忧、智联招聘、拉勾网',
    icon: <UserAddOutlined className="text-5xl" />,
    path: '/hr/job-publish',
    color: 'from-orange-500 to-red-600',
  },
  {
    id: 'resume-screening',
    title: 'AI简历筛选',
    description: '自动接收简历，AI分析匹配度，智能推荐优秀候选人',
    icon: <FileSearchOutlined className="text-5xl" />,
    path: '/hr/resume-screening',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'auto-reply',
    title: '自动回复',
    description: '自动回复候选人消息，发送面试邀请和录用通知',
    icon: <MessageOutlined className="text-5xl" />,
    path: '/hr/auto-reply',
    color: 'from-green-500 to-teal-600',
  },
  {
    id: 'interview',
    title: '面试安排',
    description: '管理面试日程，记录面试反馈，生成面试报告',
    icon: <CalendarOutlined className="text-5xl" />,
    path: '/hr/interview',
    color: 'from-purple-500 to-pink-600',
  },
]

export default function HRPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <Breadcrumb.Item onClick={() => router.push('/dashboard')} className="cursor-pointer">
            首页
          </Breadcrumb.Item>
          <Breadcrumb.Item>HR功能</Breadcrumb.Item>
        </Breadcrumb>

        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/dashboard')}
          className="mb-6"
        >
          返回首页
        </Button>

        <div className="mb-8">
          <Title level={2}>HR功能</Title>
          <Text type="secondary" className="text-lg">
            BOSS直聘、前程无忧、智联招聘、拉勾网一站式管理
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {features.map((feature) => (
            <Col xs={24} sm={12} lg={6} key={feature.id}>
              <Card
                hoverable
                className={`h-full card-hover overflow-hidden bg-gradient-to-br ${feature.color}`}
                styles={{ body: { padding: '24px' } }}
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
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )
}
