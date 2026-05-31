'use client'

import { useState } from 'react'
import { Card, Row, Col, Button, Tag, Typography, Statistic, Progress, Space, Timeline, message } from 'antd'
import {
  CrownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  RocketOutlined,
  SafetyOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

export default function SubscribePage() {
  // 当前订阅信息
  const [currentSubscription] = useState({
    planName: '年度会员',
    startDate: '2024-01-01',
    endDate: '2025-12-31',
    daysLeft: 245,
    status: 'active',
  })

  // 使用量统计
  const usageStats = [
    { name: '内容生成', used: 1250, limit: '无限', percent: 100, icon: <TeamOutlined /> },
    { name: '矩阵账号', used: 8, limit: '无限', percent: 100, icon: <CheckCircleOutlined /> },
    { name: '智能获客', used: 320, limit: '无限', percent: 100, icon: <RocketOutlined /> },
    { name: '数字人视频', used: 45, limit: '无限', percent: 100, icon: <ThunderboltOutlined /> },
    { name: '招聘助手', used: 89, limit: '无限', percent: 100, icon: <SafetyOutlined /> },
  ]

  // 套餐列表
  const plans = [
    {
      id: 'monthly',
      name: '月度会员',
      duration: '1个月',
      color: '#1890ff',
      features: [
        '无限次内容生成',
        '矩阵管理最多5个账号',
        '发布中心不限次数',
        '招聘助手基础功能',
        '智能获客100条/月',
        '客服支持（工作日）'
      ]
    },
    {
      id: 'quarterly',
      name: '季度会员',
      duration: '3个月',
      color: '#722ed1',
      popular: true,
      features: [
        '无限次内容生成',
        '矩阵管理最多10个账号',
        '发布中心不限次数',
        '招聘助手高级功能',
        '智能获客500条/月',
        '客服支持（7x24小时）',
        '优先功能体验'
      ]
    },
    {
      id: 'yearly',
      name: '年度会员',
      duration: '12个月',
      color: '#faad14',
      features: [
        '无限次内容生成',
        '矩阵管理不限账号',
        '发布中心不限次数',
        '招聘助手全部功能',
        '智能获客不限条数',
        '客服支持（7x24小时）',
        '专属客户经理',
        '优先功能体验',
        'API接口调用'
      ]
    }
  ]

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">套餐管理</Title>

      {/* 当前订阅信息 */}
      <Row gutter={16} className="mb-6">
        <Col span={16}>
          <Card>
            <Row gutter={24} align="middle">
              <Col>
                <CrownOutlined style={{ fontSize: '48px', color: '#faad14' }} />
              </Col>
              <Col>
                <Title level={4} style={{ marginBottom: 8 }}>
                  {currentSubscription.planName}
                  <Tag color="green" className="ml-2">当前</Tag>
                </Title>
                <Space>
                  <Text type="secondary">
                    <ClockCircleOutlined /> 有效期至 {currentSubscription.endDate}
                  </Text>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="剩余天数" 
              value={currentSubscription.daysLeft} 
              suffix="天"
              valueStyle={{ color: '#faad14', fontSize: '32px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 使用量统计 */}
      <Card title="功能使用统计" className="mb-6">
        <Row gutter={16}>
          {usageStats.map((stat, index) => (
            <Col span={8} key={index} className="mb-4">
              <Card size="small">
                <div className="flex items-center mb-2">
                  <div style={{ fontSize: '20px', color: '#1890ff', marginRight: '12px' }}>
                    {stat.icon}
                  </div>
                  <Text strong>{stat.name}</Text>
                </div>
                <Progress percent={stat.percent} size="small" />
                <Text type="secondary" className="mt-2">
                  已使用 {stat.used} 次（{stat.limit}）
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 套餐列表 */}
      <Card title="可选套餐">
        <Row gutter={16}>
          {plans.map((plan) => (
            <Col span={8} key={plan.id}>
              <Card
                className={plan.popular ? 'border-primary' : ''}
                style={{ 
                  borderColor: plan.popular ? plan.color : undefined,
                  position: 'relative'
                }}
              >
                {plan.popular && (
                  <Tag 
                    color={plan.color} 
                    style={{ position: 'absolute', top: 12, right: 12 }}
                  >
                    推荐
                  </Tag>
                )}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <CrownOutlined style={{ fontSize: '32px', color: plan.color }} />
                  <Title level={4} style={{ marginTop: '8px', marginBottom: 0 }}>
                    {plan.name}
                  </Title>
                  <Text type="secondary">{plan.duration}</Text>
                </div>
                
                <div style={{ minHeight: '150px' }}>
                  {plan.features.map((feature, index) => (
                    <div key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      <Text>{feature}</Text>
                    </div>
                  ))}
                </div>
                
                <Button 
                  type={plan.popular ? 'primary' : 'default'}
                  block 
                  size="large"
                  style={{ marginTop: '16px' }}
                  onClick={() => message.info('请联系管理员升级套餐')}
                >
                  联系管理员
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 操作日志 */}
      <Card title="操作日志" className="mt-6">
        <Timeline
          items={[
            { color: 'green', children: '2024-04-15 开通年度会员' },
            { color: 'blue', children: '2024-01-01 开通季度会员' },
            { color: 'gray', children: '2023-10-01 开通月度会员' },
          ]}
        />
      </Card>
    </div>
  )
}
