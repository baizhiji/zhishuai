'use client'

import { Card, Row, Col, Typography, Statistic, Table, Tag, Button, QRCode, Input, message, Tabs, List, Avatar, Progress, Space, Divider, Modal, Form, Select, DatePicker } from 'antd'
import { ShareAltOutlined, UserAddOutlined, CheckCircleOutlined, DollarOutlined, CopyOutlined, DownloadOutlined, TrophyOutlined, GiftOutlined, BankOutlined, SendOutlined, ScanOutlined } from '@ant-design/icons'
import { useState } from 'react'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

interface ReferralRecord {
  id: number
  name: string
  avatar: string
  code: string
  registerTime: string
  activateTime?: string
  status: 'pending' | 'active' | 'withdrawn'
  commission: number
  level: number
}

export default function MyReferralPage() {
  const [activeTab, setActiveTab] = useState('myReferral')
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false)
  const [applyForm] = Form.useForm()

  // Mock 数据
  const mockRecords: ReferralRecord[] = [
    { id: 1, name: '李明', avatar: 'LM', code: 'ZL2024001', registerTime: '2024-03-15', activateTime: '2024-03-16', status: 'active', commission: 100, level: 1 },
    { id: 2, name: '王芳', avatar: 'WF', code: 'ZL2024002', registerTime: '2024-03-18', activateTime: '2024-03-20', status: 'active', commission: 100, level: 1 },
    { id: 3, name: '张伟', avatar: 'ZW', code: 'ZL2024003', registerTime: '2024-03-20', activateTime: '2024-03-22', status: 'active', commission: 100, level: 1 },
    { id: 4, name: '刘洋', avatar: 'LY', code: 'ZL2024004', registerTime: '2024-03-22', status: 'pending', commission: 0, level: 1 },
    { id: 5, name: '陈静', avatar: 'CJ', code: 'ZL2024005', registerTime: '2024-03-25', activateTime: '2024-03-26', status: 'active', commission: 100, level: 1 },
    { id: 6, name: '赵强', avatar: 'ZQ', code: 'ZL2024006', registerTime: '2024-03-28', status: 'pending', commission: 0, level: 1 },
  ]

  // 排行榜数据
  const leaderboard = [
    { rank: 1, name: '周杰', referrals: 58, commission: 5800 },
    { rank: 2, name: '吴磊', referrals: 45, commission: 4500 },
    { rank: 3, name: '郑好', referrals: 42, commission: 4200 },
    { rank: 4, name: '孙丽', referrals: 38, commission: 3800 },
    { rank: 5, name: '李明', referrals: 35, commission: 3500 },
  ]

  // 提现记录
  const withdrawRecords = [
    { id: 1, amount: 500, time: '2024-03-20', status: 'completed', account: '工商银行 ****1234' },
    { id: 2, amount: 1000, time: '2024-03-15', status: 'completed', account: '工商银行 ****1234' },
    { id: 3, amount: 800, time: '2024-03-10', status: 'completed', account: '支付宝 138****5678' },
  ]

  const referralLink = 'https://zhishuai.app/download?ref=ZL2024001'
  const referralCode = 'ZL2024001'

  // 复制推荐链接
  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    message.success('推荐链接已复制到剪贴板')
  }

  // 复制推荐码
  const copyCode = () => {
    navigator.clipboard.writeText(referralCode)
    message.success('推荐码已复制到剪贴板')
  }

  // 提现申请
  const handleWithdraw = async () => {
    try {
      const values = await applyForm.validateFields()
      message.success(`提现申请已提交，等待审核`)
      setWithdrawModalVisible(false)
      applyForm.resetFields()
    } catch (error) {
      // 表单验证失败
    }
  }

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
        <Tag color={status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'default'}>
          {status === 'active' ? '已激活' : status === 'pending' ? '待激活' : '已提现'}
        </Tag>
      ),
    },
    {
      title: '佣金',
      dataIndex: 'commission',
      key: 'commission',
      render: (amount: number) => <Text strong style={{ color: '#52c41a' }}>¥{amount.toFixed(2)}</Text>,
    },
  ]

  const withdrawColumns = [
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (amount: number) => `¥${amount.toFixed(2)}` },
    { title: '到账账户', dataIndex: 'account', key: 'account' },
    { title: '申请时间', dataIndex: 'time', key: 'time' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: () => <Tag color="success">已到账</Tag>,
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">我的转介绍</Title>
        <Text type="secondary">分享智枢 AI，获得奖励佣金</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="累计推荐"
              value={156}
              prefix={<ShareAltOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="成功转化"
              value={128}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix="人"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="待结算佣金"
              value={2580}
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="已提现"
              value={10220}
              prefix={<BankOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      {/* 奖励规则说明 */}
      <Card className="mb-6" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
        <Row gutter={24} align="middle">
          <Col flex="none">
            <GiftOutlined style={{ fontSize: 48, color: '#fff' }} />
          </Col>
          <Col flex="auto">
            <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>邀请奖励规则</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 0 }}>
              每成功邀请1位好友注册并激活，您可获得 <Text strong style={{ color: '#fff' }}>100元</Text> 佣金奖励！
              好友续费时，您还可获得额外 <Text strong style={{ color: '#fff' }}>10%</Text> 的续费奖励。
            </Paragraph>
          </Col>
          <Col flex="none">
            <Button type="primary" ghost size="large" icon={<SendOutlined />}>
              立即邀请
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 标签页 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="我的推荐" key="myReferral">
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
          </TabPane>

          <TabPane tab="佣金提现" key="withdraw">
            <Row gutter={24}>
              <Col xs={24} lg={12}>
                <Card title="提现信息" bordered={false}>
                  <Statistic
                    title="可提现佣金"
                    value={2580}
                    prefix={<DollarOutlined />}
                    suffix="元"
                    valueStyle={{ color: '#52c41a', fontSize: 32 }}
                  />
                  <Divider />
                  <Paragraph type="secondary">
                    <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
                      <li>提现申请审核通过后，1-3个工作日到账</li>
                      <li>最低提现金额：100元</li>
                      <li>支持银行卡、支付宝提现</li>
                      <li>每笔提现收取 1% 手续费</li>
                    </ul>
                  </Paragraph>
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<BankOutlined />}
                    onClick={() => setWithdrawModalVisible(true)}
                    style={{ marginTop: 16 }}
                  >
                    申请提现
                  </Button>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="提现记录">
                  <Table
                    dataSource={withdrawRecords}
                    columns={withdrawColumns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="排行榜" key="leaderboard">
            <Card title={<><TrophyOutlined /> 推荐排行榜</>}>
              <List
                dataSource={leaderboard}
                renderItem={(item, index) => (
                  <List.Item
                    extra={
                      <Text strong style={{ color: index < 3 ? '#faad14' : '#666' }}>
                        ¥{item.commission.toLocaleString()}
                      </Text>
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        <Badge
                          count={index + 1}
                          style={{
                            backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#999',
                            fontSize: 12,
                          }}
                        />
                      }
                      title={<Space><Avatar style={{ backgroundColor: '#1890ff' }}>{item.name[0]}</Avatar>{item.name}</Space>}
                      description={`推荐 ${item.referrals} 人`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* 提现申请弹窗 */}
      <Modal
        title="申请提现"
        open={withdrawModalVisible}
        onOk={handleWithdraw}
        onCancel={() => setWithdrawModalVisible(false)}
        okText="确认提现"
      >
        <Form form={applyForm} layout="vertical">
          <Form.Item
            name="amount"
            label="提现金额"
            rules={[{ required: true, message: '请输入提现金额' }]}
          >
            <Input type="number" prefix="¥" suffix="元" placeholder="最低100元" />
          </Form.Item>
          <Form.Item
            name="method"
            label="提现方式"
            rules={[{ required: true, message: '请选择提现方式' }]}
          >
            <Select placeholder="请选择">
              <Option value="bank">银行卡</Option>
              <Option value="alipay">支付宝</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="account"
            label="收款账户"
            rules={[{ required: true, message: '请输入收款账户' }]}
          >
            <Input placeholder="银行卡号或支付宝账号" />
          </Form.Item>
          <Form.Item
            name="name"
            label="开户姓名"
            rules={[{ required: true, message: '请输入开户姓名' }]}
          >
            <Input placeholder="请输入开户姓名" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
