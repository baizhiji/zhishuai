'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { message } from 'antd';
import { getAuthToken, getUserInfo, setAuthToken, setUserInfo, removeAuthToken } from '@/lib/request';
import { isAuthenticated } from '@/lib/permissions';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  role: 'admin' | 'agent' | 'customer';
  status: 'active' | 'inactive' | 'banned';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 公开页面列表（不需要认证即可访问）
const publicPaths = ['/login', '/register', '/'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 检查认证状态
  const checkAuth = () => {
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
    checkAuth();
  }, [pathname]);

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    checkAuth
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
