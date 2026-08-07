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

  // 冻结/解冻客户（toggle-status 自动切换状态）
  freezeCustomer: (id: string) => {
    return request.post(`/api/agent/customers/${id}/toggle-status`);
  },

  // 解冻客户（复用 toggle-status，服务端自动切换 active ↔ frozen）
  unfreezeCustomer: (id: string) => {
    return request.post(`/api/agent/customers/${id}/toggle-status`);
  },

  // 获取统计数据
  getStats: () => {
    return request.get('/api/agent/statistics');
  },

  // 获取功能开关列表（当前登录用户自身的功能开关）
  getFeatureSwitches: (_customerId?: string) => {
    return request.get('/api/features');
  },

  // TODO: 设置客户功能开关 — 服务端 features API 仅支持用户自操作（基于 auth userId），
  // 尚不支持代理商为客户设置功能。需新增服务端路由后启用。
  // 如需启动，请在 server/src/routes/ 添加 /api/features/customer/:id/toggle 端点。
  /*
  setCustomerFeature: (customerId: string, featureKey: string, enabled: boolean) => {
    return request.put(`/api/features/customer/${customerId}`, { featureKey, enabled });
  },
  */

  // TODO: 批量设置客户功能开关 — 同上，需服务端先支持。
  /*
  batchSetCustomerFeatures: (customerId: string, features: Record<string, boolean>) => {
    return request.put(`/api/features/customer/${customerId}/batch`, { features });
  },
  */
};

export default customerService;
