'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Space,
  Typography,
  DatePicker,
} from 'antd';
import {
  UserSwitchOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  SendOutlined,
  LikeOutlined,
  CommentOutlined,
  ShareAltOutlined,
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
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface AcquisitionStats {
  totalLeads: number;
  newLeads: number;
  contacted: number;
  converted: number;
  conversionRate: number;
  avgResponseTime: string;
}

interface LeadData {
  id: string;
  name: string;
  source: string;
  status: string;
  interest: number;
  contactedAt?: string;
  convertedAt?: string;
  lastContact?: string;
}

interface TrendData {
  date: string;
  leads: number;
  contacted: number;
  converted: number;
}

interface SourceData {
  source: string;
  count: number;
  rate: number;
}

export default function AcquisitionDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AcquisitionStats>({
    totalLeads: 0,
    newLeads: 0,
    contacted: 0,
    converted: 0,
    conversionRate: 0,
    avgResponseTime: '0分钟',
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [leadsData, setLeadsData] = useState<LeadData[]>([]);
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserId(userData.id);
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/api/acquisition/dashboard', {
        userId,
      });

      if (res.data) {
        setStats(res.data.stats || generateMockStats());
        setTrendData(res.data.trendData || generateMockTrendData());
        setLeadsData(res.data.leadsData || generateMockLeadsData());
        setSourceData(res.data.sourceData || generateMockSourceData());
      }
    } catch (error) {
      setStats(generateMockStats());
      setTrendData(generateMockTrendData());
      setLeadsData(generateMockLeadsData());
      setSourceData(generateMockSourceData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockStats = () => ({
    totalLeads: 245,
    newLeads: 38,
    contacted: 156,
    converted: 42,
    conversionRate: 17.1,
    avgResponseTime: '5分钟',
  });

  const generateMockTrendData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      data.push({
        date: dayjs().subtract(i, 'day').format('MM-DD'),
        leads: Math.floor(Math.random() * 50) + 20,
        contacted: Math.floor(Math.random() * 30) + 10,
        converted: Math.floor(Math.random() * 10) + 2,
      });
    }
    return data;
  };

  const generateMockLeadsData = () => [
    {
      id: '1',
      name: '张先生',
      source: '抖音',
      status: 'converted',
      interest: 95,
      contactedAt: '2024-01-15',
      convertedAt: '2024-01-18',
    },
    {
      id: '2',
      name: '李女士',
      source: '小红书',
      status: 'contacted',
      interest: 80,
      contactedAt: '2024-01-16',
      lastContact: '2024-01-17',
    },
    { id: '3', name: '王先生', source: '微信', status: 'new', interest: 65 },
    {
      id: '4',
      name: '刘女士',
      source: '微博',
      status: 'contacted',
      interest: 75,
      contactedAt: '2024-01-14',
      lastContact: '2024-01-16',
    },
    {
      id: '5',
      name: '陈先生',
      source: '抖音',
      status: 'converted',
      interest: 90,
      contactedAt: '2024-01-13',
      convertedAt: '2024-01-17',
    },
  ];

  const generateMockSourceData = () => [
    { source: '抖音', count: 85, rate: 35 },
    { source: '小红书', count: 62, rate: 25 },
    { source: '微信', count: 48, rate: 20 },
    { source: '微博', count: 30, rate: 12 },
    { source: '其他', count: 20, rate: 8 },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'blue',
      contacted: 'orange',
      converted: 'green',
      lost: 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      new: '新线索',
      contacted: '已联系',
      converted: '已转化',
      lost: '已流失',
    };
    return texts[status] || status;
  };

  const leadsColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '来源', dataIndex: 'source', key: 'source' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: '意向度',
      dataIndex: 'interest',
      key: 'interest',
      render: (val: number) => (
        <Progress percent={val} size="small" status={val > 80 ? 'success' : 'active'} />
      ),
    },
    {
      title: '最后联系',
      dataIndex: 'lastContact',
      key: 'lastContact',
      render: (t: string) => t || '-',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">智能获客看板</h1>
        <p className="text-gray-500">追踪获客效果与转化漏斗</p>
      </div>

      {/* 核心指标 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="线索总数"
              value={stats.totalLeads}
              prefix={<UserSwitchOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="新增线索"
              value={stats.newLeads}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={<span className="text-sm text-gray-500">今日</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="已联系"
              value={stats.contacted}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="转化数"
              value={stats.converted}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 转化率指标 */}
      <Row gutter={16} className="mb-6">
        <Col span={12}>
          <Card loading={loading}>
            <div className="text-center">
              <Text className="text-lg">整体转化率</Text>
              <div className="text-5xl font-bold text-green-500 my-4">{stats.conversionRate}%</div>
              <Progress percent={stats.conversionRate} showInfo={false} strokeColor="#52c41a" />
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card loading={loading}>
            <div className="text-center">
              <Text className="text-lg">平均响应时间</Text>
              <div className="text-5xl font-bold text-blue-500 my-4">{stats.avgResponseTime}</div>
              <Text type="secondary">从线索到首次联系的平均耗时</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 趋势图 */}
      <Row gutter={16} className="mb-6">
        <Col span={16}>
          <Card title="获客趋势（近7天）">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="#1890ff" name="新增线索" />
                <Line type="monotone" dataKey="contacted" stroke="#faad14" name="已联系" />
                <Line type="monotone" dataKey="converted" stroke="#52c41a" name="已转化" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="线索来源">
            <Space direction="vertical" className="w-full">
              {sourceData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Text>{item.source}</Text>
                  <Space>
                    <Text strong>{item.count}</Text>
                    <Text type="secondary">({item.rate}%)</Text>
                  </Space>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 漏斗图 */}
      <Row gutter={16} className="mb-6">
        <Col span={24}>
          <Card title="转化漏斗">
            <div className="flex justify-around items-end px-8">
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 px-12 py-4 rounded-t-lg">
                  <div className="text-3xl font-bold">{stats.totalLeads}</div>
                  <div>总线索</div>
                </div>
              </div>
              <div className="text-2xl text-gray-300">→</div>
              <div className="text-center">
                <div className="bg-orange-100 text-orange-600 px-10 py-4 rounded-t-lg">
                  <div className="text-3xl font-bold">{stats.contacted}</div>
                  <div>已联系</div>
                </div>
              </div>
              <div className="text-2xl text-gray-300">→</div>
              <div className="text-center">
                <div className="bg-green-100 text-green-600 px-8 py-4 rounded-t-lg">
                  <div className="text-3xl font-bold">{stats.converted}</div>
                  <div>已转化</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 线索列表 */}
      <Row gutter={16}>
        <Col span={24}>
          <Card title="最新线索">
            <Table
              columns={leadsColumns}
              dataSource={leadsData}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
