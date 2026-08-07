'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table, Card, Tag, Space, Typography, Button, Input, Select,
} from 'antd';
import { SearchOutlined, ReloadOutlined, RiseOutlined, UserOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api';
import PageContainer from '@/components/customer/PageContainer';

const { Text } = Typography;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: '待跟进', color: 'orange' },
  followed: { label: '已跟进', color: 'blue' },
  converted: { label: '已转化', color: 'green' },
  invalid: { label: '无效', color: 'default' },
  no_response: { label: '无响应', color: 'red' },
};

interface TrackItem {
  id: string;
  visitorName: string;
  visitorPhone: string;
  sourceCode: string;
  sourceTitle: string;
  status: string;
  platform: string;
  visitCount: number;
  firstVisitAt: string;
  lastVisitAt: string;
}

export default function ShareTrackPage() {
  const [records, setRecords] = useState<TrackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res: Record<string, unknown> = await apiClient.get('/api/share/records');
      const list = (res.list as any[]) || [];
      setRecords(list.map((r: any) => ({
        id: r.id,
        visitorName: r.scannerId || '匿名用户',
        visitorPhone: '-',
        sourceCode: r.qrCodeId?.slice(0, 8) || '-',
        sourceTitle: r.ShareQrCode?.title || '-',
        status: r.status || 'pending',
        platform: r.platform || '未知',
        visitCount: 1,
        firstVisitAt: r.scannedAt || r.createdAt,
        lastVisitAt: r.publishedAt || r.updatedAt,
      })) as TrackItem[]);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const filteredRecords = records.filter(r => {
    if (searchText && !r.visitorName?.includes(searchText) && !r.visitorPhone?.includes(searchText) && !r.sourceTitle?.includes(searchText)) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  const columns = [
    { title: '访客', dataIndex: 'visitorName', key: 'visitorName', width: 120, render: (n: string) => n || '匿名用户' },
    { title: '手机号', dataIndex: 'visitorPhone', key: 'visitorPhone', width: 130, render: (p: string) => p || '-' },
    { title: '来源分享', dataIndex: 'sourceTitle', key: 'sourceTitle', width: 160, render: (t: string, r: TrackItem) => <Space><Text code>{r.sourceCode}</Text><Text>{t}</Text></Space> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (s: string) => {
      const cfg = STATUS_CONFIG[s] || { label: s, color: 'default' };
      return <Tag color={cfg.color}>{cfg.label}</Tag>;
    }},
    { title: '访问次数', dataIndex: 'visitCount', key: 'visitCount', width: 90, sorter: (a: TrackItem, b: TrackItem) => a.visitCount - b.visitCount },
    { title: '平台', dataIndex: 'platform', key: 'platform', width: 80 },
    { title: '首次访问', dataIndex: 'firstVisitAt', key: 'firstVisitAt', width: 150, sorter: (a: TrackItem, b: TrackItem) => new Date(a.firstVisitAt).getTime() - new Date(b.firstVisitAt).getTime(), render: (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-' },
    { title: '最近访问', dataIndex: 'lastVisitAt', key: 'lastVisitAt', width: 150, defaultSortOrder: 'descend' as const, sorter: (a: TrackItem, b: TrackItem) => new Date(a.lastVisitAt).getTime() - new Date(b.lastVisitAt).getTime(), render: (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-' },
  ];

  return (
    <PageContainer
      title="分享追踪"
      description="追踪分享链接的点击和转化情况"
      breadcrumb={[
        { title: '首页', href: '/customer/dashboard' },
        { title: '分享裂变' },
        { title: '分享追踪' },
      ]}
      loading={false}
      skeletonType="table"
      extra={
        <Button icon={<ReloadOutlined />} onClick={fetchRecords}>刷新</Button>
      }
    >
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            placeholder="搜索访客姓名/手机号/分享码"
            allowClear
            style={{ width: 260 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 120 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <Select.Option key={k} value={k}>{v.label}</Select.Option>)}
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchRecords}>查询</Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns} dataSource={filteredRecords} rowKey="id" loading={loading}
          scroll={{ x: 1200 }}
          locale={{ emptyText: '暂无追踪数据' }}
        />
      </Card>
    </PageContainer>
  );
}
