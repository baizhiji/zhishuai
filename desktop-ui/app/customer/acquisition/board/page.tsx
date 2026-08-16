'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Button, Segmented, Select } from 'antd';
import {
  UserOutlined, TeamOutlined, RiseOutlined, DollarOutlined, ReloadOutlined, TrophyOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api';
import PageContainer from '@/components/customer/PageContainer';

const { Title, Text } = Typography;

interface DashboardData {
  totalLeads: number;
  newLeads: number;
  conversionRate: number;
  totalTasks: number;
  convertedLeads: number;
  trend: { label: string; leads: number; conversions: number }[];
  channelBreakdown: { channel: string; count: number }[];
  aiScoreDist: { range: string; count: number }[];
}

const CHANNEL_COLORS: Record<string, string> = {
  douyin: '#ff4d4f',
  xiaohongshu: '#ff7a45',
  wechat: '#52c41a',
  kuaishu: '#fa8c16',
  linkedin: '#1677ff',
};

export default function AcquisitionBoardPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState<string>('week');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res: Record<string, unknown> = await apiClient.get('/acquisition/dashboard', { params: { period } });
      const payload = (res.data as unknown as DashboardData) || (res as unknown as DashboardData) || {};
      setData({
        totalLeads: payload.totalLeads ?? 0,
        newLeads: payload.newLeads ?? 0,
        conversionRate: payload.conversionRate ?? 0,
        totalTasks: payload.totalTasks ?? 0,
        convertedLeads: payload.convertedLeads ?? 0,
        trend: payload.trend ?? [],
        channelBreakdown: payload.channelBreakdown ?? [],
        aiScoreDist: payload.aiScoreDist ?? [],
      });
    } catch (err) {
      console.error('[AcquisitionBoard] 加载看板数据失败:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!data) {
    return (
      <PageContainer
        title="获客看板"
        description={loading ? '数据加载中…' : '数据获取失败，请稍后重试'}
        breadcrumb={[{ title: '首页', href: '/customer/dashboard' }, { title: '获客看板' }]}
        loading={loading}
        skeletonType="card"
        extra={<Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>刷新</Button>}
      >
        <div />
      </PageContainer>
    );
  }

  const d = data;
  const maxTrend = Math.max(1, ...d.trend.map(v => Math.max(v.leads ?? 0, v.conversions ?? 0)));
  const maxChannel = Math.max(1, ...d.channelBreakdown.map(c => c.count ?? 0));
  const maxScore = Math.max(1, ...d.aiScoreDist.map(s => s.count ?? 0));

  return (
    <PageContainer
      title="获客看板"
      description="可视化数据看板，追踪获客绩效"
      breadcrumb={[
        { title: '首页', href: '/customer/dashboard' },
        { title: '获客管理' },
        { title: '获客看板' },
      ]}
      loading={false}
      skeletonType="card"
      extra={
        <Space>
          <Segmented
            options={[
              { label: '近7天', value: 'week' },
              { label: '近30天', value: 'month' },
              { label: '近90天', value: 'quarter' },
            ]}
            value={period}
            onChange={val => setPeriod(val as string)}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>刷新</Button>
        </Space>
      }
    >
      {/* KPI 卡片 */}
      <Row gutter={[16, 16]}>
        {[
          { title: '总潜客数', value: d.totalLeads.toLocaleString(), icon: <UserOutlined />, color: '#1677ff' },
          { title: '新增潜客', value: d.newLeads.toLocaleString(), icon: <TeamOutlined />, color: '#52c41a', trend: d.totalLeads > 0 ? `↑ ${Math.round((d.newLeads / d.totalLeads) * 100)}%` : '—' },
          { title: '转化率', value: `${d.conversionRate}%`, icon: <RiseOutlined />, color: '#722ed1' },
          { title: '转化客户', value: d.convertedLeads.toLocaleString(), icon: <DollarOutlined />, color: '#fa8c16' },
        ].map(k => (
          <Col xs={12} sm={6} key={k.title}>
            <Card size="small" style={{ borderRadius: 12 }} loading={loading && !data}>
              <Statistic
                title={<Text type="secondary">{k.title}</Text>}
                value={k.value}
                valueStyle={{ color: k.color, fontSize: 24 }}
                prefix={<span style={{ color: k.color }}>{k.icon}</span>}
              />
              {(k as { trend?: string }).trend && (
                <Text type="secondary" style={{ fontSize: 12 }}>{(k as { trend: string }).trend}</Text>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 趋势图 (CSS 柱状图) */}
        <Col xs={24} lg={14}>
          <Card title="趋势图" style={{ borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 6, padding: '0 8px' }}>
              {d.trend.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 160, width: '100%', justifyContent: 'center' }}>
                    <div
                      style={{
                        width: 20,
                        height: `${(d.leads / maxTrend) * 160}px`,
                        background: 'linear-gradient(180deg, #1677ff, #69b1ff)',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s',
                      }}
                      title={`潜客: ${d.leads}`}
                    />
                    <div
                      style={{
                        width: 20,
                        height: `${(d.conversions / maxTrend) * 160}px`,
                        background: 'linear-gradient(180deg, #52c41a, #95de64)',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s',
                      }}
                      title={`转化: ${d.conversions}`}
                    />
                  </div>
                  <Text style={{ fontSize: 11, color: '#999' }}>{d.label}</Text>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12 }}>
              <Space><span style={{ display: 'inline-block', width: 10, height: 10, background: '#1677ff', borderRadius: 3 }} /> <Text type="secondary" style={{ fontSize: 12 }}>潜客</Text></Space>
              <Space><span style={{ display: 'inline-block', width: 10, height: 10, background: '#52c41a', borderRadius: 3 }} /> <Text type="secondary" style={{ fontSize: 12 }}>转化</Text></Space>
            </div>
          </Card>
        </Col>

        {/* AI评分分布 */}
        <Col xs={24} lg={10}>
          <Card title="AI评分分布" style={{ borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 8, justifyContent: 'center' }}>
              {d.aiScoreDist.map((d, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 11 }}>{d.count}</Text>
                  <div
                    style={{
                      width: 36,
                      height: `${(d.count / maxScore) * 160}px`,
                      background: `linear-gradient(180deg, ${['#f5222d', '#fa8c16', '#faad14', '#52c41a', '#1677ff'][i]}, ${['#ff7875', '#ffbb96', '#ffe58f', '#95de64', '#91caff'][i]})`,
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s',
                    }}
                  />
                  <Text style={{ fontSize: 10, color: '#666' }}>{d.range}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 渠道来源 */}
      <Card title="渠道来源" style={{ marginTop: 16, borderRadius: 12 }}>
        <Row gutter={[24, 12]}>
          {d.channelBreakdown.map((c, i) => (
            <Col xs={24} sm={12} md={Math.floor(24 / 5)} key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: Object.values(CHANNEL_COLORS)[i] || CHANNEL_COLORS.wechat, flexShrink: 0 }} />
                <Text>{c.channel}</Text>
                <div style={{ flex: 1 }}>
                  <div style={{
                    height: 6,
                    width: `${(c.count / maxChannel) * 100}%`,
                    background: Object.values(CHANNEL_COLORS)[i] || CHANNEL_COLORS.wechat,
                    borderRadius: 3,
                    minWidth: 20,
                  }} />
                </div>
                <Text strong>{c.count}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </PageContainer>
  );
}
