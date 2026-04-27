'use client'

import { Card, Row, Col, Typography, Statistic } from 'antd'
import { UserOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function RecruitmentStatsPage() {
  return (
    <div className="p-6">
      <Title level={2} className="mb-2">招聘看板</Title>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="总投递数" value={156} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待筛选" value={42} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="面试中" value={18} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已录用" value={5} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
