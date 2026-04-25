'use client'

import { useRouter } from 'next/navigation'
import { Card, Row, Col, Button, Typography, Breadcrumb } from 'antd'
import { ArrowLeftOutlined, QrcodeOutlined, LinkOutlined, BarChartOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const features = [
  { id: 'qrcode', title: '二维码生成', desc: '生成专属推广二维码', icon: <QrcodeOutlined />, color: 'from-blue-500 to-purple-600' },
  { id: 'link', title: '推荐链接生成', desc: '生成专属推荐链接', icon: <LinkOutlined />, color: 'from-green-500 to-teal-600' },
  { id: 'track', title: '推荐追踪', desc: '实时查看推荐数据', icon: <BarChartOutlined />, color: 'from-orange-500 to-red-600' },
]

export default function ReferralPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <Breadcrumb.Item onClick={() => router.push('/dashboard')} className="cursor-pointer">首页</Breadcrumb.Item>
          <Breadcrumb.Item>推荐分享</Breadcrumb.Item>
        </Breadcrumb>

        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/dashboard')} className="mb-6">
          返回首页
        </Button>

        <div className="mb-8">
          <Title level={2}>推荐分享</Title>
          <Text type="secondary">生成推广二维码和推荐链接，追踪推荐效果</Text>
        </div>

        <Row gutter={[24, 24]}>
          {features.map((feature) => (
            <Col xs={24} sm={8} lg={8} key={feature.id}>
              <Card hoverable className={`h-full card-hover overflow-hidden bg-gradient-to-br ${feature.color}`} styles={{ body: { padding: '24px' } }} onClick={() => router.push(`/referral/${feature.id}`)}>
                <div className="text-white">
                  <div className="mb-6"><div className="bg-white/20 rounded-lg p-4 inline-block">{feature.icon}</div></div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-sm opacity-90 leading-relaxed">{feature.desc}</p>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )
}
