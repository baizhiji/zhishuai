/**
 * 通知服务
 * 注意：在 Expo Go 中，远程推送通知不可用，仅支持本地通知
 */

import { Platform, Vibration } from 'react-native';
import {
  getNotifications,
  setNotifications,
  markAsRead as markNotificationRead,
  markAllAsRead,
  clearNotifications as clearAllNotifications,
  getUnreadCount,
} from '../utils/storage';

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

// 初始化通知服务
export const initNotifications = async (): Promise<void> => {
  try {
    console.log('通知服务初始化完成（本地模式）');
  } catch (error) {
    console.log('通知服务初始化失败:', error);
  }
};

// 请求通知权限
export const requestPermissions = async (): Promise<boolean> => {
  try {
    // 在 Expo Go 中，远程推送权限不可用
    // 但我们仍然可以使用本地通知
    if (Platform.OS === 'android') {
      // Android 13+ 需要请求 POST_NOTIFICATIONS 权限
      // 这里不做强制要求，因为本地通知不需要权限
    }
    return true;
  } catch (error) {
    console.log('请求通知权限失败:', error);
    return false;
  }
};

// 获取通知列表
export const getNotificationList = (): Notification[] => {
  return getNotifications();
};

// 获取未读数量
export const getUnreadNotificationCount = (): number => {
  return getUnreadCount();
};

// 发送本地通知
export const sendLocalNotification = async (
  title: string,
  body: string,
  type: Notification['type'] = 'system',
  data?: any
): Promise<void> => {
  try {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      body,
      type,
      data,
      read: false,
      timestamp: Date.now(),
    };

    const list = getNotifications();
    list.unshift(notification);
    // 只保留最近100条通知
    if (list.length > 100) {
      list.splice(100);
    }
    setNotifications(list);

    // 震动提醒
    Vibration.vibrate(200);
  } catch (error) {
    console.log('发送本地通知失败:', error);
  }
};

// 标记已读
export const markAsRead = (id: string): void => {
  markNotificationRead(id);
};

// 标记全部已读
export const markAllAsReadNotification = (): void => {
  markAllAsRead();
};

// 清除所有通知
export const clearAll = (): void => {
  clearAllNotifications();
};

// 删除单条通知
export const deleteNotification = (id: string): void => {
  const list = getNotifications();
  const filtered = list.filter(n => n.id !== id);
  setNotifications(filtered);
};

// 按类型获取通知
export const getNotificationsByType = (type: Notification['type']): Notification[] => {
  const list = getNotifications();
  return list.filter(n => n.type === type);
};

// 模拟收到新订单通知
export const simulateNewOrderNotification = () => {
  sendLocalNotification(
    '新订单通知',
    '您有一笔新订单，请及时处理',
    'order',
    { orderId: 'ORD' + Date.now() }
  );
};

// 模拟系统通知
export const simulateSystemNotification = () => {
  sendLocalNotification(
    '系统消息',
    '您的账号已通过审核，可以正常使用全部功能',
    'system'
  );
};

// 模拟活动通知
export const simulateActivityNotification = () => {
  sendLocalNotification(
    '活动提醒',
    '智枢AI限时优惠活动火热进行中，点击查看详情',
    'activity'
  );
};
