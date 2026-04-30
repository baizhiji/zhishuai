'use client'

import { Card, Row, Col, Statistic, Typography, Table, Tag, Progress } from 'antd'
import {
  UserOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
  TrophyOutlined,
  CrownOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

export default function AccountPage() {
  // 模拟账户信息
  const accountInfo = {
    userId: 'USR001',
    phone: '138****8000',
    email: 'user@example.com',
    role: '终端客户',
    memberType: '年度会员',
    expireDate: '2025-12-31',
    balance: 2880,
    totalCredits: 15880,
    usedCredits: 3200,
  }

  // 套餐信息
  const planInfo = {
    name: '年度会员',
    price: 899,
    startDate: '2024-01-01',
    expireDate: '2024-12-31',
    status: 'active',
    features: [
      { name: '无限次内容生成', used: 1250, total: '无限' },
      { name: '矩阵管理账号数', used: 8, total: '不限' },
      { name: '智能获客条数/月', used: 320, total: '不限' },
      { name: '数字人生成', used: 45, total: '无限' },
    ]
  }

  // 最近消费记录
  const consumptionRecords = [
    { id: 1, type: '内容生成', amount: -5, time: '2024-04-30 14:30', balance: 2880 },
    { id: 2, type: '充值', amount: 500, time: '2024-04-28 10:15', balance: 2885 },
    { id: 3, type: '数字人视频', amount: -20, time: '2024-04-25 16:45', balance: 2385 },
    { id: 4, type: '智能获客', amount: -50, time: '2024-04-20 09:00', balance: 2405 },
    { id: 5, type: '内容生成', amount: -5, time: '2024-04-15 11:20', balance: 2455 },
  ]

  const columns = [
    { title: '类型', dataIndex: 'type', key: 'type' },
    { 
      title: '金额', 
      dataIndex: 'amount', 
      key: 'amount',
      render: (val: number) => (
        <Text type={val > 0 ? 'success' : 'danger'}>
          {val > 0 ? `+${val}` : val}
        </Text>
      )
    },
    { title: '时间', dataIndex: 'time', key: 'time' },
    { title: '余额', dataIndex: 'balance', key: 'balance' },
  ]

  // 功能使用统计
  const usageStats = [
    { icon: <UserOutlined />, name: '自媒体运营', value: '1250次', color: '#1890ff' },
    { icon: <CrownOutlined />, name: '招聘助手', value: '89次', color: '#722ed1' },
    { icon: <SafetyCertificateOutlined />, name: '智能获客', value: '320次', color: '#13c2c2' },
    { icon: <TrophyOutlined />, name: '推荐分享', value: '156次', color: '#fa8c16' },
  ]

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">账号总览</Title>

      {/* 账户基本信息 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic 
              title="账户ID" 
              value={accountInfo.userId}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="手机号码" 
              value={accountInfo.phone}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="会员类型" 
              value={accountInfo.memberType}
              prefix={<CrownOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="到期时间" 
              value={accountInfo.expireDate}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 余额和积分 */}
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card title="账户余额" extra={<Tag color="green">可用</Tag>}>
            <Statistic 
              value={accountInfo.balance} 
              prefix="¥"
              valueStyle={{ color: '#1890ff', fontSize: '32px' }}
            />
            <div className="mt-4">
              <Text type="secondary">赠送积分：</Text>
              <Text strong className="ml-2">{accountInfo.totalCredits - accountInfo.usedCredits}</Text>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="本月消耗">
            <Statistic 
              value={accountInfo.usedCredits} 
              suffix="积分"
            />
            <Progress 
              percent={Math.round((accountInfo.usedCredits / accountInfo.totalCredits) * 100)} 
              size="small" 
              className="mt-4"
            />
            <Text type="secondary" className="mt-2">总积分：{accountInfo.totalCredits}</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="当前套餐">
            <div className="flex items-center">
              <CrownOutlined style={{ fontSize: '32px', color: '#faad14', marginRight: '16px' }} />
              <div>
                <Text strong>{planInfo.name}</Text>
                <div>
                  <Text type="secondary">¥{planInfo.price}/年</Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 功能使用统计 */}
      <Row gutter={16} className="mb-6">
        {usageStats.map((stat, index) => (
          <Col span={6} key={index}>
            <Card>
              <div className="flex items-center">
                <div 
                  style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '8px', 
                    backgroundColor: `${stat.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px',
                    color: stat.color,
                    fontSize: '24px'
                  }}
                >
                  {stat.icon}
                </div>
                <div>
                  <Text type="secondary">{stat.name}</Text>
                  <div>
                    <Text strong>{stat.value}</Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 最近消费记录 */}
      <Card title="最近消费记录">
        <Table 
          dataSource={consumptionRecords} 
          columns={columns} 
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  )
}
