'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Progress, DatePicker, Select, Spin } from 'antd';
<<<<<<< HEAD
import { UserOutlined, ShoppingOutlined, DollarOutlined, RiseOutlined, TeamOutlined, FileTextOutlined, MessageOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/charts';
import type { ColumnsType } from 'antd/es/table';
import { getOverview, getTrend, getPlatformStats, getAgentStats, type OverviewStats, type TrendData, type PlatformStats } from '@/services/statistics';
=======
import {
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  RiseOutlined,
  TeamOutlined,
  FileTextOutlined,
  MessageOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/charts';
import type { ColumnsType } from 'antd/es/table';
import {
  getOverview,
  getTrend,
  getPlatformStats,
  getAgentStats,
  type OverviewStats,
  type TrendData,
  type PlatformStats,
} from '@/services/statistics';
>>>>>>> 962968886be726cd434c792933b5515366d34518

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [platformData, setPlatformData] = useState<PlatformStats[]>([]);
  const [agentStats, setAgentStats] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, trendRes, platformRes, agentRes] = await Promise.all([
        getOverview().catch(() => null),
        getTrend(7).catch(() => []),
        getPlatformStats().catch(() => []),
        getAgentStats().catch(() => []),
      ]);
<<<<<<< HEAD
      
=======

>>>>>>> 962968886be726cd434c792933b5515366d34518
      if (overviewRes) setOverview(overviewRes);
      if (trendRes) setTrendData(trendRes);
      if (platformRes) setPlatformData(platformRes);
      if (agentRes) setAgentStats(agentRes);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 趋势图配置
  const trendConfig = {
    data: trendData,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    color: ['#1890ff', '#52c41a', '#faad14'],
    height: 300,
  };

  // 平台分布饼图配置
  const pieConfig = {
    data: platformData,
    angleField: 'count',
    colorField: 'name',
    radius: 0.8,
    label: { type: 'inner', offset: '-30%', content: '{percentage}' },
    legend: { position: 'right' as const },
    height: 280,
  };

  const columns: ColumnsType<any> = [
    { title: '代理商', dataIndex: 'agentName', key: 'agentName' },
<<<<<<< HEAD
    { title: '客户数', dataIndex: 'customerCount', key: 'customerCount', sorter: (a, b) => a.customerCount - b.customerCount },
    { title: '本月收入', dataIndex: 'monthlyRevenue', key: 'monthlyRevenue', render: (v: number) => `¥${v?.toLocaleString() || 0}` },
    { title: '活跃度', dataIndex: 'activityRate', key: 'activityRate', render: (v: number) => <Progress percent={v} size="small" /> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <span style={{ color: s === 'active' ? '#52c41a' : '#999' }}>{s === 'active' ? '正常' : '冻结'}</span> },
=======
    {
      title: '客户数',
      dataIndex: 'customerCount',
      key: 'customerCount',
      sorter: (a, b) => a.customerCount - b.customerCount,
    },
    {
      title: '本月收入',
      dataIndex: 'monthlyRevenue',
      key: 'monthlyRevenue',
      render: (v: number) => `¥${v?.toLocaleString() || 0}`,
    },
    {
      title: '活跃度',
      dataIndex: 'activityRate',
      key: 'activityRate',
      render: (v: number) => <Progress percent={v} size="small" />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <span style={{ color: s === 'active' ? '#52c41a' : '#999' }}>
          {s === 'active' ? '正常' : '冻结'}
        </span>
      ),
    },
>>>>>>> 962968886be726cd434c792933b5515366d34518
  ];

  return (
    <div style={{ padding: 24 }}>
<<<<<<< HEAD
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
=======
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
>>>>>>> 962968886be726cd434c792933b5515366d34518
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>数据大盘</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <RangePicker />
          <Select defaultValue="7d" style={{ width: 120 }}>
            <Option value="7d">近7天</Option>
            <Option value="30d">近30天</Option>
            <Option value="90d">近90天</Option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* 核心指标卡片 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card bordered={false}>
                <Statistic
                  title="总用户数"
                  value={overview?.totalUsers || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false}>
                <Statistic
                  title="代理商数"
                  value={overview?.totalAgents || 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false}>
                <Statistic
                  title="终端客户"
                  value={overview?.totalCustomers || 0}
                  prefix={<CustomerServiceOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false}>
                <Statistic
                  title="总收入"
                  value={overview?.totalRevenue || 0}
                  prefix={<DollarOutlined />}
                  suffix="元"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 运营数据 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card bordered={false}>
                <Statistic
                  title="今日活跃"
                  value={overview?.todayActiveUsers || 0}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false}>
                <Statistic
                  title="素材总数"
                  value={overview?.totalMaterials || 0}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false}>
                <Statistic
                  title="发布内容"
                  value={overview?.totalPosts || 0}
                  prefix={<MessageOutlined />}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false}>
                <Statistic
                  title="获客线索"
                  value={overview?.totalLeads || 0}
                  prefix={<ShoppingOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 图表区域 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={16}>
              <Card title="用户增长趋势" bordered={false}>
                {trendData.length > 0 ? (
                  <Line {...trendConfig} />
                ) : (
<<<<<<< HEAD
                  <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
=======
                  <div
                    style={{
                      height: 300,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                    }}
                  >
>>>>>>> 962968886be726cd434c792933b5515366d34518
                    暂无数据
                  </div>
                )}
              </Card>
            </Col>
            <Col span={8}>
              <Card title="平台分布" bordered={false}>
                {platformData.length > 0 ? (
                  <Pie {...pieConfig} />
                ) : (
<<<<<<< HEAD
                  <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
=======
                  <div
                    style={{
                      height: 280,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                    }}
                  >
>>>>>>> 962968886be726cd434c792933b5515366d34518
                    暂无数据
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* 代理商业绩排行榜 */}
          <Card title="代理商业绩排行" bordered={false}>
            <Table
              columns={columns}
              dataSource={agentStats}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </>
      )}
    </div>
  );
}
