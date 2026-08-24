// API请求基础工具
import { API_CONFIG } from './api.config';
import TokenStorage from '../utils/tokenStorage';

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

// 从后端错误响应体中提取用户可读消息
// 兼容格式:
// 1. { success:false, error:{ message:'xxx' } }  ← api-response.ts 标准格式
// 2. { message:'xxx' } / { msg:'xxx' }
// 3. { error: 'xxx' }                            ← error 直接为字符串
function extractErrorMessage(body: any): string {
  if (!body) return '';
  if (typeof body === 'string') return body;
  const error = body.error;
  if (typeof error === 'string') return error;
  return body.message || error?.message || body.msg || '';
}

// Auth 失效回调（由 AuthContext 设置）
let onAuthFailure: (() => void) | null = null;

export function setAuthFailureHandler(handler: () => void) {
  onAuthFailure = handler;
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

    const token = TokenStorage.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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
    data?: any,
    urlParams?: Record<string, string | number>
  ): Promise<T> {
    const url = this.replaceUrlParams(endpoint, urlParams);

    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  // UPLOAD请求 —— multipart/form-data 文件上传
  async upload<T = any>(
    endpoint: string,
    formData: FormData
  ): Promise<T> {
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    const token = TokenStorage.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // 不设置 Content-Type，让 fetch 自动设置 boundary

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }

  // 处理响应 —— 兼容 { code: 200 } 和 { success: true } 两种后端格式
  private async handleResponse<T>(response: Response): Promise<T> {
    // 先尝试解析响应体，避免错误响应丢失服务端真实消息
    let result: any = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }

    // 401 未认证
    if (response.status === 401) {
      // 优先展示服务端真实错误（如“手机号或密码错误”）
      const serverMessage = extractErrorMessage(result);
      // 仅当请求携带 token（已登录状态）时才视为登录过期，清除登录态
      const hadToken = !!TokenStorage.getToken();
      if (hadToken) {
        TokenStorage.clearAll();
        if (onAuthFailure) {
          onAuthFailure();
        }
      }
      throw {
        code: 401,
        message: serverMessage || (hadToken ? '登录已过期，请重新登录' : '未登录，请先登录'),
        data: null,
      };
    }

    if (!response.ok) {
      throw {
        code: response.status,
        message: extractErrorMessage(result) || `请求失败: ${response.status}`,
        data: null,
      };
    }

    if (!result) {
      throw { code: -1, message: '请求失败: 响应格式错误', data: null };
    }

    // 兼容两种后端响应格式: { code: 200, data: T } 和 { success: true, data: T }
    const isCodeFormat = result.code === 200;
    const isSuccessFormat = result.success === true;

    if (isCodeFormat || isSuccessFormat) {
      return result.data as T;
    }

    // 错误响应
    throw result;
  }
}

// 导出单例
export const apiClient = new ApiClient();
