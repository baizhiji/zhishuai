'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Statistic,
  Progress,
  Space,
  Timeline,
  message,
  Modal,
  Spin,
  Empty,
  Result,
} from 'antd';
import {
  CrownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  RocketOutlined,
  SafetyOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import request from '@/lib/request';

const { Title, Text } = Typography;

interface Plan {
  id: string;
  name: string;
  duration: string;
  price: number;
  originalPrice?: number;
  color: string;
  popular?: boolean;
  features: string[];
}

export default function SubscribePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paying, setPaying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [payModalVisible, setPayModalVisible] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, plansRes] = await Promise.all([
        request.get('/orders/my-subscription').catch(() => null),
        request.get('/orders/plans').catch(() => null),
      ]) as any[];

      if (subRes?.data) {
        setSubscription(subRes.data);
        setUsageStats(subRes.data.usageStats || []);
      }

      if (plansRes?.data?.plans) {
        setPlans(plansRes.data.plans);
      } else {
        // 降级使用默认套餐
        setPlans([
          {
            id: 'monthly', name: '月度会员', duration: '1个月', price: 299, color: '#1890ff',
            features: ['无限次内容生成', '矩阵管理最多5个账号', '发布中心不限次数', '招聘助手基础功能', '智能获客100条/月'],
          },
          {
            id: 'quarterly', name: '季度会员', duration: '3个月', price: 799, originalPrice: 897, color: '#722ed1', popular: true,
            features: ['无限次内容生成', '矩阵管理最多10个账号', '发布中心不限次数', '招聘助手高级功能', '智能获客500条/月', '客服支持7x24', '优先功能体验'],
          },
          {
            id: 'yearly', name: '年度会员', duration: '12个月', price: 2599, originalPrice: 3588, color: '#faad14',
            features: ['无限次内容生成', '矩阵管理不限账号', '发布中心不限次数', '招聘助手全部功能', '智能获客不限条数', '客服支持7x24', '专属客户经理', 'API接口调用'],
          },
        ]);
      }
    } catch (err: any) {
      setError(err?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 选择套餐并确认支付
  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setPayModalVisible(true);
  };

  // 创建订单并发起支付
  const handlePay = async () => {
    if (!selectedPlan) return;
    setPaying(true);
    try {
      const res = await request.post('/orders/create', {
        planId: selectedPlan.id,
        amount: selectedPlan.price,
        paymentMethod: 'wechat',
        returnUrl: window.location.origin + '/payment/callback',
      }) as any;

      if (res?.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else if (res?.data?.orderId) {
        message.success('订单已创建，请完成支付');
        setPayModalVisible(false);
        // 模拟跳转支付页
        setTimeout(() => {
          window.location.href = `/payment/callback?order_id=${res.data.orderId}&status=success`;
        }, 1000);
      } else {
        throw new Error('创建订单失败');
      }
    } catch (err: any) {
      message.error(err?.message || '支付失败，请稍后重试');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Title level={2} className="mb-6">套餐管理</Title>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => (
            <Card key={i}><Spin /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Result
          status="error"
          title="加载失败"
          subTitle={error}
          extra={<Button type="primary" icon={<ReloadOutlined />} onClick={fetchData}>重试</Button>}
        />
      </div>
    );
  }

  if (!subscription && !plans.length) {
    return (
      <div className="p-6">
        <Empty description="暂无套餐信息" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">套餐管理</Title>

      {/* 当前订阅信息 */}
      {subscription && (
        <Row gutter={16} className="mb-6">
          <Col xs={24} md={16}>
            <Card>
              <Row gutter={24} align="middle">
                <Col>
                  <CrownOutlined style={{ fontSize: '48px', color: '#faad14' }} />
                </Col>
                <Col>
                  <Title level={4} style={{ marginBottom: 8 }}>
                    {subscription.planName || '免费版'}
                    <Tag color="green" className="ml-2">当前</Tag>
                  </Title>
                  <Space>
                    <Text type="secondary">
                      <ClockCircleOutlined /> 有效期至 {subscription.endDate || '-'}
                    </Text>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="剩余天数"
                value={subscription.daysLeft || 0}
                suffix="天"
                valueStyle={{ color: '#faad14', fontSize: '32px' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 使用量统计 */}
      {usageStats.length > 0 && (
        <Card title="功能使用统计" className="mb-6">
          <Row gutter={16}>
            {usageStats.map((stat: any, index: number) => (
              <Col xs={24} sm={12} md={8} key={index} className="mb-4">
                <Card size="small">
                  <div className="flex items-center mb-2">
                    <div style={{ fontSize: '20px', color: '#1890ff', marginRight: '12px' }}>
                      {stat.icon || <TeamOutlined />}
                    </div>
                    <Text strong>{stat.name}</Text>
                  </div>
                  <Progress percent={stat.percent || 0} size="small" />
                  <Text type="secondary" className="mt-2">
                    已使用 {stat.used || 0} 次（{stat.limit || '无限'}）
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 套餐列表 */}
      <Card title="可选套餐">
        <Row gutter={16}>
          {plans.map(plan => (
            <Col xs={24} md={8} key={plan.id} className="mb-4">
              <Card
                className={plan.popular ? 'border-primary' : ''}
                style={{
                  borderColor: plan.popular ? plan.color : undefined,
                  position: 'relative',
                }}
              >
                {plan.popular && (
                  <Tag color={plan.color} style={{ position: 'absolute', top: 12, right: 12 }}>
                    推荐
                  </Tag>
                )}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <CrownOutlined style={{ fontSize: '32px', color: plan.color }} />
                  <Title level={4} style={{ marginTop: '8px', marginBottom: 0 }}>
                    {plan.name}
                  </Title>
                  <Text type="secondary">{plan.duration}</Text>
                  <div className="mt-2">
                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: plan.color }}>
                      ¥{plan.price}
                    </Text>
                    {plan.originalPrice && (
                      <Text delete type="secondary" className="ml-2">
                        ¥{plan.originalPrice}
                      </Text>
                    )}
                  </div>
                </div>

                <div style={{ minHeight: '150px' }}>
                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}
                    >
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      <Text>{feature}</Text>
                    </div>
                  ))}
                </div>

                <Button
                  type={plan.popular ? 'primary' : 'default'}
                  block
                  size="large"
                  style={{ marginTop: '16px' }}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {plan.price > 0 ? `¥${plan.price} 立即订阅` : '免费试用'}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 操作日志 */}
      <Card title="操作日志" className="mt-6">
        <Timeline
          items={[
            { color: 'green', children: subscription ? `当前套餐：${subscription.planName || '-'}` : '尚未订阅' },
          ]}
        />
      </Card>

      {/* 支付确认弹窗 */}
      <Modal
        title="确认订阅"
        open={payModalVisible}
        onOk={handlePay}
        onCancel={() => setPayModalVisible(false)}
        confirmLoading={paying}
        okText="确认支付"
        cancelText="取消"
      >
        {selectedPlan && (
          <div className="text-center py-4">
            <CrownOutlined style={{ fontSize: 48, color: selectedPlan.color, marginBottom: 16 }} />
            <Title level={4}>{selectedPlan.name}</Title>
            <Text type="secondary">{selectedPlan.duration}</Text>
            <div className="mt-4">
              <Text style={{ fontSize: 36, fontWeight: 'bold', color: selectedPlan.color }}>
                ¥{selectedPlan.price}
              </Text>
            </div>
            <div className="mt-4">
              <Text type="secondary">支付方式：微信支付</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
