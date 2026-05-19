'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  List,
  Avatar,
  Tag,
  Progress,
  Table,
  Select,
  DatePicker,
  Space,
  Typography,
  ProgressProps,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  RiseOutlined,
  MailOutlined,
  FileTextOutlined,
  MessageOutlined,
  DollarOutlined,
  LikeOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import request from '@/utils/request';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface DashboardData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    growth: number;
  };
  matrix: {
    accounts: number;
    todayPosts: number;
    totalViews: number;
    totalLikes: number;
  };
  recruitment: {
    activePosts: number;
    totalCandidates: number;
    interviews: number;
    hires: number;
  };
  acquisition: {
    totalLeads: number;
    contacted: number;
    converted: number;
    conversionRate: number;
  };
  recentActivities: any[];
  platformDistribution: { name: string; value: number }[];
  revenueTrend: { date: string; revenue: number }[];
}

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];

const cardStyle: React.CSSProperties = {
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};

export default function CustomerDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [dateRange, setDateRange] = useState<string>('7d');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 获取统计数据
      const statsRes = await request.get('/api/statistics/overview');
      const matrixRes = await request.get('/api/social/accounts?userId=1');
      const recruitRes = await request.get('/api/recruitment/stats?userId=1');
      const acquireRes = await request.get('/api/acquisition/stats?userId=1');

      // Mock 数据用于演示
      const mockData: DashboardData = {
        overview: {
          totalUsers: statsRes?.totalUsers || 12580,
          activeUsers: statsRes?.activeUsers || 8642,
          totalRevenue: statsRes?.totalRevenue || 285600,
          growth: 12.5,
        },
        matrix: {
          accounts: matrixRes?.length || 8,
          todayPosts: 24,
          totalViews: 1256800,
          totalLikes: 45680,
        },
        recruitment: {
          activePosts: recruitRes?.activePosts || 12,
          totalCandidates: recruitRes?.totalCandidates || 156,
          interviews: recruitRes?.interviews || 38,
          hires: recruitRes?.hires || 8,
        },
        acquisition: {
          totalLeads: acquireRes?.totalLeads || 456,
          contacted: acquireRes?.contacted || 289,
          converted: acquireRes?.converted || 67,
          conversionRate: acquireRes?.conversionRate || 14.7,
        },
        recentActivities: [
          { id: 1, type: 'post', platform: 'douyin', content: '内容发布成功', time: '2分钟前' },
          { id: 2, type: 'candidate', name: '张三', status: '面试邀请', time: '15分钟前' },
          { id: 3, type: 'lead', name: '李四', status: '已转化', time: '30分钟前' },
          { id: 4, type: 'post', platform: 'xiaohongshu', content: '内容发布成功', time: '1小时前' },
          { id: 5, type: 'candidate', name: '王五', status: '待筛选', time: '2小时前' },
        ],
        platformDistribution: [
          { name: '抖音', value: 35 },
          { name: '快手', value: 25 },
          { name: '小红书', value: 20 },
          { name: '微信', value: 15 },
          { name: '其他', value: 5 },
        ],
        revenueTrend: [
          { date: '周一', revenue: 4200 },
          { date: '周二', revenue: 3800 },
          { date: '周三', revenue: 5100 },
          { date: '周四', revenue: 4600 },
          { date: '周五', revenue: 6200 },
          { date: '周六', revenue: 5500 },
          { date: '周日', revenue: 4800 },
        ],
      };

      setData(mockData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // 使用默认数据
      setData({
        overview: { totalUsers: 12580, activeUsers: 8642, totalRevenue: 285600, growth: 12.5 },
        matrix: { accounts: 8, todayPosts: 24, totalViews: 1256800, totalLikes: 45680 },
        recruitment: { activePosts: 12, totalCandidates: 156, interviews: 38, hires: 8 },
        acquisition: { totalLeads: 456, contacted: 289, converted: 67, conversionRate: 14.7 },
        recentActivities: [],
        platformDistribution: [
          { name: '抖音', value: 35 },
          { name: '快手', value: 25 },
          { name: '小红书', value: 20 },
          { name: '微信', value: 15 },
          { name: '其他', value: 5 },
        ],
        revenueTrend: [
          { date: '周一', revenue: 4200 },
          { date: '周二', revenue: 3800 },
          { date: '周三', revenue: 5100 },
          { date: '周四', revenue: 4600 },
          { date: '周五', revenue: 6200 },
          { date: '周六', revenue: 5500 },
          { date: '周日', revenue: 4800 },
        ],
      });
    }
    setLoading(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return <FileTextOutlined style={{ color: '#1890ff' }} />;
      case 'candidate': return <TeamOutlined style={{ color: '#52c41a' }} />;
      case 'lead': return <UserOutlined style={{ color: '#faad14' }} />;
      default: return <MessageOutlined style={{ color: '#722ed1' }} />;
    }
  };

  const recruitmentProgress: any = {
    steps: [
      { title: '投递', value: 100 },
      { title: '筛选', value: 65 },
      { title: '面试', value: 35 },
      { title: '入职', value: 8 },
    ],
    percent: 8,
    strokeColor: '#52c41a',
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>工作台</Title>
          <Text type="secondary">欢迎回来，查看您的业务数据</Text>
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
            ]}
          />
        </Space>
      </div>

      {/* Overview Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title="总用户数"
              value={data?.overview.totalUsers || 0}
              prefix={<UserOutlined />}
              suffix={<Text type="success" style={{ fontSize: 14 }}>+{data?.overview.growth}%</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title="活跃用户"
              value={data?.overview.activeUsers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title="总收益"
              value={data?.overview.totalRevenue || 0}
              prefix={<DollarOutlined />}
              formatter={(value) => `¥${Number(value).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title="今日收入"
              value={data?.overview.totalRevenue ? Math.round(data.overview.totalRevenue / 30) : 0}
              prefix={<RiseOutlined />}
              suffix={<Text type="success" style={{ fontSize: 14 }}>+5.2%</Text>}
            />
          </Card>
        </Col>
      </Row>

      {/* Matrix & Business Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Matrix Stats */}
        <Col xs={24} lg={16}>
          <Card
            title="自媒体运营"
            extra={<a href="/media/matrix">查看详情</a>}
            style={cardStyle}
            loading={loading}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="账号数量" value={data?.matrix.accounts || 0} prefix={<TeamOutlined />} />
              </Col>
              <Col span={6}>
                <Statistic title="今日发布" value={data?.matrix.todayPosts || 0} prefix={<FileTextOutlined />} />
              </Col>
              <Col span={6}>
                <Statistic title="总浏览量" value={data?.matrix.totalViews || 0} prefix={<EyeOutlined />} />
              </Col>
              <Col span={6}>
                <Statistic title="总点赞量" value={data?.matrix.totalLikes || 0} prefix={<LikeOutlined />} />
              </Col>
            </Row>
            <div style={{ marginTop: 24, height: 280 }}>
              <Title level={5} style={{ marginBottom: 16 }}>收益趋势</Title>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data?.revenueTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`¥${value}`, '收益']} />
                  <Area type="monotone" dataKey="revenue" stroke="#1890ff" fill="#1890ff33" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Platform Distribution */}
        <Col xs={24} lg={8}>
          <Card title="账号分布" style={cardStyle} loading={loading}>
            <div style={{ height: 200, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.platformDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(data?.platformDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recruitment & Acquisition */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Recruitment */}
        <Col xs={24} lg={12}>
          <Card
            title="招聘助手"
            extra={<a href="/customer/recruitment-dashboard">数据看板</a>}
            style={cardStyle}
            loading={loading}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="在招职位" value={data?.recruitment.activePosts || 0} />
              </Col>
              <Col span={6}>
                <Statistic title="候选人" value={data?.recruitment.totalCandidates || 0} />
              </Col>
              <Col span={6}>
                <Statistic title="面试中" value={data?.recruitment.interviews || 0} />
              </Col>
              <Col span={6}>
                <Statistic title="已入职" value={data?.recruitment.hires || 0} valueStyle={{ color: '#52c41a' }} />
              </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
              <Title level={5} style={{ marginBottom: 12 }}>招聘漏斗</Title>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{data?.recruitment.totalCandidates || 0}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>投递</div>
                </div>
                <span style={{ color: '#d9d9d9' }}>→</span>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{Math.round((data?.recruitment.totalCandidates || 0) * 0.65)}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>筛选</div>
                </div>
                <span style={{ color: '#d9d9d9' }}>→</span>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{data?.recruitment.interviews || 0}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>面试</div>
                </div>
                <span style={{ color: '#d9d9d9' }}>→</span>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>{data?.recruitment.hires || 0}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>入职</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Acquisition */}
        <Col xs={24} lg={12}>
          <Card
            title="智能获客"
            extra={<a href="/customer/acquisition-dashboard">数据看板</a>}
            style={cardStyle}
            loading={loading}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="总线索" value={data?.acquisition.totalLeads || 0} />
              </Col>
              <Col span={6}>
                <Statistic title="已联系" value={data?.acquisition.contacted || 0} />
              </Col>
              <Col span={6}>
                <Statistic title="已转化" value={data?.acquisition.converted || 0} />
              </Col>
              <Col span={6}>
                <Statistic
                  title="转化率"
                  value={data?.acquisition.conversionRate || 0}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
              <Title level={5} style={{ marginBottom: 12 }}>获客漏斗</Title>
              <Progress
                percent={data?.acquisition.conversionRate || 0}
                success={{ percent: data?.acquisition.conversionRate || 0 }}
                strokeColor="#52c41a"
                format={(percent) => `${percent}% 转化`}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="最近活动" style={cardStyle} loading={loading}>
            <List
              dataSource={data?.recentActivities || []}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={getActivityIcon(item.type)} style={{ background: '#f0f0f0' }} />}
                    title={item.content || `${item.name} - ${item.status}`}
                    description={item.platform ? `平台: ${item.platform}` : item.time}
                  />
                  <Tag color={item.status === '已转化' || item.status === '入职' ? 'green' : 'blue'}>
                    {item.status || item.time}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="快捷入口" style={cardStyle}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <a href="/media/matrix/accounts" style={{ display: 'block', padding: '12px 16px', background: '#e6f7ff', borderRadius: 8, color: '#1890ff' }}>
                <TeamOutlined /> 矩阵账号管理
              </a>
              <a href="/media/matrix/publish" style={{ display: 'block', padding: '12px 16px', background: '#f6ffed', borderRadius: 8, color: '#52c41a' }}>
                <FileTextOutlined /> 发布内容
              </a>
              <a href="/customer/recruitment" style={{ display: 'block', padding: '12px 16px', background: '#fff7e6', borderRadius: 8, color: '#faad14' }}>
                <TeamOutlined /> 招聘管理
              </a>
              <a href="/customer/acquisition" style={{ display: 'block', padding: '12px 16px', background: '#fff1f0', borderRadius: 8, color: '#f5222d' }}>
                <UserOutlined /> 获客管理
              </a>
              <a href="/agent/ai-chat" style={{ display: 'block', padding: '12px 16px', background: '#f9f0ff', borderRadius: 8, color: '#722ed1' }}>
                <MessageOutlined /> AI 对话
              </a>
              <a href="/customer/materials" style={{ display: 'block', padding: '12px 16px', background: '#f0f5ff', borderRadius: 8, color: '#1890ff' }}>
                <FileTextOutlined /> 素材库
              </a>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
