'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Typography,
  Spin,
  Alert,
  Empty,
} from 'antd';
import {
  WalletOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
  TeamOutlined,
  FundOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { request } from '@/utils/request';

const { Title, Text } = Typography;

interface SettlementOverview {
  balance: number;
  totalEarnings: number;
  monthEarnings: number;
  pendingEarnings: number;
  commissionRate: number;
  customerCount: number;
  monthlyTrend: { month: string; amount: number }[];
}

interface SettlementRecord {
  id: string;
  amount: number;
  status: string;
  type: string;
  description: string | null;
  paidAt: string | null;
  createdAt: string;
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  customer_fee: { label: '客户付费', color: 'blue' },
  agent_fee: { label: '代理费', color: 'purple' },
  commission: { label: '分成佣金', color: 'green' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  paid: { label: '已结算', color: 'green' },
  pending: { label: '待结算', color: 'orange' },
  failed: { label: '失败', color: 'red' },
};

const cardBase: React.CSSProperties = {
  borderRadius: 8,
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
  border: '1px solid #f0f0f0',
};

export default function SettlementPage() {
  const [overview, setOverview] = useState<SettlementOverview | null>(null);
  const [records, setRecords] = useState<SettlementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });

  const fetchOverview = useCallback(async () => {
    const res = await request.get<SettlementOverview>('/api/agent/settlement/overview');
    setOverview(res);
  }, []);

  const fetchRecords = useCallback(async (page = 1) => {
    const res = await request.get<{ list: SettlementRecord[]; total: number }>(
      '/api/agent/settlement/records',
      { params: { page, pageSize: 20 } }
    );
    setRecords(res.list);
    setPagination(prev => ({ ...prev, page, total: res.total }));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchOverview(), fetchRecords(1)]);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchOverview, fetchRecords]);

  const columns: ColumnsType<SettlementRecord> = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const meta = TYPE_META[type] || { label: type, color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '金额（元）',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => <Text strong>¥{Number(amount || 0).toFixed(2)}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const meta = STATUS_META[status] || { label: status, color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string | null) => desc || '—',
    },
    {
      title: '到账时间',
      dataIndex: 'paidAt',
      key: 'paidAt',
      render: (time: string | null) =>
        time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '—',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const maxTrend = Math.max(
    1,
    ...(overview?.monthlyTrend || []).map(t => Number(t.amount || 0))
  );

  return (
    <div className="p-6">
      <Title level={2} className="mb-2">
        分成结算
      </Title>
      <Alert
        type="info"
        showIcon
        className="mb-6"
        message="本页面的所有金额仅作统计计算展示，不涉及任何线上支付。实际收款与结算均在线下完成，请以线下对账为准。"
      />

      <Row gutter={16} className="mb-6">
        <Col span={4}>
          <Card style={cardBase}>
            <Statistic
              title="累计收益（元）"
              value={overview?.totalEarnings || 0}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={cardBase}>
            <Statistic
              title="本月收益（元）"
              value={overview?.monthEarnings || 0}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#6d28d9' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={cardBase}>
            <Statistic
              title="待结算（元）"
              value={overview?.pendingEarnings || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={cardBase}>
            <Statistic
              title="分成比例"
              value={Number(overview?.commissionRate || 0) * 100}
              suffix="%"
              prefix={<PercentageOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={cardBase}>
            <Statistic
              title="客户数"
              value={overview?.customerCount || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={cardBase}>
            <Statistic
              title="账户余额（元）"
              value={overview?.balance || 0}
              prefix={<FundOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="近6个月收益趋势" className="mb-6">
        {!overview?.monthlyTrend?.length ? (
          <Empty description="暂无收益数据" />
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '200px', paddingTop: '16px' }}>
            {overview.monthlyTrend.map(t => {
              const h = Math.round((Number(t.amount || 0) / maxTrend) * 150) || 2;
              return (
                <div key={t.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                  <Text strong style={{ marginBottom: 4 }}>
                    ¥{Number(t.amount || 0).toFixed(0)}
                  </Text>
                  <div
                    style={{
                      width: '60%',
                      height: h,
                      background: t.amount > 0 ? '#6d28d9' : '#d9d9d9',
                      borderRadius: '4px 4px 0 0',
                      minHeight: 4,
                    }}
                  />
                  <Text type="secondary" style={{ marginTop: 4 }}>
                    {t.month}
                  </Text>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="结算记录">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: page => fetchRecords(page),
            showTotal: total => `共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  );
}
