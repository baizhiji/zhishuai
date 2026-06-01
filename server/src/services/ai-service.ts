/**
 * AI 能力服务 - 实现阿里云百炼和腾讯云TokenHub的API调用
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { getModelInfo, AI_PROVIDERS, ChatCompletionParams, ImageGenerationParams, TTSParams } from './ai-models';

const prisma = new PrismaClient();

// 加密密钥（生产环境应使用环境变量）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'zhishuai-ai-encryption-key-2024';
const ALGORITHM = 'aes-256-gcm';

// 加密存储
function encrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')]).toString('base64');
}

// 解密
function decrypt(encrypted: string): string {
  try {
    const buffer = Buffer.from(encrypted, 'base64');
    const iv = buffer.subarray(0, 16);
    const authTag = buffer.subarray(16, 32);
    const encryptedText = buffer.subarray(32);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    // 兼容旧数据
    return Buffer.from(encrypted, 'base64').toString('utf8');
  }
}

// 获取用户的有效API Key
async function getUserValidApiKey(userId: string, provider?: string) {
  const where: any = {
    userId,
    status: 'active'
  };
  if (provider) {
    where.provider = provider;
  }
  
  const keys = await prisma.apiKey.findMany({
    where,
    orderBy: [
      { isPrimary: 'desc' },
      { createdAt: 'asc' }
    ]
  });
  
  // 解密并检查是否有效
  for (const key of keys) {
    try {
      const apiKey = decrypt(key.apiKey);
      const secretKey = decrypt(key.secretKey);
      return { ...key, apiKey, secretKey };
    } catch {
      continue;
    }
  }
  
  return null;
}

// 更新API Key使用统计
async function updateKeyUsage(keyId: string, success: boolean) {
  const update: any = {
    usage: { increment: 1 },
    lastUsedAt: new Date()
  };
  
  if (!success) {
    update.failCount = { increment: 1 };
  } else {
    update.failCount = 0;
  }
  
  await prisma.apiKey.update({
    where: { id: keyId },
    data: update
  });
}

// 阿里云百炼 API 调用
async function callDashScope(params: ChatCompletionParams, apiKey: string) {
  const modelInfo = getModelInfo('dashscope', params.model);
  
  const requestBody: any = {
    model: params.model,
    input: {
      messages: params.messages
    },
    parameters: {
      result_format: 'message',
      temperature: params.temperature ?? 0.7,
      top_p: params.top_p ?? 0.8,
      max_tokens: params.max_tokens ?? 2048
    }
  };
  
  if (params.functions) {
    requestBody.parameters.functions = params.functions;
  }
  
  const response = await fetch(`${AI_PROVIDERS.dashscope.baseUrl}/services/aigc/text-generation/generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-DashScope-SSE': params.stream ? 'enable' : 'disable'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DashScope API错误: ${response.status} - ${error}`);
  }
  
  return response.json();
}

// 腾讯云TokenHub API 调用
async function callTokenHub(params: ChatCompletionParams, apiKey: string, secretKey: string) {
  // 获取签名
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  
  // 构造签名字符串
  const signStr = `apiKey=${apiKey}&timestamp=${timestamp}&nonce=${nonce}&secretKey=${secretKey}`;
  const signature = crypto.createHash('sha256').update(signStr).digest('hex');
  
  const requestBody = {
    model: params.model,
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
    top_p: params.top_p ?? 0.8,
    max_tokens: params.max_tokens ?? 2048,
    timestamp,
    nonce
  };
  
  const response = await fetch(`${AI_PROVIDERS.tokenhub.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'X-Timestamp': timestamp.toString(),
      'X-Nonce': nonce,
      'X-Signature': signature
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TokenHub API错误: ${response.status} - ${error}`);
  }
  
  return response.json();
}

// 获取用户的主服务商（腾讯云 TokenHub 优先）
async function getPrimaryProvider(userId: string): Promise<string> {
  const primaryKey = await getUserValidApiKey(userId, 'tokenhub');
  if (primaryKey) {
    return 'tokenhub'; // 优先使用腾讯云 TokenHub
  }
  const backupKey = await getUserValidApiKey(userId, 'dashscope');
  if (backupKey) {
    return 'dashscope'; // 备用使用阿里云百炼
  }
  return 'tokenhub'; // 默认
}

// 通用的聊天补全接口
export async function chatCompletion(userId: string, params: ChatCompletionParams) {
  // 1. 解析模型提供商
  let provider: string;
  let modelId = params.model;
  
  if (params.model.includes(':')) {
    const [p, m] = params.model.split(':');
    provider = p;
    modelId = m;
  } else {
    // 自动检测服务商 - 优先使用主 Key 对应的服务商
    provider = await getPrimaryProvider(userId);
  }
  
  // 2. 获取用户的 API Key
  const userKey = await getUserValidApiKey(userId, provider);
  if (!userKey) {
    throw new Error(`未找到有效的${AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]?.name} API Key`);
  }
  
  try {
    // 3. 调用对应的 API
    let result;
    if (provider === 'dashscope') {
      result = await callDashScope({ ...params, model: modelId }, userKey.apiKey);
    } else if (provider === 'tokenhub') {
      result = await callTokenHub({ ...params, model: modelId }, userKey.apiKey, userKey.secretKey);
    } else {
      throw new Error(`不支持的服务商: ${provider}`);
    }
    
    // 4. 更新使用统计
    await updateKeyUsage(userKey.id, true);
    
    return result;
  } catch (error: any) {
    // 更新失败统计
    await updateKeyUsage(userKey.id, false);
    
    // 尝试使用备用 Key
    if (userKey.isPrimary) {
      const backupKey = await prisma.apiKey.findFirst({
        where: {
          userId,
          provider,
          status: 'active',
          isSecondary: true,
          failCount: { lt: 5 }
        }
      });
      
      if (backupKey) {
        try {
          const decryptedBackup = {
            apiKey: decrypt(backupKey.apiKey),
            secretKey: decrypt(backupKey.secretKey)
          };
          
          let result;
          if (provider === 'dashscope') {
            result = await callDashScope({ ...params, model: modelId }, decryptedBackup.apiKey);
          } else {
            result = await callTokenHub({ ...params, model: modelId }, decryptedBackup.apiKey, decryptedBackup.secretKey);
          }
          
          await prisma.apiKey.update({
            where: { id: backupKey.id },
            data: { failCount: 0, lastUsedAt: new Date() }
          });
          
          return result;
        } catch {
          // 备用 Key 也失败
        }
      }
    }
    
    throw error;
  }
}

// 图像生成
export async function generateImage(userId: string, params: ImageGenerationParams) {
  const provider = params.model.includes(':') ? params.model.split(':')[0] : 'dashscope';
  const modelId = params.model.includes(':') ? params.model.split(':')[1] : params.model;
  
  const userKey = await getUserValidApiKey(userId, provider);
  if (!userKey) {
    throw new Error(`未找到有效的${AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]?.name} API Key`);
  }
  
  try {
    let result;
    if (provider === 'dashscope') {
      const response = await fetch(`${AI_PROVIDERS.dashscope.baseUrl}/services/aigc/text2image/image-synthesis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userKey.apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          input: {
            prompt: params.prompt,
            negative_prompt: params.negative_prompt || ''
          },
          parameters: {
            size: params.image_size || '1024x1024',
            n: params.n || 1,
            seed: params.seed || Math.floor(Math.random() * 999999999)
          }
        })
      });
      
      result = await response.json();
    } else {
      throw new Error('TokenHub图像生成暂未支持');
    }
    
    await updateKeyUsage(userKey.id, true);
    return result;
  } catch (error: any) {
    await updateKeyUsage(userKey.id, false);
    throw error;
  }
}

// 语音合成
export async function textToSpeech(userId: string, params: TTSParams) {
  const provider = params.model.includes(':') ? params.model.split(':')[0] : 'dashscope';
  const modelId = params.model.includes(':') ? params.model.split(':')[1] : params.model;
  
  const userKey = await getUserValidApiKey(userId, provider);
  if (!userKey) {
    throw new Error(`未找到有效的${AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]?.name} API Key`);
  }
  
  try {
    let result;
    if (provider === 'dashscope') {
      const response = await fetch(`${AI_PROVIDERS.dashscope.baseUrl}/services/t2t/tts/text_to_speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userKey.apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          input: {
            text: params.text
          },
          parameters: {
            voice: params.voice || 'aixia',
            format: params.format || 'mp3',
            speed: (params.speed || 1.0) * 100,
            volume: (params.volume || 1.0) * 100
          }
        })
      });
      
      result = await response.json();
    } else {
      // TokenHub TTS
      const response = await fetch(`${AI_PROVIDERS.tokenhub.baseUrl}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': userKey.apiKey
        },
        body: JSON.stringify({
          model: modelId,
          text: params.text,
          voice: params.voice,
          format: params.format || 'mp3',
          speed: params.speed || 1.0,
          volume: params.volume || 1.0
        })
      });
      
      result = await response.json();
    }
    
    await updateKeyUsage(userKey.id, true);
    return result;
  } catch (error: any) {
    await updateKeyUsage(userKey.id, false);
    throw error;
  }
}

// 获取模型列表（带用户使用状态）
export async function getAvailableModels(userId: string) {
  const userKeys = await prisma.apiKey.findMany({
    where: { userId, status: 'active' }
  });
  
  const configuredProviders = new Set(userKeys.map(k => k.provider));
  
  return {
    providers: Object.entries(AI_PROVIDERS).map(([id, p]) => ({
      id,
      name: p.name,
      configured: configuredProviders.has(id)
    })),
    models: Object.entries(AI_PROVIDERS).flatMap(([providerId, providerInfo]) =>
      Object.entries(providerInfo.models).map(([modelId, config]) => ({
        id: `${providerId}:${modelId}`,
        name: config.name,
        type: config.type,
        provider: providerId,
        providerName: providerInfo.name,
        configured: configuredProviders.has(providerId)
      }))
    )
  };
}

export { encrypt, decrypt };
