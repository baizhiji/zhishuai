'use client';

import { Card, Row, Col, Table, Tag, Progress, Statistic, Typography, Space, DatePicker, Spin } from 'antd';
import { 
  UserOutlined, VideoCameraOutlined, FileTextOutlined, 
  LikeOutlined, StarOutlined, RiseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 动态导入图表组件，禁用SSR
const LineChartComponent = dynamic(() => import('./components/LineChart'), { 
  ssr: false,
  loading: () => <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
});

const PieChartComponent = dynamic(() => import('./components/PieChart'), { 
  ssr: false,
  loading: () => <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
});

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 模拟统计数据
  const stats = {
    totalUsers: 12580,
    activeUsers: 8934,
    totalVideos: 45678,
    totalArticles: 23456,
    totalLikes: 125678,
    newFans: 3456,
    engagement: 78.5,
  };

  // 平台账号分布
  const platformData = [
    { name: '抖音', value: 4567, color: '#FE2C55' },
    { name: '小红书', value: 3456, color: '#FF2442' },
    { name: '快手', value: 2890, color: '#FF4906' },
    { name: '视频号', value: 1671, color: '#07C160' },
  ];

  // 活跃趋势数据
  const trendData = [
    { day: '周一', users: 1200 },
    { day: '周二', users: 1398 },
    { day: '周三', users: 1350 },
    { day: '周四', users: 1420 },
    { day: '周五', users: 1567 },
    { day: '周六', users: 1280 },
    { day: '周日', users: 1100 },
  ];

  // 最新发布记录
  const publishColumns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '平台', dataIndex: 'platform', key: 'platform', render: (platform: string) => <Tag color="blue">{platform}</Tag> },
    { title: '发布时间', dataIndex: 'time', key: 'time' },
    { title: '播放量', dataIndex: 'views', key: 'views' },
  ];

  const publishData = [
    { key: '1', title: 'AI智能剪辑技巧分享', platform: '抖音', time: '10:30', views: '12.5万' },
    { key: '2', title: '小红书种草文案模板', platform: '小红书', time: '09:45', views: '8.3万' },
    { key: '3', title: '快手直播带货攻略', platform: '快手', time: '昨天', views: '5.6万' },
    { key: '4', title: '视频号爆款标题技巧', platform: '视频号', time: '昨天', views: '3.2万' },
    { key: '5', title: '企业宣传片文案', platform: '抖音', time: '2天前', views: '2.8万' },
  ];

  // 招聘数据
  const recruitStats = {
    positions: 234,
    resumes: 1567,
    interviews: 456,
    hires: 89,
  };

  // 智能获客数据
  const acquisitionStats = {
    potentialCustomers: 3456,
    sentMessages: 12345,
    scannedCodes: 5678,
    conversions: 1234,
  };

  // 推荐分享数据
  const shareStats = {
    totalReferrals: 156,
    activeUsers: 128,
    conversions: 89,
    scanRate: 82,
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>数据大盘</Title>
        <RangePicker 
          value={dateRange} 
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0], dates[1]]);
            }
          }}
        />
      </div>

      {/* 核心指标 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              suffix="人"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title="活跃用户"
              value={stats.activeUsers}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              suffix="人"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title="总发布量"
              value={stats.totalVideos + stats.totalArticles}
              prefix={<VideoCameraOutlined style={{ color: '#722ed1' }} />}
              suffix="条"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title="互动量"
              value={stats.totalLikes}
              prefix={<LikeOutlined style={{ color: '#fa8c16' }} />}
              suffix="次"
            />
          </Card>
        </Col>
      </Row>

      {/* 平台分布与趋势 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="平台账号分布" bordered={false} hoverable>
            {mounted && <PieChartComponent data={platformData} />}
            {!mounted && (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin />
              </div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="用户活跃趋势" bordered={false} hoverable>
            {mounted && <LineChartComponent data={trendData} />}
            {!mounted && (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 招聘数据与最新发布 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card title="招聘数据" bordered={false} hoverable>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>发布职位</Text>
                <Text strong style={{ color: '#1890ff' }}>{recruitStats.positions}</Text>
              </div>
              <Progress percent={Math.round((recruitStats.positions / 300) * 100)} strokeColor="#1890ff" />
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>收到简历</Text>
                <Text strong style={{ color: '#52c41a' }}>{recruitStats.resumes}</Text>
              </div>
              <Progress percent={Math.round((recruitStats.resumes / 2000) * 100)} strokeColor="#52c41a" />
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>安排面试</Text>
                <Text strong style={{ color: '#fa8c16' }}>{recruitStats.interviews}</Text>
              </div>
              <Progress percent={Math.round((recruitStats.interviews / 600) * 100)} strokeColor="#fa8c16" />
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>成功入职</Text>
                <Text strong style={{ color: '#722ed1' }}>{recruitStats.hires}</Text>
              </div>
              <Progress percent={Math.round((recruitStats.hires / 100) * 100)} strokeColor="#722ed1" />
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="智能获客" bordered={false} hoverable>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>发现潜客</Text>
                <Text strong style={{ color: '#13c2c2' }}>{acquisitionStats.potentialCustomers}</Text>
              </div>
              <Progress percent={Math.round((acquisitionStats.potentialCustomers / 5000) * 100)} strokeColor="#13c2c2" />
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>发送消息</Text>
                <Text strong style={{ color: '#1890ff' }}>{acquisitionStats.sentMessages}</Text>
              </div>
              <Progress percent={Math.round((acquisitionStats.sentMessages / 20000) * 100)} strokeColor="#1890ff" />
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>扫码次数</Text>
                <Text strong style={{ color: '#52c41a' }}>{acquisitionStats.scannedCodes}</Text>
              </div>
              <Progress percent={Math.round((acquisitionStats.scannedCodes / 8000) * 100)} strokeColor="#52c41a" />
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>成功转化</Text>
                <Text strong style={{ color: '#fa8c16' }}>{acquisitionStats.conversions}</Text>
              </div>
              <Progress percent={Math.round((acquisitionStats.conversions / 2000) * 100)} strokeColor="#fa8c16" />
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="推荐分享" bordered={false} hoverable>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>总推荐数</Text>
                <Text strong style={{ color: '#722ed1' }}>{shareStats.totalReferrals}</Text>
              </div>
              <Progress percent={Math.round((shareStats.totalReferrals / 200) * 100)} strokeColor="#722ed1" />
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>活跃用户</Text>
                <Text strong style={{ color: '#52c41a' }}>{shareStats.activeUsers}</Text>
              </div>
              <Progress percent={Math.round((shareStats.activeUsers / 200) * 100)} strokeColor="#52c41a" />
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>成功转化</Text>
                <Text strong style={{ color: '#1890ff' }}>{shareStats.conversions}</Text>
              </div>
              <Progress percent={Math.round((shareStats.conversions / 100) * 100)} strokeColor="#1890ff" />
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>扫码率</Text>
                <Text strong style={{ color: '#fa8c16' }}>{shareStats.scanRate}%</Text>
              </div>
              <Progress percent={shareStats.scanRate} strokeColor="#fa8c16" />
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="最新发布" bordered={false} hoverable>
            <Table
              columns={publishColumns}
              dataSource={publishData}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
