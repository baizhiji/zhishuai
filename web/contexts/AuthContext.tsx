'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { message } from 'antd';
<<<<<<< HEAD
import { getAuthToken, getUserInfo, setAuthToken, setUserInfo, removeAuthToken } from '@/lib/request';
=======
import {
  getAuthToken,
  getUserInfo,
  setAuthToken,
  setUserInfo,
  removeAuthToken,
} from '@/lib/request';
>>>>>>> 962968886be726cd434c792933b5515366d34518
import { isAuthenticated } from '@/lib/permissions';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
<<<<<<< HEAD
  role: 'admin' | 'agent' | 'customer';
=======
  role: 'admin' | 'agent' | 'user';
>>>>>>> 962968886be726cd434c792933b5515366d34518
  status: 'active' | 'inactive' | 'banned';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 公开页面列表（不需要认证即可访问）
const publicPaths = ['/login', '/register'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD

  // 检查认证状态
  const checkAuth = () => {
=======
  // 用于解决服务端/客户端 hydration 不匹配问题
  const [mounted, setMounted] = useState(false);

  // 确保只在客户端挂载后才执行需要 localStorage 的操作
  useEffect(() => {
    setMounted(true);
  }, []);

  // 检查认证状态
  const checkAuth = () => {
    // 服务端渲染时跳过认证检查，避免 hydration 不匹配
    if (typeof window === 'undefined') {
      return;
    }

>>>>>>> 962968886be726cd434c792933b5515366d34518
    setLoading(true);

    if (!isAuthenticated()) {
      // 未登录
      if (!publicPaths.includes(pathname)) {
        router.push('/login');
      }
      setUser(null);
      setLoading(false);
      return;
    }

    // 已登录，获取用户信息
    const userInfo = getUserInfo();
    if (userInfo) {
      setUser(userInfo);
    } else {
      // Token存在但用户信息不存在，清除认证
      removeAuthToken();
      if (!publicPaths.includes(pathname)) {
        router.push('/login');
      }
    }

    setLoading(false);
  };

  // 登录
  const login = (token: string, user: User) => {
    setAuthToken(token);
    setUserInfo(user);
    setUser(user);
    message.success('登录成功');
  };

  // 退出登录
  const logout = () => {
    removeAuthToken();
<<<<<<< HEAD
=======
    if (typeof window !== 'undefined') {
      localStorage.removeItem('viewing_role');
    }
>>>>>>> 962968886be726cd434c792933b5515366d34518
    setUser(null);
    message.success('已退出登录');
    router.push('/login');
  };

  // 更新用户信息
  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      setUserInfo(updatedUser);
    }
  };

  // 初始化时检查认证状态
  useEffect(() => {
<<<<<<< HEAD
    // 防止重复调用
    if (loading) {
      checkAuth();
    }
  }, [pathname]);
=======
    // 防止重复调用，只在组件挂载后执行
    if (mounted && loading) {
      checkAuth();
    }
  }, [pathname, mounted]);
>>>>>>> 962968886be726cd434c792933b5515366d34518

  const value = {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    updateUser,
<<<<<<< HEAD
    checkAuth
=======
    checkAuth,
>>>>>>> 962968886be726cd434c792933b5515366d34518
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook: 使用AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
