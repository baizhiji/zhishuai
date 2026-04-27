import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NavigationStore {
  openKeys: string[]
  setOpenKeys: (keys: string[]) => void
  updateOpenKeysForPath: (path: string) => void
}

export const useNavigationStore = create<NavigationStore>()(
  persist(
    (set, get) => ({
      openKeys: [],
      setOpenKeys: (keys) => set({ openKeys: keys }),
      updateOpenKeysForPath: (path) => {
        // 根据路径自动更新展开的菜单
        const menuGroups: Record<string, string> = {
          '/media/factory': 'media',
          '/media/matrix': 'media',
          '/media/publish': 'media',
          '/media/report': 'media',
          '/recruitment/publish': 'recruitment',
          '/recruitment/screen': 'recruitment',
          '/recruitment/reply': 'recruitment',
          '/recruitment/interview': 'recruitment',
          '/recruitment/stats': 'recruitment',
          '/acquisition/discover': 'acquisition',
          '/acquisition/task': 'acquisition',
          '/acquisition/stats': 'acquisition',
          '/share/code': 'share',
          '/share/track': 'share',
          '/account/staff': 'account',
          '/account/api': 'account',
          '/account/knowledge': 'account',
          '/account/log': 'account',
          '/settings/company': 'settings',
          '/settings/security': 'settings',
          '/settings/theme': 'settings',
        }

        // 查找匹配的菜单组
        for (const [routePath, groupKey] of Object.entries(menuGroups)) {
          if (path.startsWith(routePath)) {
            set({ openKeys: [groupKey] })
            return
          }
        }
      },
    }),
    {
      name: 'navigation-storage',
    }
  )
)
