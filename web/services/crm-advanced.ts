import request from '../utils/request';

// ==================== 标签管理 ====================

export interface CrmTag {
  id: string;
  userId: string;
  name: string;
  color: string;
  customerCount?: number;
  createdAt: string;
}

export async function getTags(): Promise<CrmTag[]> {
  return request.get('/api/crm-advanced/tags');
}

export async function createTag(data: { name: string; color?: string }): Promise<CrmTag> {
  return request.post('/api/crm-advanced/tags', data);
}

export async function updateTag(id: string, data: { name?: string; color?: string }): Promise<CrmTag> {
  return request.put(`/api/crm-advanced/tags/${id}`, data);
}

export async function deleteTag(id: string): Promise<void> {
  return request.delete(`/api/crm-advanced/tags/${id}`);
}

export async function updateCustomerTags(
  customerId: string,
  tagIds: string[],
  action: 'add' | 'remove'
): Promise<void> {
  return request.post(`/api/crm-advanced/customers/${customerId}/tags`, { tagIds, action });
}

// ==================== 自动化规则 ====================

export interface CrmAutomationRule {
  id: string;
  userId: string;
  name: string;
  trigger: 'follow_up_overdue' | 'level_change' | 'source_change' | 'tag_added' | 'days_inactive';
  condition: any;
  action: any;
  isActive: boolean;
  lastRunAt?: string;
  runCount: number;
  createdAt: string;
}

export async function getAutomationRules(): Promise<CrmAutomationRule[]> {
  return request.get('/api/crm-advanced/rules');
}

export async function createAutomationRule(data: {
  name: string;
  trigger: string;
  condition: any;
  action: any;
}): Promise<CrmAutomationRule> {
  return request.post('/api/crm-advanced/rules', data);
}

export async function updateAutomationRule(
  id: string,
  data: { name?: string; trigger?: string; condition?: any; action?: any; isActive?: boolean }
): Promise<CrmAutomationRule> {
  return request.put(`/api/crm-advanced/rules/${id}`, data);
}

export async function deleteAutomationRule(id: string): Promise<void> {
  return request.delete(`/api/crm-advanced/rules/${id}`);
}

// ==================== 提醒管理 ====================

export interface CrmReminder {
  id: string;
  userId: string;
  customerId: string;
  type: 'follow_up' | 'contract' | 'birthday' | 'custom';
  title: string;
  remindAt: string;
  isCompleted: boolean;
  createdAt: string;
}

export async function getReminders(params?: { upcoming?: boolean; completed?: boolean }): Promise<CrmReminder[]> {
  return request.get('/api/crm-advanced/reminders', { params });
}

export async function createReminder(data: {
  customerId: string;
  type: string;
  title: string;
  remindAt: string;
}): Promise<CrmReminder> {
  return request.post('/api/crm-advanced/reminders', data);
}

export async function completeReminder(id: string): Promise<void> {
  return request.post(`/api/crm-advanced/reminders/${id}/complete`);
}

export async function deleteReminder(id: string): Promise<void> {
  return request.delete(`/api/crm-advanced/reminders/${id}`);
}

// ==================== CRM 统计看板 ====================

export interface CrmStats {
  totalCustomers: number;
  activeCustomers: number;
  overdueFollowUps: number;
  todayReminders: number;
  levelDistribution: { level: string; count: number }[];
  sourceDistribution: { source: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

export async function getCrmStats(): Promise<CrmStats> {
  return request.get('/api/crm-advanced/stats');
}
