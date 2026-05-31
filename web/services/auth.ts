import request from '@/utils/request';

export interface LoginParams {
  phone: string;
  password: string;
}

export interface RegisterParams {
  phone: string;
  password: string;
  code?: string;
  name?: string;
}

export interface ForgotPasswordParams {
  phone: string;
  code: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      phone: string;
      name: string;
      role: string;
    };
    token: string;
    expireTime: string;
  };
  message?: string;
}

export const AuthAPI = {
  // 登录
  login: (data: LoginParams) => {
    return request.post<any, AuthResponse>('/api/auth/login', data);
  },

  // 注册
  register: (data: RegisterParams) => {
    return request.post<any, AuthResponse>('/api/auth/register', data);
  },

  // 发送注册验证码
  sendCode: (phone: string, type: string = 'register') => {
    return request.post<any, { success: boolean; message: string; code?: string }>('/api/auth/send-code', { phone, type });
  },

  // 获取用户信息
  getUserInfo: () => {
    return request.get<any, any>('/api/auth/me');
  },

  // 更新用户信息
  updateProfile: (data: any) => {
    return request.put<any, any>('/api/auth/profile', data);
  },

  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }) => {
    return request.post<any, any>('/api/auth/change-password', data);
  },

  // 登出
  logout: () => {
    return request.post<any, any>('/api/auth/logout', {});
  },
};

// 找回密码 API
export const ForgotPasswordAPI = {
  // 发送重置密码验证码
  sendCode: (phone: string) => {
    return request.post<any, { success: boolean; message: string; code?: string }>('/api/auth/send-reset-code', { phone });
  },

  // 重置密码
  reset: (data: ForgotPasswordParams) => {
    return request.post<any, { success: boolean; message: string }>('/api/auth/reset-password', {
      phone: data.phone,
      code: data.code,
      newPassword: data.newPassword,
    });
  },
};

// 别名导出
export const UserForgotPassword = ForgotPasswordAPI;
