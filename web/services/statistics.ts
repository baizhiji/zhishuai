'use client';

import request from '@/utils/request';

export interface OverviewStats {
  totalUsers: number;
  totalAgents: number;
  totalCustomers: number;
  todayActiveUsers: number;
  totalMaterials: number;
  totalPosts: number;
  totalLeads: number;
  totalRevenue: number;
}

export interface TrendData {
  date: string;
  newUsers: number;
  newAgents: number;
  newCustomers: number;
  apiCalls: number;
  revenue: number;
}

export interface PlatformStats {
  name: string;
  count: number;
  percentage: number;
}

// 获取总览数据
export async function getOverview(): Promise<OverviewStats> {
  return request.get('/api/statistics/admin/overview');
}

// 获取趋势数据
export async function getTrend(days: number = 7): Promise<TrendData[]> {
<<<<<<< HEAD
  return request.get('/api/statistics/admin/trend', { days });
=======
  return request.get('/api/statistics/admin/trend', { params: { days } });
>>>>>>> 962968886be726cd434c792933b5515366d34518
}

// 获取平台分布
export async function getPlatformStats(): Promise<PlatformStats[]> {
  return request.get('/api/statistics/admin/platforms');
}

// 获取代理商列表（带统计数据）
export async function getAgentStats(): Promise<any[]> {
  return request.get('/api/statistics/admin/agents');
}
