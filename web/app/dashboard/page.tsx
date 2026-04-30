'use client';

import { Card, Row, Col, Table, Tag, Progress, Statistic, Typography, Space, DatePicker } from 'antd';
import { 
  UserOutlined, VideoCameraOutlined, FileTextOutlined, 
  LikeOutlined, StarOutlined, DownloadOutlined, RiseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);

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
    { platform: '抖音', count: 4567, color: '#FE2C55' },
    { platform: '小红书', count: 3456, color: '#FF2442' },
    { platform: '快手', count: 2890, color: '#FF4906' },
    { platform: '视频号', count: 1671, color: '#07C160' },
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

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>数据大盘</Title>
        <RangePicker 
          value={dateRange} 
          onChange={(dates) => dates && setDateRange([dates[0], dates[1]])}
        />
      </div>

      {/* 核心指标 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              suffix="人"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
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
          <Card bordered={false}>
            <Statistic
              title="总发布量"
              value={stats.totalVideos + stats.totalArticles}
              prefix={<VideoCameraOutlined style={{ color: '#722ed1' }} />}
              suffix="条"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
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
          <Card title="平台账号分布" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {platformData.map((item) => (
                <div key={item.platform}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>{item.platform}</Text>
                    <Text strong>{item.count} 个</Text>
                  </div>
                  <Progress 
                    percent={Math.round((item.count / Math.max(...platformData.map(d => d.count))) * 100)} 
                    strokeColor={item.color}
                    showInfo={false}
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="用户活跃趋势" bordered={false}>
            <Statistic
              title="近7日活跃用户"
              value={1567}
              prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
              suffix="人"
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">较上周</Text>
              <Text style={{ color: '#52c41a', marginLeft: 8 }}>+12.5%</Text>
            </div>
            <Progress 
              percent={78} 
              strokeColor="#52c41a"
              style={{ marginTop: 16 }}
            />
            <Text type="secondary">活跃率 78%</Text>
          </Card>
        </Col>
      </Row>

      {/* 招聘数据与发布记录 */}
      <Row gutter={16}>
        <Col span={8}>
          <Card title="招聘数据" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text type="secondary">在招职位</Text>
                <div><Text strong style={{ fontSize: 24 }}>{recruitStats.positions}</Text></div>
              </div>
              <div>
                <Text type="secondary">收到简历</Text>
                <div><Text strong style={{ fontSize: 24 }}>{recruitStats.resumes}</Text></div>
              </div>
              <div>
                <Text type="secondary">面试安排</Text>
                <div><Text strong style={{ fontSize: 24 }}>{recruitStats.interviews}</Text></div>
              </div>
              <div>
                <Text type="secondary">成功入职</Text>
                <div><Text strong style={{ fontSize: 24, color: '#52c41a' }}>{recruitStats.hires}</Text></div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={16}>
          <Card title="最新发布" bordered={false}>
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
