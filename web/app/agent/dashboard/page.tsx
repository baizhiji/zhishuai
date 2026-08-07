'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Statistic, Spin, Empty, Tag, Table,
  Button, App, Segmented,
} from 'antd';
import {
  TeamOutlined, UserAddOutlined, CheckCircleOutlined,
  StopOutlined, WarningOutlined, FileTextOutlined,
  RightOutlined, ReloadOutlined, ThunderboltOutlined,
  ShareAltOutlined, ExperimentOutlined, RiseOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';
import { getCustomers, type Customer } from '@/services/customer';

type PeriodType = 'today' | 'week' | 'month' | 'all';

interface AgentStatistics {
  totalCustomers: number;
  activeCustomers: number;
  disabledCustomers: number;
  newCustomersThisMonth: number;
  pendingTickets: number;
  totalMaterials: number;
  totalPublished: number;
  // 时间筛选后的统计
  periodNewCustomers?: number;
  periodNewTickets?: number;
}

const EMPTY_STATISTICS: AgentStatistics = {
  totalCustomers: 0, activeCustomers: 0, disabledCustomers: 0,
  newCustomersThisMonth: 0, pendingTickets: 0,
  totalMaterials: 0, totalPublished: 0,
};

const cardBase: React.CSSProperties = {
  borderRadius: 8,
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
  border: '1px solid #f0f0f0',
};

const periodLabels: Record<PeriodType, string> = {
  today: '今日',
  week: '本周',
  month: '本月',
  all: '全部',
};

export default function AgentDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { message } = App.useApp();
  const [statistics, setStatistics] = useState<AgentStatistics>(EMPTY_STATISTICS);
  const [loading, setLoading] = useState(true);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [businessLines, setBusinessLines] = useState<any>(null);
  const [period, setPeriod] = useState<PeriodType>('all');

  const fetchStatistics = useCallback(async () => {
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{ success: boolean; data: any }>(
        `/api/agent/statistics?period=${period}`
      )) as unknown as { success: boolean; data: any };
      if (res.success && res.data) {
        setStatistics(res.data);
      } else {
        setStatistics(EMPTY_STATISTICS);
      }
    } catch (err) {
      console.error('获取统计数据失败', err);
      setStatistics(EMPTY_STATISTICS);
    }
  }, [period]);

  const fetchRecentCustomers = async () => {
    try {
      const res = await getCustomers({ page: 1, pageSize: 5 });
      setRecentCustomers(res.list || []);
    } catch (err) {
      console.error('获取最近客户失败', err);
    }
  };

  const fetchBusinessLines = async () => {
    try {
      const request = (await import('@/lib/request')).default;
      const res = await request.get<any>('/api/dashboard-stats/agent/business-lines');
      if (res?.data?.success) setBusinessLines(res.data.data);
    } catch { /* 非关键 */ }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStatistics(), fetchRecentCustomers(), fetchBusinessLines()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [period]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" style={{ marginTop: 80 }} />
      </div>
    );
  }

  const hasData = statistics.totalCustomers > 0;

  // 动态计算时间筛选提示
  const periodLabel = period === 'all' ? '' : `${periodLabels[period]}新增 `;

  return (
    <div style={{ padding: 24 }}>
      {/* 欢迎条 + 时间筛选 */}
      <Card
        style={{
          ...cardBase,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
          border: 'none',
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div style={{ color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
              欢迎回来，{user?.name || user?.phone || '代理商'}
            </div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              今天是 {dayjs().format('YYYY年MM月DD日')} · 智枢AI 代理后台
              {periodLabel && (
                <span style={{ marginLeft: 8, background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: 4 }}>
                  {periodLabel}{statistics.periodNewCustomers ?? 0} 客户 / {statistics.periodNewTickets ?? 0} 工单
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Segmented
              value={period}
              onChange={(val) => setPeriod(val as PeriodType)}
              options={[
                { label: '今日', value: 'today' },
                { label: '本周', value: 'week' },
                { label: '本月', value: 'month' },
                { label: '全部', value: 'all' },
              ]}
              style={{ background: 'rgba(255,255,255,0.2)' }}
            />
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={loadData}
              style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}
            >
              刷新
            </Button>
          </div>
        </div>
      </Card>

      {/* 客户四条业务线概览 */}
      {businessLines?.lines && businessLines.lines.length > 0 ? (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {businessLines.lines.map((line: any, idx: number) => {
            const colorSet = ['#1677ff', '#722ed1', '#13c2c2', '#fa8c16'];
            const iconSet: Record<string, React.ReactNode> = {
              sparkles: <ExperimentOutlined />, briefcase: <UserAddOutlined />,
              thunderbolt: <ThunderboltOutlined />, share: <ShareAltOutlined />,
            };
            return (
              <Col xs={24} sm={12} md={6} key={idx}>
                <Card style={cardBase} styles={{ body: { padding: 16 } }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    {iconSet[line.icon] || <ExperimentOutlined />}
                    <span style={{ fontWeight: 600, fontSize: 14, color: colorSet[idx] }}>{line.name}</span>
                  </div>
                  {(line.metrics || []).slice(0, 3).map((m: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#8c8c8c' }}>{m.label}</span>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {typeof m.value === 'number' && m.value % 1 !== 0 ? m.value.toFixed(0) : (m.value || 0)}
                        <span style={{ fontSize: 11, color: '#aaa', marginLeft: 2 }}>{m.unit}</span>
                      </span>
                    </div>
                  ))}
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        /* KPI 卡片 */
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ ...cardBase, borderTop: '3px solid #1677ff' }} styles={{ body: { padding: 20 } }}>
              <Statistic
                title="客户总数"
                value={statistics.totalCustomers}
                prefix={<TeamOutlined style={{ color: '#1677ff' }} />}
                valueStyle={{ color: '#1677ff' }}
              />
              <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
                <UserAddOutlined /> {periodLabel}新增 {statistics.periodNewCustomers ?? statistics.newCustomersThisMonth} 个
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ ...cardBase, borderTop: '3px solid #52c41a' }} styles={{ body: { padding: 20 } }}>
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
            <Card style={{ ...cardBase, borderTop: '3px solid #722ed1' }} styles={{ body: { padding: 20 } }}>
              <Statistic
                title="素材总量"
                value={statistics.totalMaterials}
                prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ ...cardBase, borderTop: '3px solid #fa8c16' }} styles={{ body: { padding: 20 } }}>
              <Statistic
                title="发布总量"
                value={statistics.totalPublished}
                prefix={<RiseOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
                <WarningOutlined style={{ color: '#fa8c16' }} /> 待处理工单 {statistics.pendingTickets}
                {period !== 'all' && (
                  <span style={{ marginLeft: 4 }}>
                    （{periodLabels[period]}新增 {statistics.periodNewTickets ?? 0}）
                  </span>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      )}

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
                title: '状态', dataIndex: 'status', width: 100,
                render: (s: string) =>
                  s === 'active' ? <Tag color="success">正常</Tag> : <Tag color="error">已冻结</Tag>,
              },
              {
                title: '素材', dataIndex: 'materialCount', width: 80,
                render: (v: number) => v || 0,
              },
              {
                title: '发布', dataIndex: 'publishCount', width: 80,
                render: (v: number) => v || 0,
              },
              {
                title: '开通时间', dataIndex: 'createdAt', width: 150,
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
            <Button block size="large" icon={<TeamOutlined />} onClick={() => router.push('/agent/customers')}>
              客户管理
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button block size="large" icon={<FileTextOutlined />} onClick={() => router.push('/agent/tickets')}>
              工单处理
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button block size="large" icon={<RiseOutlined />} onClick={() => router.push('/agent/usage')}>
              用量统计
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
