'use client'

import { Card, Row, Col, Typography, Table, Tag, Button, QRCode, Input, message, Space, Avatar } from 'antd'
import { ShareAltOutlined, CheckCircleOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface ReferralRecord {
  id: number
  name: string
  avatar: string
  code: string
  registerTime: string
  activateTime?: string
  status: 'pending' | 'active'
  level: number
}

export default function MyReferralPage() {
  const referralLink = 'https://zhishuai.app/download?ref=ZL2024001'
  const referralCode = 'ZL2024001'

  // Mock 数据
  const mockRecords: ReferralRecord[] = [
    { id: 1, name: '李明', avatar: 'LM', code: 'ZL2024001', registerTime: '2024-03-15', activateTime: '2024-03-16', status: 'active', level: 1 },
    { id: 2, name: '王芳', avatar: 'WF', code: 'ZL2024002', registerTime: '2024-03-18', activateTime: '2024-03-20', status: 'active', level: 1 },
    { id: 3, name: '张伟', avatar: 'ZW', code: 'ZL2024003', registerTime: '2024-03-20', activateTime: '2024-03-22', status: 'active', level: 1 },
    { id: 4, name: '刘洋', avatar: 'LY', code: 'ZL2024004', registerTime: '2024-03-22', status: 'pending', level: 1 },
    { id: 5, name: '陈静', avatar: 'CJ', code: 'ZL2024005', registerTime: '2024-03-25', activateTime: '2024-03-26', status: 'active', level: 1 },
    { id: 6, name: '赵强', avatar: 'ZQ', code: 'ZL2024006', registerTime: '2024-03-28', status: 'pending', level: 1 },
  ]

  const columns = [
    {
      title: '用户',
      key: 'user',
      render: (_: any, record: ReferralRecord) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }}>{record.avatar}</Avatar>
          <span>{record.name}</span>
        </Space>
      ),
    },
    { title: '推荐码', dataIndex: 'code', key: 'code' },
    { title: '注册时间', dataIndex: 'registerTime', key: 'registerTime' },
    {
      title: '激活时间',
      dataIndex: 'activateTime',
      key: 'activateTime',
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'warning'}>
          {status === 'active' ? '已激活' : '待激活'}
        </Tag>
      ),
    },
  ]

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    message.success('推荐链接已复制到剪贴板')
  }

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode)
    message.success('推荐码已复制到剪贴板')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">我的转介绍</Title>
        <Text type="secondary">分享智枢 AI，邀请好友加入</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card hoverable>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">156</div>
              <div className="text-gray-600 text-sm">总推荐数</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">128</div>
              <div className="text-gray-600 text-sm">成功转化</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">82%</div>
              <div className="text-gray-600 text-sm">转化率</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">28</div>
              <div className="text-gray-600 text-sm">待激活</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* 左侧：推荐码和二维码 */}
        <Col xs={24} lg={8}>
          <Card title="我的推荐码" bordered={false}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <QRCode value={referralLink} size={160} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">推荐码：</Text>
              <Input
                value={referralCode}
                readOnly
                addonAfter={
                  <Button type="text" size="small" icon={<CopyOutlined />} onClick={copyCode}>
                    复制
                  </Button>
                }
                style={{ fontWeight: 'bold', letterSpacing: 2 }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">推广链接：</Text>
              <Input
                value={referralLink}
                readOnly
                addonAfter={
                  <Button type="text" size="small" icon={<CopyOutlined />} onClick={copyLink}>
                    复制
                  </Button>
                }
              />
            </div>
            <Button block type="primary" icon={<DownloadOutlined />}>
              下载二维码
            </Button>
          </Card>
        </Col>

        {/* 右侧：推荐记录 */}
        <Col xs={24} lg={16}>
          <Card
            title="推荐记录"
            extra={
              <Space>
                <Tag color="success">已激活: 128</Tag>
                <Tag color="warning">待激活: 28</Tag>
              </Space>
            }
          >
            <Table
              dataSource={mockRecords}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
