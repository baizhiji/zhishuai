'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  DatePicker,
  Progress,
  Tag,
  Space,
  Typography,
  Empty,
} from 'antd';
import {
  UserAddOutlined,
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  EyeOutlined,
  MessageOutlined,
  TrophyOutlined,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface RecruitmentStats {
  totalPosts: number;
  totalCandidates: number;
  totalViews: number;
  totalApplications: number;
  interviewsScheduled: number;
  interviewsCompleted: number;
  hiredCount: number;
  conversionRate: number;
}

interface TrendData {
  date: string;
  views: number;
  applications: number;
  interviews: number;
}

interface PositionData {
  position: string;
  posts: number;
  candidates: number;
  hired: number;
  rate: number;
}

export default function RecruitmentDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<RecruitmentStats>({
    totalPosts: 0,
    totalCandidates: 0,
    totalViews: 0,
    totalApplications: 0,
    interviewsScheduled: 0,
    interviewsCompleted: 0,
    hiredCount: 0,
    conversionRate: 0,
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [positionData, setPositionData] = useState<PositionData[]>([]);
  const [sourceData, setSourceData] = useState<{ name: string; value: number }[]>([]);
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
      const res = await request.get('/api/recruitment/dashboard', {
        params: { userId },
      });

      if (res) {
        setStats({
          totalPosts: res.stats?.totalPosts || 0,
          totalCandidates: res.stats?.totalCandidates || 0,
          totalViews: res.stats?.totalViews || 0,
          totalApplications: res.stats?.totalApplications || 0,
          interviewsScheduled: res.stats?.interviewsScheduled || 0,
          interviewsCompleted: res.stats?.interviewsCompleted || 0,
          hiredCount: res.stats?.hiredCount || 0,
          conversionRate: res.stats?.conversionRate || 0,
        });
        setTrendData(res.trendData || generateMockTrendData());
        setPositionData(res.positionData || generateMockPositionData());
        setSourceData(
          res.sourceData || [
            { name: 'BOSS直聘', value: 35 },
            { name: '前程无忧', value: 25 },
            { name: '智联招聘', value: 20 },
            { name: '猎聘网', value: 12 },
            { name: '其他', value: 8 },
          ]
        );
      }
    } catch (error) {
      // 使用模拟数据
      setStats({
        totalPosts: 12,
        totalCandidates: 156,
        totalViews: 8956,
        totalApplications: 89,
        interviewsScheduled: 15,
        interviewsCompleted: 23,
        hiredCount: 8,
        conversionRate: 5.1,
      });
      setTrendData(generateMockTrendData());
      setPositionData(generateMockPositionData());
      setSourceData([
        { name: 'BOSS直聘', value: 35 },
        { name: '前程无忧', value: 25 },
        { name: '智联招聘', value: 20 },
        { name: '猎聘网', value: 12 },
        { name: '其他', value: 8 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockTrendData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      data.push({
        date: dayjs().subtract(i, 'day').format('MM-DD'),
        views: Math.floor(Math.random() * 500) + 200,
        applications: Math.floor(Math.random() * 30) + 5,
        interviews: Math.floor(Math.random() * 10) + 1,
      });
    }
    return data;
  };

  const generateMockPositionData = () => {
    return [
      { position: '前端开发工程师', posts: 3, candidates: 45, hired: 2, rate: 78 },
      { position: '后端开发工程师', posts: 2, candidates: 38, hired: 1, rate: 65 },
      { position: '产品经理', posts: 2, candidates: 28, hired: 2, rate: 82 },
      { position: 'UI设计师', posts: 2, candidates: 22, hired: 1, rate: 70 },
      { position: '运营专员', posts: 3, candidates: 35, hired: 2, rate: 75 },
    ];
  };

  const positionColumns = [
    { title: '岗位', dataIndex: 'position', key: 'position' },
    { title: '发布数', dataIndex: 'posts', key: 'posts' },
    { title: '候选人', dataIndex: 'candidates', key: 'candidates' },
    { title: '入职', dataIndex: 'hired', key: 'hired' },
    {
      title: '匹配率',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => <Progress percent={rate} size="small" />,
    },
  ];

  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">招聘数据看板</h1>
        <p className="text-gray-500">实时追踪招聘效果与流程进度</p>
      </div>

      {/* 核心指标 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总曝光量"
              value={stats.totalViews}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="简历投递"
              value={stats.totalApplications}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="面试安排"
              value={stats.interviewsScheduled}
              prefix={<TeamOutlined />}
              suffix={`/ ${stats.interviewsCompleted} 已完成`}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="成功入职"
              value={stats.hiredCount}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 趋势图 */}
      <Row gutter={16} className="mb-6">
        <Col span={16}>
          <Card title="数据趋势（近7天）">
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
                  dataKey="views"
                  stroke="#1890ff"
                  name="浏览量"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="applications"
                  stroke="#52c41a"
                  name="投递数"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="interviews"
                  stroke="#faad14"
                  name="面试数"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="简历来源分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 岗位数据 */}
      <Row gutter={16}>
        <Col span={24}>
          <Card title="各岗位招聘情况">
            <Table
              columns={positionColumns}
              dataSource={positionData}
              rowKey="position"
              loading={loading}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {/* 漏斗图 */}
      <Row gutter={16} className="mt-6">
        <Col span={24}>
          <Card title="招聘漏斗">
            <div className="flex justify-between items-center px-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">{stats.totalViews}</div>
                <div className="text-gray-500">浏览</div>
              </div>
              <div className="text-gray-300">→</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">{stats.totalApplications}</div>
                <div className="text-gray-500">投递</div>
              </div>
              <div className="text-gray-300">→</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">
                  {stats.interviewsScheduled + stats.interviewsCompleted}
                </div>
                <div className="text-gray-500">面试</div>
              </div>
              <div className="text-gray-300">→</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500">{stats.hiredCount}</div>
                <div className="text-gray-500">入职</div>
              </div>
            </div>
            <div className="mt-4">
              <Text>整体转化率: </Text>
              <Text strong type="success">
                {stats.conversionRate}%
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
