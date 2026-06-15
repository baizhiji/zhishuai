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
<<<<<<< HEAD
    return request.post<any, AuthResponse>('/api/auth/login', data);
=======
    return request.post<AuthResponse>('/api/auth/login', data);
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },

  // 注册
  register: (data: RegisterParams) => {
<<<<<<< HEAD
    return request.post<any, AuthResponse>('/api/auth/register', data);
=======
    return request.post<AuthResponse>('/api/auth/register', data);
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },

  // 发送注册验证码
  sendCode: (phone: string, type: string = 'register') => {
<<<<<<< HEAD
    return request.post<any, { success: boolean; message: string; code?: string }>('/api/auth/send-code', { phone, type });
=======
    return request.post<{ success: boolean; message: string; code?: string }>('/api/auth/send-code', { phone, type });
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },

  // 获取用户信息
  getUserInfo: () => {
<<<<<<< HEAD
    return request.get<any, any>('/api/auth/me');
=======
    return request.get<any>('/api/auth/me');
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },

  // 更新用户信息
  updateProfile: (data: any) => {
<<<<<<< HEAD
    return request.put<any, any>('/api/auth/profile', data);
=======
    return request.put<any>('/api/auth/profile', data);
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },

  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }) => {
<<<<<<< HEAD
    return request.post<any, any>('/api/auth/change-password', data);
=======
    return request.post<any>('/api/auth/change-password', data);
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },

  // 登出
  logout: () => {
<<<<<<< HEAD
    return request.post<any, any>('/api/auth/logout', {});
=======
    return request.post<any>('/api/auth/logout', {});
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },
};

// 找回密码 API
export const ForgotPasswordAPI = {
  // 发送重置密码验证码
  sendCode: (phone: string) => {
<<<<<<< HEAD
    return request.post<any, { success: boolean; message: string; code?: string }>('/api/auth/send-reset-code', { phone });
=======
    return request.post<{ success: boolean; message: string; code?: string }>('/api/auth/send-reset-code', { phone });
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },

  // 重置密码
  reset: (data: ForgotPasswordParams) => {
<<<<<<< HEAD
    return request.post<any, { success: boolean; message: string }>('/api/auth/reset-password', {
=======
    return request.post<{ success: boolean; message: string }>('/api/auth/reset-password', {
>>>>>>> 962968886be726cd434c792933b5515366d34518
      phone: data.phone,
      code: data.code,
      newPassword: data.newPassword,
    });
  },
};

// 别名导出
export const UserForgotPassword = ForgotPasswordAPI;
