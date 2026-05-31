/**
 * 本地存储工具 - 支持同步和异步存储
 * 优先使用 AsyncStorage，不可用时回退到全局变量
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// 存储键名
export const STORAGE_KEYS = {
  THEME_MODE: '@zhishuai_theme_mode',
  USER_TOKEN: '@zhishuai_user_token',
  USER_INFO: '@zhishuai_user_info',
  NOTIFICATIONS: '@zhishuai_notifications',
  CACHE_DATA: '@zhishuai_cache',
  OFFLINE_QUEUE: '@zhishuai_offline_queue',
  SETTINGS: '@zhishuai_settings',
};

// 同步存储（使用全局变量，快速访问）
const syncStorage: Record<string, string> = {};

// AsyncStorage 是否可用
let storageAvailable = true;

// 初始化同步存储
export const initSyncStorage = async () => {
  try {
    if (!AsyncStorage || typeof AsyncStorage.getItem !== 'function') {
      console.log('AsyncStorage 不可用，使用内存存储');
      storageAvailable = false;
      return;
    }
    
    // 从 AsyncStorage 加载数据到同步存储
    const keys = Object.values(STORAGE_KEYS);
    const pairs = await AsyncStorage.multiGet(keys);
    pairs.forEach(([key, value]) => {
      if (value !== null && key) {
        syncStorage[key] = value;
      }
    });
    console.log('同步存储初始化完成');
  } catch (error) {
    console.log('同步存储初始化失败，使用内存存储:', error);
    storageAvailable = false;
  }
};

// 获取未读消息数量
export const getUnreadCount = (): number => {
  try {
    const notifications = syncStorage[STORAGE_KEYS.NOTIFICATIONS];
    if (!notifications) return 0;
    const list = JSON.parse(notifications);
    return Array.isArray(list) ? list.filter((n: any) => !n.read).length : 0;
  } catch {
    return 0;
  }
};

// 获取消息列表
export const getNotifications = (): any[] => {
  try {
    const notifications = syncStorage[STORAGE_KEYS.NOTIFICATIONS];
    if (!notifications) return [];
    return JSON.parse(notifications);
  } catch {
    return [];
  }
};

// 设置消息列表
export const setNotifications = (list: any[]): void => {
  try {
    const jsonValue = JSON.stringify(list);
    syncStorage[STORAGE_KEYS.NOTIFICATIONS] = jsonValue;
    if (storageAvailable) {
      AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, jsonValue).catch(() => {});
    }
  } catch {}
};

// 标记消息已读
export const markAsRead = (id: string): void => {
  try {
    const list = getNotifications();
    const updated = list.map((n: any) => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
  } catch {}
};

// 标记所有消息已读
export const markAllAsRead = (): void => {
  try {
    const list = getNotifications();
    const updated = list.map((n: any) => ({ ...n, read: true }));
    setNotifications(updated);
  } catch {}
};

// 清除所有消息
export const clearNotifications = (): void => {
  syncStorage[STORAGE_KEYS.NOTIFICATIONS] = '[]';
  if (storageAvailable) {
    AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, '[]').catch(() => {});
  }
};

// 获取值
export const Storage = {
  // 同步获取
  get(key: string): string | null {
    return syncStorage[key] || null;
  },

  // 同步设置
  set(key: string, value: string): void {
    syncStorage[key] = value;
    if (storageAvailable) {
      AsyncStorage.setItem(key, value).catch(() => {});
    }
  },

  // 同步删除
  remove(key: string): void {
    delete syncStorage[key];
    if (storageAvailable) {
      AsyncStorage.removeItem(key).catch(() => {});
    }
  },

  // 清除所有
  clearAll(): void {
    Object.keys(syncStorage).forEach(key => {
      delete syncStorage[key];
    });
    if (storageAvailable) {
      AsyncStorage.clear().catch(() => {});
    }
  },

  // 异步获取
  async getAsync<T>(key: string): Promise<T | null> {
    try {
      if (!storageAvailable) {
        const value = syncStorage[key];
        return value ? JSON.parse(value) : null;
      }
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  // 异步设置
  async setAsync<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      syncStorage[key] = jsonValue;
      if (storageAvailable) {
        await AsyncStorage.setItem(key, jsonValue);
      }
    } catch {}
  },
};

// 缓存工具
export const Cache = {
  // 设置缓存（带过期时间）
  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    const cacheItem = {
      data: value,
      expireTime: Date.now() + ttlSeconds * 1000,
    };
    await Storage.setAsync(`${STORAGE_KEYS.CACHE_DATA}_${key}`, cacheItem);
  },

  // 获取缓存
  async get<T>(key: string): Promise<T | null> {
    const item = await Storage.getAsync<{ data: T; expireTime: number }>(
      `${STORAGE_KEYS.CACHE_DATA}_${key}`
    );
    if (!item) return null;
    if (Date.now() > item.expireTime) {
      await this.remove(key);
      return null;
    }
    return item.data;
  },

  // 删除缓存
  async remove(key: string): Promise<void> {
    if (storageAvailable) {
      await AsyncStorage.removeItem(`${STORAGE_KEYS.CACHE_DATA}_${key}`);
    }
  },

  // 清除所有缓存
  async clear(): Promise<void> {
    if (!storageAvailable) return;
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k?.startsWith(STORAGE_KEYS.CACHE_DATA || ''));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch {}
  },
};

// 离线队列（用于网络请求）
export const OfflineQueue = {
  // 添加到队列
  async add(operation: { type: string; payload: any; timestamp: number }): Promise<void> {
    const queue = await this.getQueue();
    queue.push(operation);
    await Storage.setAsync(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  },

  // 获取队列
  async getQueue(): Promise<any[]> {
    return await Storage.getAsync(STORAGE_KEYS.OFFLINE_QUEUE) || [];
  },

  // 清空队列
  async clear(): Promise<void> {
    await Storage.setAsync(STORAGE_KEYS.OFFLINE_QUEUE, []);
  },

  // 处理队列
  async processQueue(apiClient: any): Promise<{ success: number; failed: number }> {
    const queue = await this.getQueue();
    let success = 0;
    let failed = 0;
    const failedOps: any[] = [];

    for (const operation of queue) {
      try {
        switch (operation.type) {
          case 'CREATE':
            await apiClient.post(operation.payload.endpoint, operation.payload.data);
            break;
          case 'UPDATE':
            await apiClient.put(operation.payload.endpoint, operation.payload.data);
            break;
          case 'DELETE':
            await apiClient.delete(operation.payload.endpoint);
            break;
        }
        success++;
      } catch {
        failed++;
        failedOps.push(operation);
      }
    }

    await Storage.setAsync(STORAGE_KEYS.OFFLINE_QUEUE, failedOps);
    return { success, failed };
  },
};

// 设置管理
export const Settings = {
  async get<T>(key: string, defaultValue: T): Promise<T> {
    const value = await Storage.getAsync<T>(`${STORAGE_KEYS.SETTINGS}_${key}`);
    return value ?? defaultValue;
  },

  async set<T>(key: string, value: T): Promise<void> {
    await Storage.setAsync(`${STORAGE_KEYS.SETTINGS}_${key}`, value);
  },
};
