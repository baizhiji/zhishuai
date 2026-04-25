'use client'

import { useRouter } from 'next/navigation'
import { Card, Row, Col, Button, Typography, Breadcrumb } from 'antd'
import { ArrowLeftOutlined, SearchOutlined, SendOutlined, QrcodeOutlined, BarChartOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const features = [
  { id: 'discovery', title: '潜在客户发现', desc: '根据关键词、话题发现潜在客户', icon: <SearchOutlined />, color: 'from-blue-500 to-purple-600' },
  { id: 'send', title: '自动发送信息', desc: '自动发送引流信息和介绍', icon: <SendOutlined />, color: 'from-green-500 to-teal-600' },
  { id: 'qrcode', title: '二维码发送', desc: '自动发送二维码并追踪扫码效果', icon: <QrcodeOutlined />, color: 'from-orange-500 to-red-600' },
  { id: 'stats', title: '转化统计', desc: '查看发送记录和转化率', icon: <BarChartOutlined />, color: 'from-pink-500 to-rose-600' },
]

export default function CustomerPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <Breadcrumb.Item onClick={() => router.push('/dashboard')} className="cursor-pointer">首页</Breadcrumb.Item>
          <Breadcrumb.Item>获客功能</Breadcrumb.Item>
        </Breadcrumb>

        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/dashboard')} className="mb-6">
          返回首页
        </Button>

        <div className="mb-8">
          <Title level={2}>获客功能</Title>
          <Text type="secondary">发现潜在客户并自动发送引流信息</Text>
        </div>

        <Row gutter={[24, 24]}>
          {features.map((feature) => (
            <Col xs={24} sm={12} lg={6} key={feature.id}>
              <Card hoverable className={`h-full card-hover overflow-hidden bg-gradient-to-br ${feature.color}`} styles={{ body: { padding: '24px' } }} onClick={() => router.push(`/customer/${feature.id}`)}>
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
