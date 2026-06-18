/**
 * 版本更新服务 — 调用真实后端API
 */
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
import { API_CONFIG } from './api.config';

export interface VersionInfo {
  version: string;
  buildNumber: string;
  releaseDate: string;
  releaseNotes: string;
  downloadUrl: string;
  isMandatory: boolean;
  platform?: string;
  minClientVersion?: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  versionInfo?: VersionInfo;
  currentVersion: string;
}

/**
 * 获取当前应用版本号
 */
export const getCurrentVersion = (): string => {
  return Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';
};

/**
 * 获取当前构建号
 */
export const getCurrentBuildNumber = (): string => {
  return String(Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || 1);
};

/**
 * 检查应用更新 — 调用后端真实API
 */
export const checkForUpdate = async (): Promise<UpdateCheckResult> => {
  const currentVersion = getCurrentVersion();
  const currentBuild = getCurrentBuildNumber();

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/version/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentVersion,
        currentBuildNumber: currentBuild,
        platform: Platform.OS,
      }),
    });

    if (!response.ok) {
      throw new Error(`版本检查请求失败: ${response.status}`);
    }

    const result = await response.json();

    if (result.data && result.data.hasUpdate) {
      return {
        hasUpdate: true,
        versionInfo: {
          version: result.data.version,
          buildNumber: result.data.buildNumber,
          releaseDate: result.data.releaseDate,
          releaseNotes: result.data.releaseNotes,
          downloadUrl: result.data.downloadUrl,
          isMandatory: result.data.isMandatory || false,
          platform: result.data.platform,
          minClientVersion: result.data.minClientVersion,
        },
        currentVersion,
      };
    }

    return {
      hasUpdate: false,
      currentVersion,
    };
  } catch (error) {
    console.error('检查更新失败:', error);
    return {
      hasUpdate: false,
      currentVersion,
    };
  }
};

/**
 * 下载并安装更新
 * 优先使用 expo-updates 的 OTA 热更新，降级为下载安装包
 */
export const downloadAndInstall = async (versionInfo: VersionInfo): Promise<void> => {
  try {
    // 如果是 expo-updates 支持的热更新
    if (versionInfo.downloadUrl?.includes('expo-updates') || versionInfo.platform === 'ota') {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
      return;
    }

    // 否则打开下载链接
    if (versionInfo.downloadUrl) {
      const { Linking } = require('react-native');
      await Linking.openURL(versionInfo.downloadUrl);
    }
  } catch (error) {
    console.error('下载更新失败:', error);
    throw error;
  }
};

export default {
  getCurrentVersion,
  getCurrentBuildNumber,
  checkForUpdate,
  downloadAndInstall,
};
