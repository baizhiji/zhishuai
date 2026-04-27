import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import type { ApiResponse } from '@/types/api';

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zhishuai.com/v1',
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
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message: msg, data } = response.data;

    // 业务成功
    if (code === 200) {
      return response.data as any;
    }

    // 业务失败
    message.error(msg || '请求失败');
    return Promise.reject(new Error(msg || '请求失败'));
  },
  (error) => {
    const { response } = error;

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

// Token管理
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
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
