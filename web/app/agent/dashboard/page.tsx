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
  Button,
  Select,
  DatePicker,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  RiseOutlined,
  DollarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import request from '@/utils/request';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface AgentStats {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  commission: number;
  commissionRate: number;
  newCustomersThisMonth: number;
  growthRate: number;
}

interface Customer {
  id: number;
  companyName: string;
  contactName: string;
  phone: string;
  status: 'active' | 'frozen';
  createdAt: string;
  revenue: number;
  commission: number;
}

interface RevenueTrend {
  date: string;
  revenue: number;
  commission: number;
}

interface FunnelData {
  stage: string;
  value: number;
  rate: string;
}

export default function AgentDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [dateRange, setDateRange] = useState<string>('30d');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock 数据
      const mockStats: AgentStats = {
        totalCustomers: 156,
        activeCustomers: 142,
        totalRevenue: 458600,
        commission: 91680,
        commissionRate: 20,
        newCustomersThisMonth: 12,
        growthRate: 8.5,
      };

      const mockCustomers: Customer[] = [
        {
          id: 1,
          companyName: '科技有限公司',
          contactName: '张总',
          phone: '138****1234',
          status: 'active',
          createdAt: '2024-01-10',
          revenue: 28000,
          commission: 5600,
        },
        {
          id: 2,
          companyName: '网络科技公司',
          contactName: '李总',
          phone: '139****5678',
          status: 'active',
          createdAt: '2024-01-08',
          revenue: 15600,
          commission: 3120,
        },
        {
          id: 3,
          companyName: '文化传媒',
          contactName: '王总',
          phone: '137****9012',
          status: 'active',
          createdAt: '2024-01-05',
          revenue: 12000,
          commission: 2400,
        },
        {
          id: 4,
          companyName: '电子商务',
          contactName: '赵总',
          phone: '136****3456',
          status: 'frozen',
          createdAt: '2024-01-03',
          revenue: 0,
          commission: 0,
        },
        {
          id: 5,
          companyName: '软件开发',
          contactName: '钱总',
          phone: '135****7890',
          status: 'active',
          createdAt: '2024-01-01',
          revenue: 35000,
          commission: 7000,
        },
      ];

      const mockTrend: RevenueTrend[] = [
        { date: '周一', revenue: 12000, commission: 2400 },
        { date: '周二', revenue: 15000, commission: 3000 },
        { date: '周三', revenue: 18000, commission: 3600 },
        { date: '周四', revenue: 14000, commission: 2800 },
        { date: '周五', revenue: 22000, commission: 4400 },
        { date: '周六', revenue: 25000, commission: 5000 },
        { date: '周日', revenue: 19000, commission: 3800 },
      ];

      const mockFunnel: FunnelData[] = [
        { stage: '潜在客户', value: 500, rate: '100%' },
        { stage: '已联系', value: 350, rate: '70%' },
        { stage: '有意向', value: 200, rate: '40%' },
        { stage: '已签约', value: 156, rate: '31%' },
        { stage: '活跃使用', value: 142, rate: '28%' },
      ];

      setStats(mockStats);
      setCustomers(mockCustomers);
      setRevenueTrend(mockTrend);
      setFunnelData(mockFunnel);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const customerColumns = [
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '已冻结'}
        </Tag>
      ),
    },
    {
      title: '贡献营收',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (val: number) => `¥${val.toLocaleString()}`,
    },
    {
      title: '分成收益',
      dataIndex: 'commission',
      key: 'commission',
      render: (val: number) => (
        <Text style={{ color: '#52c41a', fontWeight: 500 }}>¥{val.toLocaleString()}</Text>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            代理数据中心
          </Title>
          <Text type="secondary">查看您的代理业务数据</Text>
        </div>
        <Space>
          <Select
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 120 }}
            options={[
              { label: '近7天', value: '7d' },
              { label: '近30天', value: '30d' },
              { label: '近90天', value: '90d' },
              { label: '全部', value: 'all' },
            ]}
          />
          <Button href="/agent/customers">客户管理</Button>
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="我的客户总数"
              value={stats?.totalCustomers || 0}
              prefix={<TeamOutlined />}
              suffix={
                <Text type="success" style={{ fontSize: 14 }}>
                  <ArrowUpOutlined /> {stats?.growthRate}%
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="活跃客户"
              value={stats?.activeCustomers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="客户总营收"
              value={stats?.totalRevenue || 0}
              prefix={<DollarOutlined />}
              formatter={value => `¥${Number(value).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="我的分成收益"
              value={stats?.commission || 0}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#722ed1' }}
              formatter={value => `¥${Number(value).toLocaleString()}`}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">分成比例: </Text>
              <Text strong>{stats?.commissionRate}%</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="收益趋势">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `¥${value.toLocaleString()}`,
                      name === 'revenue' ? '营收' : '分成',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1890ff"
                    fill="#1890ff33"
                    name="营收"
                  />
                  <Area
                    type="monotone"
                    dataKey="commission"
                    stroke="#722ed1"
                    fill="#722ed133"
                    name="分成"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="客户转化漏斗">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={80} />
                  <Tooltip formatter={(value: number) => [`${value} 人`, '数量']} />
                  <Bar dataKey="value" fill="#1890ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Customer Table */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title="客户列表"
            extra={
              <Space>
                <Button type="primary" href="/agent/customers">
                  管理客户
                </Button>
                <Button href="/agent/settlement">查看分成</Button>
              </Space>
            }
          >
            <Table
              dataSource={customers}
              columns={customerColumns}
              rowKey="id"
              pagination={false}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            cover={
              <div
                style={{
                  height: 80,
                  background: '#e6f7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TeamOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              </div>
            }
          >
            <Card.Meta title="新增客户" description="添加新客户账号" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            cover={
              <div
                style={{
                  height: 80,
                  background: '#f6ffed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DollarOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              </div>
            }
          >
            <Card.Meta title="分成结算" description="查看分成收益明细" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            cover={
              <div
                style={{
                  height: 80,
                  background: '#fff7e6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileTextOutlined style={{ fontSize: 32, color: '#faad14' }} />
              </div>
            }
          >
            <Card.Meta title="业绩报表" description="导出业绩数据" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
