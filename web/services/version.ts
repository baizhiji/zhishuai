'use client';

import request from '@/utils/request';

// ==================== 版本管理 ====================

export interface AppVersion {
  id: string;
  platform: string;
  versionName: string;
  versionCode: number;
  downloadUrl: string;
  forceUpdate: boolean;
  updateContent: string;
  status: string;
  createdAt: string;
}

export async function getVersions(params?: { page?: number; pageSize?: number; platform?: string }) {
  return request.get('/api/version/versions', { params });
}

export async function getLatestVersion(platform: string = 'android') {
  return request.get('/api/version/latest', { platform });
}

export async function createVersion(data: Partial<AppVersion>) {
  return request.post('/api/version/versions', data);
}

export async function updateVersion(id: string, data: Partial<AppVersion>) {
  return request.put(`/api/version/versions/${id}`, data);
}

export async function deleteVersion(id: string) {
  return request.delete(`/api/version/versions/${id}`);
}

// ==================== 系统公告 ====================

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success';
  priority: 'low' | 'normal' | 'high';
  status: 'active' | 'inactive';
  startTime: string;
  endTime?: string;
  createdAt: string;
}

export async function getAnnouncements(params?: { page?: number; pageSize?: number; status?: string }) {
  return request.get('/api/version/announcements', { params });
}

export async function getLatestAnnouncements() {
  return request.get('/api/version/announcements/latest');
}

export async function createAnnouncement(data: Partial<Announcement>) {
  return request.post('/api/version/announcements', data);
}

export async function updateAnnouncement(id: string, data: Partial<Announcement>) {
  return request.put(`/api/version/announcements/${id}`, data);
}

export async function deleteAnnouncement(id: string) {
  return request.delete(`/api/version/announcements/${id}`);
}
