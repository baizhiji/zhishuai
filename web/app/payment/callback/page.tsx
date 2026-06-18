'use client';

import { useEffect, useState } from 'react';
import { Result, Button, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import request from '@/lib/request';

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('正在处理支付结果...');

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const payStatus = searchParams.get('status');

    if (payStatus === 'success' && orderId) {
      verifyPayment(orderId);
    } else if (payStatus === 'cancelled') {
      setStatus('failed');
      setMessage('支付已取消');
    } else {
      setStatus('failed');
      setMessage('无效的支付回调参数');
    }
  }, []);

  const verifyPayment = async (orderId: string) => {
    try {
      const res = await request.post('/orders/verify-payment', { orderId }) as any;
      if (res?.success || res?.code === 200) {
        setStatus('success');
        setMessage('支付成功！您的服务已开通');
      } else {
        setStatus('failed');
        setMessage(res?.message || '支付验证失败，请联系客服');
      }
    } catch (error: any) {
      setStatus('failed');
      setMessage(error?.message || '支付验证失败，请联系客服');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Spin size="large" tip={message} />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 72 }} />}
          title="支付成功"
          subTitle={message}
          extra={[
            <Button type="primary" key="dashboard" onClick={() => router.push('/customer/dashboard')}>
              进入控制台
            </Button>,
            <Button key="orders" onClick={() => router.push('/account/subscribe')}>
              查看订单
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Result
        status="error"
        icon={<CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 72 }} />}
        title="支付失败"
        subTitle={message}
        extra={[
          <Button type="primary" key="retry" onClick={() => router.push('/account/subscribe')}>
            重新选择套餐
          </Button>,
          <Button key="home" onClick={() => router.push('/customer/dashboard')}>
            返回首页
          </Button>,
        ]}
      />
    </div>
  );
}
