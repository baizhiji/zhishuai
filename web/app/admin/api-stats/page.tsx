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
  Spin,
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

  const fetchApiStats = async () => {
    setLoading(true);
    try {
      const res = await request.get('/admin/api-providers/usage');
      if (res.data) {
        setUsage(res.data.usage || []);
        setTrendData(res.data.trendData || []);
        setProviderData(res.data.providerData || []);
        setStats(res.data.stats || {
          totalCalls: 0,
          totalTokens: 0,
          totalCost: 0,
          avgSuccessRate: 0,
        });
      }
    } catch (error) {
      // API失败时显示空数据，不再用mock兜底
      setUsage([]);
      setTrendData([]);
      setProviderData([]);
      setStats({
        totalCalls: 0,
        totalTokens: 0,
        totalCost: 0,
        avgSuccessRate: 0,
      });
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
      render: (val: number) => val?.toLocaleString() || 0,
    },
    {
      title: '成功/失败',
      key: 'result',
      render: (_: any, record: ApiUsage) => (
        <Space direction="vertical" size={0}>
          <Text type="success">
            <CheckCircleOutlined /> {(record.successCalls || 0).toLocaleString()}
          </Text>
          <Text type="danger">
            <CloseCircleOutlined /> {(record.failedCalls || 0).toLocaleString()}
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
          percent={rate || 0}
          size="small"
          status={(rate || 0) > 99 ? 'success' : 'active'}
          format={p => `${p}%`}
        />
      ),
    },
    {
      title: 'Tokens',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      render: (val: number) => val ? `${(val / 1000000).toFixed(2)}M` : '0M',
    },
    {
      title: '费用',
      dataIndex: 'cost',
      key: 'cost',
      render: (val: number) => `¥${(val || 0).toFixed(2)}`,
    },
    {
      title: '平均延迟',
      dataIndex: 'avgLatency',
      key: 'avgLatency',
      render: (val: number) => `${val || 0}s`,
    },
    {
      title: '最后调用',
      dataIndex: 'lastCallAt',
      key: 'lastCallAt',
      render: (time: string) => time ? dayjs(time).format('HH:mm:ss') : '-',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">API 使用统计</h1>
        <p className="text-gray-500">查看 AI API 调用情况和费用分析</p>
      </div>

      {/* 总体统计 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总调用次数"
              value={stats.totalCalls}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总 Tokens"
              value={stats.totalTokens}
              suffix=""
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
      <Row gutter={16} className="mb-6">
        <Col span={16}>
          <Card title="调用趋势（近7天）">
            {trendData.length > 0 ? (
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
                    stroke="#1890ff"
                    name="调用次数"
                  />
                  <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#faad14" name="费用" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无调用趋势数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="服务商费用分布">
            {providerData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={providerData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="provider" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="cost" fill="#faad14" name="费用" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无服务商数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* 模型详情 */}
      <Card title="模型调用详情">
        {usage.length > 0 ? (
          <Table
            columns={columns}
            dataSource={usage}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        ) : (
          <Empty
            description="暂无API调用记录，使用AI功能后将自动统计"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    </div>
  );
}
