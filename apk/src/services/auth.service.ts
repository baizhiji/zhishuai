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
      const response = await apiClient.post<any>(
        API_ENDPOINTS.LOGIN,
        params
      );
      
      // 兼容两种响应格式
      const token = response.token || response.data?.token;
      const user = response.user || response.data?.user;
      
      if (!token || !user) {
        throw new Error('登录响应格式错误');
      }
      
      // 保存Token和用户信息到持久化存储
      await TokenStorage.setToken(token);
      await TokenStorage.setUserInfo(user);
      
      return { token, user };
    } catch (error: any) {
      console.error('登录失败:', error.message);
      throw error;
    }
  }

  // 用户注册
  async register(params: RegisterParams): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<any>(
        API_ENDPOINTS.REGISTER,
        params
      );
      
      const token = response.token || response.data?.token;
      const user = response.user || response.data?.user;
      
      if (token && user) {
        // 注册成功自动登录
        await TokenStorage.setToken(token);
        await TokenStorage.setUserInfo(user);
      }
      
      return { token, user };
    } catch (error: any) {
      console.error('注册失败:', error.message);
      throw error;
    }
  }

  // 发送验证码
  async sendVerifyCode(phone: string): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.SEND_CODE, { phone });
    } catch (error: any) {
      console.error('发送验证码失败:', error.message);
      throw error;
    }
  }

  // 获取用户信息
  async getUserInfo(): Promise<UserInfo> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.USER_INFO);
      
      // 更新本地存储的用户信息
      const user = response.data || response;
      await TokenStorage.setUserInfo(user);
      
      return user;
    } catch (error: any) {
      console.error('获取用户信息失败:', error.message);
      throw error;
    }
  }

  // 退出登录
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('退出登录API调用失败:', error);
    } finally {
      // 无论API是否成功，清除本地存储
      await TokenStorage.clearAll();
    }
  }

  // 检查登录状态（同步，使用内存缓存）
  isLoggedIn(): boolean {
    return TokenStorage.isLoggedInSync();
  }

  // 异步检查登录状态
  async isLoggedInAsync(): Promise<boolean> {
    return await TokenStorage.isLoggedIn();
  }

  // 获取当前用户信息（同步，使用内存缓存）
  getCurrentUser(): UserInfo | null {
    return TokenStorage.getUserInfoSync();
  }

  // 异步获取当前用户信息
  async getCurrentUserAsync(): Promise<UserInfo | null> {
    return await TokenStorage.getUserInfo();
  }
}

export const authService = new AuthService();
