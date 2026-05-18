import request from '@/utils/request';

export interface Customer {
  id: string;
  userId: string;
  phone: string;
  nickname?: string;
  status: 'active' | 'frozen';
  createdAt: string;
  stats?: {
    totalPosts: number;
    totalLeads: number;
    totalApplications: number;
  };
}

export interface FeatureSwitch {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
}

export const customerService = {
  // 获取客户列表
  getCustomers: (params?: { page?: number; pageSize?: number; keyword?: string }) => {
    return request.get('/api/agent/customers', { params });
  },

  // 获取客户详情
  getCustomer: (id: string) => {
    return request.get(`/api/agent/customers/${id}`);
  },

  // 创建客户
  createCustomer: (data: Partial<Customer>) => {
    return request.post('/api/agent/customers', data);
  },

  // 更新客户
  updateCustomer: (id: string, data: Partial<Customer>) => {
    return request.put(`/api/agent/customers/${id}`, data);
  },

  // 冻结客户
  freezeCustomer: (id: string) => {
    return request.post(`/api/agent/customers/${id}/freeze`);
  },

  // 解冻客户
  unfreezeCustomer: (id: string) => {
    return request.post(`/api/agent/customers/${id}/unfreeze`);
  },

  // 重置客户密码
  resetPassword: (id: string, newPassword: string) => {
    return request.post(`/api/agent/customers/${id}/reset-password`, { newPassword });
  },

  // 获取功能开关列表
  getFeatureSwitches: () => {
    return request.get('/api/user/features');
  },

  // 获取客户功能开关
  getCustomerFeatures: (customerId: string) => {
    return request.get(`/api/user/features/customer/${customerId}`);
  },

  // 设置客户功能开关
  setCustomerFeature: (customerId: string, featureKey: string, enabled: boolean) => {
    return request.post(`/api/user/features/customer/${customerId}`, {
      featureKey,
      enabled,
    });
  },

  // 批量设置客户功能开关
  batchSetCustomerFeatures: (customerId: string, features: Record<string, boolean>) => {
    return request.post(`/api/user/features/customer/${customerId}/batch`, { features });
  },

  // 获取统计数据
  getStats: () => {
    return request.get('/api/agent/stats');
  },
};
