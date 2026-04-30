'use client'

import { useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Select, DatePicker, Progress, Typography } from 'antd'
import { 
  BookOutlined, 
  FileTextOutlined, 
  UserAddOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  RiseOutlined,
  LineChartOutlined
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const { Title, Text } = Typography

export default function RecruitmentBoardPage() {
  const [timeRange, setTimeRange] = useState<string>('7d')

  // 统计数据
  const stats = {
    totalJobs: 89,
    activeJobs: 45,
    totalResumes: 2340,
    newResumes: 156,
    totalInterviews: 234,
    pendingInterviews: 23,
    totalHired: 67,
    hireRate: 28.6,
  }

  // 趋势数据
  const trendData = [
    { date: '周一', 简历: 45, 面试: 12, 入职: 3 },
    { date: '周二', 简历: 52, 面试: 18, 入职: 5 },
    { date: '周三', 简历: 38, 面试: 15, 入职: 4 },
    { date: '周四', 简历: 61, 面试: 22, 入职: 6 },
    { date: '周五', 简历: 48, 面试: 19, 入职: 4 },
    { date: '周六', 简历: 22, 面试: 8, 入职: 2 },
    { date: '周日', 简历: 15, 面试: 5, 入职: 1 },
  ]

  // 平台分布
  const platformData = [
    { platform: 'BOSS直聘', count: 856, rate: 36.6 },
    { platform: '前程无忧', count: 623, rate: 26.6 },
    { platform: '智联招聘', count: 512, rate: 21.9 },
    { platform: '猎聘网', count: 349, rate: 14.9 },
  ]

  // 面试安排数据
  const interviewData = [
    { id: 1, position: '前端开发工程师', candidate: '张明', time: '10:00', date: '2024-04-15', type: '初试', status: 'pending', match: 92 },
    { id: 2, position: '产品经理', candidate: '李华', time: '14:00', date: '2024-04-15', type: '复试', status: 'pending', match: 88 },
    { id: 3, position: 'UI设计师', candidate: '王芳', time: '09:30', date: '2024-04-15', type: '初试', status: 'pending', match: 95 },
    { id: 4, position: '后端开发工程师', candidate: '刘强', time: '11:00', date: '2024-04-15', type: '技术面', status: 'pending', match: 85 },
    { id: 5, position: '运营专员', candidate: '陈静', time: '15:30', date: '2024-04-15', type: '初试', status: 'pending', match: 78 },
  ]

  const columns = [
    { title: '职位', dataIndex: 'position', key: 'position', width: 150 },
    { title: '候选人', dataIndex: 'candidate', key: 'candidate', width: 100 },
    { 
      title: '匹配度', 
      dataIndex: 'match', 
      key: 'match', 
      width: 120,
      render: (match: number) => (
        <Progress 
          percent={match} 
          size="small" 
          strokeColor={match >= 90 ? '#52c41a' : match >= 80 ? '#1890ff' : '#faad14'}
        />
      )
    },
    { title: '面试类型', dataIndex: 'type', key: 'type', width: 100 },
    { 
      title: '时间', 
      key: 'datetime',
      width: 150,
      render: (_: any, record: any) => `${record.date} ${record.time}`
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'pending' ? 'blue' : status === 'completed' ? 'green' : 'red'}>
          {status === 'pending' ? '待面试' : status === 'completed' ? '已完成' : '已取消'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: () => (
        <Space>
          <Button type="link" size="small">查看详情</Button>
          <Button type="link" size="small">发送提醒</Button>
        </Space>
      )
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>招聘看板</Title>
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
              title="在招职位"
              value={stats.activeJobs}
              suffix={<span style={{ fontSize: 14 }}>/ {stats.totalJobs}</span>}
              prefix={<BookOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="简历总数"
              value={stats.totalResumes}
              suffix={
                <span style={{ fontSize: 14, color: '#52c41a' }}>
                  +{stats.newResumes} 新
                </span>
              }
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="待面试"
              value={stats.pendingInterviews}
              suffix={<span style={{ fontSize: 14 }}>/ {stats.totalInterviews}</span>}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="入职人数"
              value={stats.totalHired}
              suffix={
                <span style={{ fontSize: 14, color: '#722ed1' }}>
                  成功率 {stats.hireRate}%
                </span>
              }
              prefix={<UserAddOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card 
            title={<><LineChartOutlined /> 招聘趋势</>}
            bordered={false}
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="简历" stroke="#1890ff" strokeWidth={2} dot={{ fill: '#1890ff' }} />
                <Line type="monotone" dataKey="面试" stroke="#52c41a" strokeWidth={2} dot={{ fill: '#52c41a' }} />
                <Line type="monotone" dataKey="入职" stroke="#722ed1" strokeWidth={2} dot={{ fill: '#722ed1' }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            title={<><TeamOutlined /> 平台分布</>}
            bordered={false}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={platformData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis dataKey="platform" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#1890ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 招聘漏斗和面试安排 */}
      <Row gutter={16}>
        <Col span={8}>
          <Card 
            title={<><RiseOutlined /> 招聘漏斗</>}
            bordered={false}
          >
            <div style={{ padding: '20px 0' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>收到的简历</Text>
                  <Text strong>2,340</Text>
                </div>
                <Progress percent={100} showInfo={false} strokeColor="#1890ff" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>筛选通过</Text>
                  <Text strong>1,053 (45%)</Text>
                </div>
                <Progress percent={45} showInfo={false} strokeColor="#52c41a" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>发起面试</Text>
                  <Text strong>468 (20%)</Text>
                </div>
                <Progress percent={20} showInfo={false} strokeColor="#faad14" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>面试通过</Text>
                  <Text strong>234 (10%)</Text>
                </div>
                <Progress percent={10} showInfo={false} strokeColor="#722ed1" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text strong>成功入职</Text>
                  <Text strong style={{ color: '#52c41a' }}>67 (2.9%)</Text>
                </div>
                <Progress percent={2.9} showInfo={false} strokeColor="#52c41a" />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={16}>
          <Card 
            title={<><ClockCircleOutlined /> 今日面试安排</>}
            bordered={false}
            extra={<Button type="link">查看全部</Button>}
          >
            <Table 
              columns={columns} 
              dataSource={interviewData} 
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
