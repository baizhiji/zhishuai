'use client'

import { useRouter } from 'next/navigation'
import { Card, Row, Col, Button, Typography, Breadcrumb, Table, Tag } from 'antd'
import { ArrowLeftOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useReferral } from '@/lib/hooks/useReferral'

const { Title, Text } = Typography

const mockReferrals = [
  { id: '1', referredUser: '用户A', status: 'registered', commission: 100, date: '2024-03-15' },
  { id: '2', referredUser: '用户B', status: 'active', commission: 200, date: '2024-03-14' },
  { id: '3', referredUser: '用户C', status: 'pending', commission: 0, date: '2024-03-13' },
]

export default function IntroductionPage() {
  const router = useRouter()
  const { referrals, loading } = useReferral()

  const columns = [
    { title: '被推荐用户', dataIndex: 'referredUser', key: 'referredUser' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          registered: { color: 'blue', text: '已注册', icon: <CheckCircleOutlined /> },
          active: { color: 'green', text: '已激活', icon: <CheckCircleOutlined /> },
          pending: { color: 'orange', text: '待激活', icon: <ClockCircleOutlined /> },
        }
        const { color, text, icon } = config[status as keyof typeof config] || config.pending
        return <Tag color={color} icon={icon}>{text}</Tag>
      },
    },
    { title: '佣金', dataIndex: 'commission', key: 'commission', render: (v: number) => `¥${v}` },
    { title: '推荐时间', dataIndex: 'date', key: 'date' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <Breadcrumb.Item onClick={() => router.push('/dashboard')} className="cursor-pointer">首页</Breadcrumb.Item>
          <Breadcrumb.Item>转介绍</Breadcrumb.Item>
        </Breadcrumb>

        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/dashboard')} className="mb-6">
          返回首页
        </Button>

        <div className="mb-8">
          <Title level={2}>我的推荐</Title>
          <Text type="secondary">查看推荐的用户列表和推荐状态</Text>
        </div>

        <Card title="推荐列表" loading={loading}>
          <Table columns={columns} dataSource={referrals || mockReferrals} rowKey="id" pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </div>
  )
}
