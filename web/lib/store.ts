<<<<<<< HEAD
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
=======
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
>>>>>>> 962968886be726cd434c792933b5515366d34518
}

export const useAuthStore = create<AuthState>()(
  persist(
<<<<<<< HEAD
    (set) => ({
=======
    set => ({
>>>>>>> 962968886be726cd434c792933b5515366d34518
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
<<<<<<< HEAD
      updateUser: (userData) =>
        set((state) => ({
=======
      updateUser: userData =>
        set(state => ({
>>>>>>> 962968886be726cd434c792933b5515366d34518
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
<<<<<<< HEAD
)

interface UIState {
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'auto'
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
=======
);

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'auto';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
>>>>>>> 962968886be726cd434c792933b5515366d34518
}

export const useUIStore = create<UIState>()(
  persist(
<<<<<<< HEAD
    (set) => ({
      sidebarCollapsed: false,
      theme: 'light',
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
=======
    set => ({
      sidebarCollapsed: false,
      theme: 'light',
      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: theme => set({ theme }),
>>>>>>> 962968886be726cd434c792933b5515366d34518
    }),
    {
      name: 'ui-storage',
    }
  )
<<<<<<< HEAD
)

interface MediaState {
  selectedPlatforms: string[]
  setSelectedPlatforms: (platforms: string[]) => void
  clearSelection: () => void
}

export const useMediaStore = create<MediaState>((set) => ({
  selectedPlatforms: [],
  setSelectedPlatforms: (platforms) => set({ selectedPlatforms: platforms }),
  clearSelection: () => set({ selectedPlatforms: [] }),
}))

interface LoadingState {
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void
}

export const useLoadingStore = create<LoadingState>((set) => ({
  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}))
=======
);

interface MediaState {
  selectedPlatforms: string[];
  setSelectedPlatforms: (platforms: string[]) => void;
  clearSelection: () => void;
}

export const useMediaStore = create<MediaState>(set => ({
  selectedPlatforms: [],
  setSelectedPlatforms: platforms => set({ selectedPlatforms: platforms }),
  clearSelection: () => set({ selectedPlatforms: [] }),
}));

interface LoadingState {
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

export const useLoadingStore = create<LoadingState>(set => ({
  globalLoading: false,
  setGlobalLoading: loading => set({ globalLoading: loading }),
}));
>>>>>>> 962968886be726cd434c792933b5515366d34518
