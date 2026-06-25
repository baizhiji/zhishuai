/**
 * 推送通知服务 V2
 * 支持 FCM HTTP v1 API (Android+iOS) / APNs (iOS) / Web Push (VAPID)
 * 
 * 使用说明：
 * 1. 设置环境变量:
 *    - FCM: GOOGLE_APPLICATION_CREDENTIALS (JSON文件路径) 或 GOOGLE_SERVICE_ACCOUNT_JSON (JSON字符串)
 *    - Web Push: VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY + VAPID_SUBJECT
 * 2. APK端上报pushToken后，调用 sendPush() 发送推送
 * 3. Web端使用 Web Push (VAPID) 推送到浏览器 Service Worker
 * 
 * FCM HTTP v1 API 使用 OAuth2 access token（自动从 service account 获取）
 * 不再使用已废弃的 FCM_SERVER_KEY（Legacy HTTP API）
 */
import { PrismaClient } from '@prisma/client';
import { prisma } from '../utils/db';
import crypto from 'crypto';

// 推送消息结构
export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  imageUrl?: string;
}

// 推送结果
interface PushResult {
  success: boolean;
  error?: string;
  invalidToken?: boolean;
}

// FCM OAuth2 access token cache
let fcmAccessToken: string | null = null;
let fcmTokenExpiry: number = 0;

// Google service account 配置
interface ServiceAccount {
  project_id: string;
  private_key: string;
  client_email: string;
  type: string;
}

function getServiceAccount(): ServiceAccount | null {
  // 方式1: JSON文件路径
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    try {
      const fs = require('fs');
      return JSON.parse(fs.readFileSync(credPath, 'utf8'));
    } catch (e) {
      console.error('读取GOOGLE_APPLICATION_CREDENTIALS文件失败:', e);
    }
  }
  
  // 方式2: JSON字符串
  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (credJson) {
    try {
      return JSON.parse(credJson);
    } catch (e) {
      console.error('解析GOOGLE_SERVICE_ACCOUNT_JSON失败:', e);
    }
  }
  
  return null;
}

/**
 * 获取 FCM OAuth2 access token（自动刷新）
 * 使用 Google service account 的 private_key 签名 JWT
 */
async function getFCMAccessToken(): Promise<string | null> {
  // 缓存有效token
  if (fcmAccessToken && fcmTokenExpiry > Date.now() + 60000) {
    return fcmAccessToken;
  }
  
  const sa = getServiceAccount();
  if (!sa) {
    return null;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1小时有效
  
  // 构造 JWT
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry,
  };
  
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signInput = `${headerB64}.${payloadB64}`;
  
  // RSA-SHA256签名
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signInput);
  sign.end();
  
  // 处理private_key（可能包含\n转义）
  const privateKey = sa.private_key.replace(/\\n/g, '\n');
  const signature = sign.sign(privateKey, 'base64url');
  
  const jwt = `${signInput}.${signature}`;
  
  // 交换JWT获取access token
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    
    const result: any = await response.json();
    if (result.access_token) {
      fcmAccessToken = result.access_token;
      fcmTokenExpiry = Date.now() + (result.expires_in || 3600) * 1000;
      return fcmAccessToken;
    }
    
    console.error('FCM OAuth2 token获取失败:', result.error);
    return null;
  } catch (error: any) {
    console.error('FCM OAuth2 token请求失败:', error);
    return null;
  }
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
      console.info(`用户 ${userId} 无推送Token，仅存储通知到数据库`);
      // 即使没有Token，仍然创建通知记录（应用内可见）
      await createNotificationRecord(userId, message);
      return { success: true };
    }

    // 同时在数据库创建通知记录
    await createNotificationRecord(userId, message);

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
 * 创建数据库通知记录
 */
async function createNotificationRecord(userId: string, message: PushMessage): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      type: message.data?.notificationType || 'system',
      title: message.title,
      content: message.body,
      data: message.data ? JSON.stringify(message.data) : null,
      isRead: false,
    },
  });
}

/**
 * FCM推送 V2 — 使用 HTTP v1 API + OAuth2 access token
 * 支持 Android 和 iOS (通过FCM)
 * 
 * 旧版 FCM_SERVER_KEY (Legacy HTTP API) 已于2024年6月废弃
 */
async function sendFCM(token: string, message: PushMessage): Promise<PushResult> {
  const sa = getServiceAccount();
  
  if (!sa) {
    // FCM未配置，静默失败（通知已存入数据库，用户打开APP可见）
    console.warn('FCM service account未配置，推送仅存储到数据库。请设置 GOOGLE_APPLICATION_CREDENTIALS 或 GOOGLE_SERVICE_ACCOUNT_JSON');
    return { success: true };
  }

  // 获取OAuth2 access token
  const accessToken = await getFCMAccessToken();
  if (!accessToken) {
    console.error('FCM access token获取失败');
    return { success: false, error: 'FCM access token获取失败' };
  }

  try {
    // FCM HTTP v1 API endpoint
    const projectId = sa.project_id;
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    
    // 构造 v1 API 消息格式
    const fcmMessage: any = {
      message: {
        token: token,
        notification: {
          title: message.title,
          body: message.body,
          // imageUrl 只在notification中设置（可选）
          image: message.imageUrl || undefined,
        },
        data: message.data || {},
        android: {
          priority: 'HIGH',
          notification: {
            sound: message.sound || 'default',
            channel_id: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              badge: message.badge || 0,
              sound: message.sound || 'default',
            },
          },
        },
        webpush: {
          notification: {
            icon: message.imageUrl || undefined,
          },
        },
      },
    };

    // 移除undefined字段
    const cleanMessage = JSON.parse(JSON.stringify(fcmMessage));

    const response = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(cleanMessage),
    });

    if (response.ok) {
      return { success: true };
    }

    const result: any = await response.json();
    
    // v1 API错误处理
    const errorDetail = result.error?.details?.[0];
    const errorCode = result.error?.code;
    
    // 无效Token检测
    if (errorCode === 404 || 
        errorDetail?.reason === 'UNREGISTERED' ||
        errorDetail?.errorCode === 'INVALID_TOKEN') {
      await invalidatePushToken(token);
      return { success: false, error: 'Token已失效', invalidToken: true };
    }

    console.error('FCM v1推送失败:', result.error?.message || JSON.stringify(result));
    return { success: false, error: result.error?.message || `HTTP ${response.status}` };
  } catch (error: any) {
    console.error('FCM推送异常:', error);
    return { success: false, error: error.message };
  }
}

/**
 * APNs推送（iOS原生）
 * 注：生产环境建议使用FCM统一发送（FCM支持iOS设备）
 * 仅在需要直接使用APNs时启用（需要APNs JWT证书）
 */
async function sendAPNs(token: string, message: PushMessage): Promise<PushResult> {
  // 优先走FCM（如果FCM已配置，iOS Token也会注册到FCM）
  const sa = getServiceAccount();
  if (sa) {
    return sendFCM(token, message);
  }
  
  // FCM未配置时，尝试直接APNs推送（需要APNS_KEY_ID等配置）
  // 直接APNs需要：APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY
  const apnsKeyId = process.env.APNS_KEY_ID;
  const apnsTeamId = process.env.APNS_TEAM_ID;
  const apnsPrivateKey = process.env.APNS_PRIVATE_KEY;
  
  if (!apnsKeyId || !apnsTeamId || !apnsPrivateKey) {
    console.warn('APNs证书未配置（需要APNS_KEY_ID/APNS_TEAM_ID/APNS_PRIVATE_KEY），推送仅存储到数据库');
    return { success: true };
  }
  
  try {
    // 构造APNs JWT token
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'ES256', kid: apnsKeyId };
    const payload = { iss: apnsTeamId, iat: now };
    
    // 构造未签名的JWT
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const unsignedJwt = `${headerB64}.${payloadB64}`;
    
    // ES256签名
    const keyData = apnsPrivateKey.replace(/\\n/g, '\n');
    const sign = crypto.createSign('ES256');
    sign.update(unsignedJwt);
    sign.end();
    const signature = sign.sign(keyData, 'base64url');
    const apnsJwt = `${unsignedJwt}.${signature}`;
    
    // 推送到APNs
    // 生产环境: api.push.apple.com
    // 开发环境: api.sandbox.push.apple.com
    const isProduction = process.env.NODE_ENV === 'production';
    const apnsHost = isProduction ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';
    
    const apnsPayload = {
      aps: {
        alert: {
          title: message.title,
          body: message.body,
        },
        badge: message.badge || 0,
        sound: message.sound || 'default',
        'mutable-content': 1,
      },
      // 自定义数据
      ...message.data,
    };
    
    const response = await fetch(`https://${apnsHost}/3/device/${token}`, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${apnsJwt}`,
        'apns-topic': `${apnsTeamId}.com.baizhiji.zhishuai`,
        'apns-push-type': 'alert',
        'content-type': 'application/json',
      },
      body: JSON.stringify(apnsPayload),
    });
    
    if (response.ok || response.status === 200) {
      return { success: true };
    }
    
    const result: any = await response.json();
    
    // 处理APNs特定错误
    if (result.reason === 'Unregistered' || result.reason === 'BadDeviceToken') {
      await invalidatePushToken(token);
      return { success: false, error: result.reason, invalidToken: true };
    }
    
    console.error('APNs推送失败:', result.reason);
    return { success: false, error: result.reason };
  } catch (error: any) {
    console.error('APNs推送异常:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Web Push（VAPID）
 * 使用 VAPID 密钥对向浏览器 Service Worker 推送通知
 * 
 * 需要: web-push npm包 + VAPID密钥对
 */
async function sendWebPush(token: string, message: PushMessage): Promise<PushResult> {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.warn('Web Push VAPID密钥未配置（需要VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT），推送仅存储到数据库');
    return { success: true };
  }
  
  try {
    // 动态导入 web-push（避免未安装时报错）
    const webPush = await import('web-push');
    
    webPush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );
    
    const payload = JSON.stringify({
      title: message.title,
      body: message.body,
      data: message.data || {},
      icon: message.imageUrl || '/logo.png',
      badge: message.badge || 0,
    });
    
    // token 是 PushSubscription 对象的JSON字符串
    let subscription: any;
    try {
      subscription = JSON.parse(token);
    } catch {
      // 如果token不是JSON，构造一个默认subscription（不太可能发生）
      console.error('Web Push subscription格式错误');
      return { success: false, error: 'Invalid subscription format' };
    }
    
    const result = await webPush.sendNotification(subscription, payload);
    
    if (result.statusCode === 200 || result.statusCode === 201) {
      return { success: true };
    }
    
    // 410 Gone = subscription已失效
    if (result.statusCode === 410) {
      await invalidatePushToken(token);
      return { success: false, error: 'Subscription已失效', invalidToken: true };
    }
    
    console.error('Web Push推送失败:', result.statusCode, result.body);
    return { success: false, error: `HTTP ${result.statusCode}` };
  } catch (error: any) {
    // web-push未安装时的fallback
    if (error.code === 'MODULE_NOT_FOUND') {
      console.warn('web-push包未安装，Web Push不可用。运行: npm install web-push');
      return { success: true }; // 静默处理，通知已在数据库
    }
    console.error('Web Push推送异常:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 使失效的推送Token无效
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

/**
 * 生成 VAPID 密钥对（首次设置Web Push时使用）
 * 返回 { publicKey, privateKey }
 */
export function generateVAPIDKeys(): { publicKey: string; privateKey: string } {
  try {
    const webPush = require('web-push');
    return webPush.generateVAPIDKeys();
  } catch {
    console.error('web-push未安装，无法生成VAPID密钥');
    return { publicKey: '', privateKey: '' };
  }
}
