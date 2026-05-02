// API请求基础工具
import { API_CONFIG } from './api.config';

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

class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // 设置Token
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // 从存储获取Token
    // 注意：这里使用全局变量，后续需要改用AsyncStorage
    if (global.userToken) {
      headers['Authorization'] = `Bearer ${global.userToken}`;
    }

    return headers;
  }

  // 替换URL中的参数
  private replaceUrlParams(url: string, params?: Record<string, string | number>): string {
    if (!params) return url;
    
    let result = url;
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(`:${key}`, String(value));
    });
    return result;
  }

  // GET请求
  async get<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    urlParams?: Record<string, string | number>
  ): Promise<T> {
    const url = this.replaceUrlParams(endpoint, urlParams);
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

  // POST请求
  async post<T = any>(
    endpoint: string,
    data?: any,
    urlParams?: Record<string, string | number>
  ): Promise<T> {
    const url = this.replaceUrlParams(endpoint, urlParams);

    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  // PUT请求
  async put<T = any>(
    endpoint: string,
    data?: any,
    urlParams?: Record<string, string | number>
  ): Promise<T> {
    const url = this.replaceUrlParams(endpoint, urlParams);

    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  // DELETE请求
  async delete<T = any>(
    endpoint: string,
    urlParams?: Record<string, string | number>
  ): Promise<T> {
    const url = this.replaceUrlParams(endpoint, urlParams);

    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  // 处理响应
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw {
        code: response.status,
        message: `请求失败: ${response.status}`,
        data: null,
      };
    }

    const result: ApiResponse<T> = await response.json();

    if (result.code !== 200) {
      throw result;
    }

    return result.data;
  }
}

// 导出单例
export const apiClient = new ApiClient();
