/**
 * 通知服务 - 支持本地通知 + 远程推送（FCM）
 * 
 * 在独立构建（非Expo Go）中：
 * - 使用 expo-notifications 获取FCM Token
 * - 上报Token到服务端
 * - 接收远程推送
 * 
 * 在 Expo Go 中：
 * - 仅支持本地通知
 */
import { Platform, Vibration } from 'react-native';
import { apiClient } from './api.client';

// 通知接口
export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'system' | 'order' | 'activity' | 'message';
  data?: any;
  read: boolean;
  timestamp: number;
}

// 推送Token状态
let currentPushToken: string | null = null;

/**
 * 初始化通知服务
 * - 请求权限
 * - 获取FCM Token
 * - 上报Token到服务端
 */
export const initNotifications = async (): Promise<void> => {
  try {
    // 尝试导入 expo-notifications（仅在独立构建中可用）
    let expoNotifications: any = null;
    try {
      expoNotifications = require('expo-notifications');
    } catch {
      console.info('expo-notifications不可用，使用本地通知模式');
    }

    if (expoNotifications) {
      // 配置推送处理器
      expoNotifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // 请求权限
      const { status } = await expoNotifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('通知权限未授予');
        return;
      }

      // 获取推送Token
      const tokenData = await expoNotifications.getExpoPushTokenAsync({
        projectId: undefined, // 使用app.json中的配置
      });

      if (tokenData?.data) {
        currentPushToken = tokenData.data;
        console.info('获取到推送Token');

        // 对于Android，还需要获取FCM Token
        let platform = 'fcm';
        if (Platform.OS === 'ios') {
          platform = 'apns';
        } else if (currentPushToken.startsWith('ExponentPushToken')) {
          // Expo Go中使用Expo推送服务
          platform = 'fcm';
        }

        // 上报Token到服务端
        await registerPushToken(currentPushToken, platform);
      }

      // 监听推送Token刷新
      expoNotifications.addPushTokenListener(async (newToken: { data: string }) => {
        if (newToken?.data && newToken.data !== currentPushToken) {
          currentPushToken = newToken.data;
          const platform = Platform.OS === 'ios' ? 'apns' : 'fcm';
          await registerPushToken(currentPushToken, platform);
        }
      });

      // 监听收到推送通知
      expoNotifications.addNotificationReceivedListener((notification: any) => {
        console.info('收到推送通知:', notification.request?.content?.title);
        Vibration.vibrate(200);
      });

      // 监听用户点击通知
      expoNotifications.addNotificationResponseReceivedListener((response: any) => {
        const data = response.notification?.request?.content?.data;
        console.info('用户点击通知:', data);
        // 根据通知data中的screen字段跳转到对应页面
        if (data?.screen) {
          try {
            const { navigationRef } = require('../navigation/AppNavigator');
            if (navigationRef.current) {
              navigationRef.current.navigate(data.screen as any, data.params);
            }
          } catch (e) {
            console.warn('通知跳转失败:', e);
          }
        }
      });
    }

    console.log('通知服务初始化完成');
  } catch (error) {
    console.log('通知服务初始化失败:', error);
  }
};

/**
 * 注册推送Token到服务端
 */
async function registerPushToken(token: string, platform: string): Promise<void> {
  try {
    await apiClient.post('/notifications/push-token', { token, platform });
    console.info('推送Token已上报');
  } catch (error) {
    console.warn('推送Token上报失败:', error);
  }
}

/**
 * 注销推送Token（登出时调用）
 */
export const unregisterPushToken = async (): Promise<void> => {
  try {
    await apiClient.delete('/notifications/push-token');
    currentPushToken = null;
    console.info('推送Token已注销');
  } catch (error) {
    console.warn('推送Token注销失败:', error);
  }
};

/**
 * 请求通知权限
 */
export const requestPermissions = async (): Promise<boolean> => {
  try {
    let expoNotifications: any = null;
    try {
      expoNotifications = require('expo-notifications');
    } catch {
      return true; // 本地模式无需权限
    }

    if (expoNotifications) {
      const { status } = await expoNotifications.requestPermissionsAsync();
      return status === 'granted';
    }
    return true;
  } catch (error) {
    console.log('请求通知权限失败:', error);
    return false;
  }
};

/**
 * 获取当前推送Token
 */
export const getPushToken = (): string | null => {
  return currentPushToken;
};

/**
 * 从服务端同步通知列表
 */
export const syncNotificationsFromServer = async (): Promise<Notification[]> => {
  try {
    const result = await apiClient.get<any>('/notifications', { pageSize: '50' });
    if (result?.list) {
      return result.list.map((n: any) => ({
        id: n.id,
        title: n.title || '通知',
        body: n.content || n.body || '',
        type: n.type || 'system',
        data: n.data ? (typeof n.data === 'string' ? JSON.parse(n.data) : n.data) : undefined,
        read: n.isRead || false,
        timestamp: new Date(n.createdAt).getTime(),
      }));
    }
    return [];
  } catch (error) {
    console.warn('同步通知失败:', error);
    return [];
  }
};

/**
 * 发送本地通知（无需FCM）
 */
export const sendLocalNotification = async (
  title: string,
  body: string,
  type: Notification['type'] = 'system',
  data?: any
): Promise<void> => {
  try {
    let expoNotifications: any = null;
    try {
      expoNotifications = require('expo-notifications');
    } catch {}

    if (expoNotifications) {
      await expoNotifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        trigger: null, // 立即发送
      });
    }

    Vibration.vibrate(200);
  } catch (error) {
    console.log('发送本地通知失败:', error);
  }
};

// ============ 模拟通知（开发用） ============

export const simulateNewOrderNotification = () => {
  sendLocalNotification(
    '新订单通知',
    '您有一笔新订单，请及时处理',
    'order',
    { orderId: 'ORD' + Date.now() }
  );
};

export const simulateSystemNotification = () => {
  sendLocalNotification(
    '系统消息',
    '您的账号已通过审核，可以正常使用全部功能',
    'system'
  );
};

export const simulateActivityNotification = () => {
  sendLocalNotification(
    '活动提醒',
    '智枢AI限时优惠活动火热进行中，点击查看详情',
    'activity'
  );
};
