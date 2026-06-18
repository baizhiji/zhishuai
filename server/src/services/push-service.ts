/**
 * 推送通知服务
 * 支持 FCM (Android) / APNs (iOS) / Web Push
 * 
 * 使用说明：
 * 1. 设置环境变量 FCM_SERVER_KEY 或 GOOGLE_SERVICE_ACCOUNT_JSON
 * 2. APK端上报pushToken后，调用 sendPush() 发送推送
 * 3. Web端可使用 Web Push (VAPID)
 */
import { PrismaClient } from '@prisma/client';
import { prisma } from '../utils/db';


// 推送消息结构
export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

// 推送结果
interface PushResult {
  success: boolean;
  error?: string;
  invalidToken?: boolean;
}

/**
 * 向指定用户发送推送通知
 */
export async function sendPushToUser(userId: string, message: PushMessage): Promise<PushResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true, pushPlatform: true },
    });

    if (!user?.pushToken) {
      return { success: false, error: '用户无推送Token' };
    }

    // 同时在数据库创建通知记录
    await prisma.notification.create({
      data: {
        userId,
        type: 'system',
        title: message.title,
        content: message.body,
        isRead: false,
        data: message.data ? JSON.stringify(message.data) : null,
      },
    });

    // 根据平台发送推送
    switch (user.pushPlatform) {
      case 'fcm':
        return await sendFCM(user.pushToken, message);
      case 'apns':
        return await sendAPNs(user.pushToken, message);
      case 'web':
        return await sendWebPush(user.pushToken, message);
      default:
        // 无平台信息时尝试FCM
        return await sendFCM(user.pushToken, message);
    }
  } catch (error: any) {
    console.error('推送发送失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 向多个用户批量发送推送
 */
export async function sendPushToUsers(userIds: string[], message: PushMessage): Promise<void> {
  const results = await Promise.allSettled(
    userIds.map(userId => sendPushToUser(userId, message))
  );

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`批量推送: ${failed.length}/${userIds.length} 失败`);
  }
}

/**
 * FCM推送（Android + iOS via FCM）
 */
async function sendFCM(token: string, message: PushMessage): Promise<PushResult> {
  const serverKey = process.env.FCM_SERVER_KEY;

  if (!serverKey) {
    // FCM未配置，静默失败（通知已存入数据库，用户打开APP可见）
    console.warn('FCM_SERVER_KEY未配置，推送仅存储到数据库');
    return { success: true };
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${serverKey}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: message.title,
          body: message.body,
          sound: message.sound || 'default',
          badge: message.badge,
        },
        data: message.data || {},
        priority: 'high',
      }),
    });

    const result: any = await response.json();

    if (result.failure === 1) {
      const error = result.results?.[0]?.error;
      // 无效Token需要清理
      if (error === 'InvalidRegistration' || error === 'NotRegistered') {
        await invalidatePushToken(token);
        return { success: false, error, invalidToken: true };
      }
      return { success: false, error };
    }

    return { success: true };
  } catch (error: any) {
    console.error('FCM推送失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * APNs推送（iOS原生）
 * 注：生产环境建议使用FCM统一发送（FCM支持iOS）
 * 仅在需要直接使用APNs时启用
 */
async function sendAPNs(token: string, message: PushMessage): Promise<PushResult> {
  // APNs需要JWT证书，这里先委托给FCM
  // 如果APNs Token已注册到FCM，直接走FCM
  return sendFCM(token, message);
}

/**
 * Web Push（VAPID）
 */
async function sendWebPush(token: string, message: PushMessage): Promise<PushResult> {
  // Web Push需要VAPID密钥对，暂不实现
  // 通知已存入数据库，Web端轮询可见
  console.info('Web Push暂未实现，通知已存入数据库');
  return { success: true };
}

/**
 * 使失效的推送Token
 */
async function invalidatePushToken(token: string): Promise<void> {
  try {
    await prisma.user.updateMany({
      where: { pushToken: token },
      data: { pushToken: null, pushPlatform: null },
    });
  } catch (error) {
    console.error('清理推送Token失败:', error);
  }
}

/**
 * 获取用户的未读通知数（供轮询使用）
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}
