import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { AppState, AppStateStatus, NativeEventEmitter } from 'react-native';
import TokenStorage from '../utils/tokenStorage';
import { initNotifications, unregisterPushToken } from '../services/notification.service';
import type { User, UserRole } from '../types';

// 会话超时：30分钟无操作自动登出
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// 全局401事件（apiClient触发，AuthContext监听）
export const AUTH_EVENT_401 = 'auth:401';
let _onAuth401: (() => void) | null = null;
export function setOnAuth401(cb: (() => void) | null) {
  _onAuth401 = cb;
}
export function notifyAuth401() {
  if (_onAuth401) _onAuth401();
}

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
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
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
  login: async () => {},
  logout: async () => {},
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
  const lastActivityRef = useRef<number>(Date.now());
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 重置活动时间戳
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // 检查会话是否超时
  const checkSessionTimeout = useCallback(async () => {
    if (!user) return;
    const now = Date.now();
    if (now - lastActivityRef.current > SESSION_TIMEOUT_MS) {
      console.log('会话超时，自动登出');
      await TokenStorage.clearAll();
      setUserState(null);
      setViewingRoleState('customer');
    }
  }, [user]);

  // AppState 监听（后台/前台切换）
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkSessionTimeout();
      }
      resetActivity();
    });
    return () => subscription.remove();
  }, [checkSessionTimeout, resetActivity]);

  // 会话超时定时器（每分钟检查一次）
  useEffect(() => {
    if (user) {
      sessionTimerRef.current = setInterval(checkSessionTimeout, 60000);
    }
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    };
  }, [user, checkSessionTimeout]);

  // 注册401全局监听（apiClient刷新失败时回调）
  useEffect(() => {
    setOnAuth401(async () => {
      console.log('收到401通知，执行优雅登出');
      await logout();
    });
    return () => setOnAuth401(null);
  }, [logout]);

  // 初始化：从AsyncStorage恢复登录态
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 初始化TokenStorage内存缓存
        await TokenStorage.init();
        
        // 从AsyncStorage获取用户信息
        const localUser = await TokenStorage.getUserInfo() as StoredUser | null;
        if (localUser) {
          if (!localUser.actualRole) {
            localUser.actualRole = localUser.role as UserRole;
          }
          const savedViewingRole = await TokenStorage.getViewingRole();
          localUser.viewingRole = savedViewingRole || localUser.actualRole;
          setUserState(localUser);
          setViewingRoleState(localUser.viewingRole || localUser.actualRole);
          setIsLoading(false);
          return;
        }

        // 没有用户信息，检查token
        const token = await TokenStorage.getToken();
        if (token) {
          try {
            const { authService } = await import('../services/auth.service');
            const userInfo = await fetchWithTimeout(authService.getUserInfo());
            if (userInfo) {
              const storedUser: StoredUser = {
                ...userInfo,
                actualRole: userInfo.role as UserRole,
                viewingRole: userInfo.role as UserRole,
              };
              await TokenStorage.setUserInfo(storedUser);
              setUserState(storedUser);
              setViewingRoleState(storedUser.viewingRole || storedUser.actualRole);
            }
          } catch (e) {
            console.log('获取用户信息失败，清除登录态');
            await TokenStorage.clearToken();
          }
        }
      } catch (error) {
        console.error('初始化认证状态失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // 设置用户并保存到持久化存储
  const setUser = useCallback(async (userData: StoredUser | null) => {
    if (userData) {
      if (!userData.actualRole) {
        userData.actualRole = userData.role as UserRole;
      }
      if (!userData.viewingRole) {
        userData.viewingRole = userData.actualRole;
      }
      await TokenStorage.setUserInfo(userData);
      setUserState(userData);
      setViewingRoleState(userData.viewingRole);
    } else {
      setUserState(null);
      setViewingRoleState('customer');
    }
  }, []);

  // 登录
  const login = useCallback(async (userData: User) => {
    const storedUser: StoredUser = {
      ...userData,
      actualRole: userData.role as UserRole,
      viewingRole: userData.role as UserRole,
    };
    await setUser(storedUser);
    // 登录成功后初始化推送通知
    initNotifications().catch(e => console.warn('推送初始化失败:', e));
  }, [setUser]);

  // 登出
  const logout = useCallback(async () => {
    // 登出前注销推送Token
    await unregisterPushToken().catch(() => {});
    await TokenStorage.clearAll();
    setUserState(null);
    setViewingRoleState('customer');
  }, []);

  // 切换视角角色（仅管理员可用）
  const switchRole = useCallback(async (role: UserRole) => {
    if (!user) return;
    
    if (user.role !== 'admin') {
      console.log('非管理员账号，无法切换角色');
      return;
    }

    const updatedUser: StoredUser = {
      ...user,
      role: role,
      viewingRole: role,
    };
    
    await TokenStorage.setUserInfo(updatedUser);
    await TokenStorage.setViewingRole(role);
    
    setUserState(updatedUser);
    setViewingRoleState(role);
    
    console.log(`角色切换到: ${role}`);
  }, [user]);

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      const { authService } = await import('../services/auth.service');
      const userInfo = await fetchWithTimeout(authService.getUserInfo());
      if (userInfo && user) {
        const updatedUser: StoredUser = {
          ...userInfo,
          actualRole: user.actualRole,
          viewingRole: user.viewingRole || user.actualRole,
        };
        await setUser(updatedUser);
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error);
    }
  };

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
