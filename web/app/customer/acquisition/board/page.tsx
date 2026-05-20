'use client'

import { useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Select, DatePicker, Progress, Typography } from 'antd'
import { 
  UserAddOutlined, 
  SendOutlined, 
  MessageOutlined,
  ScanOutlined,
  RiseOutlined,
  TeamOutlined,
  GlobalOutlined,
  WhatsAppOutlined
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const { Title, Text } = Typography

export default function AcquisitionBoardPage() {
  const [timeRange, setTimeRange] = useState<string>('7d')

  // 统计数据
  const stats = {
    totalCustomers: 15680,
    newCustomers: 1234,
    sentMessages: 45678,
    replies: 8923,
    scans: 4567,
    conversions: 1234,
    replyRate: 19.5,
    scanRate: 51.2,
    conversionRate: 27.6,
  }

  // 趋势数据
  const trendData = [
    { date: '周一', 潜客: 456, 发送: 6234, 回复: 1234, 扫码: 623 },
    { date: '周二', 潜客: 523, 发送: 7123, 回复: 1456, 扫码: 734 },
    { date: '周三', 潜客: 489, 发送: 6890, 回复: 1345, 扫码: 689 },
    { date: '周四', 潜客: 567, 发送: 7890, 回复: 1567, 扫码: 789 },
    { date: '周五', 潜客: 612, 发送: 8234, 回复: 1678, 扫码: 834 },
    { date: '周六', 潜客: 345, 发送: 4567, 回复: 890, 扫码: 445 },
    { date: '周日', 潜客: 298, 发送: 3890, 回复: 756, 扫码: 389 },
  ]

  // 平台分布
  const platformData = [
    { name: '抖音', value: 35, color: '#ff4d4f' },
    { name: '快手', value: 25, color: '#722ed1' },
    { name: '小红书', value: 20, color: '#eb2f96' },
    { name: 'B站', value: 12, color: '#fa8c16' },
    { name: '其他', value: 8, color: '#8c8c8c' },
  ]

  // 获客渠道
  const channelData = [
    { channel: '评论区采集', count: 4567, rate: 29.1 },
    { channel: '直播间采集', count: 3890, rate: 24.8 },
    { channel: '关键词搜索', count: 3124, rate: 19.9 },
    { channel: '话题采集', count: 2345, rate: 15.0 },
    { channel: '碰一碰采集', count: 1567, rate: 10.0 },
  ]

  // 潜客详情数据
  const customerData = [
    { id: 1, name: '张明', platform: '抖音', industry: '教育培训', intention: 95, status: 'converted', followUp: '已扫码' },
    { id: 2, name: '李华', platform: '快手', industry: '电商运营', intention: 88, status: 'following', followUp: '待联系' },
    { id: 3, name: '王芳', platform: '小红书', industry: '美妆护肤', intention: 82, status: 'following', followUp: '已回复' },
    { id: 4, name: '刘强', platform: 'B站', industry: '科技数码', intention: 76, status: 'pending', followUp: '待发送' },
    { id: 5, name: '陈静', platform: '抖音', industry: '餐饮美食', intention: 92, status: 'converted', followUp: '已转化' },
  ]

  const columns = [
    { title: '潜客', dataIndex: 'name', key: 'name', width: 100 },
    { 
      title: '平台', 
      dataIndex: 'platform', 
      key: 'platform',
      width: 100,
      render: (platform: string) => {
        const color = platform === '抖音' ? '#ff4d4f' : platform === '快手' ? '#722ed1' : platform === '小红书' ? '#eb2f96' : '#fa8c16'
        return <Tag color={color}>{platform}</Tag>
      }
    },
    { title: '行业', dataIndex: 'industry', key: 'industry', width: 120 },
    { 
      title: '意向度', 
      dataIndex: 'intention', 
      key: 'intention',
      width: 120,
      render: (intention: number) => (
        <Progress 
          percent={intention} 
          size="small" 
          strokeColor={intention >= 90 ? '#52c41a' : intention >= 80 ? '#1890ff' : '#faad14'}
        />
      )
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config: Record<string, { color: string; text: string }> = {
          converted: { color: 'success', text: '已转化' },
          following: { color: 'processing', text: '跟进中' },
          pending: { color: 'warning', text: '待处理' },
        }
        return <Tag color={config[status]?.color || 'default'}>{config[status]?.text || status}</Tag>
      }
    },
    { title: '跟进情况', dataIndex: 'followUp', key: 'followUp', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: () => (
        <Space>
          <Button type="link" size="small">详情</Button>
          <Button type="link" size="small">跟进</Button>
        </Space>
      )
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>获客看板</Title>
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
            <Statistic
              title="潜客总数"
              value={stats.totalCustomers}
              suffix={
                <span style={{ fontSize: 14, color: '#52c41a' }}>
                  +{stats.newCustomers} 新
                </span>
              }
              prefix={<UserAddOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="发送消息"
              value={stats.sentMessages}
              prefix={<SendOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="收到回复"
              value={stats.replies}
              suffix={
                <span style={{ fontSize: 14, color: '#722ed1' }}>
                  回复率 {stats.replyRate}%
                </span>
              }
              prefix={<MessageOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="扫码转化"
              value={stats.conversions}
              suffix={
                <span style={{ fontSize: 14, color: '#fa8c16' }}>
                  转化率 {stats.conversionRate}%
                </span>
              }
              prefix={<ScanOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card 
            title={<><RiseOutlined /> 获客趋势</>}
            bordered={false}
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="潜客" stroke="#52c41a" strokeWidth={2} dot={{ fill: '#52c41a' }} />
                <Line type="monotone" dataKey="发送" stroke="#1890ff" strokeWidth={2} dot={{ fill: '#1890ff' }} />
                <Line type="monotone" dataKey="回复" stroke="#722ed1" strokeWidth={2} dot={{ fill: '#722ed1' }} />
                <Line type="monotone" dataKey="扫码" stroke="#fa8c16" strokeWidth={2} dot={{ fill: '#fa8c16' }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            title={<><GlobalOutlined /> 平台分布</>}
            bordered={false}
          >
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

      {/* 转化漏斗和潜客详情 */}
      <Row gutter={16}>
        <Col span={8}>
          <Card 
            title={<><TeamOutlined /> 获客渠道</>}
            bordered={false}
          >
            <div style={{ padding: '20px 0' }}>
              {channelData.map((item, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text>{item.channel}</Text>
                    <Text strong>{item.count}</Text>
                  </div>
                  <Progress 
                    percent={item.rate} 
                    showInfo={false}
                    strokeColor={['#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96'][index]}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            title={<><SendOutlined /> 转化漏斗</>}
            bordered={false}
          >
            <div style={{ padding: '20px 0' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>发现的潜客</Text>
                  <Text strong>15,680</Text>
                </div>
                <Progress percent={100} showInfo={false} strokeColor="#1890ff" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>发送消息</Text>
                  <Text strong>45,678 (79.2%)</Text>
                </div>
                <Progress percent={79.2} showInfo={false} strokeColor="#52c41a" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>收到回复</Text>
                  <Text strong>8,923 (19.5%)</Text>
                </div>
                <Progress percent={19.5} showInfo={false} strokeColor="#faad14" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>扫码添加</Text>
                  <Text strong>4,567 (51.2%)</Text>
                </div>
                <Progress percent={51.2} showInfo={false} strokeColor="#722ed1" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text strong>成功转化</Text>
                  <Text strong style={{ color: '#52c41a' }}>1,234 (27.0%)</Text>
                </div>
                <Progress percent={27} showInfo={false} strokeColor="#52c41a" />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            title={<><WhatsAppOutlined /> 最新潜客</>}
            bordered={false}
            extra={<Button type="link">查看全部</Button>}
          >
            <Table 
              columns={columns} 
              dataSource={customerData} 
              rowKey="id" 
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
