'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Empty, Typography, Tag, Table, Progress, App } from 'antd';
import {
  RocketOutlined,
  ThunderboltOutlined,
  FireOutlined,
  DatabaseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface UsageData {
  totalTokens: number;
  totalCalls: number;
  imageGenCount: number;
  videoGenCount: number;
  textGenCount: number;
  voiceGenCount: number;
  monthlyTrend: { date: string; tokens: number; calls: number }[];
  topCustomers: { name: string; tokens: number; calls: number }[];
}

const EMPTY: UsageData = {
  totalTokens: 0,
  totalCalls: 0,
  imageGenCount: 0,
  videoGenCount: 0,
  textGenCount: 0,
  voiceGenCount: 0,
  monthlyTrend: [],
  topCustomers: [],
};

export default function AgentUsagePage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UsageData>(EMPTY);

  const load = async () => {
    setLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res: any = await request.get('/agent/usage');
      const payload = res?.data || res;
      setData({
        totalTokens: payload?.totalTokens ?? 0,
        totalCalls: payload?.totalCalls ?? 0,
        imageGenCount: payload?.imageGenCount ?? 0,
        videoGenCount: payload?.videoGenCount ?? 0,
        textGenCount: payload?.textGenCount ?? 0,
        voiceGenCount: payload?.voiceGenCount ?? 0,
        monthlyTrend: Array.isArray(payload?.monthlyTrend) ? payload.monthlyTrend : [],
        topCustomers: Array.isArray(payload?.topCustomers) ? payload.topCustomers : [],
      });
    } catch (err) {
      // 静默：使用空数据，避免 404 时控制台噪音
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="加载用量数据..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>用量统计</Title>
          <Text type="secondary">名下所有客户的 AI 创作与 API 调用汇总</Text>
        </div>
        <a onClick={load} style={{ cursor: 'pointer' }}>
          <ReloadOutlined /> 刷新
        </a>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="总调用次数"
              value={data.totalCalls}
              prefix={<ThunderboltOutlined />}
              suffix="次"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="总 Token 消耗"
              value={data.totalTokens}
              prefix={<DatabaseOutlined />}
              suffix="tokens"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="图片生成"
              value={data.imageGenCount}
              prefix={<FireOutlined />}
              suffix="张"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="视频生成"
              value={data.videoGenCount}
              prefix={<RocketOutlined />}
              suffix="条"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="近 30 天用量趋势">
            {data.monthlyTrend.length === 0 ? (
              <Empty description="暂无用量数据" />
            ) : (
              <Table
                size="small"
                dataSource={data.monthlyTrend}
                rowKey={(r) => r.date}
                pagination={false}
                columns={[
                  { title: '日期', dataIndex: 'date', key: 'date' },
                  { title: 'Token', dataIndex: 'tokens', key: 'tokens' },
                  { title: '调用次数', dataIndex: 'calls', key: 'calls' },
                ]}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="用量 Top 5 客户">
            {data.topCustomers.length === 0 ? (
              <Empty description="暂无客户用量数据" />
            ) : (
              <Table
                size="small"
                dataSource={data.topCustomers}
                rowKey={(r, i) => `${r.name}-${i}`}
                pagination={false}
                columns={[
                  { title: '客户', dataIndex: 'name', key: 'name' },
                  { title: 'Token', dataIndex: 'tokens', key: 'tokens' },
                  { title: '调用', dataIndex: 'calls', key: 'calls' },
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card>
        <Paragraph type="secondary" style={{ margin: 0 }}>
          用量数据按名下所有客户汇总计算。如需更细粒度的统计，请进入「客户管理」选择具体客户查看其工作台。
        </Paragraph>
      </Card>
    </div>
  );
}
