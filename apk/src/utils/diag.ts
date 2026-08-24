import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOT_LOG_KEY = '@diag/boot_log';
const ERROR_KEY = '@diag/error';

let bootLog: string[] = [];

// 记录启动步骤日志（内存 + AsyncStorage 持久化 + console 输出）
export function logBoot(step: string) {
  const line = `[${new Date().toISOString().slice(11, 19)}] ${step}`;
  bootLog.push(line);
  if (bootLog.length > 80) bootLog.shift();
  try {
    console.log(line);
  } catch {}
  AsyncStorage.setItem(BOOT_LOG_KEY, JSON.stringify(bootLog)).catch(() => {});
}

// 读取当前内存中的启动日志
export function getBootLog(): string[] {
  return [...bootLog];
}

// 从持久化存储加载历史启动日志（应用重启后仍可查看上次的日志）
export async function loadBootLog(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(BOOT_LOG_KEY);
    const list = raw ? JSON.parse(raw) : [];
    bootLog = Array.isArray(list) ? list : [];
    return bootLog;
  } catch {
    return [];
  }
}

// 保存致命错误信息
export function saveError(err: unknown) {
  try {
    const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    AsyncStorage.setItem(ERROR_KEY, msg).catch(() => {});
    try {
      console.error('[FATAL_ERROR]', msg);
    } catch {}
  } catch {}
}

// 读取上次保存的错误信息
export async function loadSavedError(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ERROR_KEY);
  } catch {
    return null;
  }
}

// 注册全局 JS 错误处理器（必须在 registerRootComponent 之前调用）
export function setupGlobalErrorHandler() {
  const ErrorUtils = (global as any).ErrorUtils;
  if (!ErrorUtils || typeof ErrorUtils.setGlobalHandler !== 'function') return;
  try {
    ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      try {
        const msg =
          error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
        console.error('[GLOBAL_ERROR]', msg, 'isFatal=', isFatal);
        saveError(error);
      } catch {}
    });
  } catch {}
}
