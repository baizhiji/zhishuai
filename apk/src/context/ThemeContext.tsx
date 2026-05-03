import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

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
};

export type Theme = typeof lightTheme;
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 简单的本地存储
const THEME_KEY = '@theme_mode';

const getStoredTheme = (): ThemeMode => {
  try {
    // 在React Native中，我们使用AsyncStorage
    // 这里简化处理，默认使用system
    return 'system';
  } catch {
    return 'system';
  }
};

const setStoredTheme = (mode: ThemeMode) => {
  try {
    // 在React Native中，我们使用AsyncStorage
    // 这里简化处理
    console.log('Theme set to:', mode);
  } catch {
    console.log('Failed to store theme');
  }
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getStoredTheme);

  // 从本地存储加载主题
  useEffect(() => {
    // 可以在此处从AsyncStorage加载主题
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    setStoredTheme(mode);
  };

  // 根据模式和系统主题确定实际主题
  const isDark = themeMode === 'system' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeMode, isDark, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;
