'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Button,
  Descriptions,
  Statistic,
  Space,
  message,
  Spin,
  Empty,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  CrownOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

export default function SubscribePage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [autoRenew, setAutoRenew] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await request.get('/api/subscription/my');
      const data = res?.data || res;
      setSubscription({
        plan: data?.plan || data?.planName || '-',
        status: data?.status || '-',
        startDate: data?.startDate || data?.createdAt || '-',
        expireDate: data?.expireDate || data?.endDate || '-',
        autoRenew: data?.autoRenew ?? false,
        features: (data?.features || []).map((f: any) => ({
          name: f.name || f.feature || '-',
          used: f.used ?? f.usedCount ?? 0,
          limit: f.limit || f.maxCount || '无限',
          icon: f.iconType === 'media' ? <TeamOutlined /> : f.iconType === 'recruit' ? <CheckCircleOutlined /> : f.iconType === 'acquisition' ? <RocketOutlined /> : <CrownOutlined />,
        })),
      });
      setAutoRenew(data?.autoRenew ?? false);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setSubscription(null);
    }

    try {
      const payRes = await request.get('/api/subscription/payments');
      const payData = payRes?.data || payRes;
      setPayments(
        (payData?.list || payData?.payments || []).map((p: any) => ({
          id: p.id,
          plan: p.plan || p.planName || '-',
          period: `${p.startDate || p.createdAt || '-'} 至 ${p.endDate || p.expireDate || '-'}`,
          status: p.status || '-',
          date: p.createdAt || p.date || '-',
        }))
      );
    } catch {
      setPayments([]);
    }
    setLoading(false);
  };

  const handleToggleAutoRenew = async () => {
    try {
      await request.put('/api/subscription/my', { autoRenew: !autoRenew });
      setAutoRenew(!autoRenew);
      message.success(`自动续费已${!autoRenew ? '开启' : '关闭'}`);
    } catch (error) {
      message.error('操作失败，请稍后重试');
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: '套餐',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: string) => <Text strong>{plan}</Text>,
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
      ),
    },
    { title: '开通时间', dataIndex: 'date', key: 'date' },
  ];

  if (loading) {
    return (
      <div className="p-6" style={{ textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-6">
        <Empty description="暂无订阅信息" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">
        订阅管理
      </Title>

      {/* 当前订阅信息 */}
      <Row gutter={16} className="mb-6">
        <Col span={16}>
          <Card title="当前订阅">
            <Descriptions column={2}>
              <Descriptions.Item label="套餐名称">
                <Tag color="gold" icon={<CrownOutlined />}>
                  {subscription.plan}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color="green">正常</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">{subscription.startDate}</Descriptions.Item>
              <Descriptions.Item label="到期时间">
                <Text strong type="danger">
                  <ClockCircleOutlined /> {subscription.expireDate}
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
              value={
                subscription.expireDate && subscription.expireDate !== '-'
                  ? Math.ceil(
                      (new Date(subscription.expireDate).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0
              }
              suffix="天"
              valueStyle={{ color: '#faad14', fontSize: '36px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 功能使用情况 */}
      {subscription.features.length > 0 && (
        <Card title="功能使用情况" className="mb-6">
          <Row gutter={16}>
            {subscription.features.map((feature: any, index: number) => (
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
                    suffix={
                      <span style={{ fontSize: '14px', color: '#52c41a' }}>/ {feature.limit}</span>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 订阅历史 */}
      <Card title="订阅历史">
        {payments.length > 0 ? (
          <Table rowKey="id" columns={columns} dataSource={payments} pagination={false} />
        ) : (
          <Empty description="暂无订阅历史" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  );
}
