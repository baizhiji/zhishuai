import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const instance: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const request = {
  get: <T = any, R = any>(url: string, params?: any, config?: AxiosRequestConfig) => 
    instance.get<T, R>(url, { params, ...config }),
  post: <T = any, R = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    instance.post<T, R>(url, data, config),
  put: <T = any, R = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    instance.put<T, R>(url, data, config),
  delete: <T = any, R = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    instance.delete<T, R>(url, { params: data, ...config }),
  patch: <T = any, R = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    instance.patch<T, R>(url, data, config),
};

export default request;
