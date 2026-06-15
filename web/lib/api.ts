<<<<<<< HEAD
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiResponse } from '@/types'

class ApiClient {
  private client: AxiosInstance
  private baseURL: string

  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:3000/api'
=======
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:3000/api';
>>>>>>> 962968886be726cd434c792933b5515366d34518
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
<<<<<<< HEAD
    })

    this.setupInterceptors()
=======
    });

    this.setupInterceptors();
>>>>>>> 962968886be726cd434c792933b5515366d34518
  }

  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use(
<<<<<<< HEAD
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )
=======
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
>>>>>>> 962968886be726cd434c792933b5515366d34518

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
<<<<<<< HEAD
        return response.data as any
      },
      (error) => {
        const message = error.response?.data?.message || error.message || '请求失败'
        console.error('API Error:', message)

        if (error.response?.status === 401) {
          this.removeToken()
          window.location.href = '/login'
        }

        return Promise.reject(new Error(message))
      }
    )
=======
        return response.data as any;
      },
      error => {
        const message = error.response?.data?.message || error.message || '请求失败';
        console.error('API Error:', message);

        if (error.response?.status === 401) {
          this.removeToken();
          window.location.href = '/login';
        }

        return Promise.reject(new Error(message));
      }
    );
>>>>>>> 962968886be726cd434c792933b5515366d34518
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
<<<<<<< HEAD
      return localStorage.getItem('token')
    }
    return null
=======
      return localStorage.getItem('token');
    }
    return null;
>>>>>>> 962968886be726cd434c792933b5515366d34518
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
<<<<<<< HEAD
      localStorage.setItem('token', token)
=======
      localStorage.setItem('token', token);
>>>>>>> 962968886be726cd434c792933b5515366d34518
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
<<<<<<< HEAD
      localStorage.removeItem('token')
=======
      localStorage.removeItem('token');
>>>>>>> 962968886be726cd434c792933b5515366d34518
    }
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
<<<<<<< HEAD
    const response = await this.client.get<ApiResponse<T>>(url, config)
    return response.data as T
  }

  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config)
    return response.data as T
  }

  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config)
    return response.data as T
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config)
    return response.data as T
=======
    return this.client.get<ApiResponse<T>>(url, config) as Promise<T>;
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post<ApiResponse<T>>(url, data, config) as Promise<T>;
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put<ApiResponse<T>>(url, data, config) as Promise<T>;
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete<ApiResponse<T>>(url, config) as Promise<T>;
>>>>>>> 962968886be726cd434c792933b5515366d34518
  }

  public async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
<<<<<<< HEAD
    const formData = new FormData()
    formData.append('file', file)
=======
    const formData = new FormData();
    formData.append('file', file);
>>>>>>> 962968886be726cd434c792933b5515366d34518

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
<<<<<<< HEAD
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100
          onProgress(progress)
        }
      },
    })

    return response.data as T
  }

  public setAuthToken(token: string): void {
    this.setToken(token)
  }

  public removeAuthToken(): void {
    this.removeToken()
  }
}

export const apiClient = new ApiClient()
export default apiClient
=======
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
>>>>>>> 962968886be726cd434c792933b5515366d34518
