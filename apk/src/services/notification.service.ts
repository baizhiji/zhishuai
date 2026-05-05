/**
 * 通知服务 - 处理推送通知
 * 支持本地通知和远程推送
 */

import { Platform, Alert } from 'react-native';
import { Storage, STORAGE_KEYS } from '../utils/storage';

// 通知消息类型
export interface NotificationMessage {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: number;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
}

// 通知类型
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'task' | 'message';

// 消息订阅者
type MessageHandler = (notification: NotificationMessage) => void;
const messageHandlers: MessageHandler[] = [];

// 检查是否可以使用通知功能
const canUseNotifications = (): boolean => {
  try {
    require('expo-notifications');
    return true;
  } catch {
    return false;
  }
};

// 获取本地通知列表
export const getLocalNotifications = async (): Promise<NotificationMessage[]> => {
  return await Storage.getAsync(STORAGE_KEYS.NOTIFICATIONS) || [];
};

// 保存通知到本地
export const saveNotification = async (notification: NotificationMessage): Promise<void> => {
  const notifications = await getLocalNotifications();
  notifications.unshift(notification);
  // 只保留最近100条
  const trimmed = notifications.slice(0, 100);
  await Storage.setAsync(STORAGE_KEYS.NOTIFICATIONS, trimmed);
  
  // 通知所有订阅者
  messageHandlers.forEach(handler => handler(notification));
  
  // 如果可用，发送本地通知
  if (canUseNotifications()) {
    await sendLocalNotification(notification);
  }
};

// 发送本地通知
export const sendLocalNotification = async (notification: NotificationMessage): Promise<void> => {
  if (!canUseNotifications()) return;
  
  try {
    const Notifications = require('expo-notifications');
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: true,
      },
      trigger: null, // 立即发送
    });
  } catch (error) {
    console.log('发送本地通知失败:', error);
  }
};

// 标记通知为已读
export const markAsRead = async (notificationId: string): Promise<void> => {
  const notifications = await getLocalNotifications();
  const updated = notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
  await Storage.setAsync(STORAGE_KEYS.NOTIFICATIONS, updated);
};

// 标记所有通知为已读
export const markAllAsRead = async (): Promise<void> => {
  const notifications = await getLocalNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  await Storage.setAsync(STORAGE_KEYS.NOTIFICATIONS, updated);
};

// 删除通知
export const deleteNotification = async (notificationId: string): Promise<void> => {
  const notifications = await getLocalNotifications();
  const filtered = notifications.filter(n => n.id !== notificationId);
  await Storage.setAsync(STORAGE_KEYS.NOTIFICATIONS, filtered);
};

// 清除所有通知
export const clearAllNotifications = async (): Promise<void> => {
  await Storage.setAsync(STORAGE_KEYS.NOTIFICATIONS, []);
};

// 获取未读数量
export const getUnreadCount = async (): Promise<number> => {
  const notifications = await getLocalNotifications();
  return notifications.filter(n => !n.read).length;
};

// 订阅消息
export const subscribeToNotifications = (handler: MessageHandler): (() => void) => {
  messageHandlers.push(handler);
  return () => {
    const index = messageHandlers.indexOf(handler);
    if (index > -1) {
      messageHandlers.splice(index, 1);
    }
  };
};

// 创建通知
export const createNotification = (
  title: string,
  body: string,
  data?: Record<string, any>,
  type: NotificationType = 'info'
): NotificationMessage => {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    body,
    data,
    timestamp: Date.now(),
    read: false,
    type,
  };
};

// 发送通知快捷方法
export const notify = async (
  title: string,
  body: string,
  data?: Record<string, any>,
  type: NotificationType = 'info'
): Promise<void> => {
  const notification = createNotification(title, body, data, type);
  await saveNotification(notification);
};

// 通知类型对应的图标
export const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'success': return 'checkmark-circle';
    case 'warning': return 'warning';
    case 'error': return 'close-circle';
    case 'task': return 'task';
    case 'message': return 'mail';
    default: return 'information-circle';
  }
};

// 通知类型对应的颜色
export const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case 'success': return '#10B981';
    case 'warning': return '#F59E0B';
    case 'error': return '#EF4444';
    case 'task': return '#3B82F6';
    case 'message': return '#8B5CF6';
    default: return '#64748B';
  }
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
        sound: true,
      });
      
      // 任务通知渠道
      await Notifications.setNotificationChannelAsync('tasks', {
        name: '任务通知',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: true,
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('通知权限未授予');
      return false;
    }

    // 添加通知接收监听
    Notifications.addNotificationReceivedListener(notification => {
      const { title, body, data } = notification.request.content;
      const newNotification = createNotification(title, body, data);
      saveNotification(newNotification);
    });

    // 添加通知点击监听
    Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      // 可以在这里处理通知点击事件
      console.log('通知被点击:', data);
    });

    console.log('通知服务初始化成功');
    return true;
  } catch (error) {
    console.log('通知服务初始化失败:', error);
    return false;
  }
};

/**
 * 设置角标数字
 */
export const setBadgeNumber = async (count: number): Promise<void> => {
  if (!canUseNotifications()) return;
  
  try {
    const Notifications = require('expo-notifications');
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.log('设置角标失败:', error);
  }
};
