'use client';

import { useState } from 'react';
import { Typography, Row, Col, Card, Button, Tag, Space } from 'antd';
import { CheckCircleFilled, CrownFilled, RocketOutlined, BarChartOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const plans = [
  {
    key: 'free',
    name: '免费版',
    price: '¥0',
    period: '/月',
    icon: <RocketOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
    color: '#52c41a',
    features: [
      '1个自媒体平台账号',
      '基础AI内容生成（10次/天）',
      '素材库 1GB 存储',
      '基础数据分析',
      '社区支持',
    ],
    buttonText: '免费开始',
    buttonType: 'default' as const,
  },
  {
    key: 'pro',
    name: '专业版',
    price: '¥299',
    period: '/月',
    icon: <CrownFilled style={{ fontSize: 48, color: '#1890ff' }} />,
    color: '#1890ff',
    tag: '推荐',
    features: [
      '5个自媒体平台账号',
      '无限AI内容生成',
      '素材库 50GB 存储',
      '智能招聘',
      '智能获客功能',
      '推荐分享追踪',
      'API接口接入',
      '邮件支持',
    ],
    buttonText: '立即订阅',
    buttonType: 'primary' as const,
  },
  {
    key: 'enterprise',
    name: '企业版',
    price: '¥999',
    period: '/月',
    icon: <BarChartOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
    color: '#722ed1',
    features: [
      '无限自媒体平台账号',
      '无限AI内容生成',
      '素材库 500GB 存储',
      '智能招聘全功能',
      '智能获客全功能',
      '推荐分享高级追踪',
      '全部API接口',
      '自定义品牌贴牌',
      '专属客户经理',
      '7x24小时技术支持',
      '私有化部署可选',
    ],
    buttonText: '联系销售',
    buttonType: 'default' as const,
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const yearlyDiscount = 0.8; // 年付8折

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={1}>价格方案</Title>
        <Paragraph style={{ fontSize: 18, color: '#666', maxWidth: 600, margin: '16px auto' }}>
          选择最适合您业务需求的方案，所有方案均支持随时升级
        </Paragraph>

        <Space style={{ marginTop: 24 }}>
          <Button
            type={billingPeriod === 'monthly' ? 'primary' : 'default'}
            onClick={() => setBillingPeriod('monthly')}
          >
            按月付费
          </Button>
          <Button
            type={billingPeriod === 'yearly' ? 'primary' : 'default'}
            onClick={() => setBillingPeriod('yearly')}
          >
            按年付费
            <Tag color="green" style={{ marginLeft: 8 }}>省20%</Tag>
          </Button>
        </Space>
      </div>

      <Row gutter={[24, 24]} justify="center">
        {plans.map((plan) => {
          const displayPrice =
            billingPeriod === 'yearly'
              ? `¥${Math.round(parseInt(plan.price.replace('¥', '')) * 12 * yearlyDiscount)}`
              : plan.price;
          const displayPeriod = billingPeriod === 'yearly' ? '/年' : plan.period;

          return (
            <Col key={plan.key} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                style={{
                  borderRadius: 16,
                  borderColor: plan.key === 'pro' ? plan.color : undefined,
                  borderWidth: plan.key === 'pro' ? 2 : 1,
                  height: '100%',
                }}
              >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  {plan.tag && (
                    <Tag color={plan.color} style={{ marginBottom: 12 }}>
                      {plan.tag}
                    </Tag>
                  )}
                  <div style={{ marginBottom: 16 }}>{plan.icon}</div>
                  <Title level={3} style={{ marginBottom: 8 }}>
                    {plan.name}
                  </Title>
                  <div style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 40, fontWeight: 700, color: plan.color }}>
                      {displayPrice}
                    </Text>
                    <Text style={{ fontSize: 16, color: '#999' }}>{displayPeriod}</Text>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left' }}>
                    {plan.features.map((feature, i) => (
                      <li key={i} style={{ padding: '8px 0', fontSize: 15 }}>
                        <CheckCircleFilled style={{ color: plan.color, marginRight: 8 }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button type={plan.buttonType} size="large" block style={{ borderRadius: 8, height: 48 }}>
                    {plan.buttonText}
                  </Button>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <div style={{ textAlign: 'center', marginTop: 60, color: '#999', fontSize: 14 }}>
        所有价格均为含税价格。如需定制方案请联系我们的销售团队。
      </div>
    </div>
  );
}
