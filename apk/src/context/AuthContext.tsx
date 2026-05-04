import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TokenStorage as Storage } from '../utils/tokenStorage';

interface User {
  id: string;
  phone: string;
  name: string;
  company?: string;
  position?: string;
  expireTime?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 检查登录状态
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // 优先从本地存储获取用户信息
        const localUser = TokenStorage.getUserInfo();
        if (localUser) {
          setUser(localUser);
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
              setUser(userInfo);
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

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    TokenStorage.clearAll();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { getUserInfo } = await import('../services/auth.service');
      const userInfo = await fetchWithTimeout(getUserInfo());
      if (userInfo) {
        setUser(userInfo);
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
