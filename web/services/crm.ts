'use client';

import request from '@/utils/request';

// 客户类型
export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  wechat?: string;
  company?: string;
  position?: string;
  source?: string;
  level: string;
  status: 'potential' | 'active' | 'inactive' | 'lost';
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
  potentialCustomers: number;
  totalRevenue: number;
}

// 获取我的客户列表
export function getMyCustomers(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  level?: string;
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
export function getFollowUps(customerId: string) {
  return request.get<{ list: FollowUpRecord[] }>(`/api/crm/customers/${customerId}/follow-ups`);
}

// 添加跟进记录
export function addFollowUp(customerId: string, data: Partial<FollowUpRecord>) {
  return request.post<FollowUpRecord>(`/api/crm/customers/${customerId}/follow-ups`, data);
}

// 获取我的统计数据
export function getMyStats() {
  return request.get<CustomerStats>('/api/crm/my-stats');
}

// 获取公海池客户
export function getPublicPool(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}) {
  return request.get<{
    list: Customer[];
    total: number;
    page: number;
    pageSize: number;
  }>('/api/crm/public-pool', { params });
}

// 认领公海客户
export function claimCustomer(id: string) {
  return request.post<void>(`/api/crm/customers/${id}/claim`);
}

// 放入公海
export function releaseToPool(id: string) {
  return request.post<void>(`/api/crm/customers/${id}/release`);
}
