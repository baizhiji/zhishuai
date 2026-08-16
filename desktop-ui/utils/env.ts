/**
 * 运行环境检测工具（V3.0 桌面安装版）
 *
 * 桌面版（Tauri WebView）通过 `window.__TAURI__` 暴露的原生桥接能力进行识别；
 * Web 版（浏览器/公共服务页）不包含该全局对象。
 *
 * 统一约定：
 * - NEXT_PUBLIC_API_BASE_URL = 后端 API 域名根（如 https://api.zhishuai.example）
 *   utils/request.ts 拼接完整路径 /api/xxx；lib/request.ts 拼接 /api + 相对路径
 * - 未配置时回退当前 origin（浏览器开发/部署场景）
 */

export const isDesktop: boolean =
  typeof window !== 'undefined' &&
  typeof (window as any).__TAURI__ !== 'undefined';

/** 后端 API 域名根（不含 /api 前缀） */
export const API_ORIGIN: string =
  process.env.NEXT_PUBLIC_API_BASE_URL || '';

/** 桌面版完整 API 前缀（lib/request 用，如 https://api.zhishuai.example/api） */
export const API_PREFIX: string = API_ORIGIN
  ? `${API_ORIGIN.replace(/\/+$/, '')}/api`
  : '/api';

/** 浏览器环境（客户端渲染） */
export const isBrowser: boolean = typeof window !== 'undefined';

/** 判断当前是否运行在桌面 WebView 中 */
export function detectDesktop(): boolean {
  return isDesktop;
}
