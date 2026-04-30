'use client'

import { Card, Row, Col, Typography, Table, Tag, DatePicker, Select } from 'antd'
import { Line } from '@ant-design/plots'

const { Title } = Typography

export default function ShareTrackPage() {
  const columns = [
    { title: '推荐人', dataIndex: 'referrer', key: 'referrer' },
    { title: '被推荐人', dataIndex: 'referee', key: 'referee' },
    { title: '推荐码', dataIndex: 'code', key: 'code' },
    { title: '注册时间', dataIndex: 'registerTime', key: 'registerTime' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={status === 'success' ? 'success' : 'default'}>{status === 'success' ? '成功' : '待激活'}</Tag>,
    },
  ]

  const mockData = [
    { referrer: '张三', referee: '李四', code: 'ZHISHUAI2024', registerTime: '2024-03-25', status: 'success' },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">推荐追踪</Title>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col span={8}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">156</div>
              <div className="text-gray-600 text-sm">总推荐数</div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">128</div>
              <div className="text-gray-600 text-sm">成功转化</div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">82%</div>
              <div className="text-gray-600 text-sm">转化率</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="推荐记录">
        <Table dataSource={mockData} columns={columns} rowKey="id" />
      </Card>
    </div>
  )
}
