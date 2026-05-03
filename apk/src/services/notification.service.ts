/**
 * 通知服务 - 处理推送通知
 * 使用 expo-notifications (如可用)
 */

import { Platform, Alert } from 'react-native';
import { Storage } from '../utils/tokenStorage';

// 检查是否可以使用通知功能
const canUseNotifications = () => {
  try {
    require('expo-notifications');
    return true;
  } catch {
    return false;
  }
};

// 通知消息类型
export interface NotificationMessage {
  title: string;
  body: string;
  data?: Record<string, any>;
}

// 消息订阅者
type MessageHandler = (message: NotificationMessage) => void;
const messageHandlers: MessageHandler[] = [];

// 本地通知存储
const NOTIFICATION_KEY = 'local_notifications';

// 获取本地通知列表
export const getLocalNotifications = (): NotificationMessage[] => {
  const stored = Storage.get(NOTIFICATION_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

// 保存通知到本地
const saveNotification = (notification: NotificationMessage) => {
  const notifications = getLocalNotifications();
  notifications.unshift(notification);
  // 只保留最近50条
  const trimmed = notifications.slice(0, 50);
  Storage.set(NOTIFICATION_KEY, JSON.stringify(trimmed));
  
  // 通知所有订阅者
  messageHandlers.forEach(handler => handler(notification));
};

/**
 * 初始化通知服务
 */
export const initNotifications = async (): Promise<boolean> => {
  if (!canUseNotifications()) {
    console.log('通知服务: expo-notifications 不可用，使用本地通知模式');
    return false;
  }

  try {
    const Notifications = require('expo-notifications');
    
    // 配置通知行为
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // 请求权限
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: '默认通知',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('通知权限未授予');
      return false;
    }

    console.log('通知服务初始化成功');
    return true;
  } catch (error) {
    console.log('通知服务初始化失败:', error);
    return false;
  }
};

/**
 * 订阅消息通知
 */
export const subscribeToMessages = (handler: MessageHandler) => {
  messageHandlers.push(handler);
  return () => {
    const index = messageHandlers.indexOf(handler);
    if (index > -1) {
      messageHandlers.splice(index, 1);
    }
  };
};

/**
 * 发送本地通知
 */
export const sendLocalNotification = async (message: NotificationMessage): Promise<void> => {
  // 保存到本地存储
  saveNotification(message);

  if (!canUseNotifications()) {
    return;
  }

  try {
    const Notifications = require('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        data: message.data,
      },
      trigger: null, // 立即发送
    });
  } catch (error) {
    console.log('发送通知失败:', error);
  }
};

/**
 * 清除所有通知
 */
export const clearAllNotifications = async (): Promise<void> => {
  Storage.delete(NOTIFICATION_KEY);
  
  if (!canUseNotifications()) {
    return;
  }

  try {
    const Notifications = require('expo-notifications');
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.log('清除通知失败:', error);
  }
};

/**
 * 获取未读消息数量
 */
export const getUnreadCount = (): number => {
  const notifications = getLocalNotifications();
  return notifications.length;
};

// 导出状态
export const notificationsAvailable = canUseNotifications();
