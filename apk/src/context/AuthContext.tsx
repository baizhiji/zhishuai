import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Storage } from '../utils/tokenStorage';
import { getUserInfo } from '../services/auth.service';

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 检查登录状态
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = Storage.getToken();
      if (token) {
        // 有Token，尝试获取用户信息
        const userInfo = await getUserInfo();
        if (userInfo) {
          setUser(userInfo);
        } else {
          // Token无效，清除
          Storage.clearToken();
        }
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      Storage.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    Storage.clearToken();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userInfo = await getUserInfo();
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
