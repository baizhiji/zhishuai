'use client'

import { Card, Row, Col, Typography, Statistic, Table, Tag, Button } from 'antd'
import { ShareAltOutlined, UserAddOutlined, CheckCircleOutlined, DollarOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function MyReferralPage() {
  const columns = [
    { title: '被推荐人', dataIndex: 'name', key: 'name' },
    { title: '推荐码', dataIndex: 'code', key: 'code' },
    { title: '注册时间', dataIndex: 'registerTime', key: 'registerTime' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '已激活' : '待激活'}
        </Tag>
      ),
    },
    {
      title: '佣金',
      dataIndex: 'commission',
      key: 'commission',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
  ]

  const mockData = [
    { name: '李四', code: 'ZHISHUAI2024', registerTime: '2024-03-25', status: 'active', commission: 100.00 },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">我的转介绍</Title>
        <Text type="secondary">查看推荐记录和佣金收益</Text>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="累计推荐"
              value={156}
              prefix={<ShareAltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="成功转化"
              value={128}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="待结算佣金"
              value={2580}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已提现"
              value={10220}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      <Card title="推荐记录">
        <Table dataSource={mockData} columns={columns} rowKey="name" />
      </Card>
    </div>
  )
}
