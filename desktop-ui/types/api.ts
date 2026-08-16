// API响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// ========== 订单/支付 ==========

export enum OrderType {
  RECHARGE = 'recharge',
  SUBSCRIBE = 'subscribe'
}

export enum PaymentMethod {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  BALANCE = 'balance'
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum SubscriptionPlan {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export interface Order {
  id: string;
  type: OrderType;
  amount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  planId?: SubscriptionPlan;
  createdAt: string;
  paidAt?: string;
}
