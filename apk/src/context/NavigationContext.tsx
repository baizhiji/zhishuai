import React, { createContext, useContext, useCallback, useRef } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';

// 导航上下文类型
export interface NavigationContextType {
  navigate: (name: string, params?: any) => void;
  goBack: () => void;
}

// 创建 Context - 只创建一次
export const NavigationContext = createContext<NavigationContextType>({
  navigate: () => {},
  goBack: () => {},
});

// 导出 hook - 必须在 Context.Provider 内使用
export const useAppNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  return context;
};
