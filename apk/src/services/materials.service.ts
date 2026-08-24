// 内容中心服务
import { apiClient } from './api.client';

export interface Material {
  id: string;
  title: string;
  content: string;
  type: string; // ContentCategory 枚举值（与电脑版 15 分类对齐）
  thumbnail?: string;
  url?: string;
  tags?: string[];
  status?: 'unused' | 'used';
  downloadedAt?: string; // 已下载时间，存在即"已下载"
  createdAt: string;
  updatedAt: string;
}

class MaterialsService {
  // 获取素材列表（后端返回 data.list，非 data.items）
  async getMaterials(params?: {
    type?: string;
    status?: string; // downloaded | undownloaded
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ list: Material[]; total: number }> {
    const response = await apiClient.get<{ list: Material[]; total: number }>('/materials', params);
    return response;
  }

  // 批量删除
  async batchDelete(ids: string[]): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>('/materials/batch-delete', { ids });
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

  // 上传文件 —— 对齐 WEB 端 POST /api/materials（以 Base64 内联或 multipart 上传）
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
