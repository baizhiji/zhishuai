/**
 * 统一 API 请求工具
 * 使用环境变量配置 baseURL
 */

// API 基础地址 - 生产环境通过 Nginx 代理，开发环境通过环境变量
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

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

  // 尝试刷新 token
  private async tryRefreshToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return null;
    try {
      const res = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const newToken = data.data?.token || data.token;
        if (newToken) {
          localStorage.setItem('token', newToken);
          return newToken;
        }
      }
    } catch {}
    return null;
  }

  private async handleResponse<T>(response: Response, retryUrl?: string, retryMethod?: string, retryData?: any): Promise<T> {
    if (!response.ok) {
      if (response.status === 401 && retryUrl) {
        // 尝试刷新 token 并重试
        const newToken = await this.tryRefreshToken();
        if (newToken) {
          const retryRes = await fetch(`${this.baseURL}${retryUrl}`, {
            method: retryMethod || 'GET',
            headers: this.getHeaders(),
            body: retryData ? JSON.stringify(retryData) : undefined,
          });
          return this.handleResponse<T>(retryRes);
        }
      }
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

    return response.json().then((result: any) => {
      if (result.code !== 200 && result.success !== true) {
        throw result;
      }
      return result.success === true ? result : result.data;
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

    return this.handleResponse<T>(response, url, 'GET');
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response, url, 'POST', data);
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response, url, 'PUT', data);
  }

  async delete<T = any>(url: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response, url, 'DELETE');
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
