'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Statistic,
  Space,
  Table,
  Spin,
  Empty,
  message,
  Alert,
} from 'antd';
import {
  CrownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  RocketOutlined,
  SafetyOutlined,
  ShareAltOutlined,
  ApiOutlined,
  CustomerServiceOutlined,
  ThunderboltOutlined,
  BookOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

const { Title, Text } = Typography;

const FEATURE_META: Record<string, { name: string; icon: React.ReactNode; desc: string }> = {
  factory: { name: 'AI创作工厂', icon: <ThunderboltOutlined />, desc: '文案、脚本、图文内容创作' },
  recruitment: { name: '智能招聘', icon: <TeamOutlined />, desc: '人才筛选与自动猎头' },
  acquisition: { name: '智能获客', icon: <RocketOutlined />, desc: '潜客采集与引流' },
  referral: { name: '推荐分享', icon: <ShareAltOutlined />, desc: '裂变增长与分销' },
  media: { name: '媒体矩阵', icon: <ShareAltOutlined />, desc: '多平台账号管理' },
  digital_human: { name: '数字人视频', icon: <CustomerServiceOutlined />, desc: '数字人内容生成' },
  customer_service: { name: '智能客服', icon: <CustomerServiceOutlined />, desc: '智能应答与工单' },
  knowledge: { name: '知识库', icon: <BookOutlined />, desc: '企业知识沉淀与检索' },
  material: { name: '素材库', icon: <FileImageOutlined />, desc: '素材管理与复用' },
  api_access: { name: 'API 接口', icon: <ApiOutlined />, desc: '开放接口调用' },
};

const PLANS = [
  {
    id: 'monthly',
    name: '月度会员',
    duration: '1个月',
    color: '#6d28d9',
    features: [
      '无限次内容生成',
      '矩阵管理最多5个账号',
      '发布中心不限次数',
      '智能招聘基础功能',
      '智能获客100条/月',
      '客服支持（工作日）',
    ],
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
      '智能招聘高级功能',
      '智能获客500条/月',
      '客服支持（7x24小时）',
      '优先功能体验',
    ],
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
      '智能招聘全部功能',
      '智能获客不限条数',
      '客服支持（7x24小时）',
      '专属客户经理',
      '优先功能体验',
      'API接口调用',
    ],
  },
];

interface SubscriptionRecord {
  id: string;
  plan: string;
  period: string;
  status: string;
  date: string;
  amount: number;
}

interface SubscriptionInfo {
  plan: string;
  status: string;
  startDate: string;
  expireDate: string;
  fee: number;
}

const historyColumns: ColumnsType<SubscriptionRecord> = [
  {
    title: '套餐',
    dataIndex: 'plan',
    key: 'plan',
    render: (plan: string) => <Text strong>{plan}</Text>,
  },
  { title: '计费周期', dataIndex: 'period', key: 'period' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => (
      <Tag color={status === 'active' ? 'green' : 'default'}>
        {status === 'active' ? '当前' : '已过期'}
      </Tag>
    ),
  },
  { title: '开通时间', dataIndex: 'date', key: 'date' },
  {
    title: '金额（元）',
    dataIndex: 'amount',
    key: 'amount',
    render: (amount: number) => (amount > 0 ? amount.toFixed(2) : '—'),
  },
];

export default function SubscribePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [history, setHistory] = useState<SubscriptionRecord[]>([]);

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/account/subscription');
      setSubscription(res?.current || null);
      setFeatures(res?.features || []);
      setHistory(res?.history || []);
    } catch {
      setSubscription(null);
      setFeatures([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const remainingDays = subscription
    ? Math.ceil(
        (new Date(subscription.expireDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const openTicket = () => {
    router.push('/customer/tickets?category=subscription');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">
        套餐管理
      </Title>

      {!subscription ? (
        <Card className="mb-6">
          <Empty description="您尚未开通任何套餐">
            <Space direction="vertical" className="w-full">
              <Text type="secondary">
                本平台采用线下付费模式，请联系您的专属代理商或提交开通申请工单。
              </Text>
              <Button type="primary" onClick={openTicket}>
                提交订阅申请工单
              </Button>
            </Space>
          </Empty>
        </Card>
      ) : (
        <>
          <Row gutter={16} className="mb-6">
            <Col span={16}>
              <Card>
                <Row gutter={24} align="middle">
                  <Col>
                    <CrownOutlined style={{ fontSize: '48px', color: '#faad14' }} />
                  </Col>
                  <Col>
                    <Title level={4} style={{ marginBottom: 8 }}>
                      {subscription.plan}
                      <Tag
                        color={subscription.status === 'active' ? 'green' : 'red'}
                        className="ml-2"
                      >
                        {subscription.status === 'active' ? '正常' : '已过期'}
                      </Tag>
                    </Title>
                    <Space direction="vertical">
                      <Text type="secondary">
                        <ClockCircleOutlined /> 有效期：{subscription.startDate} 至{' '}
                        {subscription.expireDate}
                      </Text>
                      {subscription.fee > 0 && (
                        <Text type="secondary">
                          当前套餐费用：{subscription.fee.toFixed(2)} 元（线下结算）
                        </Text>
                      )}
                    </Space>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="剩余天数"
                  value={remainingDays > 0 ? remainingDays : 0}
                  suffix="天"
                  valueStyle={{
                    color: remainingDays > 7 ? '#52c41a' : remainingDays > 0 ? '#faad14' : '#ff4d4f',
                    fontSize: '32px',
                  }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="已开通功能模块" className="mb-6">
            <Row gutter={[16, 16]}>
              {Object.entries(FEATURE_META).map(([code, meta]) => {
                const enabled = features.includes(code);
                return (
                  <Col span={8} key={code}>
                    <Card size="small" style={{ opacity: enabled ? 1 : 0.55 }}>
                      <div className="flex items-center mb-2">
                        <div style={{ fontSize: '20px', color: enabled ? '#6d28d9' : '#999', marginRight: '12px' }}>
                          {meta.icon}
                        </div>
                        <div>
                          <Text strong>{meta.name}</Text>
                          <div>
                            <Tag color={enabled ? 'green' : 'default'}>
                              {enabled ? '已开通' : '未开通'}
                            </Tag>
                          </div>
                        </div>
                      </div>
                      <Text type="secondary">{meta.desc}</Text>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </>
      )}

      <Card title="可选套餐" className="mb-6">
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="本平台采用线下付费模式，套餐开通与续费请联系您的专属代理商线下办理。"
        />
        <Row gutter={16}>
          {PLANS.map(plan => (
            <Col span={8} key={plan.id}>
              <Card
                style={{
                  borderColor: plan.popular ? plan.color : undefined,
                  position: 'relative',
                }}
              >
                {plan.popular && (
                  <Tag color={plan.color} style={{ position: 'absolute', top: 12, right: 12 }}>
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
                    <div
                      key={index}
                      style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}
                    >
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
                  onClick={() => {
                    message.info('请通过工单申请或联系代理商开通');
                    openTicket();
                  }}
                >
                  申请开通
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="订阅记录">
        <Table
          rowKey="id"
          columns={historyColumns}
          dataSource={history}
          pagination={false}
          locale={{ emptyText: '暂无订阅记录' }}
        />
      </Card>
    </div>
  );
}
