'use client'

import { useState } from 'react'
import { Card, Row, Col, Table, Tag, Select, DatePicker, Space, Typography, Progress, Button, Modal, message } from 'antd'
import {
  UserAddOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ScanOutlined,
  CopyOutlined,
  DownloadOutlined,
  QrcodeOutlined,
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const { Title, Text } = Typography

export default function ShareBoardPage() {
  const [timeRange, setTimeRange] = useState<string>('7d')
  const [showQRModal, setShowQRModal] = useState(false)

  // 核心指标
  const stats = {
    totalReferrals: 156,
    activeUsers: 128,
    conversions: 128,
    scanRate: 82,
  }

  // 趋势数据
  const trendData = [
    { date: '周一', 推荐: 23, 扫码: 18, 转化: 15 },
    { date: '周二', 推荐: 25, 扫码: 20, 转化: 17 },
    { date: '周三', 推荐: 21, 扫码: 17, 转化: 14 },
    { date: '周四', 推荐: 28, 扫码: 23, 转化: 19 },
    { date: '周五', 推荐: 32, 扫码: 26, 转化: 22 },
    { date: '周六', 推荐: 15, 扫码: 12, 转化: 10 },
    { date: '周日', 推荐: 12, 扫码: 10, 转化: 8 },
  ]

  // 渠道分布
  const channelData = [
    { channel: '抖音', count: 45, rate: 28.8 },
    { channel: '微信', count: 67, rate: 42.9 },
    { channel: '小红书', count: 28, rate: 17.9 },
    { channel: '其他', count: 16, rate: 10.3 },
  ]

  // 推荐记录
  const recordColumns = [
    { title: '推荐人', dataIndex: 'referrer', key: 'referrer', width: 120 },
    { title: '被推荐人', dataIndex: 'referred', key: 'referred', width: 120 },
    { title: '推荐码', dataIndex: 'code', key: 'code', width: 150 },
    { title: '注册时间', dataIndex: 'time', key: 'time', width: 150 },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: (status: string) => (
        <Tag color={status === '成功' ? 'success' : status === '待激活' ? 'warning' : 'default'}>
          {status}
        </Tag>
      )
    },
    { title: '操作', key: 'action', width: 150, render: () => <a>查看详情</a> },
  ]

  const recordData = [
    { key: '1', referrer: '张三', referred: '李四', code: 'ZHISHUAI2024001', time: '2024-03-25 14:30', status: '成功' },
    { key: '2', referrer: '张三', referred: '王五', code: 'ZHISHUAI2024002', time: '2024-03-24 11:20', status: '成功' },
    { key: '3', referrer: '李四', referred: '赵六', code: 'ZHISHUAI2024003', time: '2024-03-23 09:15', status: '待激活' },
    { key: '4', referrer: '王五', referred: '钱七', code: 'ZHISHUAI2024004', time: '2024-03-22 16:45', status: '成功' },
    { key: '5', referrer: '李四', referred: '孙八', code: 'ZHISHUAI2024005', time: '2024-03-21 10:00', status: '已失效' },
  ]

  const handleCopyCode = () => {
    navigator.clipboard.writeText('ZHISHUAI2024')
    message.success('推荐码已复制')
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>推荐看板</Title>
          <Text type="secondary">推荐分享数据统计与分析</Text>
        </div>
        <Space>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120 }}
            options={[
              { value: '7d', label: '近7天' },
              { value: '30d', label: '近30天' },
              { value: '90d', label: '近3个月' },
            ]}
          />
          <DatePicker.RangePicker />
        </Space>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserAddOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>总推荐数</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>{stats.totalReferrals}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TeamOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>活跃用户</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{stats.activeUsers}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#fff7e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>成功转化</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>{stats.conversions}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f9f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ScanOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>扫码率</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#722ed1' }}>{stats.scanRate}%</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card bordered={false} title="推荐趋势">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="推荐" stroke="#1890ff" strokeWidth={2} />
                <Line type="monotone" dataKey="扫码" stroke="#fa8c16" strokeWidth={2} />
                <Line type="monotone" dataKey="转化" stroke="#722ed1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card bordered={false} title="渠道分布">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#722ed1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 推荐记录 */}
      <Card bordered={false} title="推荐记录">
        <Table
          dataSource={recordData}
          columns={recordColumns}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  )
}
