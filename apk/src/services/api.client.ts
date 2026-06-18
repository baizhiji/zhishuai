// API请求基础工具
import { API_CONFIG } from './api.config';
import TokenStorage from '../utils/tokenStorage';
import { notifyAuth401 } from '../context/AuthContext';

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
  private isRefreshing = false;
  private refreshQueue: Array<(token: string) => void> = [];

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // 暴露baseURL和token给需要直接fetch的服务（如SSE流式）
  get baseUrl() { return this.baseURL; }
  getToken() { return TokenStorage.getTokenSync(); }

  // 设置Token - 优先使用内存缓存，兼容异步存储
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // 从内存缓存获取Token（由TokenStorage.setToken同步更新）
    const token = TokenStorage.getTokenSync();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Token 刷新
  private async tryRefreshToken(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise(resolve => {
        this.refreshQueue.push(resolve);
      });
    }

    this.isRefreshing = true;
    try {
      const currentToken = TokenStorage.getTokenSync();
      if (!currentToken) return null;
      const res = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const newToken = data.data?.token || data.token;
        if (newToken) {
          await TokenStorage.setToken(newToken);
          this.refreshQueue.forEach(cb => cb(newToken));
          this.refreshQueue = [];
          return newToken;
        }
      }
      return null;
    } catch {
      return null;
    } finally {
      this.isRefreshing = false;
    }
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

  // 带超时的fetch（支持外部AbortSignal）
  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs?: number, externalSignal?: AbortSignal): Promise<Response> {
    const controller = new AbortController();
    const timeout = timeoutMs || this.timeout;
    const timer = setTimeout(() => controller.abort(), timeout);

    // 如果外部signal被中断，也中断内部controller
    if (externalSignal) {
      if (externalSignal.aborted) {
        clearTimeout(timer);
        throw new DOMException('Request was aborted', 'AbortError');
      }
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  // GET请求
  async get<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    urlParams?: Record<string, string | number>,
    signal?: AbortSignal
  ): Promise<T> {
    const url = this.replaceUrlParams(endpoint, urlParams);
    const queryString = params 
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';

    const response = await this.fetchWithTimeout(`${this.baseURL}${url}${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(),
    }, undefined, signal);

    return this.handleResponse<T>(response, endpoint, 'GET');
  }

  // POST请求
  async post<T = any>(
    endpoint: string,
    data?: any,
    urlParams?: Record<string, string | number>,
    signal?: AbortSignal
  ): Promise<T> {
    const url = this.replaceUrlParams(endpoint, urlParams);

    const response = await this.fetchWithTimeout(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    }, undefined, signal);

    return this.handleResponse<T>(response, endpoint, 'POST', data);
  }

  // PUT请求
  async put<T = any>(
    endpoint: string,
    data?: any,
    urlParams?: Record<string, string | number>,
    signal?: AbortSignal
  ): Promise<T> {
    const url = this.replaceUrlParams(endpoint, urlParams);

    const response = await this.fetchWithTimeout(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    }, undefined, signal);

    return this.handleResponse<T>(response, endpoint, 'PUT', data);
  }

  // DELETE请求
  async delete<T = any>(
    endpoint: string,
    urlParams?: Record<string, string | number>,
    signal?: AbortSignal
  ): Promise<T> {
    const url = this.replaceUrlParams(endpoint, urlParams);

    const response = await this.fetchWithTimeout(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    }, undefined, signal);

    return this.handleResponse<T>(response, endpoint, 'DELETE');
  }

  // 上传文件
  async upload<T = any>(
    endpoint: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // 使用XMLHttpRequest实现上传进度
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      
      const token = TokenStorage.getTokenSync();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            if (result.code !== undefined && result.code !== 200) {
              reject(result);
            } else {
              resolve(result.data || result);
            }
          } catch {
            resolve(JSON.parse(xhr.responseText));
          }
        } else {
          reject({ code: xhr.status, message: `上传失败: ${xhr.status}`, data: null });
        }
      };
      
      xhr.onerror = () => reject({ code: 0, message: '网络错误', data: null });
      xhr.ontimeout = () => reject({ code: 0, message: '请求超时', data: null });
      xhr.timeout = this.timeout;
      
      xhr.send(formData);
    });
  }

  // 处理响应
  private async handleResponse<T>(response: Response, retryEndpoint?: string, retryMethod?: string, retryData?: any): Promise<T> {
    if (!response.ok) {
      if (response.status === 401 && retryEndpoint) {
        // 尝试刷新 token 并重试一次
        const newToken = await this.tryRefreshToken();
        if (newToken) {
          const retryUrl = this.replaceUrlParams(retryEndpoint);
          const retryRes = await this.fetchWithTimeout(`${this.baseURL}${retryUrl}`, {
            method: retryMethod || 'GET',
            headers: this.getHeaders(),
            body: retryData ? JSON.stringify(retryData) : undefined,
          });
          return this.handleResponse<T>(retryRes);
        }
      }
      if (response.status === 401) {
        // Token过期且刷新失败，通知AuthContext执行优雅登出
        try {
          await TokenStorage.clearToken();
        } catch (e) {
          console.warn('[ApiClient] 清除Token失败:', e);
        }
        // 通知AuthContext处理登出跳转（而非直接清空所有数据）
        notifyAuth401();
        throw {
          code: 401,
          message: '登录已过期，请重新登录',
          data: null,
        };
      }

      let errorMessage = `请求失败: ${response.status}`;
      try {
        const body = await response.json();
        errorMessage = body.error || body.message || errorMessage;
      } catch (e) {
        // 非 JSON 响应体，使用默认错误消息
      }

      throw {
        code: response.status,
        message: errorMessage,
        data: null,
      };
    }

    const result = await response.json();

    // 兼容两种响应格式：{ code: 200, data: ... } 和 { success: true, data: ... }
    if (result.code !== undefined && result.code !== 200) {
      throw {
        code: result.code,
        message: result.message || result.error || '请求失败',
        data: null,
      };
    }

    return result.data !== undefined ? result.data : result;
  }
}

// 导出单例
export const apiClient = new ApiClient();
