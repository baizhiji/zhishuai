'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, InputNumber, Modal, QRCode, message, Radio, Tabs } from 'antd';
import {
  WalletOutlined,
  AlipayOutlined,
  WechatOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import paymentService from '@/services/paymentService';
import { PaymentMethod } from '@/types/api';

interface RechargePackage {
  amount: number;
  bonus: number;
  popular?: boolean;
}

export default function RechargePage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.ALIPAY);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [orderId, setOrderId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');

  const rechargePackages: RechargePackage[] = [
    { amount: 50, bonus: 0 },
    { amount: 100, bonus: 10 },
    { amount: 200, bonus: 25, popular: true },
    { amount: 500, bonus: 80 },
    { amount: 1000, bonus: 200 }
  ];

  // 计算总金额（充值金额 + 赠送金额）
  const getTotalAmount = (amount: number): number => {
    const pkg = rechargePackages.find(p => p.amount === amount);
    return pkg ? amount + pkg.bonus : amount;
  };

  // 选择充值金额
  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(null);
  };

  // 自定义充值金额
  const handleCustomAmountChange = (value: number | null) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  // 创建充值订单
  const handleCreateOrder = async () => {
    const amount = selectedAmount || customAmount;

    if (!amount || amount <= 0) {
      message.warning('请选择或输入充值金额');
      return;
    }

    if (amount < 1) {
      message.warning('充值金额不能小于1元');
      return;
    }

    try {
      const result = await paymentService.createRechargeOrder(amount, paymentMethod);

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
              message.success('充值成功');
              setTimeout(() => {
                setPayModalVisible(false);
                window.location.reload();
              }, 2000);
            },
            () => {
              setPaymentStatus('failed');
              message.error('充值失败');
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

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Card title="账户充值" bordered={false}>
        {/* 充值套餐 */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>选择充值金额</h3>
          <Row gutter={[16, 16]}>
            {rechargePackages.map((pkg) => (
              <Col key={pkg.amount} xs={12} sm={8} md={6} lg={4}>
                <Card
                  hoverable
                  style={{
                    textAlign: 'center',
                    border: selectedAmount === pkg.amount ? '2px solid #1890ff' : undefined,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => handleSelectAmount(pkg.amount)}
                >
                  {pkg.popular && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: '#ff4d4f',
                        color: '#fff',
                        padding: '2px 8px',
                        fontSize: 12,
                        borderBottomLeftRadius: 8
                      }}
                    >
                      热门
                    </div>
                  )}
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    ¥{pkg.amount}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                    到账 ¥{pkg.amount + pkg.bonus}
                  </div>
                  {pkg.bonus > 0 && (
                    <div style={{ fontSize: 12, color: '#ff4d4f', marginTop: 4 }}>
                      赠送 ¥{pkg.bonus}
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 自定义金额 */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>或输入自定义金额</h3>
          <InputNumber
            style={{ width: 200 }}
            placeholder="请输入金额"
            min={1}
            max={100000}
            precision={2}
            value={customAmount}
            onChange={handleCustomAmountChange}
            prefix="¥"
            suffix="元"
          />
        </div>

        {/* 支付方式 */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>选择支付方式</h3>
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
        </div>

        {/* 充值按钮 */}
        <Button
          type="primary"
          size="large"
          icon={<WalletOutlined />}
          onClick={handleCreateOrder}
          disabled={!selectedAmount && !customAmount}
          block
          style={{ height: 48 }}
        >
          立即充值 ¥{(selectedAmount || customAmount || 0).toFixed(2)}
        </Button>

        {/* 温馨提示 */}
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 4
          }}
        >
          <h4 style={{ color: '#52c41a', marginBottom: 8 }}>温馨提示：</h4>
          <ul style={{ color: '#666', marginLeft: 20, marginBottom: 0 }}>
            <li>充值金额将在10分钟内到账</li>
            <li>充值成功后可享受套餐赠送优惠</li>
            <li>如有问题请联系客服处理</li>
          </ul>
        </div>
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
            <p style={{ color: '#999', fontSize: 12 }}>支付金额: ¥{(selectedAmount || customAmount || 0).toFixed(2)}</p>
          </div>
        ) : paymentStatus === 'success' ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
            <p style={{ marginTop: 16, fontSize: 18, fontWeight: 'bold' }}>充值成功</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#ff4d4f' }}>充值失败，请重试</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
