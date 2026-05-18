import request from '@/utils/request';

export interface ScheduledTask {
  id: string;
  title: string;
  content: string;
  images: string[];
  platform: string;
  accountId: string;
  scheduledTime: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface CreateTaskParams {
  title: string;
  content: string;
  images?: string[];
  platform: string;
  accountId: string;
  scheduledTime: string;
}

export interface UpdateTaskParams {
  title?: string;
  content?: string;
  images?: string[];
  scheduledTime?: string;
}

export function getScheduledTasks(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  return request.get<{
    list: ScheduledTask[];
    total: number;
    page: number;
    pageSize: number;
  }>('/api/schedule/tasks', { params });
}

export function getScheduledTask(id: string) {
  return request.get<ScheduledTask>(`/api/schedule/tasks/${id}`);
}

export function createScheduledTask(data: CreateTaskParams) {
  return request.post<ScheduledTask>('/api/schedule/tasks', data);
}

export function updateScheduledTask(id: string, data: UpdateTaskParams) {
  return request.put<ScheduledTask>(`/api/schedule/tasks/${id}`, data);
}

export function cancelScheduledTask(id: string) {
  return request.post<void>(`/api/schedule/tasks/${id}/cancel`);
}

export function deleteScheduledTask(id: string) {
  return request.delete<void>(`/api/schedule/tasks/${id}`);
}

export function batchCreateTasks(tasks: CreateTaskParams[]) {
  return request.post<ScheduledTask[]>('/api/schedule/tasks/batch', { tasks });
}
