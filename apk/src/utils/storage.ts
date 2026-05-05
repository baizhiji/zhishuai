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

// 初始化同步存储
export const initSyncStorage = async () => {
  try {
    // 从 AsyncStorage 加载数据到同步存储
    const keys = Object.values(STORAGE_KEYS);
    const pairs = await AsyncStorage.multiGet(keys);
    pairs.forEach(([key, value]) => {
      if (value !== null) {
        syncStorage[key] = value;
      }
    });
    console.log('同步存储初始化完成');
  } catch (error) {
    console.log('同步存储初始化失败，使用内存存储:', error);
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
    // 异步保存到 AsyncStorage
    AsyncStorage.setItem(key, value).catch(err => {
      console.log('AsyncStorage 保存失败:', err);
    });
  },

  // 同步删除
  remove(key: string): void {
    delete syncStorage[key];
    AsyncStorage.removeItem(key).catch(err => {
      console.log('AsyncStorage 删除失败:', err);
    });
  },

  // 清除所有
  clearAll(): void {
    Object.keys(syncStorage).forEach(key => {
      delete syncStorage[key];
    });
    AsyncStorage.clear().catch(err => {
      console.log('AsyncStorage 清除失败:', err);
    });
  },

  // 异步获取
  async getAsync<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.log('AsyncStorage 获取失败:', error);
      return null;
    }
  },

  // 异步设置
  async setAsync<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      syncStorage[key] = jsonValue;
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.log('AsyncStorage 保存失败:', error);
    }
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
      // 缓存已过期
      await this.remove(key);
      return null;
    }
    return item.data;
  },

  // 删除缓存
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(`${STORAGE_KEYS.CACHE_DATA}_${key}`);
  },

  // 清除所有缓存
  async clear(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(STORAGE_KEYS.CACHE_DATA));
    await AsyncStorage.multiRemove(cacheKeys);
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
        // 根据操作类型执行请求
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
      } catch (error) {
        failed++;
        failedOps.push(operation);
      }
    }

    // 保存失败的操作
    await Storage.setAsync(STORAGE_KEYS.OFFLINE_QUEUE, failedOps);
    return { success, failed };
  },
};

// 设置管理
export const Settings = {
  // 获取设置
  async get<T>(key: string, defaultValue: T): Promise<T> {
    const value = await Storage.getAsync<T>(`${STORAGE_KEYS.SETTINGS}_${key}`);
    return value ?? defaultValue;
  },

  // 设置值
  async set<T>(key: string, value: T): Promise<void> {
    await Storage.setAsync(`${STORAGE_KEYS.SETTINGS}_${key}`, value);
  },
};
