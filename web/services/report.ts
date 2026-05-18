'use client';

import request from '@/utils/request';

export interface ReportType {
  key: string;
  name: string;
}

export interface ReportData {
  success: boolean;
  reportName: string;
  type: string;
  total: number;
  data: any[];
  generatedAt: string;
}

export async function getReportTypes(): Promise<ReportType[]> {
  return request.get('/api/report/types');
}

export async function generateReport(params: {
  type: string;
  startDate?: string;
  endDate?: string;
  format?: 'json' | 'csv';
}): Promise<ReportData> {
  return request.post('/api/report/generate', params);
}

export async function exportReport(params: {
  type: string;
  startDate?: string;
  endDate?: string;
}) {
  return request.post('/api/report/export', params);
}
