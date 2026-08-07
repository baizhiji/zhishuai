'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Spin,
  Empty,
  Typography,
  Button,
  Space,
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  ContactsOutlined,
  ApiOutlined,
  WarningOutlined,
  PictureOutlined,
  SendOutlined,
  RiseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';

interface AdminStatistics {
  totalAgents: number;
  activeAgents: number;
  newAgentsThisMonth: number;
  newAgentsLastMonth: number;
  totalCustomers: number;
  activeCustomers: number;
  disabledCustomers: number;
  newCustomersThisMonth: number;
  newCustomersLastMonth: number;
  pendingTickets: number;
  totalMaterials: number;
  totalPublished: number;
  totalApiProviders: number;
  enabledApiProviders: number;
  topAgents: Array<{ id: string; name: string; totalCustomers: number; totalCommission: number }>;
}

const EMPTY_STATISTICS: AdminStatistics = {
  totalAgents: 0,
  activeAgents: 0,
  newAgentsThisMonth: 0,
  newAgentsLastMonth: 0,
  totalCustomers: 0,
  activeCustomers: 0,
  disabledCustomers: 0,
  newCustomersThisMonth: 0,
  newCustomersLastMonth: 0,
  pendingTickets: 0,
  totalMaterials: 0,
  totalPublished: 0,
  totalApiProviders: 0,
  enabledApiProviders: 0,
  topAgents: [],
};

function calcGrowth(thisMonth: number, lastMonth: number): { text: string; color: string } {
  if (lastMonth === 0) {
    if (thisMonth > 0) return { text: '新增', color: '#52c41a' };
    return { text: '持平', color: '#8c8c8c' };
  }
  const pct = ((thisMonth - lastMonth) / lastMonth) * 100;
  if (pct > 0) return { text: `+${pct.toFixed(1)}%`, color: '#52c41a' };
  if (pct < 0) return { text: `${pct.toFixed(1)}%`, color: '#ff4d4f' };
  return { text: '持平', color: '#8c8c8c' };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<AdminStatistics>(EMPTY_STATISTICS);
  const [loading, setLoading] = useState(false);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{ success: boolean; data: AdminStatistics }>(
        '/api/admin/dashboard'
      )) as unknown as { success: boolean; data: AdminStatistics };
      if (res.success && res.data) {
        setStatistics(res.data);
      } else {
        setStatistics(EMPTY_STATISTICS);
      }
    } catch (err) {
      console.error('获取统计数据失败', err);
      setStatistics(EMPTY_STATISTICS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const customerGrowth = calcGrowth(statistics.newCustomersThisMonth, statistics.newCustomersLastMonth);
  const agentGrowth = calcGrowth(statistics.newAgentsThisMonth, statistics.newAgentsLastMonth);

  const topAgentColumns: ColumnsType<AdminStatistics['topAgents'][number]> = [
    {
      title: '排名',
      key: 'rank',
      width: 70,
      render: (_v, _r, idx) => (
        <Tag color={idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'orange' : 'default'}>
          #{idx + 1}
        </Tag>
      ),
    },
    { title: '代理商', dataIndex: 'name', key: 'name' },
    {
      title: '名下客户数',
      dataIndex: 'totalCustomers',
      key: 'totalCustomers',
      sorter: (a, b) => a.totalCustomers - b.totalCustomers,
      render: v => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '累计佣金',
      dataIndex: 'totalCommission',
      key: 'totalCommission',
      sorter: (a, b) => a.totalCommission - b.totalCommission,
      render: v => `¥ ${Number(v || 0).toFixed(2)}`,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_v, r) => (
        <Button type="link" size="small" onClick={() => router.push(`/admin/agents`)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Spin spinning={loading}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              数据总览
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 14 }}>
              概览平台核心业务数据，快速掌握各维度运营状况
            </Typography.Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchStatistics}>
            刷新
          </Button>
        </div>

        {/* 核心指标：代理商 */}
        <Typography.Title level={5} style={{ marginTop: 8 }}>
          <ContactsOutlined /> 代理商
        </Typography.Title>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="代理商总数"
                value={statistics.totalAgents}
                prefix={<ContactsOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                活跃 {statistics.activeAgents} 家
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="本月新增代理商"
                value={statistics.newAgentsThisMonth}
                prefix={<RiseOutlined />}
                valueStyle={{ color: agentGrowth.color }}
              />
              <div style={{ fontSize: 12, color: agentGrowth.color, marginTop: 4 }}>
                较上月 {agentGrowth.text}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="名下客户总数"
                value={statistics.totalCustomers}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                活跃 {statistics.activeCustomers} / 冻结 {statistics.disabledCustomers}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="本月新增客户"
                value={statistics.newCustomersThisMonth}
                prefix={<UserOutlined />}
                valueStyle={{ color: customerGrowth.color }}
              />
              <div style={{ fontSize: 12, color: customerGrowth.color, marginTop: 4 }}>
                较上月 {customerGrowth.text}
              </div>
            </Card>
          </Col>
        </Row>

        {/* 内容/工单 */}
        <Typography.Title level={5} style={{ marginTop: 24 }}>
          内容与工单
        </Typography.Title>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="素材总量"
                value={statistics.totalMaterials}
                prefix={<PictureOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="已发布内容"
                value={statistics.totalPublished}
                prefix={<SendOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待处理工单"
                value={statistics.pendingTickets}
                prefix={<WarningOutlined />}
                valueStyle={{ color: statistics.pendingTickets > 0 ? '#fa8c16' : undefined }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, height: 'auto' }}
                  onClick={() => router.push('/agent/tickets')}
                >
                  前往处理 →
                </Button>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="API 服务商"
                value={statistics.totalApiProviders}
                prefix={<ApiOutlined />}
                valueStyle={{ color: '#13c2c2' }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                已启用 {statistics.enabledApiProviders} 个
              </div>
            </Card>
          </Col>
        </Row>

        {/* 代理商排行榜 */}
        <Typography.Title level={5} style={{ marginTop: 24 }}>
          代理商 Top 5（按名下客户数）
        </Typography.Title>
        <Card>
          {statistics.topAgents.length > 0 ? (
            <Table
              rowKey="id"
              columns={topAgentColumns}
              dataSource={statistics.topAgents}
              pagination={false}
              size="middle"
            />
          ) : (
            <Empty description="暂无代理商数据" />
          )}
        </Card>

        {/* 快捷入口 */}
        <Card style={{ marginTop: 16 }} title="快捷入口">
          <Space wrap>
            <Button type="primary" icon={<UserOutlined />} onClick={() => router.push('/admin/tenants')}>
              客户管理
            </Button>
            <Button icon={<ContactsOutlined />} onClick={() => router.push('/admin/agents')}>
              代理商管理
            </Button>
            <Button icon={<ApiOutlined />} onClick={() => router.push('/admin/api-providers')}>
              API 服务商
            </Button>
            <Button icon={<WarningOutlined />} onClick={() => router.push('/agent/tickets')}>
              工单处理
            </Button>
          </Space>
        </Card>
      </Spin>
    </div>
  );
}
