import { message } from 'antd';
import type { PaymentMethod, Order, OrderType, SubscriptionPlan } from '@/types/api';

// 支付状态
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 支付结果
export interface PaymentResult {
  orderId: string;
  status: PaymentStatus;
  paymentUrl?: string;
  qrCode?: string;
  transactionId?: string;
  error?: string;
}

// 支付配置
export interface PaymentConfig {
  alipay: {
    appId: string;
    gateway: string;
    publicKey: string;
    privateKey: string;
  };
  wechat: {
    appId: string;
    mchId: string;
    apiKey: string;
    certPath: string;
  };
}

// 支付服务
class PaymentService {
  // 创建充值订单
  async createRechargeOrder(
    amount: number,
    paymentMethod: PaymentMethod
  ): Promise<PaymentResult> {
    try {
      // 调用API创建订单
      const response = await fetch('/api/orders/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount, paymentMethod })
      });

      const data = await response.json();

      if (data.code === 200) {
        return {
          orderId: data.data.orderId,
          status: PaymentStatus.PENDING,
          paymentUrl: data.data.paymentUrl,
          qrCode: data.data.qrCode
        };
      }

      throw new Error(data.message || '创建订单失败');
    } catch (error) {
      message.error('创建订单失败');
      return {
        orderId: '',
        status: PaymentStatus.FAILED,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 创建订阅订单
  async createSubscribeOrder(
    planId: SubscriptionPlan,
    paymentMethod: PaymentMethod
  ): Promise<PaymentResult> {
    try {
      const response = await fetch('/api/orders/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ planId, paymentMethod })
      });

      const data = await response.json();

      if (data.code === 200) {
        return {
          orderId: data.data.orderId,
          status: PaymentStatus.PENDING,
          paymentUrl: data.data.paymentUrl,
          qrCode: data.data.qrCode
        };
      }

      throw new Error(data.message || '创建订单失败');
    } catch (error) {
      message.error('创建订单失败');
      return {
        orderId: '',
        status: PaymentStatus.FAILED,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 支付宝支付
  async alipayPayment(orderId: string): Promise<PaymentResult> {
    try {
      // 获取支付宝支付链接
      const response = await fetch(`/api/payments/alipay/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.code === 200) {
        // 跳转到支付宝支付页面
        if (data.data.paymentUrl) {
          window.open(data.data.paymentUrl, '_blank');
        }

        return {
          orderId,
          status: PaymentStatus.PROCESSING,
          paymentUrl: data.data.paymentUrl
        };
      }

      throw new Error(data.message || '支付失败');
    } catch (error) {
      message.error('支付失败');
      return {
        orderId,
        status: PaymentStatus.FAILED,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 微信支付
  async wechatPayment(orderId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`/api/payments/wechat/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.code === 200) {
        return {
          orderId,
          status: PaymentStatus.PROCESSING,
          qrCode: data.data.qrCode
        };
      }

      throw new Error(data.message || '支付失败');
    } catch (error) {
      message.error('支付失败');
      return {
        orderId,
        status: PaymentStatus.FAILED,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 查询支付状态
  async queryPaymentStatus(orderId: string): Promise<PaymentStatus> {
    try {
      const response = await fetch(`/api/payments/status/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.code === 200) {
        return data.data.status as PaymentStatus;
      }

      return PaymentStatus.PENDING;
    } catch (error) {
      return PaymentStatus.FAILED;
    }
  }

  // 取消订单
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.code === 200) {
        message.success('订单已取消');
        return true;
      }

      throw new Error(data.message || '取消订单失败');
    } catch (error) {
      message.error('取消订单失败');
      return false;
    }
  }

  // 轮询支付状态
  pollPaymentStatus(
    orderId: string,
    onSuccess: () => void,
    onFailed: () => void,
    interval: number = 2000,
    maxAttempts: number = 30
  ): NodeJS.Timeout {
    let attempts = 0;

    const poll = async () => {
      attempts++;

      if (attempts >= maxAttempts) {
        onFailed();
        return;
      }

      const status = await this.queryPaymentStatus(orderId);

      if (status === PaymentStatus.SUCCESS) {
        onSuccess();
      } else if (status === PaymentStatus.FAILED || status === PaymentStatus.CANCELLED) {
        onFailed();
      } else {
        // 继续轮询
        return setTimeout(poll, interval);
      }
    };

    return setTimeout(poll, interval);
  }
}

// 创建支付服务实例
const paymentService = new PaymentService();
export default paymentService;
