import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import TokenStorage from '../utils/tokenStorage';
import type { User, UserRole } from '../types';

// 扩展的用户类型（用于本地存储）
interface StoredUser extends User {
  actualRole: UserRole;
  viewingRole?: UserRole;
}

interface AuthContextType {
  user: StoredUser | null;
  viewingRole: UserRole;
  setUser: (user: StoredUser | null) => void;
  isLoading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (userData: User) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  viewingRole: 'customer',
  setUser: () => {},
  isLoading: true,
  isLoggedIn: false,
  isAdmin: false,
  login: () => {},
  logout: () => {},
  switchRole: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// 带超时的fetch
const fetchWithTimeout = async (promise: Promise<any>, timeout = 5000): Promise<any> => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('请求超时')), timeout);
  });
  return Promise.race([promise, timeoutPromise]);
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingRole, setViewingRoleState] = useState<UserRole>('customer');

  // 检查登录状态
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // 优先从本地存储获取用户信息
        const localUser = TokenStorage.getUserInfo() as StoredUser | null;
        if (localUser) {
          // 确保有 actualRole 字段
          if (!localUser.actualRole) {
            localUser.actualRole = localUser.role as UserRole;
          }
          // 确保有 viewingRole 字段
          const savedViewingRole = TokenStorage.getViewingRole();
          localUser.viewingRole = savedViewingRole || localUser.actualRole;
          setUserState(localUser);
          setViewingRoleState(localUser.viewingRole || localUser.actualRole);
          setIsLoading(false);
          return;
        }

        // 没有本地用户信息，检查是否有token
        const token = TokenStorage.getToken();
        if (token) {
          // 有token但没有用户信息，尝试从API获取（带超时）
          try {
            const { getUserInfo } = await import('../services/auth.service');
            const userInfo = await fetchWithTimeout(getUserInfo());
            if (userInfo) {
              const storedUser: StoredUser = {
                ...userInfo,
                actualRole: userInfo.role as UserRole,
                viewingRole: userInfo.role as UserRole,
              };
              setUserState(storedUser);
              setViewingRoleState(storedUser.viewingRole || storedUser.actualRole);
            }
          } catch (e) {
            // API获取失败，清除token
            console.log('获取用户信息失败，使用游客模式');
            TokenStorage.clearToken();
          }
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 设置用户并保存到本地存储
  const setUser = useCallback((userData: StoredUser | null) => {
    if (userData) {
      // 确保有 actualRole 字段
      if (!userData.actualRole) {
        userData.actualRole = userData.role as UserRole;
      }
      // 确保有 viewingRole 字段
      if (!userData.viewingRole) {
        userData.viewingRole = userData.actualRole;
      }
      TokenStorage.setUserInfo(userData);
      setUserState(userData);
      setViewingRoleState(userData.viewingRole);
    } else {
      setUserState(null);
      setViewingRoleState('customer');
    }
  }, []);

  // 登录
  const login = useCallback((userData: User) => {
    const storedUser: StoredUser = {
      ...userData,
      actualRole: userData.role as UserRole,
      viewingRole: userData.role as UserRole,
    };
    setUser(storedUser);
  }, [setUser]);

  // 登出
  const logout = useCallback(() => {
    TokenStorage.clearAll();
    setUserState(null);
    setViewingRoleState('customer');
  }, []);

  // 切换视角角色（仅管理员可用）
  const switchRole = useCallback((role: UserRole) => {
    if (!user) return;
    
    // 非管理员只能使用自己的角色
    if (user.role !== 'admin') {
      console.log('非管理员账号，无法切换角色');
      return;
    }

    const updatedUser: StoredUser = {
      ...user,
      role: role, // 当前显示的角色
      viewingRole: role,
    };
    
    // 保存到本地存储
    TokenStorage.setUserInfo(updatedUser);
    TokenStorage.setViewingRole(role);
    
    setUserState(updatedUser);
    setViewingRoleState(role);
    
    console.log(`角色切换到: ${role}`);
  }, [user]);

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      const { getUserInfo } = await fetchWithTimeout(import('../services/auth.service'));
      const userInfo = await getUserInfo();
      if (userInfo && user) {
        const updatedUser: StoredUser = {
          ...userInfo,
          actualRole: user.actualRole,
          viewingRole: user.viewingRole || user.actualRole,
        };
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error);
    }
  };

  // 是否是管理员账号
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        viewingRole,
        setUser,
        isLoading,
        isLoggedIn: !!user,
        isAdmin,
        login,
        logout,
        switchRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
