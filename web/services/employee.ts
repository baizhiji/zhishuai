'use client';

import request from '@/utils/request';

export interface Employee {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  role: 'staff' | 'manager' | 'admin';
  permissions?: string[];
  status: 'active' | 'disabled';
  lastLoginAt?: string;
  createdAt: string;
}

export interface LoginResponse extends Employee {
  mainUserId: string;
  token: string;
}

export interface EmployeeLoginLog {
  id: string;
  employeeId: string;
  ip?: string;
  userAgent?: string;
  status: string;
  errorMsg?: string;
  createdAt: string;
}

// 获取员工列表
export async function getEmployees(params?: {
  userId?: string;
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}) {
<<<<<<< HEAD
  return request.get('/api/employee/employees', params);
=======
  return request.get('/api/employee/employees', { params });
>>>>>>> 962968886be726cd434c792933b5515366d34518
}

// 创建员工
export async function createEmployee(data: {
  userId: string;
  name: string;
  phone: string;
  password?: string;
  email?: string;
  role?: string;
}) {
  return request.post('/api/employee/employees', data);
}

// 更新员工
export async function updateEmployee(id: string, data: Partial<Employee>) {
  return request.put(`/api/employee/employees/${id}`, data);
}

// 重置密码
export async function resetEmployeePassword(id: string, password?: string) {
  return request.put(`/api/employee/employees/${id}/reset-password`, { password });
}

// 删除员工
export async function deleteEmployee(id: string) {
  return request.delete(`/api/employee/employees/${id}`);
}

// 员工登录
export async function employeeLogin(phone: string, password: string): Promise<LoginResponse> {
  return request.post('/api/employee/employees/login', { phone, password });
}

// 获取登录日志
export async function getEmployeeLoginLogs(id: string, params?: { page?: number; pageSize?: number }) {
<<<<<<< HEAD
  return request.get(`/api/employee/employees/${id}/login-logs`, params);
=======
  return request.get(`/api/employee/employees/${id}/login-logs`, { params });
>>>>>>> 962968886be726cd434c792933b5515366d34518
}
