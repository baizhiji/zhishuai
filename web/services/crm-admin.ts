'use client';

import request from '@/utils/request';

// 客户类型
export interface Customer {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  company?: string;
  industry?: string;
  status: 'potential' | 'active' | 'inactive' | 'lost';
  level: 'vip' | 'normal' | 'trial';
  source?: string; // 客户来源
  agentId?: string;
  agentName?: string;
  employeeCount?: number;
  monthlyFee?: number;
  totalPaid?: number;
  lastContactAt?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// 跟进记录
export interface FollowUpRecord {
  id: string;
  customerId: string;
  type: 'call' | 'visit' | 'wechat' | 'email' | 'other';
  content: string;
  nextPlan?: string;
  nextFollowUpAt?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

// 统计数据
export interface CustomerStats {
  totalCustomers: number;
  newThisMonth: number;
  activeCustomers: number;
  lostCustomers: number;
  totalRevenue: number;
  conversionRate: number;
}

// 获取客户列表
export function getCustomers(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  level?: string;
  agentId?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
}) {
  return request.get<{
    list: Customer[];
    total: number;
    page: number;
    pageSize: number;
  }>('/api/crm/customers', { params });
}

// 获取单个客户详情
export function getCustomer(id: string) {
  return request.get<Customer>(`/api/crm/customers/${id}`);
}

// 创建客户
export function createCustomer(data: Partial<Customer>) {
  return request.post<Customer>('/api/crm/customers', data);
}

// 更新客户
export function updateCustomer(id: string, data: Partial<Customer>) {
  return request.put<Customer>(`/api/crm/customers/${id}`, data);
}

// 删除客户
export function deleteCustomer(id: string) {
  return request.delete<void>(`/api/crm/customers/${id}`);
}

// 获取跟进记录
export function getFollowUps(customerId: string, params?: {
  page?: number;
  pageSize?: number;
}) {
  return request.get<{
    list: FollowUpRecord[];
    total: number;
  }>(`/api/crm/customers/${customerId}/follow-ups`, { params });
}

// 添加跟进记录
export function addFollowUp(customerId: string, data: Partial<FollowUpRecord>) {
  return request.post<FollowUpRecord>(`/api/crm/customers/${customerId}/follow-ups`, data);
}

// 获取统计数据
export function getCustomerStats(params?: {
  startDate?: string;
  endDate?: string;
  agentId?: string;
}) {
  return request.get<CustomerStats>('/api/crm/stats', { params });
}

// 导出客户
export function exportCustomers(params?: {
  keyword?: string;
  status?: string;
  level?: string;
  agentId?: string;
}) {
  // 导出功能暂不实现
  return Promise.reject(new Error('导出功能暂未实现'));
}
