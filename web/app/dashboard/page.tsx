'use client'

import { useRouter } from 'next/navigation'
import { Card, Row, Col, Typography, Alert } from 'antd'
import {
  VideoCameraOutlined,
  TeamOutlined,
  UserAddOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

export default function DashboardPage() {
  const router = useRouter()

  // 4个核心版块（根据新需求）
  const modules = [
    {
      key: 'media',
      title: '自媒体运营',
      icon: <VideoCameraOutlined className="text-4xl" />,
      description: 'AI智能内容生成与矩阵发布',
      path: '/media',
      color: 'from-blue-500 to-blue-600',
      features: ['内容工厂', '矩阵管理', '发布中心', '数据报表'],
    },
    {
      key: 'recruitment',
      title: '招聘助手',
      icon: <TeamOutlined className="text-4xl" />,
      description: 'AI智能招聘与简历筛选',
      path: '/recruitment',
      color: 'from-purple-500 to-purple-600',
      features: ['职位发布', '简历筛选', '自动回复', '面试管理'],
    },
    {
      key: 'acquisition',
      title: '智能获客',
      icon: <UserAddOutlined className="text-4xl" />,
      description: '精准获客与自动引流',
      path: '/acquisition',
      color: 'from-orange-500 to-orange-600',
      features: ['潜客发现', '引流任务', '获客看板'],
    },
    {
      key: 'share',
      title: '推荐分享',
      icon: <ShareAltOutlined className="text-4xl" />,
      description: '短视频一键发布裂变',
      path: '/share',
      color: 'from-pink-500 to-pink-600',
      features: ['码生成', '推荐追踪'],
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
        description="请选择下方的功能版块开始使用。AI生成内容将自动保存到素材库。"
        type="success"
        showIcon
        closable
        className="mb-6"
      />

      {/* 4个核心版块 */}
      <Row gutter={[16, 16]}>
        {modules.map((module) => (
          <Col xs={24} sm={12} md={12} lg={6} xl={6} key={module.key}>
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
              <div className="flex flex-wrap gap-2">
                {module.features.map((feature, index) => (
                  <div key={index} className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                    {feature}
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
