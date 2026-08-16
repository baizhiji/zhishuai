'use client';

/**
 * 用户上下文 Provider
 * 提供用户信息、角色和权限到整个应用
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserRole, Permission, rolePermissions } from '@/lib/permissions/config';
import { AuthAPI } from '@/services/auth';

// 用户信息类型
export interface UserInfo {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  tenantId?: string;
  agentId?: string;
}

// 功能开关类型
export type FeatureToggles = Record<string, boolean>;

// 上下文类型
interface UserContextType {
  user: UserInfo | null;
  isLoading: boolean;
  permissions: Permission[];
  featureToggles: FeatureToggles;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  setFeatureToggles: (toggles: FeatureToggles) => void;
  hasPermission: (permission: Permission) => boolean;
  isFeatureEnabled: (key: string) => boolean;
}

// 创建上下文
const UserContext = createContext<UserContextType | undefined>(undefined);

// 默认功能开关
const defaultFeatureToggles: FeatureToggles = {
  media_factory: true,
  media_matrix: true,
  media_digital_human: true,
  recruitment: true,
  acquisition: true,
  share: true,
  ecommerce: false,
  marketing: false,
};



// Provider组件
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [featureToggles, setFeatureToggles] = useState<FeatureToggles>(defaultFeatureToggles);

  // 初始化时检查本地存储的用户信息
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToggles = localStorage.getItem('featureToggles');

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as UserInfo;
        setUser(parsedUser);
        setPermissions(rolePermissions[parsedUser.role as UserRole] || []);
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }

    if (savedToggles) {
      try {
        setFeatureToggles({ ...defaultFeatureToggles, ...JSON.parse(savedToggles) });
      } catch (e) {
        console.error('Failed to parse saved toggles:', e);
      }
    }

    setIsLoading(false);
  }, []);

  // 登录（调用真实后端 API）
  const login = useCallback(async (phone: string, password: string): Promise<boolean> => {
    try {
      const res = await AuthAPI.login({ phone, password });
      if (res.success && res.data?.user && res.data.token) {
        const u = res.data.user;
        const userInfo: UserInfo = {
          id: u.id,
          name: u.name,
          phone: u.phone,
          role: (u.role as UserRole) || UserRole.CUSTOMER,
        };
        setUser(userInfo);
        setPermissions(rolePermissions[userInfo.role] || []);
        localStorage.setItem('user', JSON.stringify(userInfo));
        localStorage.setItem('token', res.data.token);
        return true;
      }
      return false;
    } catch (e) {
      console.error('登录失败:', e);
      return false;
    }
  }, []);

  // 登出
  const logout = useCallback(() => {
    setUser(null);
    setPermissions([]);
    localStorage.removeItem('user');
  }, []);

  // 设置功能开关
  const updateFeatureToggles = useCallback((toggles: FeatureToggles) => {
    setFeatureToggles(toggles);
    localStorage.setItem('featureToggles', JSON.stringify(toggles));
  }, []);

  // 权限检查
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  // 功能开关检查
  const isFeatureEnabled = useCallback(
    (key: string): boolean => {
      return featureToggles[key] ?? false;
    },
    [featureToggles]
  );

  const value: UserContextType = {
    user,
    isLoading,
    permissions,
    featureToggles,
    login,
    logout,
    setFeatureToggles: updateFeatureToggles,
    hasPermission,
    isFeatureEnabled,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// 自定义hook
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// 导出默认
export default UserContext;
