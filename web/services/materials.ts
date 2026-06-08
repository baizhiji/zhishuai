'use client';

import request from '@/utils/request';

export interface Material {
  id: string;
  title: string;
  type: 'text' | 'image' | 'video' | 'audio';
  content?: string;
  url?: string;
  tags: string[];
  category?: string;
  used: boolean;
  usedAt?: string;
  usedBy?: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialCategory {
  id: string;
  name: string;
  type: string;
  count: number;
}

export async function getMaterials(params?: {
  type?: string;
  status?: string;
  keyword?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}) {
  return request.get('/api/materials', { params });
}

export async function createMaterial(data: Partial<Material>) {
  return request.post('/api/materials', data);
}

export async function updateMaterial(id: string, data: Partial<Material>) {
  return request.put(`/api/materials/${id}`, data);
}

export async function deleteMaterial(id: string) {
  return request.delete(`/api/materials/${id}`);
}

export async function batchDeleteMaterials(ids: string[]) {
  return request.post('/api/materials/batch-delete', { ids });
}

export async function getMaterialStats() {
  return request.get('/api/materials/stats');
}

export async function markMaterialUsed(id: string) {
  return request.put(`/api/materials/${id}/mark-used`, {});
}
