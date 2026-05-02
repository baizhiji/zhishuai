import React, { createContext, useContext } from 'react';
import type { NavigationContextType } from '../navigation/AppNavigator';

const AppNavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useAppNavigation = (): NavigationContextType => {
  const context = useContext(AppNavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within NavigationProvider');
  }
  return context;
};

export { AppNavigationContext };
