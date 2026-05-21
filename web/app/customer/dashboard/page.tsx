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
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  RiseOutlined,
  FileTextOutlined,
  MessageOutlined,
  DollarOutlined,
  LikeOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import {
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
} from 'recharts';
import request from '@/utils/request';

const { Title, Text } = Typography;

interface DashboardData {
  overview: {
    materials: number;
    recruitmentPosts: number;
    acquisitionTasks: number;
    shareCodes: number;
    matrixAccounts: number;
    publishedContent: number;
  };
  weekly: {
    newMaterials: number;
    newPosts: number;
    newLeads: number;
  };
  platforms: { platform: string; count: number }[];
  mediaStats?: {
    trend: any[];
    totals: {
      posts: number;
      views: number;
      likes: number;
      comments: number;
      shares: number;
    };
  };
  recruitmentStats?: {
    posts: { total: number; byStatus: Record<string, number> };
    candidates: { total: number; byStatus: Record<string, number> };
    totals: { views: number; applications: number };
  };
  acquisitionStats?: {
    tasks: { total: number; byStatus: Record<string, number> };
    leads: { total: number; byStatus: Record<string, number> };
    metrics: { replyRate: number; avgConversion: number };
  };
  shareStats?: {
    totalCodes: number;
    totals: { scans: number; registers: number };
    conversionRate: number;
  };
}

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

const cardStyle: React.CSSProperties = {
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};

export default function CustomerDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [dateRange, setDateRange] = useState<string>('7d');
  const [userId, setUserId] = useState<string>('1'); // 默认测试用户

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 并行获取所有数据
      const [dashboardRes, mediaRes, recruitRes, acquireRes, shareRes] = await Promise.allSettled([
        request.get(`/api/dashboard-stats/stats`),
        request.get(`/api/media/stats?days=30`),
        request.get(`/api/recruitment/stats`),
        request.get(`/api/acquisition/stats`),
        request.get(`/api/share/stats`),
      ]);

      const dashboard = dashboardRes.status === 'fulfilled' ? dashboardRes.value?.data : null;
      const media = mediaRes.status === 'fulfilled' ? mediaRes.value?.data : null;
      const recruit = recruitRes.status === 'fulfilled' ? recruitRes.value?.data : null;
      const acquire = acquireRes.status === 'fulfilled' ? acquireRes.value?.data : null;
      const share = shareRes.status === 'fulfilled' ? shareRes.value?.data : null;

      // 如果没有真实数据，使用模拟数据
      const hasRealData = dashboard?.overview?.materials > 0 || dashboard?.overview?.matrixAccounts > 0;

      if (hasRealData) {
        setData({
          overview: dashboard.overview,
          weekly: dashboard.weekly,
          platforms: dashboard.platforms,
          mediaStats: media,
          recruitmentStats: recruit,
          acquisitionStats: acquire,
          shareStats: share,
        });
      } else {
        // 使用演示数据
        setData({
          overview: {
            materials: 156,
            recruitmentPosts: 12,
            acquisitionTasks: 8,
            shareCodes: 25,
            matrixAccounts: 8,
            publishedContent: 342,
          },
          weekly: {
            newMaterials: 23,
            newPosts: 18,
            newLeads: 45,
          },
          platforms: [
            { platform: '抖音', count: 3 },
            { platform: '小红书', count: 2 },
            { platform: '快手', count: 1 },
            { platform: '视频号', count: 2 },
          ],
          mediaStats: {
            trend: [
              { date: '周一', posts: 5, views: 1200, likes: 89 },
              { date: '周二', posts: 8, views: 1580, likes: 112 },
              { date: '周三', posts: 6, views: 980, likes: 67 },
              { date: '周四', posts: 10, views: 2100, likes: 156 },
              { date: '周五', posts: 7, views: 1800, likes: 134 },
              { date: '周六', posts: 4, views: 890, likes: 45 },
              { date: '周日', posts: 3, views: 650, likes: 38 },
            ],
            totals: { posts: 43, views: 9200, likes: 641, comments: 89, shares: 45 },
          },
          recruitmentStats: {
            posts: { total: 12, byStatus: { published: 8, draft: 4 } },
            candidates: { total: 156, byStatus: { new: 45, screening: 38, interview: 28, offer: 12, hired: 8 } },
            totals: { views: 3450, applications: 156 },
          },
          acquisitionStats: {
            tasks: { total: 8, byStatus: { running: 5, completed: 2, paused: 1 } },
            leads: { total: 456, byStatus: { new: 120, contacted: 180, replied: 98, converted: 58 } },
            metrics: { replyRate: 21.5, avgConversion: 73 },
          },
          shareStats: {
            totalCodes: 25,
            totals: { scans: 5680, registers: 456 },
            conversionRate: 8,
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      message.error('获取数据失败，使用演示数据');
      // 使用默认演示数据
      setData({
        overview: {
          materials: 156,
          recruitmentPosts: 12,
          acquisitionTasks: 8,
          shareCodes: 25,
          matrixAccounts: 8,
          publishedContent: 342,
        },
        weekly: {
          newMaterials: 23,
          newPosts: 18,
          newLeads: 45,
        },
        platforms: [
          { platform: '抖音', count: 3 },
          { platform: '小红书', count: 2 },
          { platform: '快手', count: 1 },
          { platform: '视频号', count: 2 },
        ],
        mediaStats: {
          trend: [],
          totals: { posts: 43, views: 9200, likes: 641, comments: 89, shares: 45 },
        },
        recruitmentStats: {
          posts: { total: 12, byStatus: { published: 8, draft: 4 } },
          candidates: { total: 156, byStatus: { new: 45, screening: 38, interview: 28, offer: 12, hired: 8 } },
          totals: { views: 3450, applications: 156 },
        },
        acquisitionStats: {
          tasks: { total: 8, byStatus: { running: 5, completed: 2, paused: 1 } },
          leads: { total: 456, byStatus: { new: 120, contacted: 180, replied: 98, converted: 58 } },
          metrics: { replyRate: 21.5, avgConversion: 73 },
        },
        shareStats: {
          totalCodes: 25,
          totals: { scans: 5680, registers: 456 },
          conversionRate: 8,
        },
      });
    }
    setLoading(false);
  };

  // 准备饼图数据
  const getPlatformChartData = () => {
    if (!data?.platforms?.length) {
      return [
        { name: '抖音', value: 35 },
        { name: '小红书', value: 25 },
        { name: '快手', value: 20 },
        { name: '视频号', value: 20 },
      ];
    }
    return data.platforms.map(p => ({ name: p.platform, value: p.count }));
  };

  // 招聘漏斗数据
  const getRecruitmentFunnel = () => {
    if (!data?.recruitmentStats) {
      return [
        { stage: '投递', count: 156, color: '#1890ff' },
        { stage: '筛选', count: 98, color: '#52c41a' },
        { stage: '面试', count: 40, color: '#faad14' },
        { stage: '入职', count: 8, color: '#722ed1' },
      ];
    }
    const candidates = data.recruitmentStats.candidates;
    return [
      { stage: '投递', count: candidates.total, color: '#1890ff' },
      { stage: '筛选', count: (candidates.byStatus?.screening || 0) + (candidates.byStatus?.interview || 0), color: '#52c41a' },
      { stage: '面试', count: candidates.byStatus?.interview || 0, color: '#faad14' },
      { stage: '入职', count: (candidates.byStatus?.offer || 0) + (candidates.byStatus?.hired || 0), color: '#722ed1' },
    ];
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
              title="素材总数"
              value={data?.overview.materials || 0}
              prefix={<FileTextOutlined />}
              suffix={<Text type="success" style={{ fontSize: 12 }}>+{data?.weekly.newMaterials || 0}本周</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title="招聘职位"
              value={data?.overview.recruitmentPosts || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={<Text type="secondary" style={{ fontSize: 12 }}>个</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title="获客任务"
              value={data?.overview.acquisitionTasks || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title="分享码"
              value={data?.overview.shareCodes || 0}
              prefix={<ShareAltOutlined />}
              suffix={<Text type="success" style={{ fontSize: 12 }}>+{data?.shareStats?.conversionRate || 0}%转化</Text>}
            />
          </Card>
        </Col>
      </Row>

      {/* Matrix & Media Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Media Stats */}
        <Col xs={24} lg={16}>
          <Card
            title="自媒体运营"
            extra={<a href="/customer/media/matrix">查看详情</a>}
            style={cardStyle}
            loading={loading}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="矩阵账号" value={data?.overview.matrixAccounts || 0} prefix={<TeamOutlined />} />
              </Col>
              <Col span={6}>
                <Statistic title="已发布" value={data?.overview.publishedContent || 0} prefix={<PlayCircleOutlined />} />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="本周发布" 
                  value={data?.weekly.newPosts || 0} 
                  prefix={<FileTextOutlined />} 
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="本周潜客" 
                  value={data?.weekly.newLeads || 0} 
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 24, height: 280 }}>
              <Title level={5} style={{ marginBottom: 16 }}>发布趋势</Title>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data?.mediaStats?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = { posts: '发布数', views: '浏览量', likes: '点赞数' };
                    return [`${value}`, labels[name] || name];
                  }} />
                  <Area yAxisId="left" type="monotone" dataKey="posts" stroke="#1890ff" fill="#1890ff33" name="posts" />
                  <Area yAxisId="right" type="monotone" dataKey="views" stroke="#52c41a" fill="#52c41a33" name="views" />
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
                    data={getPlatformChartData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {getPlatformChartData().map((entry, index) => (
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
            extra={<a href="/customer/recruitment">职位管理</a>}
            style={cardStyle}
            loading={loading}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="在招职位" value={data?.recruitmentStats?.posts.total || 0} />
              </Col>
              <Col span={6}>
                <Statistic title="候选人" value={data?.recruitmentStats?.candidates.total || 0} />
              </Col>
              <Col span={6}>
                <Statistic title="面试中" value={data?.recruitmentStats?.candidates.byStatus?.interview || 0} />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="已入职" 
                  value={(data?.recruitmentStats?.candidates.byStatus?.offer || 0) + (data?.recruitmentStats?.candidates.byStatus?.hired || 0)} 
                  valueStyle={{ color: '#52c41a' }} 
                />
              </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
              <Title level={5} style={{ marginBottom: 12 }}>招聘漏斗</Title>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {getRecruitmentFunnel().map((item, idx) => (
                  <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: item.color }}>{item.count}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{item.stage}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>

        {/* Acquisition */}
        <Col xs={24} lg={12}>
          <Card
            title="智能获客"
            extra={<a href="/customer/acquisition">任务管理</a>}
            style={cardStyle}
            loading={loading}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="总线索" value={data?.acquisitionStats?.leads.total || 0} />
              </Col>
              <Col span={6}>
                <Statistic title="已联系" value={data?.acquisitionStats?.leads.byStatus?.contacted || 0} />
              </Col>
              <Col span={6}>
                <Statistic title="已回复" value={data?.acquisitionStats?.leads.byStatus?.replied || 0} />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="已转化" 
                  value={data?.acquisitionStats?.leads.byStatus?.converted || 0} 
                  valueStyle={{ color: '#52c41a' }} 
                />
              </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
              <Title level={5} style={{ marginBottom: 12 }}>获客转化</Title>
              <Progress
                percent={data?.acquisitionStats?.metrics?.replyRate || 0}
                success={{ percent: data?.acquisitionStats?.metrics?.replyRate || 0 }}
                strokeColor="#52c41a"
                format={(percent) => `${percent}% 回复率`}
              />
              <div style={{ marginTop: 8 }}>
                <Progress
                  percent={data?.acquisitionStats?.metrics?.avgConversion || 0}
                  strokeColor="#1890ff"
                  format={(percent) => `${percent}% 完成度`}
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities & Quick Links */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="数据总览" style={cardStyle} loading={loading}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic 
                  title="总浏览量" 
                  value={data?.mediaStats?.totals.views || 0} 
                  prefix={<EyeOutlined />} 
                  formatter={(v) => Number(v).toLocaleString()} 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="总点赞" 
                  value={data?.mediaStats?.totals.likes || 0} 
                  prefix={<LikeOutlined />} 
                  formatter={(v) => Number(v).toLocaleString()} 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="分享码扫码" 
                  value={data?.shareStats?.totals.scans || 0} 
                  prefix={<ShareAltOutlined />} 
                  formatter={(v) => Number(v).toLocaleString()} 
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="快捷入口" style={cardStyle}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <a href="/customer/media/matrix" style={{ display: 'block', padding: '12px 16px', background: '#e6f7ff', borderRadius: 8, color: '#1890ff' }}>
                <TeamOutlined /> 矩阵账号管理
              </a>
              <a href="/customer/media/publish" style={{ display: 'block', padding: '12px 16px', background: '#f6ffed', borderRadius: 8, color: '#52c41a' }}>
                <FileTextOutlined /> 发布内容
              </a>
              <a href="/customer/recruitment" style={{ display: 'block', padding: '12px 16px', background: '#fff7e6', borderRadius: 8, color: '#faad14' }}>
                <TeamOutlined /> 招聘管理
              </a>
              <a href="/customer/acquisition" style={{ display: 'block', padding: '12px 16px', background: '#fff1f0', borderRadius: 8, color: '#f5222d' }}>
                <UserOutlined /> 获客管理
              </a>
              <a href="/customer/materials" style={{ display: 'block', padding: '12px 16px', background: '#f9f0ff', borderRadius: 8, color: '#722ed1' }}>
                <FileTextOutlined /> 素材库
              </a>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
