'use client';

import { useState } from 'react';
import { Card, Row, Col, Button, Modal, message, Radio, Tag, Typography, Statistic, Progress, Space, Divider, Timeline } from 'antd';
import {
  CrownOutlined,
  AlipayOutlined,
  WechatOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  UpOutlined,
} from '@ant-design/icons';
import QRCode from 'qrcode.react';

const { Title, Text } = Typography

interface Plan {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  duration: string;
  months: number;
  features: string[];
  popular?: boolean;
  color: string;
}

interface Order {
  id: string;
  planName: string;
  price: number;
  status: 'active' | 'pending' | 'expired';
  startDate: string;
  endDate: string;
}

export default function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'wechat'>('alipay');
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // 当前订阅信息
  const [currentSubscription] = useState({
    planName: '年度会员',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    daysLeft: 245,
    totalDays: 365,
    status: 'active',
  });

  // 使用量统计
  const usageStats = [
    { name: '内容生成', used: 1250, limit: '无限', percent: 100 },
    { name: '矩阵账号', used: 8, limit: '无限', percent: 100 },
    { name: '智能获客', used: 320, limit: '无限', percent: 100 },
    { name: '数字人视频', used: 45, limit: '无限', percent: 100 },
    { name: '招聘助手', used: 89, limit: '无限', percent: 100 },
  ];

  const plans: Plan[] = [
    {
      id: 'monthly',
      name: '月度会员',
      price: 99,
      originalPrice: 199,
      duration: '1个月',
      months: 1,
      color: '#1890ff',
      features: [
        '无限次内容生成',
        '矩阵管理最多5个账号',
        '发布中心不限次数',
        '招聘助手基础功能',
        '智能获客100条/月',
        '客服支持（工作日）'
      ]
    },
    {
      id: 'quarterly',
      name: '季度会员',
      price: 269,
      originalPrice: 597,
      duration: '3个月',
      months: 3,
      color: '#722ed1',
      popular: true,
      features: [
        '无限次内容生成',
        '矩阵管理最多10个账号',
        '发布中心不限次数',
        '招聘助手高级功能',
        '智能获客500条/月',
        '客服支持（7x24小时）',
        '优先功能体验',
        '专属客服经理'
      ]
    },
    {
      id: 'yearly',
      name: '年度会员',
      price: 899,
      originalPrice: 2388,
      duration: '12个月',
      months: 12,
      color: '#fa8c16',
      features: [
        '无限次内容生成',
        '矩阵管理不限账号',
        '发布中心不限次数',
        '招聘助手企业版',
        '智能获客不限次数',
        '客服支持（7x24小时）',
        '优先功能体验',
        '专属客服经理',
        '定制化服务',
        'API接口访问'
      ]
    },
    {
      id: 'permanent',
      name: '永久会员',
      price: 3888,
      originalPrice: 9999,
      duration: '永久有效',
      months: 999,
      color: '#eb2f96',
      features: [
        '年度会员全部权益',
        '永久有效',
        '专属客服团队',
        '优先体验新功能',
        '定制化开发服务',
        'API永久授权',
        '数据永久保留',
        '一对一培训服务'
      ]
    },
  ];

  // 历史订单
  const [orders] = useState<Order[]>([
    { id: '1', planName: '年度会员', price: 899, status: 'active', startDate: '2024-01-01', endDate: '2024-12-31' },
    { id: '2', planName: '季度会员', price: 269, status: 'expired', startDate: '2023-10-01', endDate: '2023-12-31' },
    { id: '3', planName: '月度会员', price: 99, status: 'expired', startDate: '2023-09-01', endDate: '2023-09-30' },
  ]);

  // 选择订阅计划
  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  // 立即订阅
  const handleSubscribe = () => {
    if (!selectedPlan) {
      message.warning('请选择订阅计划');
      return;
    }
    setPayModalVisible(true);
  };

  // 确认支付
  const handleConfirmPay = () => {
    setLoading(true);
    setTimeout(() => {
      message.success('订阅成功！');
      setLoading(false);
      setPayModalVisible(false);
    }, 2000);
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const discountPercent = selectedPlanData ? Math.round((1 - selectedPlanData.price / selectedPlanData.originalPrice) * 100) : 0;

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">会员订阅</Title>

      <Row gutter={24}>
        {/* 左侧：当前订阅 + 套餐选择 */}
        <Col span={16}>
          {/* 当前订阅状态 */}
          <Card className="mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
            <Row gutter={24} align="middle">
              <Col span={8}>
                <div className="text-center">
                  <CrownOutlined style={{ fontSize: '48px', marginBottom: '8px' }} />
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{currentSubscription.planName}</div>
                  <Tag color="gold">生效中</Tag>
                </div>
              </Col>
              <Col span={16}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text style={{ color: 'rgba(255,255,255,0.8)' }}>到期时间</Text>
                    <div style={{ fontSize: '16px' }}>{currentSubscription.endDate}</div>
                  </Col>
                  <Col span={12}>
                    <Text style={{ color: 'rgba(255,255,255,0.8)' }}>剩余天数</Text>
                    <div style={{ fontSize: '16px' }}>{currentSubscription.daysLeft} 天</div>
                  </Col>
                </Row>
                <div className="mt-4">
                  <Progress 
                    percent={Math.round((currentSubscription.daysLeft / currentSubscription.totalDays) * 100)} 
                    showInfo={false}
                    strokeColor="#fff"
                    trailColor="rgba(255,255,255,0.3)"
                  />
                </div>
              </Col>
            </Row>
          </Card>

          {/* 使用量统计 */}
          <Card title="本月使用量" className="mb-4">
            <Row gutter={[16, 16]}>
              {usageStats.map((stat, index) => (
                <Col span={12} key={index}>
                  <div className="flex justify-between items-center">
                    <Text>{stat.name}</Text>
                    <Text type="secondary">{stat.used} / {stat.limit}</Text>
                  </div>
                  <Progress percent={stat.percent} size="small" />
                </Col>
              ))}
            </Row>
          </Card>

          {/* 套餐选择 */}
          <Card title="选择套餐">
            <Row gutter={[16, 16]}>
              {plans.map(plan => (
                <Col span={12} key={plan.id}>
                  <Card
                    hoverable
                    style={{ 
                      borderColor: selectedPlan === plan.id ? plan.color : '#d9d9d9',
                      borderWidth: selectedPlan === plan.id ? 2 : 1,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {plan.popular && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: plan.color,
                        color: '#fff',
                        padding: '2px 12px',
                        fontSize: '12px',
                        borderBottomLeftRadius: '8px',
                      }}>
                        推荐
                      </div>
                    )}
                    <div className="text-center mb-4">
                      <CrownOutlined style={{ fontSize: '32px', color: plan.color }} />
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: plan.color }}>
                        {plan.name}
                      </div>
                      <div style={{ textDecoration: 'line-through', color: '#999' }}>
                        ¥{plan.originalPrice}
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                        ¥{plan.price}
                      </div>
                      <Tag color={plan.color}>省{Math.round((1 - plan.price / plan.originalPrice) * 100)}%</Tag>
                      <div className="mt-2" style={{ fontSize: '12px', color: '#666' }}>
                        {plan.duration}
                      </div>
                    </div>
                    <Divider className="my-2" />
                    <ul className="pl-4 text-sm">
                      {plan.features.slice(0, 5).map((feature, i) => (
                        <li key={i} className="mb-1" style={{ color: '#666' }}>
                          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 5 && (
                        <li className="text-gray-400">...还有{plan.features.length - 5}项权益</li>
                      )}
                    </ul>
                    {selectedPlan === plan.id && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: plan.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '20px',
                      }}>
                        <CheckCircleOutlined />
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
            <div className="mt-4 text-center">
              <Button 
                type="primary" 
                size="large" 
                disabled={!selectedPlan}
                onClick={handleSubscribe}
                style={{ width: '200px' }}
              >
                立即订阅
              </Button>
            </div>
          </Card>
        </Col>

        {/* 右侧：会员权益 + 历史订单 */}
        <Col span={8}>
          {/* 会员特权 */}
          <Card title="会员特权" className="mb-4">
            <Timeline
              items={[
                { color: 'blue', children: <><Text strong>无限次内容生成</Text><br/><Text type="secondary">AI文章、图片、视频一键生成</Text></> },
                { color: 'purple', children: <><Text strong>矩阵账号管理</Text><br/><Text type="secondary">多平台多账号统一管理</Text></> },
                { color: 'green', children: <><Text strong>智能获客</Text><br/><Text type="secondary">精准触达潜在客户</Text></> },
                { color: 'orange', children: <><Text strong>招聘助手</Text><br/><Text type="secondary">全流程智能化招聘</Text></> },
                { color: 'red', children: <><Text strong>专属客服</Text><br/><Text type="secondary">7x24小时专业支持</Text></> },
                { color: 'gold', children: <><Text strong>优先体验</Text><br/><Text type="secondary">新功能抢先用</Text></> },
              ]}
            />
          </Card>

          {/* 升级推荐 */}
          {currentSubscription.planName !== '年度会员' && currentSubscription.planName !== '永久会员' && (
            <Card 
              style={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: '#fff'
              }}
              className="mb-4"
            >
              <div className="text-center">
                <GiftOutlined style={{ fontSize: '32px' }} />
                <div className="mt-2" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  升级到年度会员
                </div>
                <div className="my-2">
                  <Text style={{ color: '#fff' }}>立省 ¥{(269 * 4 - 899).toLocaleString()}</Text>
                </div>
                <Button type="primary" ghost style={{ borderColor: '#fff', color: '#fff' }}>
                  立即升级 <UpOutlined />
                </Button>
              </div>
            </Card>
          )}

          {/* 历史订单 */}
          <Card title="订阅历史">
            {orders.map(order => (
              <div key={order.id} className="mb-4 pb-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <div className="flex justify-between">
                  <Text strong>{order.planName}</Text>
                  <Text>¥{order.price}</Text>
                </div>
                <div className="flex justify-between mt-1">
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {order.startDate} ~ {order.endDate}
                  </Text>
                  <Tag color={order.status === 'active' ? 'success' : 'default'}>
                    {order.status === 'active' ? '当前' : '已过期'}
                  </Tag>
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* 支付二维码 Modal */}
      <Modal
        title="扫码支付"
        open={payModalVisible}
        onCancel={() => setPayModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPayModalVisible(false)}>取消支付</Button>,
          <Button key="confirm" type="primary" loading={loading} onClick={handleConfirmPay}>
            已完成支付
          </Button>
        ]}
        width={400}
      >
        {selectedPlanData && (
          <div className="text-center py-8">
            <div style={{
              width: 200,
              height: 200,
              backgroundColor: '#f5f5f5',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed #ccc'
            }}>
              <QRCode value="https://example.com" size={180} />
            </div>
            <Text type="secondary">请使用{paymentMethod === 'alipay' ? '支付宝' : '微信'}扫码支付</Text>
            <div className="mt-4">
              <Text strong style={{ fontSize: '24px', color: selectedPlanData.color }}>
                {selectedPlanData.name}
              </Text>
            </div>
            <div>
              <Text strong style={{ fontSize: '28px', color: '#1890ff' }}>¥{selectedPlanData.price}</Text>
              <Text type="secondary" className="ml-2" style={{ textDecoration: 'line-through' }}>
                ¥{selectedPlanData.originalPrice}
              </Text>
            </div>
            <div className="mt-2">
              <Tag color="green">限时省{Math.round((1 - selectedPlanData.price / selectedPlanData.originalPrice) * 100)}%</Tag>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
