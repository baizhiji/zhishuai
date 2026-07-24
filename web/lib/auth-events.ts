/**
 * 统一认证事件模块
 * 替代各处零散的 window.location.href = '/login'，避免多次硬跳转
 */

let isRedirectingToLogin = false;

// 重置标记（登录成功后调用）
export function resetRedirectFlag(): void {
  isRedirectingToLogin = false;
}

// 触发认证过期事件，由 AuthContext 统一处理
export function dispatchAuthExpired(): void {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  // 清除本地存储的认证信息
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('viewing_role');
  }

  // 派发自定义事件，由 AuthContext 监听并处理
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }
}
