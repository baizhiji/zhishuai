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
        // 使用更精确的路径匹配
        const menuMapping: Record<string, string> = {
          // 自媒体运营
          '/media/factory': 'media',
          '/media/matrix': 'media',
          '/media/publish': 'media',
          '/media/report': 'media',
          // 招聘助手
          '/recruitment/publish': 'recruitment',
          '/recruitment/screen': 'recruitment',
          '/recruitment/reply': 'recruitment',
          '/recruitment/interview': 'recruitment',
          '/recruitment/stats': 'recruitment',
          // 智能获客
          '/acquisition/discover': 'acquisition',
          '/acquisition/task': 'acquisition',
          '/acquisition/stats': 'acquisition',
          // 推荐分享
          '/share/code': 'share',
          '/share/track': 'share',
          // 账号与配置
          '/account/staff': 'account',
          '/account/api': 'account',
          '/account/knowledge': 'account',
          '/account/log': 'account',
          // 系统设置
          '/settings/company': 'settings',
          '/settings/security': 'settings',
          '/settings/theme': 'settings',
        }

        // 精确匹配路径
        if (menuMapping[path]) {
          set({ openKeys: [menuMapping[path]] })
          return
        }

        // 如果没有精确匹配，尝试前缀匹配
        for (const [routePath, groupKey] of Object.entries(menuMapping)) {
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
