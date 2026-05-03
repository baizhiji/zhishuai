/**
 * Web端跳转服务 - 从APK打开Web端特定页面
 */

import { Linking, Alert, Share, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Web端基础URL
const WEB_BASE_URL = 'https://zhishuai.com';

// 深度链接配置
export const WEB_DEEP_LINKS = {
  home: '/',
  materials: '/materials',
  media: '/media',
  recruitment: '/recruitment',
  acquisition: '/acquisition',
  profile: '/profile',
  settings: '/settings',
  ai: '/ai',
  referrals: '/referrals',
  statistics: '/statistics',
} as const;

export type WebPageKey = keyof typeof WEB_DEEP_LINKS;

/**
 * 跳转到Web端指定页面
 */
export const openWebPage = async (
  page: WebPageKey,
  params?: Record<string, string>
): Promise<boolean> => {
  try {
    let url = `${WEB_BASE_URL}${WEB_DEEP_LINKS[page]}`;
    
    // 添加查询参数
    if (params && Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      url += `?${queryString}`;
    }

    // 使用系统浏览器打开
    const result = await WebBrowser.openBrowserAsync(url, {
      toolbarColor: '#1890FF',
      controlsColor: '#1890FF',
      dismissButtonStyle: 'done',
      enableBarCollapsing: false,
    });

    return result.type === 'dismiss';
  } catch (error) {
    console.error('打开Web页面失败:', error);
    Alert.alert('提示', '无法打开Web页面，请检查网络连接');
    return false;
  }
};

/**
 * 分享Web链接
 */
export const shareWebLink = async (
  page: WebPageKey,
  params?: Record<string, string>,
  title?: string
): Promise<boolean> => {
  try {
    let url = `${WEB_BASE_URL}${WEB_DEEP_LINKS[page]}`;
    
    if (params && Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      url += `?${queryString}`;
    }

    const result = await Share.share({
      url,
      title: title || '智枢AI',
      message: Platform.OS === 'ios' ? undefined : `智枢AI - ${title || '分享链接'}\n${url}`,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('分享失败:', error);
    return false;
  }
};

/**
 * 获取当前App版本对应的Web端页面URL
 */
export const getWebPageUrl = (
  page: WebPageKey,
  params?: Record<string, string>
): string => {
  let url = `${WEB_BASE_URL}${WEB_DEEP_LINKS[page]}`;
  
  if (params && Object.keys(params).length > 0) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    url += `?${queryString}`;
  }

  return url;
};

/**
 * 检查是否可以处理某个URL
 */
export const canOpenUrl = async (url: string): Promise<boolean> => {
  try {
    const supported = await Linking.canOpenURL(url);
    return supported;
  } catch {
    return false;
  }
};

/**
 * 获取分享文本（用于复制）
 */
export const getShareText = (page: WebPageKey, params?: Record<string, string>): string => {
  return getWebPageUrl(page, params);
};
