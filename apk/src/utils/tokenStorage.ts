// Token 存储工具
// 使用全局变量模拟存储，后续可替换为 AsyncStorage

// 全局Token变量
(global as any).userToken = null;
(global as any).userInfo = null;

// 本地存储
(global as any).localStorage = {};

class TokenStorage {
  // 获取Token
  static getToken(): string | null {
    return (global as any).userToken;
  }

  // 设置Token
  static setToken(token: string): void {
    (global as any).userToken = token;
  }

  // 清除Token
  static clearToken(): void {
    (global as any).userToken = null;
  }

  // 检查是否已登录
  static isLoggedIn(): boolean {
    return !!(global as any).userToken;
  }

  // 获取用户信息
  static getUserInfo(): any {
    return (global as any).userInfo;
  }

  // 设置用户信息
  static setUserInfo(userInfo: any): void {
    (global as any).userInfo = userInfo;
  }

  // 清除用户信息
  static clearUserInfo(): void {
    (global as any).userInfo = null;
  }

  // 清除所有登录数据
  static clearAll(): void {
    this.clearToken();
    this.clearUserInfo();
  }

  // 获取本地存储数据
  static get(key: string): any {
    const data = (global as any).localStorage[key];
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    return null;
  }

  // 设置本地存储数据
  static set(key: string, value: any): void {
    if (typeof value === 'string') {
      (global as any).localStorage[key] = value;
    } else {
      (global as any).localStorage[key] = JSON.stringify(value);
    }
  }

  // 移除本地存储数据
  static remove(key: string): void {
    delete (global as any).localStorage[key];
  }
}

export default TokenStorage;
