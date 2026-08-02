'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Spin,
  Empty,
  Tag,
  Table,
  Button,
  App,
} from 'antd';
import {
  TeamOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
  StopOutlined,
  WarningOutlined,
  FileTextOutlined,
  RightOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';
import { getCustomers, type Customer } from '@/services/customer';

interface AgentStatistics {
  totalCustomers: number;
  activeCustomers: number;
  disabledCustomers: number;
  newCustomersThisMonth: number;
  pendingTickets: number;
  totalMaterials: number;
  totalPublished: number;
}

const EMPTY_STATISTICS: AgentStatistics = {
  totalCustomers: 0,
  activeCustomers: 0,
  disabledCustomers: 0,
  newCustomersThisMonth: 0,
  pendingTickets: 0,
  totalMaterials: 0,
  totalPublished: 0,
};

const cardBase: React.CSSProperties = {
  borderRadius: 8,
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
  border: '1px solid #f0f0f0',
};

export default function AgentDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { message } = App.useApp();
  const [statistics, setStatistics] = useState<AgentStatistics>(EMPTY_STATISTICS);
  const [loading, setLoading] = useState(true);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);

  const fetchStatistics = async () => {
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{ success: boolean; data: AgentStatistics }>(
        '/api/agent/statistics'
      )) as unknown as { success: boolean; data: AgentStatistics };
      if (res.success && res.data) {
        setStatistics(res.data);
      } else {
        setStatistics(EMPTY_STATISTICS);
      }
    } catch (err) {
      console.error('获取统计数据失败', err);
      setStatistics(EMPTY_STATISTICS);
    }
  };

  const fetchRecentCustomers = async () => {
    try {
      const res = await getCustomers({ page: 1, pageSize: 5 });
      setRecentCustomers(res.list || []);
    } catch (err) {
      console.error('获取最近客户失败', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStatistics(), fetchRecentCustomers()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" style={{ marginTop: 80 }} />
      </div>
    );
  }

  const hasData = statistics.totalCustomers > 0;

  return (
    <div style={{ padding: 24 }}>
      {/* 欢迎条 */}
      <Card
        style={{
          ...cardBase,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
          border: 'none',
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div style={{ color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
              欢迎回来，{user?.name || user?.phone || '代理商'}
            </div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              今天是 {dayjs().format('YYYY年MM月DD日')} · 智枢AI 代理后台
            </div>
          </div>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={loadData}
            style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}
          >
            刷新数据
          </Button>
        </div>
      </Card>

      {/* 核心 KPI - 4 个卡片，每个 1-2 个核心数据 */}
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Card style={cardBase} styles={{ body: { padding: 20 } }}>
            <Statistic
              title="我的客户总数"
              value={statistics.totalCustomers}
              prefix={<TeamOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
              <UserAddOutlined /> 本月新增 {statistics.newCustomersThisMonth} 个
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={cardBase} styles={{ body: { padding: 20 } }}>
            <Statistic
              title="活跃客户"
              value={statistics.activeCustomers}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
              <StopOutlined /> 已冻结 {statistics.disabledCustomers} 个
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={cardBase} styles={{ body: { padding: 20 } }}>
            <Statistic
              title="名下素材总量"
              value={statistics.totalMaterials}
              prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
              客户累计产出素材数
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={cardBase} styles={{ body: { padding: 20 } }}>
            <Statistic
              title="名下发布总量"
              value={statistics.totalPublished}
              prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
              <WarningOutlined style={{ color: '#fa8c16' }} /> 待处理工单 {statistics.pendingTickets}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 最近客户 */}
      <Card
        title="最近开通的客户"
        style={{ ...cardBase, marginTop: 16 }}
        styles={{ body: { padding: 0 } }}
        extra={
          <Button
            type="link"
            onClick={() => router.push('/agent/customers')}
            icon={<RightOutlined />}
            iconPosition="end"
          >
            查看全部
          </Button>
        }
      >
        {!hasData ? (
          <div style={{ padding: 40 }}>
            <Empty description="暂无客户，立即开通第一个客户" />
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button type="primary" onClick={() => router.push('/agent/customers')}>
                前往客户管理
              </Button>
            </div>
          </div>
        ) : (
          <Table
            size="middle"
            dataSource={recentCustomers}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: '客户',
                key: 'name',
                render: (_, r) => (
                  <div>
                    <div style={{ fontWeight: 500 }}>{r.name || '未设置昵称'}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{r.phone}</div>
                  </div>
                ),
              },
              {
                title: '状态',
                dataIndex: 'status',
                width: 100,
                render: (s: string) =>
                  s === 'active' ? <Tag color="success">正常</Tag> : <Tag color="error">已冻结</Tag>,
              },
              {
                title: '素材',
                dataIndex: 'materialCount',
                width: 80,
                render: (v: number) => v || 0,
              },
              {
                title: '发布',
                dataIndex: 'publishCount',
                width: 80,
                render: (v: number) => v || 0,
              },
              {
                title: '开通时间',
                dataIndex: 'createdAt',
                width: 150,
                render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm'),
              },
            ]}
          />
        )}
      </Card>

      {/* 快捷入口 */}
      <Card
        title="快捷入口"
        style={{ ...cardBase, marginTop: 16 }}
        styles={{ body: { padding: 24 } }}
      >
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Button
              block
              size="large"
              icon={<TeamOutlined />}
              onClick={() => router.push('/agent/customers')}
            >
              客户管理
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button
              block
              size="large"
              icon={<FileTextOutlined />}
              onClick={() => router.push('/agent/tickets')}
            >
              工单处理
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
