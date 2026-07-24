'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import {
  getAuthToken,
  getUserInfo,
  setAuthToken,
  setUserInfo,
  removeAuthToken,
} from '@/lib/request';
import { isAuthenticated } from '@/lib/permissions';
import { resetRedirectFlag } from '@/lib/auth-events';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  role: 'admin' | 'agent' | 'user';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // 用于解决服务端/客户端 hydration 不匹配问题
  const [mounted, setMounted] = useState(false);
  // 标记是否已完成初次认证检查
  const authCheckedRef = useRef(false);
  // ref 存储最新值，避免闭包问题
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  // 确保只在客户端挂载后才执行需要 localStorage 的操作
  useEffect(() => {
    setMounted(true);
  }, []);

  // 检查认证状态（仅在初次挂载时执行一次）
  const checkAuth = useCallback(() => {
    // 服务端渲染时跳过认证检查，避免 hydration 不匹配
    if (typeof window === 'undefined') {
      return;
    }

    if (!isAuthenticated()) {
      // 未登录，不在公开页面则跳转
      const pathname = window.location.pathname;
      const publicPaths = ['/login', '/register'];
      const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
      if (!isPublic) {
        router.replace('/login');
      }
      setUser(null);
      setLoading(false);
      authCheckedRef.current = true;
      return;
    }

    // 已登录，获取用户信息
    const userInfo = getUserInfo();
    if (userInfo) {
      setUser(userInfo);
    } else {
      // Token存在但用户信息不存在，清除认证
      removeAuthToken();
      router.replace('/login');
    }

    setLoading(false);
    authCheckedRef.current = true;
  }, [router]);

  // 登录
  const login = useCallback((token: string, userData: User) => {
    resetRedirectFlag();
    setAuthToken(token);
    setUserInfo(userData);
    setUser(userData);
    setLoading(false);
    authCheckedRef.current = true;
  }, []);

  // 退出登录
  const logout = useCallback(() => {
    removeAuthToken();
    // 清除 auth_token cookie
    if (typeof document !== 'undefined') {
      document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax; Secure';
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('viewing_role');
    }
    setUser(null);
    setLoading(false);
    authCheckedRef.current = true;
    message.success('已退出登录');
    router.replace('/login');
  }, [router]);

  // 更新用户信息
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updatedUser = { ...prev, ...updates };
      setUserInfo(updatedUser);
      return updatedUser;
    });
  }, []);

  // 初始化时检查认证状态
  useEffect(() => {
    if (mounted && !authCheckedRef.current) {
      checkAuth();
    }
  }, [mounted, checkAuth]);

  // 监听 auth:expired 事件（来自 HTTP 拦截器的 401 处理）
  useEffect(() => {
    const handler = () => {
      if (!loadingRef.current) {
        logout();
      }
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [logout]);

  const value: AuthContextType = {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    updateUser,
    checkAuth,
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
