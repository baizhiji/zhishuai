'use client'

import { Card, Row, Col, Typography, Statistic } from 'antd'
import { UserAddOutlined, EyeOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function AcquisitionStatsPage() {
  return (
    <div className="p-6">
      <Title level={2} className="mb-2">获客看板</Title>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="发现潜客" value={328} prefix={<UserAddOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="引流曝光" value={12580} prefix={<EyeOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="正在跟进" value={45} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="成功转化" value={18} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
