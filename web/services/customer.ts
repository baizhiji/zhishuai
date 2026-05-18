import request from '@/utils/request';

export interface Customer {
  id: string;
  phone: string;
  name: string;
  avatar?: string;
  status: 'active' | 'frozen';
  role: string;
  materialCount?: number;
  accountCount?: number;
  publishCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFeature {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  subSwitches?: CustomerFeature[];
}

export function getCustomers(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}) {
  return request.get<{
    list: Customer[];
    total: number;
    page: number;
    pageSize: number;
  }>('/api/agent/customers', { params });
}

export function getCustomer(id: string) {
  return request.get<Customer>(`/api/agent/customers/${id}`);
}

export function createCustomer(data: {
  phone: string;
  name?: string;
  password?: string;
}) {
  return request.post<Customer>('/api/agent/customers', data);
}

export function updateCustomer(id: string, data: Partial<Customer>) {
  return request.put<Customer>(`/api/agent/customers/${id}`, data);
}

export function toggleCustomerStatus(id: string) {
  return request.post<Customer>(`/api/agent/customers/${id}/toggle-status`);
}

export function resetCustomerPassword(id: string, newPassword?: string) {
  return request.post<void>(`/api/agent/customers/${id}/reset-password`, {
    newPassword,
  });
}

export function getCustomerFeatures(id: string) {
  return request.get<CustomerFeature[]>('/api/agent/customers/${id}/features');
}

export function updateCustomerFeatures(id: string, features: CustomerFeature[]) {
  return request.put<void>(`/api/agent/customers/${id}/features`, { features });
}

export function getCustomerStats(id: string, params?: {
  startDate?: string;
  endDate?: string;
}) {
  return request.get<{
    materialCount: number;
    accountCount: number;
    publishCount: number;
  }>(`/api/agent/customers/${id}/stats`, { params });
}
