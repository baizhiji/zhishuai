import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { message } from 'antd';
import type { ApiResponse } from '@/types/api';

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加token
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 是否正在刷新token（防止并发刷新）
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

async function tryRefreshToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise(resolve => {
      addRefreshSubscriber((token: string) => {
        resolve(token);
      });
    });
  }

  isRefreshing = true;
  try {
    const currentToken = getAuthToken();
    if (!currentToken) return null;
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    const res = await fetch(`${baseURL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      const newToken = data.data?.token || data.token;
      if (newToken) {
        setAuthToken(newToken);
        onRefreshed(newToken);
        return newToken;
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    isRefreshing = false;
  }
}

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    const data = response.data;

    // 支持两种响应格式：
    // 1. { success: true, data: {...} } - 登录等API格式
    // 2. { code: 200, data: {...} } - 其他API格式
    if (data.success === true || data.code === 200) {
      return response.data as any;
    }

    // 业务失败
    message.error(data.message || data.msg || '请求失败');
    return Promise.reject(new Error(data.message || data.msg || '请求失败'));
  },
  async error => {
    const { response, config } = error;

    // 401 时尝试刷新 token
    if (response?.status === 401 && config && !config._retry) {
      config._retry = true;
      const newToken = await tryRefreshToken();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return request(config);
      }
      // 刷新失败，跳转登录
      message.error('登录已过期，请重新登录');
      removeAuthToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (response) {
      switch (response.status) {
        case 401:
          message.error('登录已过期，请重新登录');
          removeAuthToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          break;
        case 403:
          message.error('没有权限访问');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误');
          break;
        default:
          message.error(response.data?.message || '网络错误');
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时');
    } else if (error.message === 'Network Error') {
      message.error('网络连接失败');
    } else {
      message.error('未知错误');
    }

    return Promise.reject(error);
  }
);

// Token管理 - 优先从Cookie获取（HttpOnly安全），fallback到localStorage
function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    // 优先从cookie获取（HttpOnly cookie只能由server设置，但非HttpOnly的token cookie可以读取）
    const cookieToken = getTokenFromCookie();
    if (cookieToken) return cookieToken;
    return localStorage.getItem('token');
  }
  return null;
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // 清除服务端设置的cookie
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
  }
}

// 用户信息管理
export function getUserInfo(): any | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function setUserInfo(user: any): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

// 导出request实例
export default request;
