'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Typography, Table, Tag, Space } from 'antd';
import {
  UserOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  TeamOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const { Title, Text } = Typography;

// 模拟数据
const trendData = [
  { name: '1月', customers: 45, revenue: 12500, referrals: 23 },
  { name: '2月', customers: 52, revenue: 15800, referrals: 31 },
  { name: '3月', customers: 68, revenue: 18200, referrals: 42 },
  { name: '4月', customers: 85, revenue: 22500, referrals: 56 },
  { name: '5月', customers: 92, revenue: 26800, referrals: 68 },
  { name: '6月', customers: 108, revenue: 31200, referrals: 82 },
];

const platformData = [
  { name: '自媒体运营', value: 45, color: '#1890ff' },
  { name: '招聘助手', value: 30, color: '#722ed1' },
  { name: '智能获客', value: 20, color: '#fa8c16' },
  { name: '推荐分享', value: 5, color: '#52c41a' },
];

const recentActivities = [
  { id: 1, action: '新开通账号', user: '上海xx科技', time: '2小时前', feature: '自媒体运营' },
  { id: 2, action: '续费套餐', user: '杭州yy科技', time: '5小时前', feature: '全功能' },
  { id: 3, action: '新开通账号', user: '北京zz传媒', time: '1天前', feature: '招聘助手' },
  { id: 4, action: '升级套餐', user: '深圳aa网络', time: '1天前', feature: '全功能' },
  { id: 5, action: '新开通账号', user: '广州bb科技', time: '2天前', feature: '智能获客' },
];

const topAgents = [
  { rank: 1, name: '华东区域代理', customers: 256, revenue: 125600, growth: '+12.5%' },
  { rank: 2, name: '华南区域代理', customers: 198, revenue: 98600, growth: '+8.3%' },
  { rank: 3, name: '华北区域代理', customers: 167, revenue: 82400, growth: '+15.2%' },
  { rank: 4, name: '西南区域代理', customers: 89, revenue: 45200, growth: '+5.7%' },
];

export default function AgentAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('month');

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>📊 代理商业绩看板</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="我的客户总数"
              value={108}
              prefix={<UserOutlined />}
              suffix={<Text type="success" style={{ fontSize: 14 }}><ArrowUpOutlined /> 12%</Text>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月新增客户"
              value={23}
              prefix={<TeamOutlined />}
              suffix={<Text type="success" style={{ fontSize: 14 }}><ArrowUpOutlined /> 8%</Text>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="累计收益"
              value={312000}
              prefix={<DollarOutlined />}
              formatter={(value) => `¥${Number(value).toLocaleString()}`}
              suffix={<Text type="success" style={{ fontSize: 14 }}><ArrowUpOutlined /> 15%</Text>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="推荐转化数"
              value={82}
              prefix={<GiftOutlined />}
              suffix={<Text type="success" style={{ fontSize: 14 }}><ArrowUpOutlined /> 22%</Text>}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="📈 业绩趋势">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Area yAxisId="left" type="monotone" dataKey="customers" stroke="#1890ff" fill="#1890ff33" name="客户数" />
                <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#52c41a" fill="#52c41a33" name="收益" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="🎯 功能开通分布">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="🏆 代理商业绩排行">
            <Table
              dataSource={topAgents}
              rowKey="rank"
              pagination={false}
              columns={[
                { title: '排名', dataIndex: 'rank', render: (r) => r <= 3 ? <Tag color={r === 1 ? 'gold' : r === 2 ? 'silver' : 'bronze'}>{r}</Tag> : <Text>{r}</Text> },
                { title: '代理商', dataIndex: 'name' },
                { title: '客户数', dataIndex: 'customers', sorter: (a, b) => a.customers - b.customers },
                { 
                  title: '收益', 
                  dataIndex: 'revenue', 
                  render: (v) => `¥${v.toLocaleString()}`,
                  sorter: (a, b) => a.revenue - b.revenue 
                },
                { 
                  title: '增长率', 
                  dataIndex: 'growth',
                  render: (g) => <Text type="success">{g}</Text>
                },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="📋 最近动态">
            <Table
              dataSource={recentActivities}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { 
                  title: '操作', 
                  dataIndex: 'action',
                  render: (a) => <Tag color="blue">{a}</Tag>
                },
                { title: '用户', dataIndex: 'user' },
                { title: '功能', dataIndex: 'feature', render: (f) => <Tag>{f}</Tag> },
                { title: '时间', dataIndex: 'time', render: (t) => <Text type="secondary">{t}</Text> },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="💡 代理目标完成度" style={{ marginTop: 24 }}>
        <Row gutter={24}>
          <Col span={8}>
            <Text>季度客户目标</Text>
            <Progress percent={72} status="active" />
            <Text type="secondary">已招募 72/100 客户</Text>
          </Col>
          <Col span={8}>
            <Text>季度收益目标</Text>
            <Progress percent={85} status="active" strokeColor="#52c41a" />
            <Text type="secondary">已完成 ¥156,000/¥200,000</Text>
          </Col>
          <Col span={8}>
            <Text>推荐转化目标</Text>
            <Progress percent={65} status="active" strokeColor="#fa8c16" />
            <Text type="secondary">已转化 65/100 人</Text>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
