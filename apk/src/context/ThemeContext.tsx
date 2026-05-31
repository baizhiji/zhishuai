import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Storage, STORAGE_KEYS } from '../utils/storage';

// 主题颜色定义
export const lightTheme = {
  primary: '#3B82F6',
  primaryLight: '#DBEAFE',
  background: '#EFF6FF',
  card: '#FFFFFF',
  text: '#1E3A5F',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  header: '#DBEAFE',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  statusBar: 'dark-content' as const,
  // 额外颜色
  inputBg: '#F8FAFC',
  shadow: '#94A3B8',
  overlay: 'rgba(0,0,0,0.5)',
  tabBar: '#FFFFFF',
  tabBarInactive: '#94A3B8',
};

export const darkTheme = {
  primary: '#60A5FA',
  primaryLight: '#1E3A5F',
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#334155',
  header: '#1E3A5F',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  statusBar: 'light-content' as const,
  // 额外颜色
  inputBg: '#1E293B',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.7)',
  tabBar: '#1E293B',
  tabBarInactive: '#64748B',
};

export type Theme = typeof lightTheme;
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // 从本地存储加载主题设置
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedMode = Storage.get(STORAGE_KEYS.THEME_MODE);
        if (storedMode && ['light', 'dark', 'system'].includes(storedMode)) {
          setThemeModeState(storedMode as ThemeMode);
        }
      } catch (error) {
        console.log('加载主题设置失败:', error);
      }
      setIsLoaded(true);
    };
    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    Storage.set(STORAGE_KEYS.THEME_MODE, mode);
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
    setThemeMode(newMode);
  };

  // 根据模式和系统主题确定实际主题
  const isDark = themeMode === 'system'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  const theme = isDark ? darkTheme : lightTheme;

  // 未加载时不渲染，避免闪烁
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, isDark, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
