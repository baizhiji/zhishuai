// 素材库服务
import { apiClient } from './api.client';

export interface Material {
  id: string;
  title: string;
  content: string;
  type: 'title' | 'topic' | 'copywriting' | 'image' | 'video' | 'link';
  thumbnail?: string;
  url?: string;
  tags?: string[];
  status: 'unused' | 'used';
  createdAt: string;
  updatedAt: string;
}

class MaterialsService {
  // 获取素材列表
  async getMaterials(params?: {
    type?: Material['type'];
    status?: Material['status'];
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Material[]; total: number }> {
    const response = await apiClient.get<{ items: Material[]; total: number }>('/materials', params);
    return response;
  }

  // 创建素材
  async createMaterial(data: Partial<Material>): Promise<Material> {
    const response = await apiClient.post<Material>('/materials', data);
    return response;
  }

  // 更新素材
  async updateMaterial(id: string, data: Partial<Material>): Promise<Material> {
    const response = await apiClient.put<Material>(`/materials/${id}`, data);
    return response;
  }

  // 删除素材
  async deleteMaterial(id: string): Promise<void> {
    await apiClient.delete(`/materials/${id}`);
  }

  // 上传文件
  async uploadFile(uri: string, type: 'image' | 'video' | 'document'): Promise<{ url: string }> {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'file';
    const match = /\.(\w+)$/.exec(filename);
    const mimeType = match 
      ? type === 'image' ? `image/${match[1]}` 
      : type === 'video' ? `video/${match[1]}` 
      : 'application/octet-stream'
      : 'application/octet-stream';
    
    formData.append('file', {
      uri,
      name: filename,
      type: mimeType,
    } as any);

    const response = await apiClient.upload<{ url: string }>('/materials/upload', formData);
    return response;
  }
}

export const materialsService = new MaterialsService();
