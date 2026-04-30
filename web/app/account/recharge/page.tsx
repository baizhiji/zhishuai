'use client';

import { useState } from 'react';
import { Card, Row, Col, Button, InputNumber, Modal, message, Radio, Tabs, Statistic, Space, Tag, Typography, Divider } from 'antd';
import QRCode from 'qrcode.react';
import {
  WalletOutlined,
  AlipayOutlined,
  WechatOutlined,
  CheckCircleOutlined,
  GiftOutlined,
  HistoryOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography

interface RechargePackage {
  amount: number;
  bonus: number;
  popular?: boolean;
}

interface RechargeRecord {
  id: string;
  amount: number;
  method: string;
  status: 'success' | 'pending' | 'failed';
  time: string;
  orderNo: string;
}

export default function RechargePage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'wechat'>('alipay');
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // 模拟账户余额
  const [balance] = useState(2880);

  const rechargePackages: RechargePackage[] = [
    { amount: 50, bonus: 0 },
    { amount: 100, bonus: 10 },
    { amount: 200, bonus: 25, popular: true },
    { amount: 500, bonus: 80 },
    { amount: 1000, bonus: 200 },
    { amount: 2000, bonus: 500 },
  ];

  // 充值记录
  const [records] = useState<RechargeRecord[]>([
    { id: '1', amount: 500, method: '支付宝', status: 'success', time: '2024-04-28 10:15', orderNo: 'RE20240428001' },
    { id: '2', amount: 200, method: '微信支付', status: 'success', time: '2024-04-20 15:30', orderNo: 'RE20240420001' },
    { id: '3', amount: 100, method: '支付宝', status: 'success', time: '2024-04-10 09:00', orderNo: 'RE20240410001' },
  ]);

  // 计算总金额（充值金额 + 赠送金额）
  const getTotalAmount = (amount: number): number => {
    const pkg = rechargePackages.find(p => p.amount === amount);
    return pkg ? amount + pkg.bonus : amount;
  };

  // 获取赠送金额
  const getBonus = (amount: number): number => {
    const pkg = rechargePackages.find(p => p.amount === amount);
    return pkg?.bonus || 0;
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

  // 当前充值金额
  const currentAmount = customAmount || selectedAmount || 0;
  const currentBonus = getBonus(currentAmount);

  // 发起充值
  const handleRecharge = () => {
    if (!currentAmount || currentAmount < 10) {
      message.warning('充值金额不能少于10元');
      return;
    }
    setPayModalVisible(true);
  };

  // 确认支付
  const handleConfirmPay = () => {
    setLoading(true);
    setTimeout(() => {
      message.success('充值成功！');
      setLoading(false);
      setPayModalVisible(false);
    }, 2000);
  };

  // 续费套餐
  const renewalPlans = [
    { months: 1, price: 99, originalPrice: 199, discount: 50 },
    { months: 3, price: 269, originalPrice: 597, discount: 55 },
    { months: 6, price: 499, originalPrice: 1194, discount: 58 },
    { months: 12, price: 899, originalPrice: 2388, discount: 62, popular: true },
  ];

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">账户充值</Title>

      <Tabs
        defaultActiveKey="recharge"
        items={[
          {
            key: 'recharge',
            label: <span><WalletOutlined /> 账户充值</span>,
            children: (
              <Row gutter={24}>
                {/* 左侧：充值金额选择 */}
                <Col span={16}>
                  <Card title="选择充值金额" className="mb-4">
                    <div className="mb-4">
                      <Text type="secondary">当前账户余额：</Text>
                      <Statistic 
                        value={balance} 
                        prefix="¥" 
                        className="inline-block ml-2"
                        valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                      />
                    </div>
                    
                    <Row gutter={[16, 16]}>
                      {rechargePackages.map(pkg => (
                        <Col span={8} key={pkg.amount}>
                          <Card
                            hoverable
                            className={`text-center ${selectedAmount === pkg.amount ? 'border-primary' : ''}`}
                            style={{ 
                              borderColor: selectedAmount === pkg.amount ? '#1890ff' : '#d9d9d9',
                              backgroundColor: selectedAmount === pkg.amount ? '#e6f7ff' : '#fff'
                            }}
                            onClick={() => handleSelectAmount(pkg.amount)}
                          >
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                              ¥{pkg.amount}
                            </div>
                            {pkg.bonus > 0 && (
                              <Tag color="red" className="mt-2">
                                送 ¥{pkg.bonus}
                              </Tag>
                            )}
                            {pkg.popular && <Tag color="gold" className="mt-2">推荐</Tag>}
                          </Card>
                        </Col>
                      ))}
                    </Row>

                    <Divider>自定义金额</Divider>
                    <Space>
                      <InputNumber
                        min={10}
                        max={100000}
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        placeholder="输入充值金额"
                        style={{ width: 200 }}
                        formatter={value => `¥ ${value}`}
                        parser={value => value?.replace(/¥\s?/g, '') as any}
                      />
                      <Text type="secondary">最低充值10元</Text>
                    </Space>
                  </Card>

                  {/* 支付方式 */}
                  <Card title="选择支付方式" className="mb-4">
                    <Radio.Group 
                      value={paymentMethod} 
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="flex gap-4"
                    >
                      <Radio.Button value="alipay" style={{ height: 60, width: 150 }}>
                        <div className="text-center">
                          <AlipayOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                          <div>支付宝</div>
                        </div>
                      </Radio.Button>
                      <Radio.Button value="wechat" style={{ height: 60, width: 150 }}>
                        <div className="text-center">
                          <WechatOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                          <div>微信支付</div>
                        </div>
                      </Radio.Button>
                    </Radio.Group>
                  </Card>

                  {/* 充值说明 */}
                  <Card title="充值说明">
                    <ul className="pl-4">
                      <li>充值金额实时到账，可用于平台所有付费服务</li>
                      <li>充值的金额永不过期，可随时使用</li>
                      <li>赠送金额将在充值成功后自动添加到账户</li>
                      <li>如需开具发票，请联系客服</li>
                    </ul>
                  </Card>
                </Col>

                {/* 右侧：订单确认 */}
                <Col span={8}>
                  <Card title="订单确认" className="sticky top-4">
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <Text>充值金额</Text>
                        <Text strong>¥{currentAmount}</Text>
                      </div>
                      {currentBonus > 0 && (
                        <div className="flex justify-between mb-2">
                          <Text type="success">赠送金额</Text>
                          <Text type="success" strong>+¥{currentBonus}</Text>
                        </div>
                      )}
                      <div className="flex justify-between mb-2">
                        <Text>支付方式</Text>
                        <Text>{paymentMethod === 'alipay' ? '支付宝' : '微信支付'}</Text>
                      </div>
                      <Divider />
                      <div className="flex justify-between">
                        <Text strong>实际支付</Text>
                        <Text strong style={{ fontSize: '20px', color: '#1890ff' }}>
                          ¥{currentAmount}
                        </Text>
                      </div>
                    </div>
                    <Button 
                      type="primary" 
                      block 
                      size="large"
                      disabled={currentAmount < 10}
                      onClick={handleRecharge}
                    >
                      立即充值
                    </Button>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'renewal',
            label: <span><CheckCircleOutlined /> 套餐续费</span>,
            children: (
              <Card>
                <Row gutter={16}>
                  {renewalPlans.map(plan => (
                    <Col span={6} key={plan.months}>
                      <Card
                        hoverable
                        className="text-center"
                        style={{ 
                          borderColor: plan.popular ? '#1890ff' : '#d9d9d9',
                          position: 'relative',
                        }}
                      >
                        {plan.popular && (
                          <Tag color="gold" style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                            最划算
                          </Tag>
                        )}
                        <div className="mb-4">
                          <Text type="secondary">{plan.months}个月</Text>
                          <div style={{ fontSize: '12px', textDecoration: 'line-through', color: '#999' }}>
                            ¥{plan.originalPrice}
                          </div>
                          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff' }}>
                            ¥{plan.price}
                          </div>
                          <Tag color="green">省{plan.discount}%</Tag>
                        </div>
                        <ul className="text-left pl-4 text-sm">
                          <li>无限次内容生成</li>
                          <li>矩阵账号管理</li>
                          <li>智能获客</li>
                          <li>专属客服</li>
                        </ul>
                        <Button type={plan.popular ? 'primary' : 'default'} block className="mt-4">
                          立即续费
                        </Button>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            ),
          },
          {
            key: 'history',
            label: <span><HistoryOutlined /> 充值记录</span>,
            children: (
              <Card>
                <Row gutter={16} className="mb-4">
                  {records.map(record => (
                    <Col span={24} key={record.id}>
                      <Card size="small" className="mb-2">
                        <Row align="middle">
                          <Col span={6}>
                            <Text strong>¥{record.amount}</Text>
                          </Col>
                          <Col span={6}>
                            <Text type="secondary">{record.method}</Text>
                          </Col>
                          <Col span={6}>
                            <Tag color={record.status === 'success' ? 'success' : record.status === 'pending' ? 'processing' : 'error'}>
                              {record.status === 'success' ? '充值成功' : record.status === 'pending' ? '处理中' : '失败'}
                            </Tag>
                          </Col>
                          <Col span={4}>
                            <Text type="secondary">{record.time}</Text>
                          </Col>
                          <Col span={2}>
                            <Text type="secondary">{record.orderNo}</Text>
                          </Col>
                        </Row>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            ),
          },
        ]}
      />

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
            <Text strong style={{ fontSize: '24px', color: '#1890ff' }}>¥{currentAmount}</Text>
          </div>
          {currentBonus > 0 && (
            <div>
              <GiftOutlined className="mr-1" />
              <Text type="success">将获得 ¥{currentBonus} 赠送</Text>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
