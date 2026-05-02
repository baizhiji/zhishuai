// 认证服务
import { apiClient } from './api.client';
import { API_ENDPOINTS } from './api.config';
import TokenStorage from '../utils/tokenStorage';

// 用户信息类型
export interface UserInfo {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  role: 'admin' | 'agent' | 'customer';
  status: 'active' | 'inactive' | 'expired';
  expireTime?: string; // 服务到期时间
}

// 登录请求参数
export interface LoginParams {
  phone: string;
  password: string;
}

// 注册请求参数
export interface RegisterParams {
  phone: string;
  password: string;
  code: string; // 验证码
  name: string;
}

// 登录响应
export interface LoginResponse {
  token: string;
  user: UserInfo;
}

class AuthService {
  // 用户登录
  async login(params: LoginParams): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.LOGIN,
        params
      );
      
      // 保存Token和用户信息
      TokenStorage.setToken(response.token);
      TokenStorage.setUserInfo(response.user);
      
      return response;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  // 用户注册
  async register(params: RegisterParams): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.REGISTER,
        params
      );
      
      // 保存Token和用户信息
      TokenStorage.setToken(response.token);
      TokenStorage.setUserInfo(response.user);
      
      return response;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  }

  // 获取用户信息
  async getUserInfo(): Promise<UserInfo> {
    try {
      const response = await apiClient.get<UserInfo>(API_ENDPOINTS.USER_INFO);
      
      // 更新本地存储的用户信息
      TokenStorage.setUserInfo(response);
      
      return response;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }

  // 退出登录
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('退出登录失败:', error);
    } finally {
      // 清除本地存储
      TokenStorage.clearAll();
    }
  }

  // 检查登录状态
  isLoggedIn(): boolean {
    return TokenStorage.isLoggedIn();
  }

  // 获取当前用户信息（从本地存储）
  getCurrentUser(): UserInfo | null {
    return TokenStorage.getUserInfo();
  }
}

export const authService = new AuthService();
