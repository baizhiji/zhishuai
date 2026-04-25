'use client'

import { useRouter } from 'next/navigation'
import { Card, Row, Col, Button, Typography, Breadcrumb } from 'antd'
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  ShopOutlined,
  UploadOutlined,
  DollarOutlined,
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
    id: 'detail-page',
    title: '智能详情页生成',
    description: '基于产品信息和热点话题，自动生成吸引人的商品详情页',
    icon: <FileTextOutlined className="text-5xl" />,
    path: '/e-commerce/detail-page',
    color: 'from-green-500 to-teal-600',
  },
  {
    id: 'shops',
    title: '多店铺管理',
    description: '管理淘宝、京东、拼多多、抖店、美团等多个电商店铺',
    icon: <ShopOutlined className="text-5xl" />,
    path: '/e-commerce/shops',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'auto-publish',
    title: '自动上架',
    description: '一键上架到各平台，自动填写商品信息和上传图片',
    icon: <UploadOutlined className="text-5xl" />,
    path: '/e-commerce/auto-publish',
    color: 'from-orange-500 to-red-600',
  },
  {
    id: 'price-monitor',
    title: '价格监控',
    description: '实时监控竞品价格，提供价格趋势分析和调价建议',
    icon: <DollarOutlined className="text-5xl" />,
    path: '/e-commerce/price-monitor',
    color: 'from-purple-500 to-pink-600',
  },
  {
    id: 'sales-stats',
    title: '销量统计',
    description: '查看销量数据、转化率、客单价、退货率等关键指标',
    icon: <BarChartOutlined className="text-5xl" />,
    path: '/e-commerce/sales-stats',
    color: 'from-yellow-500 to-orange-600',
  },
]

export default function EcommercePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
      <div className="container mx-auto px-4 py-8">
        {/* 面包屑导航 */}
        <Breadcrumb className="mb-6">
          <Breadcrumb.Item onClick={() => router.push('/dashboard')} className="cursor-pointer">
            首页
          </Breadcrumb.Item>
          <Breadcrumb.Item>电商板块</Breadcrumb.Item>
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
            电商板块
          </Title>
          <Text type="secondary" className="text-lg">
            淘宝、京东、拼多多、抖店、美团一站式管理
          </Text>
        </div>

        {/* 功能卡片 */}
        <Row gutter={[24, 24]}>
          {features.map((feature) => (
            <Col xs={24} sm={12} lg={12} xl={12} key={feature.id}>
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
              { name: '淘宝', icon: '🛍️', desc: '综合电商平台' },
              { name: '京东', icon: '🛒', desc: '品质电商平台' },
              { name: '拼多多', icon: '📦', desc: '社交电商平台' },
              { name: '抖店', icon: '🎪', desc: '抖音电商平台' },
              { name: '美团', icon: '🍔', desc: '本地生活服务' },
            ].map((platform) => (
              <Col xs={12} sm={6} md={4} key={platform.name}>
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
