/**
 * 版本更新服务
 */
import { apiClient } from './api.client';
import { API_CONFIG } from './api.config';

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
  return '1.0.0';
};

/**
 * 检查应用更新
 */
export const checkForUpdate = async (): Promise<UpdateCheckResult> => {
  const currentVersion = getCurrentVersion();
  try {
    const response = await apiClient.get<VersionInfo>(
      `${API_CONFIG.BASE_URL}/version/latest`
    );
    const versionInfo = response as unknown as VersionInfo;
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
