/**
 * 版本更新服务
 */
import { apiClient } from './api.client';
import { APP_VERSION } from './version';

export interface VersionInfo {
  version: string;
  buildNumber: string;
  releaseDate: string;
  releaseNotes: string;
  downloadUrl: string;
  isMandatory: boolean;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  versionInfo?: VersionInfo;
  currentVersion: string;
}

/**
 * 获取当前应用版本信息
 */
export const getCurrentVersion = (): string => {
  return APP_VERSION;
};

/**
 * 检查应用更新
 */
export const checkForUpdate = async (): Promise<UpdateCheckResult> => {
  const currentVersion = getCurrentVersion();
  try {
    const data = await apiClient.get<{
      version: string;
      buildNumber?: number | string;
      releaseDate?: string;
      changelog?: string;
      downloadUrl?: string;
      forceUpdate?: boolean;
    }>('/version/latest');
    const versionInfo: VersionInfo = {
      version: data.version,
      buildNumber: String(data.buildNumber ?? ''),
      releaseDate: data.releaseDate || '',
      releaseNotes: data.changelog || '',
      downloadUrl: data.downloadUrl || '',
      isMandatory: data.forceUpdate ?? false,
    };
    return {
      hasUpdate: versionInfo.version !== currentVersion,
      versionInfo,
      currentVersion,
    };
  } catch {
    return { hasUpdate: false, currentVersion };
  }
};

/**
 * 下载并安装更新
 */
export const downloadAndInstall = async (downloadUrl: string): Promise<void> => {
  // 在实际应用中，应该使用 expo-linking 或原生模块打开下载链接
  // 或使用 expo-updates 库来处理应用内更新
  try {
    const { Linking } = require('react-native');
    await Linking.openURL(downloadUrl);
  } catch (error) {
    console.error('打开下载链接失败:', error);
    throw error;
  }
};

export default {
  getCurrentVersion,
  checkForUpdate,
  downloadAndInstall
};
