// Token 存储工具 - 使用 SecureStore 安全存储Token + AsyncStorage存储非敏感数据
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  TOKEN: 'zhishuai_token',        // SecureStore key
  USER_INFO: '@zhishuai_user_info', // AsyncStorage (非敏感)
  VIEWING_ROLE: '@zhishuai_viewing_role', // AsyncStorage
  LOCAL_STORAGE_PREFIX: '@zhishuai_local_',
};

class TokenStorage {
  // ============ Token (SecureStore 安全存储) ============

  static async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('获取Token失败:', error);
      return null;
    }
  }

  // 同步获取Token（从内存缓存，用于API拦截器）
  static getTokenSync(): string | null {
    return (global as any).__tokenCache || null;
  }

  static async setToken(token: string): Promise<void> {
    try {
      (global as any).__tokenCache = token; // 内存缓存
      await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);
    } catch (error) {
      console.error('保存Token失败:', error);
    }
  }

  static async clearToken(): Promise<void> {
    try {
      (global as any).__tokenCache = null;
      await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('清除Token失败:', error);
    }
  }

  static async isLoggedIn(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  static isLoggedInSync(): boolean {
    return !!(global as any).__tokenCache;
  }

  // ============ 用户信息 (AsyncStorage) ============

  static async getUserInfo(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  static getUserInfoSync(): any {
    return (global as any).__userInfoCache || null;
  }

  static async setUserInfo(userInfo: any): Promise<void> {
    try {
      (global as any).__userInfoCache = userInfo;
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  }

  static async clearUserInfo(): Promise<void> {
    try {
      (global as any).__userInfoCache = null;
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO);
    } catch (error) {
      console.error('清除用户信息失败:', error);
    }
  }

  // ============ 视角角色 (AsyncStorage) ============

  static async getViewingRole(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.VIEWING_ROLE);
    } catch (error) {
      console.error('获取视角角色失败:', error);
      return null;
    }
  }

  static async setViewingRole(role: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VIEWING_ROLE, role);
    } catch (error) {
      console.error('保存视角角色失败:', error);
    }
  }

  static async clearViewingRole(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.VIEWING_ROLE);
    } catch (error) {
      console.error('清除视角角色失败:', error);
    }
  }

  // ============ 清除所有 ============

  static async clearAll(): Promise<void> {
    try {
      (global as any).__tokenCache = null;
      (global as any).__userInfoCache = null;
      await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_INFO,
        STORAGE_KEYS.VIEWING_ROLE,
      ]);
    } catch (error) {
      console.error('清除所有数据失败:', error);
    }
  }

  // ============ 初始化 ============

  static async init(): Promise<void> {
    try {
      const [token, userInfo] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_INFO),
      ]);
      (global as any).__tokenCache = token;
      (global as any).__userInfoCache = userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('初始化TokenStorage失败:', error);
    }
  }

  // ============ 本地存储 (AsyncStorage) ============

  static async get(key: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_PREFIX + key);
      if (data) {
        try {
          return JSON.parse(data);
        } catch {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('获取本地存储失败:', error);
      return null;
    }
  }

  static async set(key: string, value: any): Promise<void> {
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_STORAGE_PREFIX + key, data);
    } catch (error) {
      console.error('保存本地存储失败:', error);
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.LOCAL_STORAGE_PREFIX + key);
    } catch (error) {
      console.error('移除本地存储失败:', error);
    }
  }
}

export default TokenStorage;
