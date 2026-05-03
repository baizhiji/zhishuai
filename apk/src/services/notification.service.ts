/**
 * 通知服务 - 处理推送通知
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';

// 配置通知处理方式
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  trigger: Notifications.NotificationTriggerInput;
  data?: Record<string, any>;
}

class NotificationService {
  private notificationListeners: Notifications.Subscription[] = [];
  private responseListeners: Notifications.Subscription[] = [];

  /**
   * 初始化通知服务
   */
  async initialize(): Promise<void> {
    if (!Device.isDevice) {
      console.log('推送通知仅在真机上可用');
      return;
    }

    // 检查权限
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('未获得推送通知权限');
      return;
    }

    // 获取 Expo 项目推送令牌
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      });
    }

    console.log('通知服务初始化成功');
  }

  /**
   * 获取设备推送令牌
   */
  async getPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // 需要替换为实际的 Expo 项目 ID
      });

      console.log('Push token:', token);
      return token;
    } catch (error) {
      console.error('获取推送令牌失败:', error);
      return null;
    }
  }

  /**
   * 发送本地通知
   */
  async sendLocalNotification(notification: NotificationData): Promise<string | null> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: true,
        },
        trigger: null, // 立即发送
      });

      console.log('本地通知已发送:', id);
      return id;
    } catch (error) {
      console.error('发送本地通知失败:', error);
      return null;
    }
  }

  /**
   * 发送定时通知
   */
  async scheduleNotification(notification: ScheduledNotification): Promise<string | null> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: true,
        },
        trigger: notification.trigger,
      });

      console.log('定时通知已安排:', id);
      return id;
    } catch (error) {
      console.error('发送定时通知失败:', error);
      return null;
    }
  }

  /**
   * 取消所有定时通知
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('已取消所有定时通知');
    } catch (error) {
      console.error('取消定时通知失败:', error);
    }
  }

  /**
   * 取消指定通知
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('已取消通知:', notificationId);
    } catch (error) {
      console.error('取消通知失败:', error);
    }
  }

  /**
   * 设置通知监听器 - 接收到通知时
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): void {
    const listener = Notifications.addNotificationReceivedListener(callback);
    this.notificationListeners.push(listener);
  }

  /**
   * 设置响应监听器 - 用户点击通知时
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): void {
    const listener = Notifications.addNotificationResponseReceivedListener(callback);
    this.responseListeners.push(listener);
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(): void {
    this.notificationListeners.forEach(listener => listener.remove());
    this.responseListeners.forEach(listener => listener.remove());
    this.notificationListeners = [];
    this.responseListeners = [];
  }

  /**
   * 获取所有待发送的通知
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('获取定时通知失败:', error);
      return [];
    }
  }

  /**
   * 显示任务完成通知
   */
  async showTaskCompleteNotification(
    taskName: string,
    taskType: string
  ): Promise<void> {
    await this.sendLocalNotification({
      title: '🎉 任务完成',
      body: `您的${taskType}任务"${taskName}"已完成，点击查看`,
      data: { type: 'task_complete', taskName, taskType },
    });
  }

  /**
   * 显示新消息通知
   */
  async showNewMessageNotification(
    sender: string,
    preview: string
  ): Promise<void> {
    await this.sendLocalNotification({
      title: `💬 ${sender}发来新消息`,
      body: preview,
      data: { type: 'new_message', sender },
    });
  }

  /**
   * 显示系统通知
   */
  async showSystemNotification(
    title: string,
    message: string
  ): Promise<void> {
    await this.sendLocalNotification({
      title,
      body: message,
      data: { type: 'system' },
    });
  }
}

// 导出单例
export const notificationService = new NotificationService();
export default notificationService;
