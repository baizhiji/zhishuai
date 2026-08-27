/**
 * 用户 API Key 管理服务
 * 智枢 AI SaaS 系统 - 后端
 * 
 * 功能：
 * 1. 用户 API Key 存储和管理
 * 2. 主/副 Key 自动切换
 * 3. 密钥加密存储
 */

import crypto from 'crypto';
import { prisma } from '../utils/db';

// 加密密钥（生产环境必须通过环境变量 ENCRYPTION_KEY 配置，缺失即拒绝启动，禁止内置默认密钥）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error('[SECURITY] 未配置 ENCRYPTION_KEY 环境变量（需 32 字节随机值），服务拒绝启动。请先在服务器环境变量中配置 ENCRYPTION_KEY。');
}
if (Buffer.byteLength(ENCRYPTION_KEY, 'utf8') !== 32) {
  throw new Error('[SECURITY] ENCRYPTION_KEY 长度必须为 32 字节，当前为 ' + Buffer.byteLength(ENCRYPTION_KEY, 'utf8') + ' 字节，服务拒绝启动。');
}
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
  ark: {
    name: '火山方舟',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    type: 'volcano',
  },
};

// 服务商别名映射：标准命名（alibaba/tencent/volcano）→ 存储值（dashscope/tokenhub/ark）
export const PROVIDER_ALIASES: Record<string, string> = {
  dashscope: 'dashscope',
  alibaba: 'dashscope',
  tokenhub: 'tokenhub',
  tencent: 'tokenhub',
  ark: 'ark',
  volcano: 'ark',
};

/**
 * 归一化服务商标识：统一标准命名（alibaba/tencent/volcano）到存储值（dashscope/tokenhub/ark）
 * 修复 provider 命名断裂：电脑版配置的 Key 可被后端代理（ai-client）按 tencent/alibaba/volcano 查到
 */
export function normalizeProvider(provider: string): 'dashscope' | 'tokenhub' | 'ark' {
  return (PROVIDER_ALIASES[provider] || provider) as 'dashscope' | 'tokenhub' | 'ark';
}

// 获取服务商显示名（兼容别名与历史数据）
function getProviderName(provider: string): string {
  const normalized = normalizeProvider(provider);
  return PROVIDER_CONFIG[normalized]?.name || provider;
}

/**
 * 获取用户的主 API Key
 */
export async function getPrimaryApiKey(userId: string, provider: string) {
  const normalizedProvider = normalizeProvider(provider);
  const config = PROVIDER_CONFIG[normalizedProvider];
  
  const apiKeyRecord = await prisma.apiKey.findFirst({
    where: {
      userId,
      provider: normalizedProvider,
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
      provider: normalizedProvider,
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
export async function getSecondaryApiKey(userId: string, provider: string) {
  const normalizedProvider = normalizeProvider(provider);
  const config = PROVIDER_CONFIG[normalizedProvider];
  
  const apiKeyRecord = await prisma.apiKey.findFirst({
    where: {
      userId,
      provider: normalizedProvider,
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
    providerName: getProviderName(key.provider),
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
 * 获取用户的 API Key 列表（含明文密钥，仅供本人前端直连生成使用）
 * 用于 AI 工厂前端在 localStorage 缺失 Key 时自动同步
 */
export async function getApiKeyListRaw(userId: string) {
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: [{ isPrimary: 'desc' }, { isSecondary: 'desc' }, { createdAt: 'desc' }],
  });
  return keys.map(key => ({
    id: key.id,
    provider: key.provider,
    apiKey: decrypt(key.apiKey),
    status: key.status,
    isPrimary: key.isPrimary,
    isSecondary: key.isSecondary,
  }));
}

/**
 * 创建用户 API Key
 */
export async function createApiKey(
  userId: string,
  provider: string,
  apiKey: string,
  secretKey: string,
  isPrimary: boolean = true
) {
  const normalizedProvider = normalizeProvider(provider);

  // 如果是主 Key，先取消其他主 Key
  if (isPrimary) {
    await prisma.apiKey.updateMany({
      where: { userId, provider: normalizedProvider, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  // 加密存储
  const encryptedApiKey = encrypt(apiKey);
  const encryptedSecretKey = encrypt(secretKey);

  const record = await prisma.apiKey.create({
    data: {
      userId,
      provider: normalizedProvider,
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
    providerName: getProviderName(record.provider),
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
    providerName: getProviderName(key.provider),
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

/**
 * 测试已保存的 API Key 是否有效（服务端解密后测试，前端无需回传密钥）
 */
export async function testApiKeyById(userId: string, keyId: string): Promise<{ valid: boolean; message: string }> {
  const key = await prisma.apiKey.findFirst({
    where: { id: keyId, userId },
  });
  if (!key) return { valid: false, message: 'API Key 不存在' };
  return testApiKey(key.provider, decrypt(key.apiKey), decrypt(key.secretKey));
}

export async function testApiKey(provider: string, apiKey: string, secretKey: string): Promise<{ valid: boolean; message: string }> {
  const config = PROVIDER_CONFIG[normalizeProvider(provider)];
  
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

export interface ApiKeyBalance {
  balance: number | null;
  unit: string;
  message?: string;
}

/**
 * 查询 API Key 余额（蓝皮书 6.2 第 3 条）
 * 目前仅阿里云百炼提供余额查询接口，其余服务商返回 null + 提示
 */
export async function getApiKeyBalance(userId: string, keyId: string): Promise<ApiKeyBalance> {
  const key = await prisma.apiKey.findFirst({
    where: { id: keyId, userId },
  });
  if (!key) throw new Error('API Key 不存在');

  // 仅阿里云百炼支持余额查询
  if (key.provider !== 'dashscope') {
    return { balance: null, unit: '元', message: '该服务商暂不支持余额查询' };
  }

  const rawKey = decrypt(key.apiKey);
  try {
    const resp = await fetch('https://dashscope.aliyuncs.com/api/v1/balance', {
      headers: {
        'Authorization': `Bearer ${rawKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) {
      return { balance: null, unit: '元', message: `余额查询失败（HTTP ${resp.status}）` };
    }
    const data: any = await resp.json();
    const b = data?.balance?.[0];
    if (b && typeof b.available_balance === 'string') {
      const balance = parseFloat(b.available_balance);
      return { balance: isNaN(balance) ? null : balance, unit: '元' };
    }
    return { balance: null, unit: '元', message: '暂无法解析余额' };
  } catch (error: any) {
    return { balance: null, unit: '元', message: `余额查询失败: ${error.message}` };
  }
}
