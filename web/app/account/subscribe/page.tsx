'use client';

import { useState } from 'react';
import { Card, Row, Col, Button, Modal, QRCode, message, Radio, Tag } from 'antd';
import {
  CrownOutlined,
  AlipayOutlined,
  WechatOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';
import paymentService from '@/services/paymentService';
import { PaymentMethod, SubscriptionPlan } from '@/types/api';

interface Plan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  originalPrice: number;
  duration: string;
  features: string[];
  popular?: boolean;
}

export default function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.ALIPAY);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [orderId, setOrderId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');

  const plans: Plan[] = [
    {
      id: SubscriptionPlan.MONTHLY,
      name: '月度会员',
      price: 99,
      originalPrice: 199,
      duration: '1个月',
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
      id: SubscriptionPlan.QUARTERLY,
      name: '季度会员',
      price: 269,
      originalPrice: 597,
      duration: '3个月',
      features: [
        '无限次内容生成',
        '矩阵管理最多10个账号',
        '发布中心不限次数',
        '招聘助手高级功能',
        '智能获客500条/月',
        '客服支持（7x24小时）',
        '优先功能体验',
        '专属客服经理'
      ],
      popular: true
    },
    {
      id: SubscriptionPlan.YEARLY,
      name: '年度会员',
      price: 899,
      originalPrice: 2388,
      duration: '12个月',
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
    }
  ];

  // 选择订阅计划
  const handleSelectPlan = (planId: SubscriptionPlan) => {
    setSelectedPlan(planId);
  };

  // 创建订阅订单
  const handleCreateOrder = async () => {
    if (!selectedPlan) {
      message.warning('请选择订阅计划');
      return;
    }

    try {
      const result = await paymentService.createSubscribeOrder(selectedPlan, paymentMethod);

      if (result.status === 'success') {
        setOrderId(result.orderId);

        // 如果是微信支付，显示二维码
        if (paymentMethod === PaymentMethod.WECHAT && result.qrCode) {
          setQrCode(result.qrCode);
          setPayModalVisible(true);

          // 轮询支付状态
          paymentService.pollPaymentStatus(
            result.orderId,
            () => {
              setPaymentStatus('success');
              message.success('订阅成功');
              setTimeout(() => {
                setPayModalVisible(false);
                window.location.reload();
              }, 2000);
            },
            () => {
              setPaymentStatus('failed');
              message.error('订阅失败');
            }
          );
        }
        // 如果是支付宝，跳转到支付页面
        else if (paymentMethod === PaymentMethod.ALIPAY && result.paymentUrl) {
          window.open(result.paymentUrl, '_blank');
        }
      } else {
        message.error(result.error || '创建订单失败');
      }
    } catch (error) {
      console.error('创建订单失败:', error);
    }
  };

  // 计算折扣
  const getDiscount = (originalPrice: number, price: number): number => {
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Card bordered={false}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <CrownOutlined style={{ fontSize: 48, color: '#ffd700', marginBottom: 16 }} />
          <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>选择您的会员计划</h1>
          <p style={{ color: '#666', fontSize: 16 }}>解锁全部功能，提升您的业务效率</p>
        </div>

        {/* 订阅计划 */}
        <Row gutter={[24, 24]}>
          {plans.map((plan) => (
            <Col key={plan.id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  border: selectedPlan === plan.id ? '2px solid #1890ff' : undefined,
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {plan.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: '#ff4d4f',
                      color: '#fff',
                      padding: '4px 12px',
                      fontSize: 14,
                      borderBottomLeftRadius: 12,
                      fontWeight: 'bold'
                    }}
                  >
                    推荐
                  </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>{plan.name}</h3>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 36, fontWeight: 'bold', color: '#1890ff' }}>
                      ¥{plan.price}
                    </span>
                    <span style={{ color: '#999', marginLeft: 8 }}>/{plan.duration}</span>
                  </div>
                  <div>
                    <span style={{ textDecoration: 'line-through', color: '#999', marginRight: 8 }}>
                      原价 ¥{plan.originalPrice}
                    </span>
                    <Tag color="red">立省{getDiscount(plan.originalPrice, plan.price)}%</Tag>
                  </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                  {plan.features.map((feature, index) => (
                    <li key={index} style={{ marginBottom: 12, color: '#666' }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  type={selectedPlan === plan.id ? 'primary' : 'default'}
                  size="large"
                  block
                >
                  {selectedPlan === plan.id ? '已选择' : '选择此计划'}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 支付方式 */}
        {selectedPlan && (
          <Card
            title="选择支付方式"
            style={{ marginTop: 24 }}
            bordered={false}
          >
            <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <Radio.Button value={PaymentMethod.ALIPAY}>
                <AlipayOutlined style={{ marginRight: 8 }} />
                支付宝
              </Radio.Button>
              <Radio.Button value={PaymentMethod.WECHAT}>
                <WechatOutlined style={{ marginRight: 8 }} />
                微信支付
              </Radio.Button>
            </Radio.Group>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Button
                type="primary"
                size="large"
                icon={<CrownOutlined />}
                onClick={handleCreateOrder}
                style={{ height: 48, width: 300 }}
              >
                立即订阅 ¥{plans.find(p => p.id === selectedPlan)?.price}
              </Button>
            </div>
          </Card>
        )}

        {/* 服务保障 */}
        <Card
          title={
            <span>
              <SafetyOutlined style={{ marginRight: 8 }} />
              服务保障
            </span>
          }
          style={{ marginTop: 24 }}
          bordered={false}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <ThunderboltOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                <h4>快速开通</h4>
                <p style={{ color: '#666', fontSize: 14 }}>支付后立即开通会员</p>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <SafetyOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
                <h4>安全支付</h4>
                <p style={{ color: '#666', fontSize: 14 }}>支持支付宝、微信支付</p>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <CustomerServiceOutlined style={{ fontSize: 32, color: '#faad14', marginBottom: 8 }} />
                <h4>专属客服</h4>
                <p style={{ color: '#666', fontSize: 14 }}>7x24小时客服支持</p>
              </div>
            </Col>
          </Row>
        </Card>
      </Card>

      {/* 支付二维码弹窗 */}
      <Modal
        title="扫码支付"
        open={payModalVisible}
        onCancel={() => setPayModalVisible(false)}
        footer={null}
        width={400}
        centered
      >
        {paymentStatus === 'pending' ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <QRCode value={qrCode} size={200} />
            <p style={{ marginTop: 16, color: '#666' }}>
              请使用{paymentMethod === PaymentMethod.ALIPAY ? '支付宝' : '微信'}扫描二维码完成支付
            </p>
            <p style={{ color: '#999', fontSize: 12 }}>
              支付金额: ¥{plans.find(p => p.id === selectedPlan)?.price}
            </p>
          </div>
        ) : paymentStatus === 'success' ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
            <p style={{ marginTop: 16, fontSize: 18, fontWeight: 'bold' }}>订阅成功</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#ff4d4f' }}>订阅失败，请重试</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
