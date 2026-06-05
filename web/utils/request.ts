/**
 * 统一 API 请求工具
 * 使用环境变量配置 baseURL
 */

// API 基础地址 - 统一使用环境变量
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://43.129.16.148:3001/api';

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
          window.location.href = '/login';
        }
      }
      throw {
        code: response.status,
        message: `请求失败: ${response.status}`,
        data: null,
      };
    }

    return response.json().then((result: ApiResponse<T>) => {
      if (result.code !== 200) {
        throw result;
      }
      return result.data;
    });
  }

  async get<T = any>(url: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const queryString = params
      ? '?' +
        new URLSearchParams(
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
