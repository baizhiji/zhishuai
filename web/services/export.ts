import request from '@/utils/request';

// 导出客户数据
export function exportCustomers(params?: {
  format?: 'csv' | 'xlsx' | 'json';
  level?: string;
  status?: string;
}) {
  return request.get('/api/export/customers', { params });
}

// 导出获客数据
export function exportAcquisitionData(params?: {
  format?: 'csv' | 'xlsx' | 'json';
  source?: string;
  intentLevel?: string;
  status?: string;
}) {
  return request.get('/api/export/acquisition', { params });
}

// 导出发布记录
export function exportPublishRecords(params?: {
  format?: 'csv' | 'xlsx' | 'json';
  platform?: string;
  status?: string;
}) {
  return request.get('/api/export/publish', { params });
}

// 导出统计数据
export function exportStatistics(params?: {
  format?: 'csv' | 'xlsx' | 'json';
  period?: '7d' | '30d' | '90d' | '1y';
}) {
  return request.get('/api/export/statistics', { params });
}
