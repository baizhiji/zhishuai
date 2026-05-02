import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';

// 导航上下文类型
export type NavigationContextType = {
  navigate: (name: string, params?: any) => void;
  goBack: () => void;
};

// 创建 Context
const NavigationContext = createContext<NavigationContextType | null>(null);

// 导出 Context Provider
export const NavigationProvider = NavigationContext.Provider;

// 导出 hook
export const useAppNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within NavigationProvider');
  }
  return context;
};
