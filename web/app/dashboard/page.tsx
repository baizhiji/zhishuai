'use client'

import { useRouter } from 'next/navigation'
import { Card, Row, Col, Typography, Alert, Space } from 'antd'
import {
  VideoCameraOutlined,
  ShopOutlined,
  TeamOutlined,
  UserAddOutlined,
  ShareAltOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

export default function DashboardPage() {
  const router = useRouter()

  // 7个核心版块
  const modules = [
    {
      key: 'media',
      title: '自媒体版块',
      icon: <VideoCameraOutlined className="text-4xl" />,
      description: '智能内容生成与矩阵发布',
      path: '/media',
      color: 'from-blue-500 to-blue-600',
      features: ['内容生成', '矩阵管理', '批量发布', '数据统计'],
    },
    {
      key: 'ecommerce',
      title: '电商版块',
      icon: <ShopOutlined className="text-4xl" />,
      description: '智能详情页生成与上架',
      path: '/ecommerce',
      color: 'from-green-500 to-green-600',
      features: ['详情页生成', '多店铺管理', '自动上架', '价格监控'],
    },
    {
      key: 'hr',
      title: 'HR 功能',
      icon: <TeamOutlined className="text-4xl" />,
      description: 'AI 招聘与简历筛选',
      path: '/hr',
      color: 'from-purple-500 to-purple-600',
      features: ['职位发布', 'AI 简历筛选', '自动回复', '面试安排'],
    },
    {
      key: 'acquisition',
      title: '获客功能',
      icon: <UserAddOutlined className="text-4xl" />,
      description: '精准获客与自动引流',
      path: '/acquisition',
      color: 'from-orange-500 to-orange-600',
      features: ['客户发现', '自动发送', '二维码推广', '转化统计'],
    },
    {
      key: 'share',
      title: '推荐分享',
      icon: <ShareAltOutlined className="text-4xl" />,
      description: '短视频一键发布裂变',
      path: '/share',
      color: 'from-pink-500 to-pink-600',
      features: ['二维码生成', '推荐链接', '推荐追踪'],
    },
    {
      key: 'ai',
      title: 'AI 能力',
      icon: <RobotOutlined className="text-4xl" />,
      description: '文本、图像、视频生成',
      path: '/ai',
      color: 'from-indigo-500 to-indigo-600',
      features: ['内容生成', '拟人化回复', '数据分析'],
    },
    {
      key: 'referral',
      title: '我的转介绍',
      icon: <UserOutlined className="text-4xl" />,
      description: '推荐智枢AI获取奖励',
      path: '/referral',
      color: 'from-cyan-500 to-cyan-600',
      features: ['我的推荐', '推荐统计', '收益查看'],
    },
  ]

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <Title level={2} className="mb-2">欢迎使用智枢AI</Title>
        <Text type="secondary">一站式智能商业平台，用AI赋能企业</Text>
      </div>

      {/* 系统公告 */}
      <Alert
        message="🎉 欢迎使用智枢AI"
        description="请选择下方的功能版块开始使用，每个版块都包含丰富的AI功能。"
        type="success"
        showIcon
        closable
        className="mb-6"
      />

      {/* 7个核心版块 */}
      <Row gutter={[16, 16]}>
        {modules.map((module) => (
          <Col xs={24} sm={12} md={8} lg={8} xl={6} key={module.key}>
            <Card
              className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer"
              styles={{ body: { padding: '24px' } }}
              onClick={() => router.push(module.path)}
              hoverable
            >
              {/* 图标 */}
              <div className="mb-4">
                <div
                  className={`p-4 rounded-xl bg-gradient-to-br ${module.color} text-white flex items-center justify-center`}
                >
                  {module.icon}
                </div>
              </div>

              {/* 标题 */}
              <Title level={5} className="mb-2">
                {module.title}
              </Title>

              {/* 描述 */}
              <Text type="secondary" className="text-sm mb-4 block">
                {module.description}
              </Text>

              {/* 功能列表 */}
              <Space direction="vertical" size="small" className="w-full">
                {module.features.map((feature, index) => (
                  <div key={index} className="text-xs text-gray-500">
                    • {feature}
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
