'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Typography, Table, Tag, Space, Alert } from 'antd';
import {
  UserOutlined,
  BankOutlined,
  RiseOutlined,
  ArrowUpOutOutlined,
  DollarOutlined,
  TeamOutlined,
  ApartmentOutlined,
  SafetyOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  AreaChart,
  Area,
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
  Legend,
} from 'recharts';

const { Title, Text } = Typography;

// 模拟数据
const trendData = [
  { name: '1月', agents: 12, customers: 456, revenue: 125000 },
  { name: '2月', agents: 15, customers: 532, revenue: 158000 },
  { name: '3月', agents: 18, customers: 678, revenue: 182000 },
  { name: '4月', agents: 22, customers: 856, revenue: 225000 },
  { name: '5月', agents: 28, customers: 1023, revenue: 268000 },
  { name: '6月', agents: 35, customers: 1289, revenue: 312000 },
];

const customerDistribution = [
  { name: '自媒体运营', value: 45, color: '#1890ff' },
  { name: '招聘助手', value: 30, color: '#722ed1' },
  { name: '智能获客', value: 20, color: '#fa8c16' },
  { name: '其他', value: 5, color: '#52c41a' },
];

const revenueByRegion = [
  { region: '华东', revenue: 125600, customers: 456 },
  { region: '华南', revenue: 98600, customers: 389 },
  { region: '华北', revenue: 82400, customers: 312 },
  { region: '西南', revenue: 45200, customers: 178 },
  { region: '西北', revenue: 32100, customers: 134 },
];

const topPerformers = [
  { rank: 1, name: '华东大区', agents: 15, customers: 456, revenue: 125600, growth: '+18.5%' },
  { rank: 2, name: '华南大区', agents: 12, customers: 389, revenue: 98600, growth: '+12.3%' },
  { rank: 3, name: '华北大区', agents: 8, customers: 312, revenue: 82400, growth: '+15.8%' },
  { rank: 4, name: '西南大区', agents: 5, customers: 178, revenue: 45200, growth: '+8.2%' },
];

const recentAlerts = [
  { id: 1, type: 'warning', message: '华东区域3个客户即将到期', time: '1小时前' },
  { id: 2, type: 'info', message: '新增区域代理商1个（西南区域）', time: '3小时前' },
  { id: 3, type: 'success', message: '系统升级完成 v2.1.5', time: '1天前' },
];

const featureUsage = [
  { name: '自媒体运营', usage: 85, users: 856 },
  { name: '招聘助手', usage: 62, users: 523 },
  { name: '智能获客', usage: 45, users: 389 },
  { name: '推荐分享', usage: 28, users: 234 },
  { name: 'AI创作', usage: 78, users: 678 },
];

export default function AdminAnalyticsPage() {
  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>📊 全平台数据大盘</Title>
      <Text type="secondary">开发者总后台 - 全局数据监控</Text>
      
      <Alert
        message="欢迎回来，管理员"
        description="这是全平台的数据概览，您可以查看所有代理商和终端客户的运营数据。"
        type="info"
        showIcon
        style={{ marginTop: 16, marginBottom: 24 }}
      />
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="代理商总数"
              value={35}
              prefix={<ApartmentOutlined />}
              suffix={<Text type="success"><ArrowUpOutOutlined /> 3</Text>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="终端客户总数"
              value={1289}
              prefix={<TeamOutlined />}
              suffix={<Text type="success"><ArrowUpOutOutlined /> 23</Text>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平台总收益"
              value={3120000}
              prefix={<DollarOutlined />}
              formatter={(value) => `¥${Number(value).toLocaleString()}`}
              suffix={<Text type="success"><ArrowUpOutOutlined /> 18%</Text>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃用户数"
              value={956}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={<Text type="success"><ArrowUpOutOutlined /> 12%</Text>}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="📈 全平台增长趋势">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="agents" stroke="#722ed1" fill="#722ed133" name="代理商" />
                <Area yAxisId="left" type="monotone" dataKey="customers" stroke="#1890ff" fill="#1890ff33" name="客户数" />
                <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#52c41a" fill="#52c41a33" name="收益(万)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="🎯 功能开通分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {customerDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="🏆 区域业绩排行">
            <Table
              dataSource={topPerformers}
              rowKey="rank"
              pagination={false}
              columns={[
                { title: '排名', dataIndex: 'rank', render: (r) => r <= 3 ? <Tag color={r === 1 ? 'gold' : r === 2 ? 'silver' : 'bronze'}>{r}</Tag> : <Text>{r}</Text> },
                { title: '大区', dataIndex: 'name' },
                { title: '代理商', dataIndex: 'agents' },
                { title: '客户数', dataIndex: 'customers', sorter: (a, b) => a.customers - b.customers },
                { 
                  title: '收益', 
                  dataIndex: 'revenue', 
                  render: (v) => `¥${v.toLocaleString()}`,
                  sorter: (a, b) => a.revenue - b.revenue 
                },
                { title: '增长率', dataIndex: 'growth', render: (g) => <Text type="success">{g}</Text> },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="📊 区域收益对比">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByRegion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#1890ff" name="收益" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="📱 功能使用率">
            <Table
              dataSource={featureUsage}
              rowKey="name"
              pagination={false}
              size="small"
              columns={[
                { title: '功能', dataIndex: 'name' },
                { 
                  title: '使用率', 
                  dataIndex: 'usage',
                  render: (u) => <Progress percent={u} size="small" />,
                  sorter: (a, b) => a.usage - b.usage
                },
                { title: '使用用户', dataIndex: 'users' },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="🔔 系统通知">
            <Table
              dataSource={recentAlerts}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { 
                  title: '类型', 
                  dataIndex: 'type',
                  render: (t) => <Tag color={t === 'warning' ? 'orange' : t === 'success' ? 'green' : 'blue'}>{t === 'warning' ? '警告' : t === 'success' ? '成功' : '信息'}</Tag>
                },
                { title: '消息', dataIndex: 'message' },
                { title: '时间', dataIndex: 'time', render: (t) => <Text type="secondary">{t}</Text> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
