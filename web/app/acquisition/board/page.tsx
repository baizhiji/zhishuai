'use client'

import { useState } from 'react'
import { Card, Row, Col, Table, Tag, Select, DatePicker, Space, Typography, Progress, Button } from 'antd'
import {
  UserAddOutlined,
  MessageOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const { Title, Text } = Typography

export default function AcquisitionBoardPage() {
  const [timeRange, setTimeRange] = useState<string>('7d')
  const [platform, setPlatform] = useState<string>('all')

  // 核心指标
  const stats = {
    discover: 1256,
    discoverChange: 15.8,
    sent: 45892,
    sentChange: 12.3,
    scanned: 8934,
    scannedChange: 8.5,
    converted: 1523,
    convertedChange: 18.2,
  }

  // 趋势数据
  const trendData = [
    { date: '周一', 发送: 6543, 扫码: 1234, 转化: 218 },
    { date: '周二', 发送: 7234, 扫码: 1456, 转化: 256 },
    { date: '周三', 发送: 6890, 扫码: 1321, 转化: 234 },
    { date: '周四', 发送: 7567, 扫码: 1567, 转化: 278 },
    { date: '周五', 发送: 8123, 扫码: 1678, 转化: 298 },
    { date: '周六', 发送: 4234, 扫码: 876, 转化: 156 },
    { date: '周日', 发送: 3890, 扫码: 756, 转化: 134 },
  ]

  // 漏斗数据
  const funnelData = [
    { stage: '发送消息', count: 45892, rate: 100 },
    { stage: '查看消息', count: 28934, rate: 63 },
    { stage: '扫码次数', count: 8934, rate: 19 },
    { stage: '成功转化', count: 1523, rate: 3.3 },
  ]

  // 渠道分布
  const channelData = [
    { channel: '抖音', count: 1856, rate: 12.2 },
    { channel: '微信', count: 4567, rate: 30.0 },
    { channel: '短信', count: 8934, rate: 58.7 },
    { channel: '其他', count: 1234, rate: 8.1 },
  ]

  // 发送记录
  const recordColumns = [
    { title: '任务名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '渠道', dataIndex: 'channel', key: 'channel', width: 100, render: (channel: string) => <Tag color="blue">{channel}</Tag> },
    { title: '发送量', dataIndex: 'sent', key: 'sent', width: 100 },
    { title: '扫码数', dataIndex: 'scanned', key: 'scanned', width: 100 },
    { title: '转化数', dataIndex: 'converted', key: 'converted', width: 100 },
    { 
      title: '扫码率', 
      dataIndex: 'scanRate', 
      key: 'scanRate', 
      width: 100,
      render: (rate: number) => <Text type="success">{rate}%</Text>
    },
    { 
      title: '转化率', 
      dataIndex: 'convertRate', 
      key: 'convertRate', 
      width: 100,
      render: (rate: number) => <Text type="warning">{rate}%</Text>
    },
    { title: '时间', dataIndex: 'time', key: 'time', width: 150 },
  ]

  const recordData = [
    { key: '1', name: '新品推广活动', channel: '抖音', sent: 1234, scanned: 456, converted: 78, scanRate: 37.0, convertRate: 6.3, time: '2024-03-25 10:30' },
    { key: '2', name: '限时优惠引流', channel: '微信', sent: 2345, scanned: 876, converted: 156, scanRate: 37.4, convertRate: 6.7, time: '2024-03-25 09:15' },
    { key: '3', name: '会员招募短信', channel: '短信', sent: 5678, scanned: 1234, converted: 234, scanRate: 21.7, convertRate: 4.1, time: '2024-03-24 14:20' },
    { key: '4', name: '新品预约通知', channel: '抖音', sent: 987, scanned: 345, converted: 56, scanRate: 35.0, convertRate: 5.7, time: '2024-03-24 11:45' },
    { key: '5', name: '活动邀请函', channel: '微信', sent: 1567, scanned: 567, converted: 89, scanRate: 36.2, convertRate: 5.7, time: '2024-03-23 16:30' },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>获客看板</Title>
          <Text type="secondary">智能获客数据统计与分析</Text>
        </div>
        <Space>
          <Select
            value={platform}
            onChange={setPlatform}
            style={{ width: 120 }}
            options={[
              { value: 'all', label: '全部渠道' },
              { value: 'douyin', label: '抖音' },
              { value: 'wechat', label: '微信' },
              { value: 'sms', label: '短信' },
            ]}
          />
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
                <Text type="secondary" style={{ fontSize: 12 }}>发现潜客</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>{stats.discover.toLocaleString()}</div>
                <Text type={stats.discoverChange > 0 ? 'success' : 'danger'} style={{ fontSize: 12 }}>
                  {stats.discoverChange > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(stats.discoverChange)}%
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>发送消息</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{stats.sent.toLocaleString()}</div>
                <Text type={stats.sentChange > 0 ? 'success' : 'danger'} style={{ fontSize: 12 }}>
                  {stats.sentChange > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(stats.sentChange)}%
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#fff7e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrcodeOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>扫码次数</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>{stats.scanned.toLocaleString()}</div>
                <Text type={stats.scannedChange > 0 ? 'success' : 'danger'} style={{ fontSize: 12 }}>
                  {stats.scannedChange > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(stats.scannedChange)}%
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f9f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>成功转化</Text>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#722ed1' }}>{stats.converted.toLocaleString()}</div>
                <Text type={stats.convertedChange > 0 ? 'success' : 'danger'} style={{ fontSize: 12 }}>
                  {stats.convertedChange > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(stats.convertedChange)}%
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card bordered={false} title="转化趋势">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="发送" stroke="#1890ff" strokeWidth={2} />
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

      {/* 转化漏斗 */}
      <Card bordered={false} title="转化漏斗" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          {funnelData.map((item, index) => (
            <Col span={6} key={index}>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 28, fontWeight: 600, color: '#1890ff' }}>{item.count.toLocaleString()}</div>
                <div style={{ color: '#666', marginBottom: 8 }}>{item.stage}</div>
                <Progress percent={item.rate} strokeColor="#1890ff" showInfo={false} />
                <Text type="secondary">{item.rate}%</Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 发送记录 */}
      <Card bordered={false} title="发送记录">
        <Table
          dataSource={recordData}
          columns={recordColumns}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  )
}
