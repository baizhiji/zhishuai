/**
 * 统一 API 请求工具
 * 使用环境变量配置 baseURL
 */

import { dispatchAuthExpired } from '@/lib/auth-events';

// API 基础地址 - 保持为空，让服务层负责完整路径（/api/xxx）
// 服务层（web/services/*.ts）已写完整路径 /api/xxx
const API_BASE_URL = '';

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface ApiError {
  code: number;
  message: string;
  data: null;
}

class Request {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('[API] Base URL:', this.baseURL);
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          dispatchAuthExpired();
        }
      }
      return response.json().then((errBody: any) => {
        throw {
          code: response.status,
          message: errBody?.message || errBody?.error || `请求失败: ${response.status}`,
          data: null,
        };
      }).catch((e: any) => {
        if (e?.code) throw e;
        throw {
          code: response.status,
          message: `请求失败: ${response.status}`,
          data: null,
        };
      });
    }

    return response.json().then((result: any) => {
      // 兼容多种响应格式（按优先级）：
      // 1. {success: true, data: ...}  ← 标准格式
      // 2. {code: 0, data: ...}       ← 内容发布等旧格式
      // 3. {code: 200, data: ...}     ← 旧格式
      // 4. {data: ..., pagination: ...} ← 半标准格式（有 data 字段但无 success）
      // 5. 直接返回数据对象            ← 无包装（兜底）
      if (result?.success === true) {
        return result.data as T;
      }
      if (result?.code === 0 || result?.code === 200) {
        return result.data as T;
      }
      if (result?.data !== undefined && result?.success === undefined && result?.code === undefined) {
        // 半标准格式: {data: ..., pagination: ..., total: ...}
        const { data, pagination, ...rest } = result;
        return { ...data, ...rest, pagination } as T;
      }
      // 兜底：可能直接返回数据
      return result as T;
    });
  }

  async get<T = any>(url: string, options?: { params?: Record<string, string | number | boolean | undefined> }): Promise<T> {
    const params = options?.params;
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';

    const response = await fetch(`${this.baseURL}${url}${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T = any>(url: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}

// 导出单例
export const request = new Request();
export default request;
