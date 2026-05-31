'use client'

import React, { useState } from 'react'
import { Card, Row, Col, Typography, Table, Tag, Button, Descriptions, Statistic, Space, message } from 'antd'
import { 
  ClockCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  CrownOutlined,
  RocketOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

// Mock 订阅信息
const subscriptionInfo = {
  plan: '年度会员',
  status: 'active',
  startDate: '2024-01-01',
  expireDate: '2025-12-31',
  autoRenew: true,
  features: [
    { name: '自媒体运营', used: 1250, limit: '无限', icon: <TeamOutlined /> },
    { name: '招聘助手', used: 89, limit: '无限', icon: <CheckCircleOutlined /> },
    { name: '智能获客', used: 320, limit: '无限', icon: <RocketOutlined /> },
    { name: '推荐分享', used: 156, limit: '无限', icon: <CrownOutlined /> },
  ]
}

// 订阅历史
const subscriptionHistory = [
  { 
    id: 1, 
    plan: '年度会员', 
    period: '2024-01-01 至 2025-12-31', 
    status: 'active', 
    date: '2024-01-01' 
  },
  { 
    id: 2, 
    plan: '季度会员', 
    period: '2023-10-01 至 2024-01-01', 
    status: 'expired', 
    date: '2023-10-01' 
  },
  { 
    id: 3, 
    plan: '月度会员', 
    period: '2023-07-01 至 2023-10-01', 
    status: 'expired', 
    date: '2023-07-01' 
  },
]

const columns: ColumnsType<typeof subscriptionHistory[0]> = [
  { 
    title: '套餐', 
    dataIndex: 'plan', 
    key: 'plan',
    render: (plan: string) => <Text strong>{plan}</Text>
  },
  { title: '有效期', dataIndex: 'period', key: 'period' },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status',
    render: (status: string) => (
      <Tag color={status === 'active' ? 'green' : 'default'}>
        {status === 'active' ? '当前' : '已过期'}
      </Tag>
    )
  },
  { title: '开通时间', dataIndex: 'date', key: 'date' },
]

export default function SubscribePage() {
  const [autoRenew, setAutoRenew] = useState(true)

  const handleToggleAutoRenew = () => {
    setAutoRenew(!autoRenew)
    message.success(`自动续费已${!autoRenew ? '开启' : '关闭'}`)
  }

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">订阅管理</Title>

      {/* 当前订阅信息 */}
      <Row gutter={16} className="mb-6">
        <Col span={16}>
          <Card title="当前订阅">
            <Descriptions column={2}>
              <Descriptions.Item label="套餐名称">
                <Tag color="gold" icon={<CrownOutlined />}>
                  {subscriptionInfo.plan}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color="green">正常</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {subscriptionInfo.startDate}
              </Descriptions.Item>
              <Descriptions.Item label="到期时间">
                <Text strong type="danger">
                  <ClockCircleOutlined /> {subscriptionInfo.expireDate}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="自动续费">
                <Button 
                  type={autoRenew ? 'primary' : 'default'}
                  size="small"
                  onClick={handleToggleAutoRenew}
                >
                  {autoRenew ? '已开启' : '已关闭'}
                </Button>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="剩余天数" 
              value={Math.ceil((new Date(subscriptionInfo.expireDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
              suffix="天"
              valueStyle={{ color: '#faad14', fontSize: '36px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 功能使用情况 */}
      <Card title="功能使用情况" className="mb-6">
        <Row gutter={16}>
          {subscriptionInfo.features.map((feature, index) => (
            <Col span={6} key={index}>
              <Card size="small">
                <div className="flex items-center mb-2">
                  <div style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }}>
                    {feature.icon}
                  </div>
                  <Text type="secondary">{feature.name}</Text>
                </div>
                <Statistic 
                  value={feature.used} 
                  suffix={<span style={{ fontSize: '14px', color: '#52c41a' }}>/ {feature.limit}</span>}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 订阅历史 */}
      <Card title="订阅历史">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={subscriptionHistory}
          pagination={false}
        />
      </Card>
    </div>
  )
}
