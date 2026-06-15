'use client';

import request from '@/utils/request';

export interface AdminLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  target?: string;
  detail?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    name?: string;
    phone?: string;
    role?: string;
  };
}

export interface LogStats {
  totalLogs: number;
  todayLogs: number;
  actionStats: { action: string; count: number }[];
}

export async function getLogs(params?: {
  page?: number;
  pageSize?: number;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}) {
<<<<<<< HEAD
  return request.get('/api/admin/logs', params);
}

export async function getLogStats(days: number = 7): Promise<LogStats> {
  return request.get('/api/admin/logs/stats', { days });
=======
  return request.get('/api/admin/logs', { params });
}

export async function getLogStats(days: number = 7): Promise<LogStats> {
  return request.get('/api/admin/logs/stats', { params: { days } });
>>>>>>> 962968886be726cd434c792933b5515366d34518
}
