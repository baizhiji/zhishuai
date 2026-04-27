'use client'

import { useRouter } from 'next/navigation'
import { Card, Button, Typography, Space, Row, Col, Badge, Divider } from 'antd'
import {
  ArrowLeftOutlined,
  ApiOutlined,
  BookOutlined,
  MobileOutlined,
  UserOutlined,
  SettingOutlined,
  DatabaseOutlined,
  BellOutlined,
  ShieldCheckOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

const modules = [
  {
    id: 'api-config',
    title: 'API配置',
    icon: <ApiOutlined className="text-4xl" />,
    description: '配置AI模型的API密钥和参数',
    status: 'completed',
    link: '/system/settings',
    badge: '推荐',
  },
  {
    id: 'knowledge-base',
    title: '知识库管理',
    icon: <BookOutlined className="text-4xl" />,
    description: '上传和管理知识库文档',
    status: 'completed',
    link: '/system/knowledge',
    badge: null,
  },
  {
    id: 'app-customization',
    title: 'APP定制',
    icon: <MobileOutlined className="text-4xl" />,
    description: '定制APK应用的外观和功能',
    status: 'completed',
    link: '/system/app-customize',
    badge: null,
  },
  {
    id: 'user-management',
    title: '用户管理',
    icon: <UserOutlined className="text-4xl" />,
    description: '管理系统用户和权限',
    status: 'new',
    link: '/system/users',
    badge: 'NEW',
  },
  {
    id: 'system-settings',
    title: '系统设置',
    icon: <SettingOutlined className="text-4xl" />,
    description: '配置系统参数和通知',
    status: 'new',
    link: '/system/settings',
    badge: null,
  },
]

export default function SystemPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/')}
          className="mb-6"
        >
          返回首页
        </Button>

        {/* 标题 */}
        <div className="mb-8">
          <Title level={2}>系统设置</Title>
          <Text type="secondary">配置和管理系统各项设置</Text>
        </div>

        {/* 系统状态概览 */}
        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={8}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-500 text-sm mb-2">系统版本</div>
                  <div className="text-xl font-bold">v1.0.0</div>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <ShieldCheckOutlined className="text-2xl text-blue-500" />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-500 text-sm mb-2">运行状态</div>
                  <div className="text-xl font-bold text-green-500">正常运行</div>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DatabaseOutlined className="text-2xl text-green-500" />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-500 text-sm mb-2">最后更新</div>
                  <div className="text-xl font-bold">2024-01-16</div>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <BellOutlined className="text-2xl text-purple-500" />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 功能模块 */}
        <Row gutter={[16, 16]}>
          {modules.map((module) => (
            <Col xs={24} sm={12} md={8} key={module.id}>
              <Card
                hoverable
                onClick={() => router.push(module.link)}
                className="h-full"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-violet-100 p-4 rounded-lg">
                      {module.icon}
                    </div>
                    {module.badge && (
                      <Badge count={module.badge} color="volcano" />
                    )}
                  </div>
                  <Title level={4} className="mb-2">{module.title}</Title>
                  <Paragraph type="secondary" className="flex-1">
                    {module.description}
                  </Paragraph>
                  <div className="flex items-center justify-between mt-4">
                    <Text type="secondary" className="text-sm">
                      {module.status === 'new' ? '新功能' : '已配置'}
                    </Text>
                    <Button type="link" size="small">
                      进入配置 →
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 快速操作 */}
        <Card className="mt-8">
          <Title level={4}>快速操作</Title>
          <Divider />
          <Space wrap>
            <Button icon={<SettingOutlined />}>重置所有配置</Button>
            <Button icon={<DatabaseOutlined />}>备份数据</Button>
            <Button icon={<ShieldCheckOutlined />}>安全检查</Button>
            <Button icon={<BellOutlined />}>系统通知</Button>
          </Space>
        </Card>
      </div>
    </div>
  )
}
