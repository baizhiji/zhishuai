'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Space, Select, Input, Button, DatePicker, Statistic, Row, Col, Empty, Spin, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import request from '@/lib/request';

const { RangePicker } = DatePicker;

interface AgentEarning {
  id: string;
  name: string;
  commissionRate: number;
  totalRevenue: number;
  balance: number;
  customerCount: number;
}

interface EarningRecord {
  id: string;
  agentId: string;
  agentName?: string;
  userPhone?: string;
  userName?: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  paidAt: string;
  createdAt: string;
}

const TYPE_LABELS: Record<string, { text: string; color: string }> = {
  agent_open: { text: '开通代理商', color: 'purple' },
  customer_open: { text: '开通客户', color: 'blue' },
  customer_fee: { text: '客户套餐费', color: 'green' },
  agent_settlement: { text: '分成结算', color: 'orange' },
};

const fmtMoney = (yuan: number) => `¥${(yuan || 0).toFixed(2)}`;

export default function AdminEarningsPage() {
  const [summary, setSummary] = useState<AgentEarning[]>([]);
  const [records, setRecords] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [pageSize] = useState(20);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, pageSize };
      if (agentFilter) params.agentId = agentFilter;
      if (dateRange) {
        params.startDate = dateRange[0];
        params.endDate = dateRange[1];
      }
      const res: any = await request.get('/admin/earnings', { params });
      if (res?.success) {
        setSummary(res.data.summary || []);
        setRecords(res.data.records || []);
        setTotal(res.data.pagination?.total || 0);
      } else {
        message.error(res?.message || '获取数据失败');
      }
    } catch (err: any) {
      message.error(err?.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, agentFilter, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalRevenue = summary.reduce((s, a) => s + (a.totalRevenue || 0), 0);
  const totalCustomers = summary.reduce((s, a) => s + (a.customerCount || 0), 0);

  const summaryColumns = [
    { title: '代理商', dataIndex: 'name', key: 'name' },
    {
      title: '客户数',
      dataIndex: 'customerCount',
      key: 'customerCount',
      width: 100,
      sorter: (a: AgentEarning, b: AgentEarning) => a.customerCount - b.customerCount,
    },
    {
      title: '累计收益',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      width: 140,
      sorter: (a: AgentEarning, b: AgentEarning) => a.totalRevenue - b.totalRevenue,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{fmtMoney(v)}</span>,
    },
    {
      title: '分成比例',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      width: 100,
      render: (v: number) => `${Math.round((v || 0) * 100)}%`,
    },
  ];

  const recordColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => (v ? new Date(v).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '代理商',
      dataIndex: 'agentName',
      key: 'agentName',
      width: 140,
      render: (v: string) => v || '-',
    },
    {
      title: '客户',
      key: 'customer',
      width: 140,
      render: (_: any, r: EarningRecord) => (r.userName ? `${r.userName}(${r.userPhone})` : '-'),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (v: string) => {
        const cfg = TYPE_LABELS[v] || { text: v, color: 'default' };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (v: number) => <span style={{ fontWeight: 600, color: '#16a34a' }}>+{fmtMoney(v)}</span>,
    },
    {
      title: '备注',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v: string) => v || '-',
    },
  ];

  return (
    <div className="p-6">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic title="代理商累计收益" value={totalRevenue} precision={2} prefix="¥" />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="代理商客户总数" value={totalCustomers} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="收益记录条数" value={total} />
            </Card>
          </Col>
        </Row>

        <Card title="代理商收益排行" extra={<Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>}>
          <Table
            rowKey="id"
            dataSource={summary}
            columns={summaryColumns}
            pagination={false}
            size="small"
            locale={{ emptyText: <Empty description="暂无数据" /> }}
          />
        </Card>

        <Card title="收益明细">
          <Space style={{ marginBottom: 16 }} wrap>
            <Select
              allowClear
              placeholder="按代理商筛选"
              style={{ width: 200 }}
              value={agentFilter || undefined}
              onChange={(v) => { setAgentFilter(v || ''); setPage(1); }}
              options={summary.map((a) => ({ value: a.id, label: a.name }))}
            />
            <Select
              allowClear
              placeholder="按类型筛选"
              style={{ width: 150 }}
              value={typeFilter || undefined}
              onChange={(v) => { setTypeFilter(v || ''); setPage(1); }}
              options={Object.entries(TYPE_LABELS).map(([k, v]) => ({ value: k, label: v.text }))}
            />
            <RangePicker
              onChange={(v) => {
                if (v && v[0] && v[1]) {
                  setDateRange([v[0].startOf('day').format('YYYY-MM-DD HH:mm:ss'), v[1].endOf('day').format('YYYY-MM-DD HH:mm:ss')]);
                  setPage(1);
                } else {
                  setDateRange(null);
                }
              }}
            />
            <Button type="primary" onClick={() => setPage(1)}>查询</Button>
          </Space>
          <Spin spinning={loading}>
            <Table
              rowKey="id"
              dataSource={records}
              columns={recordColumns}
              pagination={{
                current: page,
                pageSize,
                total,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (p) => setPage(p),
              }}
              size="small"
              locale={{ emptyText: <Empty description="暂无收益记录" /> }}
            />
          </Spin>
        </Card>
      </Space>
    </div>
  );
}
