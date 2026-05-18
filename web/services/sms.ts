import request from '@/utils/request';

export interface SmsConfig {
  id: string;
  name: string;
  provider: 'aliyun' | 'tencent';
  accessKeyId: string;
  accessKeySecret: string;
  signName: string;
  templateCode: string;
  enabled: boolean;
  isDefault: boolean;
}

export interface SmsLog {
  id: string;
  phone: string;
  type: string;
  code: string;
  status: string;
  provider: string;
  response: string;
  createdAt: string;
}

export function getSmsConfigs() {
  return request.get<SmsConfig[]>('/api/sms/configs');
}

export function getSmsConfig(id: string) {
  return request.get<SmsConfig>(`/api/sms/config/${id}`);
}

export function createSmsConfig(data: Partial<SmsConfig>) {
  return request.post<SmsConfig>('/api/sms/config', data);
}

export function updateSmsConfig(id: string, data: Partial<SmsConfig>) {
  return request.put<SmsConfig>(`/api/sms/config/${id}`, data);
}

export function deleteSmsConfig(id: string) {
  return request.delete<void>(`/api/sms/config/${id}`);
}

export function setDefaultConfig(id: string) {
  return request.post<void>(`/api/sms/config/${id}/default`);
}

export function getSmsLogs(params: {
  page?: number;
  pageSize?: number;
  phone?: string;
  type?: string;
  status?: string;
}) {
  return request.get<{
    list: SmsLog[];
    total: number;
    page: number;
    pageSize: number;
  }>('/api/sms/logs', { params });
}

export function testSmsConfig(id: string) {
  return request.post<{ success: boolean; message: string }>(`/api/sms/config/${id}/test`);
}
