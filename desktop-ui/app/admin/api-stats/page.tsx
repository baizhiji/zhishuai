'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Select,
  DatePicker,
  Tag,
  Space,
  Typography,
  Progress,
  Statistic,
  Empty,
  Alert,
} from 'antd';
import {
  ApiOutlined,
  AreaChartOutlined,
  FieldTimeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { request } from '@/utils/request';
import dayjs from 'dayjs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface ApiUsage {
  id: string;
  provider: string;
  modelName: string;
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  successRate: number;
  totalTokens: number;
  cost: number;
  avgLatency: number;
  lastCallAt: string;
}

interface TrendData {
  date: string;
  calls: number;
  tokens: number;
  cost: number;
}

interface ProviderData {
  provider: string;
  calls: number;
  cost: number;
}

export default function ApiStatsPage() {
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<ApiUsage[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [providerData, setProviderData] = useState<ProviderData[]>([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    totalTokens: 0,
    totalCost: 0,
    avgSuccessRate: 0,
  });

  useEffect(() => {
    fetchApiStats();
  }, []);

  const [error, setError] = useState<string | null>(null);

  const fetchApiStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await request.get('/api/admin/api-providers/usage');
      if (res.data && (res.data.usage || res.data.stats)) {
        setUsage(res.data.usage || []);
        setTrendData(res.data.trendData || []);
        setProviderData(res.data.providerData || []);
        setStats(res.data.stats || { totalCalls: 0, totalTokens: 0, totalCost: 0, avgSuccessRate: 0 });
      } else {
        setUsage([]);
        setTrendData([]);
        setProviderData([]);
        setStats({ totalCalls: 0, totalTokens: 0, totalCost: 0, avgSuccessRate: 0 });
        setError('暂无 API 使用数据，请确认服务商配置正确后重试');
      }
    } catch (err: any) {
      console.error('获取API统计数据失败', err);
      setUsage([]);
      setTrendData([]);
      setProviderData([]);
      setStats({ totalCalls: 0, totalTokens: 0, totalCost: 0, avgSuccessRate: 0 });
      setError(err?.response?.data?.message || '获取统计数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '模型',
      key: 'model',
      render: (_: any, record: ApiUsage) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.modelName}</Text>
          <Tag>{record.provider}</Tag>
        </Space>
      ),
    },
    {
      title: '调用次数',
      dataIndex: 'totalCalls',
      key: 'totalCalls',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '成功/失败',
      key: 'result',
      render: (_: any, record: ApiUsage) => (
        <Space direction="vertical" size={0}>
          <Text type="success">
            <CheckCircleOutlined /> {record.successCalls.toLocaleString()}
          </Text>
          <Text type="danger">
            <CloseCircleOutlined /> {record.failedCalls.toLocaleString()}
          </Text>
        </Space>
      ),
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate: number) => (
        <Progress
          percent={rate}
          size="small"
          status={rate > 99 ? 'success' : 'active'}
          format={p => `${p}%`}
        />
      ),
    },
    {
      title: 'Tokens',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      render: (val: number) => (val / 1000000).toFixed(2) + 'M',
    },
    {
      title: '费用',
      dataIndex: 'cost',
      key: 'cost',
      render: (val: number) => `¥${val.toFixed(2)}`,
    },
    {
      title: '平均延迟',
      dataIndex: 'avgLatency',
      key: 'avgLatency',
      render: (val: number) => `${val}s`,
    },
    {
      title: '最后调用',
      dataIndex: 'lastCallAt',
      key: 'lastCallAt',
      render: (time: string) => dayjs(time).format('HH:mm:ss'),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>API 使用统计</Title>
        <Text type="secondary">查看 AI API 调用情况和费用分析</Text>
      </div>

      {error && (
        <Alert
          message="数据加载提示"
          description={error}
          type={usage.length === 0 ? 'info' : 'warning'}
          showIcon
          closable
          style={{ marginBottom: 24 }}
          onClose={() => setError(null)}
        />
      )}

      {!loading && usage.length === 0 && !error && (
        <Empty description="暂无 API 调用记录" style={{ padding: 60 }} />
      )}

      {/* 总体统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总调用次数"
              value={stats.totalCalls}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#6d28d9' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总 Tokens"
              value={stats.totalTokens >= 1000000 ? (stats.totalTokens / 1000000).toFixed(1) : (stats.totalTokens / 1000).toFixed(1)}
              suffix={stats.totalTokens >= 1000000 ? 'M' : 'K'}
              prefix={<AreaChartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总费用"
              value={stats.totalCost}
              prefix="¥"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="成功率"
              value={stats.avgSuccessRate}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 趋势图 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="调用趋势（近7天）">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="calls"
                  stroke="#6d28d9"
                  name="调用次数"
                />
                <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#faad14" name="费用" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="服务商费用分布">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={providerData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="provider" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="cost" fill="#faad14" name="费用" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 模型详情 */}
      <Card title="模型调用详情">
        <Table
          columns={columns}
          dataSource={usage}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
}
