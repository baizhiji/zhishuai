'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Spin,
  Empty,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/lib/api';

const { Title, Text } = Typography;

interface SubscriptionRecord {
  id: number;
  plan: string;
  period: string;
  status: string;
  date: string;
}

interface SubscriptionInfo {
  plan: string;
  status: string;
  startDate: string;
  expireDate: string;
}

const columns: ColumnsType<SubscriptionRecord> = [
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

export default function SubscribePage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [history, setHistory] = useState<SubscriptionRecord[]>([]);

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/account/subscription');
      if ((res as any).current) {
        setSubscription((res as any).current);
        setHistory((res as any).history || []);
      }
    } catch {
      // API 未就绪时显示空状态
      setSubscription(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-6">
        <Title level={2} className="mb-6">订阅管理</Title>
        <Empty description="暂无订阅信息" />
      </div>
    );
  }

  const remainingDays = Math.ceil(
    (new Date(subscription.expireDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">
        订阅管理
      </Title>

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
                <Tag color={subscription.status === 'active' ? 'green' : 'red'}>
                  {subscription.status === 'active' ? '正常' : '已过期'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">{subscription.startDate}</Descriptions.Item>
              <Descriptions.Item label="到期时间">
                <Text strong type="danger">
                  <ClockCircleOutlined /> {subscription.expireDate}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="剩余天数"
              value={remainingDays > 0 ? remainingDays : 0}
              suffix="天"
              valueStyle={{ color: remainingDays > 0 ? '#faad14' : '#ff4d4f', fontSize: '36px' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="订阅历史">
        <Table rowKey="id" columns={columns} dataSource={history} pagination={false} locale={{ emptyText: '暂无订阅记录' }} />
      </Card>
    </div>
  );
}
