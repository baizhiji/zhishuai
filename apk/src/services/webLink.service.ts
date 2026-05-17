/**
 * Web端链接服务 - 从APK跳转到Web端特定页面
 */
import { Linking, Share, Alert } from 'react-native';

// Web端基础URL
const WEB_BASE_URL = 'http://129.211.12.253';

// 深链接映射表
export const WEB_DEEP_LINKS = {
  home: `${WEB_BASE_URL}/home`,
  create: `${WEB_BASE_URL}/create`,
  materials: `${WEB_BASE_URL}/materials`,
  media: `${WEB_BASE_URL}/media`,
  statistics: `${WEB_BASE_URL}/statistics`,
  recruitment: `${WEB_BASE_URL}/recruitment`,
  acquisition: `${WEB_BASE_URL}/acquisition`,
  share: `${WEB_BASE_URL}/share`,
  settings: `${WEB_BASE_URL}/settings`,
  profile: `${WEB_BASE_URL}/profile`,
  help: `${WEB_BASE_URL}/help`,
  feedback: `${WEB_BASE_URL}/feedback`,
  update: `${WEB_BASE_URL}/update`,
};

export type WebPageKey = keyof typeof WEB_DEEP_LINKS;

/**
 * 打开Web端指定页面
 */
export const openWebPage = async (page: WebPageKey): Promise<void> => {
  const url = WEB_DEEP_LINKS[page];
  if (!url) {
    Alert.alert('错误', '未知的页面类型');
    return;
  }

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // 如果无法打开，尝试复制链接
      await Share.share({
        message: `打开智枢AI：${url}`,
        title: '智枢AI',
      });
      Alert.alert('提示', '已在浏览器中打开链接');
    }
  } catch (error) {
    console.error('打开Web页面失败:', error);
    Alert.alert('错误', '无法打开链接，请稍后重试');
  }
};

/**
 * 分享Web端链接
 */
export const shareWebLink = async (page?: WebPageKey): Promise<void> => {
  const url = page ? WEB_DEEP_LINKS[page] : WEB_BASE_URL;
  try {
    await Share.share({
      message: `体验智枢AI SaaS系统：${url}`,
      title: '智枢AI',
      url: url,
    });
  } catch (error) {
    console.error('分享失败:', error);
  }
};
