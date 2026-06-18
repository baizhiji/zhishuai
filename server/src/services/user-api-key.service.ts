/**
 * 用户 API Key 管理服务
 * 智枢 AI SaaS 系统 - 后端
 * 
 * 功能：
 * 1. 用户 API Key 存储和管理
 * 2. 主/副 Key 自动切换
 * 3. 密钥加密存储
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../utils/db';


// 加密密钥（生产环境应从环境变量读取）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'zhishuai-default-key-32chars!!';
const IV_LENGTH = 16;

// 加密函数
function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// 解密函数
function decrypt(text: string): string {
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    return text; // 如果解密失败，返回原始文本（兼容旧数据）
  }
}

// 服务商配置
export const PROVIDER_CONFIG = {
  dashscope: {
    name: '阿里云百炼',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    type: 'aliyun',
  },
  tokenhub: {
    name: '腾讯云 TokenHub',
    baseUrl: 'https://tokenhub.tencentmaas.com/v1',
    type: 'tencent',
  },
};

/**
 * 获取用户的主 API Key
 */
export async function getPrimaryApiKey(userId: string, provider: 'dashscope' | 'tokenhub') {
  const config = PROVIDER_CONFIG[provider];
  
  const apiKeyRecord = await prisma.apiKey.findFirst({
    where: {
      userId,
      provider,
      status: 'active',
      isPrimary: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (apiKeyRecord) {
    return {
      apiKey: decrypt(apiKeyRecord.apiKey),
      secretKey: decrypt(apiKeyRecord.secretKey),
      provider: config.type,
      baseUrl: config.baseUrl,
      isPrimary: true,
    };
  }

  // 如果没有主 Key，查找任意可用的 Key
  const anyKey = await prisma.apiKey.findFirst({
    where: {
      userId,
      provider,
      status: 'active',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (anyKey) {
    return {
      apiKey: decrypt(anyKey.apiKey),
      secretKey: decrypt(anyKey.secretKey),
      provider: config.type,
      baseUrl: config.baseUrl,
      isPrimary: false,
    };
  }

  return null;
}

/**
 * 获取用户的备用 API Key
 */
export async function getSecondaryApiKey(userId: string, provider: 'dashscope' | 'tokenhub') {
  const config = PROVIDER_CONFIG[provider];
  
  const apiKeyRecord = await prisma.apiKey.findFirst({
    where: {
      userId,
      provider,
      status: 'active',
      isSecondary: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (apiKeyRecord) {
    return {
      apiKey: decrypt(apiKeyRecord.apiKey),
      secretKey: decrypt(apiKeyRecord.secretKey),
      provider: config.type,
      baseUrl: config.baseUrl,
    };
  }

  return null;
}

/**
 * 获取用户的 API Key 列表（不包含密钥）
 */
export async function getApiKeyList(userId: string) {
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: [
      { isPrimary: 'desc' },
      { isSecondary: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return keys.map(key => ({
    id: key.id,
    provider: key.provider,
    providerName: PROVIDER_CONFIG[key.provider as keyof typeof PROVIDER_CONFIG]?.name || key.provider,
    apiKey: maskKey(key.apiKey),
    secretKey: key.secretKey ? '******' : '',
    status: key.status,
    isPrimary: key.isPrimary,
    isSecondary: key.isSecondary,
    usage: key.usage || 0,
    limit: key.limit || 0,
    failCount: key.failCount || 0,
    lastUsedAt: key.lastUsedAt,
    createdAt: key.createdAt,
  }));
}

/**
 * 创建用户 API Key
 */
export async function createApiKey(
  userId: string,
  provider: 'dashscope' | 'tokenhub',
  apiKey: string,
  secretKey: string,
  isPrimary: boolean = true
) {
  // 如果是主 Key，先取消其他主 Key
  if (isPrimary) {
    await prisma.apiKey.updateMany({
      where: { userId, provider, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  // 加密存储
  const encryptedApiKey = encrypt(apiKey);
  const encryptedSecretKey = encrypt(secretKey);

  const record = await prisma.apiKey.create({
    data: {
      userId,
      provider,
      apiKey: encryptedApiKey,
      secretKey: encryptedSecretKey,
      status: 'active',
      isPrimary,
      usage: 0,
      failCount: 0,
    },
  });

  return {
    id: record.id,
    provider: record.provider,
    providerName: PROVIDER_CONFIG[record.provider as keyof typeof PROVIDER_CONFIG]?.name || record.provider,
    status: record.status,
    isPrimary: record.isPrimary,
    createdAt: record.createdAt,
  };
}

/**
 * 删除用户 API Key
 */
export async function deleteApiKey(userId: string, keyId: string) {
  const result = await prisma.apiKey.deleteMany({
    where: { id: keyId, userId },
  });
  return result.count > 0;
}

/**
 * 更新 API Key 使用统计
 */
export async function updateApiKeyUsage(keyId: string, success: boolean) {
  const update = success
    ? { usage: { increment: 1 }, failCount: 0 }
    : { failCount: { increment: 1 } };

  await prisma.apiKey.update({
    where: { id: keyId },
    data: {
      ...update,
      lastUsedAt: new Date(),
    },
  });
}

/**
 * 脱敏 API Key
 */
function maskKey(key: string): string {
  if (key.length <= 8) {
    return '****' + key.slice(-4);
  }
  return key.slice(0, 4) + '****' + key.slice(-4);
}

/**
 * 测试 API Key 是否有效
 */
/**
 * 导出别名（兼容旧代码）
 */
export const getUserApiKeys = getApiKeyList;
export const updateApiKey = updateApiKeyUsage;
export const getApiKeyById = async (userId: string, keyId: string) => {
  const key = await prisma.apiKey.findFirst({
    where: { id: keyId, userId },
  });
  if (!key) return null;
  return {
    id: key.id,
    provider: key.provider,
    providerName: PROVIDER_CONFIG[key.provider as keyof typeof PROVIDER_CONFIG]?.name || key.provider,
    apiKey: maskKey(key.apiKey),
    status: key.status,
    isPrimary: key.isPrimary,
    isSecondary: key.isSecondary,
    usage: key.usage || 0,
    limit: key.limit || 0,
    failCount: key.failCount || 0,
    createdAt: key.createdAt,
  };
};

/**
 * 切换主/备用 Key
 */
export async function toggleApiKey(userId: string, keyId: string, type: 'primary' | 'secondary') {
  const isPrimary = type === 'primary';
  const isSecondary = type === 'secondary';
  
  await prisma.apiKey.updateMany({
    where: { userId, provider: (await prisma.apiKey.findFirst({ where: { id: keyId } }))?.provider },
    data: { isPrimary: false, isSecondary: false },
  });
  
  await prisma.apiKey.update({
    where: { id: keyId },
    data: { isPrimary, isSecondary },
  });
  
  return true;
}

export async function testApiKey(provider: 'dashscope' | 'tokenhub', apiKey: string, secretKey: string): Promise<{ valid: boolean; message: string }> {
  const config = PROVIDER_CONFIG[provider];
  
  try {
    const response = await fetch(`${config.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return { valid: true, message: 'API Key 验证成功' };
    } else {
      const error = await response.text();
      return { valid: false, message: `验证失败: ${error}` };
    }
  } catch (error: any) {
    return { valid: false, message: `连接失败: ${error.message}` };
  }
}
