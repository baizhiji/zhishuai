import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';
import { dispatchAuthExpired } from '@/lib/auth-events';
import { API_ORIGIN } from '@/utils/env';

// 从后端错误响应体中提取用户可读消息
// 兼容格式:
// 1. { success:false, error:{ message:'xxx' } }  ← api-response.ts 标准格式
// 2. { success:false, message:'xxx' } / { msg:'xxx' }
// 3. { error: 'xxx' }                            ← error 直接为字符串
function extractErrorMsg(data: any): string {
  if (!data) return '';
  if (typeof data === 'string') return data;
  const error = data.error;
  if (typeof error === 'string') return error;
  return data.message || error?.message || data.msg || '';
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = API_ORIGIN ? `${API_ORIGIN.replace(/\/+$/, '')}/api` : '/api';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use(
      config => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response.data as any;
      },
      error => {
        const msg = extractErrorMsg(error.response?.data) || error.message || '请求失败';
        console.error('API Error:', msg);

        if (error.response?.status === 401) {
          // 仅已登录请求（携带 token）才视为登录过期；登录接口等业务性 401（如密码错误）不触发登出
          const hadToken = !!(error.config?.headers as any)?.Authorization;
          if (hadToken) {
            this.removeToken();
            dispatchAuthExpired();
          }
        }

        return Promise.reject(new Error(msg));
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data as T;
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data as T;
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data as T;
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data as T;
  }

  public async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(progress);
        }
      },
    });

    return response.data as T;
  }

  public setAuthToken(token: string): void {
    this.setToken(token);
  }

  public removeAuthToken(): void {
    this.removeToken();
  }
}

export const apiClient = new ApiClient();
export default apiClient;
