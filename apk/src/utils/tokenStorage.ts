// Token 存储工具
// 使用全局变量模拟存储，后续可替换为 AsyncStorage
// Web 平台额外持久化到浏览器 localStorage，便于调试与截图

// 全局Token变量
(global as any).userToken = null;
(global as any).userInfo = null;
(global as any).viewingRole = null;

// 本地存储
(global as any).localStorage = {};

// Web 平台：启动时从真实 localStorage 恢复登录态
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    (global as any).userToken = window.localStorage.getItem('zs_userToken') || null;
    const ui = window.localStorage.getItem('zs_userInfo');
    (global as any).userInfo = ui ? JSON.parse(ui) : null;
    (global as any).viewingRole = window.localStorage.getItem('zs_viewingRole') || null;
  } catch (e) {
    // 忽略解析错误
  }
}

class TokenStorage {
  // 获取Token
  static getToken(): string | null {
    return (global as any).userToken;
  }

  // 设置Token
  static setToken(token: string): void {
    (global as any).userToken = token;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('zs_userToken', token);
    }
  }

  // 清除Token
  static clearToken(): void {
    (global as any).userToken = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('zs_userToken');
    }
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
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('zs_userInfo', JSON.stringify(userInfo));
    }
  }

  // 清除用户信息
  static clearUserInfo(): void {
    (global as any).userInfo = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('zs_userInfo');
    }
  }

  // 获取当前视角角色
  static getViewingRole(): any {
    return (global as any).viewingRole;
  }

  // 设置当前视角角色
  static setViewingRole(role: string): void {
    (global as any).viewingRole = role;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('zs_viewingRole', role);
    }
  }

  // 清除视角角色
  static clearViewingRole(): void {
    (global as any).viewingRole = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('zs_viewingRole');
    }
  }

  // 清除所有登录数据
  static clearAll(): void {
    this.clearToken();
    this.clearUserInfo();
    this.clearViewingRole();
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
