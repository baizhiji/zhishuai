'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Button, Segmented } from 'antd';
import {
  ShareAltOutlined, EyeOutlined, UserOutlined, RiseOutlined, ReloadOutlined, LinkOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api';
import PageContainer from '@/components/customer/PageContainer';

const { Title, Text } = Typography;

interface ShareDashboardData {
  totalLinks: number;
  totalViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  trend: { label: string; views: number; visitors: number }[];
  topLinks: { title: string; views: number }[];
  deviceBreakdown: { device: string; count: number; percentage: number }[];
}

const DEVICE_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1'];

export default function ShareBoardPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ShareDashboardData | null>(null);
  const [period, setPeriod] = useState<string>('week');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res: Record<string, unknown> = await apiClient.get('/share/dashboard', { params: { period } });
      setData(res as ShareDashboardData);
    } catch { setData(null); } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!loading && !data) {
    return (
      <PageContainer title="分享看板" description="数据获取失败，请稍后重试" breadcrumb={[{ title: '首页', href: '/customer/dashboard' }, { title: '分享裂变' }, { title: '分享看板' }]} skeletonType="card" extra={<Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>}>
        <div />
      </PageContainer>
    );
  }

  const d = data!;
  const maxTrend = Math.max(...d.trend.map(v => Math.max(v.views, v.visitors)));
  const maxLink = Math.max(...d.topLinks.map(l => l.views));
  const maxDevice = Math.max(...d.deviceBreakdown.map(dd => dd.count));

  return (
    <PageContainer
      title="分享看板"
      description="数据看板，追踪分享裂变效果"
      breadcrumb={[
        { title: '首页', href: '/customer/dashboard' },
        { title: '分享裂变' },
        { title: '分享看板' },
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
          { title: '分享链接数', value: d.totalLinks.toLocaleString(), icon: <ShareAltOutlined />, color: '#1677ff' },
          { title: '总浏览量', value: d.totalViews.toLocaleString(), icon: <EyeOutlined />, color: '#52c41a' },
          { title: '独立访客', value: d.uniqueVisitors.toLocaleString(), icon: <UserOutlined />, color: '#722ed1' },
          { title: '转化率', value: `${d.conversionRate}%`, icon: <RiseOutlined />, color: '#fa8c16' },
        ].map(k => (
          <Col xs={12} sm={6} key={k.title}>
            <Card size="small" style={{ borderRadius: 12 }} loading={loading && !data}>
              <Statistic
                title={<Text type="secondary">{k.title}</Text>}
                value={k.value}
                valueStyle={{ color: k.color, fontSize: 24 }}
                prefix={<span style={{ color: k.color }}>{k.icon}</span>}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 趋势图 */}
        <Col xs={24} lg={14}>
          <Card title="浏览趋势" style={{ borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 6, padding: '0 8px' }}>
              {d.trend.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 160, width: '100%', justifyContent: 'center' }}>
                    <div style={{
                      width: 20,
                      height: `${(d.views / maxTrend) * 160}px`,
                      background: 'linear-gradient(180deg, #1677ff, #69b1ff)',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s',
                    }} title={`浏览量: ${d.views}`} />
                    <div style={{
                      width: 20,
                      height: `${(d.visitors / maxTrend) * 160}px`,
                      background: 'linear-gradient(180deg, #52c41a, #95de64)',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s',
                    }} title={`访客: ${d.visitors}`} />
                  </div>
                  <Text style={{ fontSize: 11, color: '#999' }}>{d.label}</Text>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12 }}>
              <Space><span style={{ display: 'inline-block', width: 10, height: 10, background: '#1677ff', borderRadius: 3 }} /> <Text type="secondary" style={{ fontSize: 12 }}>浏览量</Text></Space>
              <Space><span style={{ display: 'inline-block', width: 10, height: 10, background: '#52c41a', borderRadius: 3 }} /> <Text type="secondary" style={{ fontSize: 12 }}>访客</Text></Space>
            </div>
          </Card>
        </Col>

        {/* 设备分布 */}
        <Col xs={24} lg={10}>
          <Card title="设备分布" style={{ borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 16, justifyContent: 'center' }}>
              {d.deviceBreakdown.map((d, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12 }}>{d.percentage}%</Text>
                  <div style={{
                    width: 44,
                    height: `${(d.count / maxDevice) * 160}px`,
                    background: `linear-gradient(180deg, ${DEVICE_COLORS[i]}, ${DEVICE_COLORS[i]}88)`,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s',
                  }} />
                  <Text style={{ fontSize: 11, color: '#666' }}>{d.device}</Text>
                  <Text style={{ fontSize: 10, color: '#999' }}>{d.count}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 热门链接排行 */}
      <Card title="热门链接 Top 5" style={{ marginTop: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {d.topLinks.map((link, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][i] : '#f0f0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 12, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Space><LinkOutlined /><Text>{link.title}</Text></Space>
                  <Text strong>{link.views.toLocaleString()}</Text>
                </div>
                <div style={{
                  height: 6,
                  width: `${(link.views / maxLink) * 100}%`,
                  background: `linear-gradient(90deg, #1677ff, #69b1ff)`,
                  borderRadius: 3,
                  minWidth: 30,
                }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}
