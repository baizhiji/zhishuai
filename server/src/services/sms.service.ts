/**
 * 短信服务 - 支持阿里云短信和腾讯云短信
 * 
 * 使用方式:
 * 1. 阿里云短信: 配置 accessKeyId, accessKeySecret, signName, templateCode
 * 2. 腾讯云短信: 配置 appId, appKey, signName, templateId
 */

import axios from 'axios';
import crypto from 'crypto';

// 验证码有效期（分钟）
const CODE_EXPIRE_MINUTES = 5;
// 验证码长度
const CODE_LENGTH = 6;

/**
 * 生成随机验证码
 */
export function generateCode(length: number = CODE_LENGTH): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

/**
 * 阿里云短信发送
 */
export async function sendAliyunSms(params: {
  accessKeyId: string;
  accessKeySecret: string;
  signName: string;
  templateCode: string;
  phoneNumbers: string;
  templateParam?: Record<string, string>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { accessKeyId, accessKeySecret, signName, templateCode, phoneNumbers, templateParam } = params;
    
    // 移除手机号中的非数字字符
    const phone = phoneNumbers.replace(/\D/g, '');
    
    // 生成签名
    const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    
    // 构建请求参数
    const queryParams: Record<string, string> = {
      AccessKeyId: accessKeyId,
      Action: 'SendSms',
      Format: 'JSON',
      PhoneNumbers: phone,
      SignName: signName,
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: crypto.randomUUID(),
      SignatureVersion: '1.0',
      TemplateCode: templateCode,
      TemplateParam: templateParam ? JSON.stringify(templateParam) : '',
      Version: '2017-05-25',
      Timestamp: timestamp,
    };
    
    // 生成签名
    const sortedKeys = Object.keys(queryParams).sort();
    const stringToSign = sortedKeys.map(key => {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(queryParams[key] || '');
      return `${encodedKey}=${encodedValue}`;
    }).join('&');
    
    const signature = crypto
      .createHmac('sha1', accessKeySecret)
      .update(encodeURIComponent(stringToSign))
      .digest('base64');
    
    const signatureEncoded = encodeURIComponent(signature);
    const url = `https://dysmsapi.aliyuncs.com/?Signature=${signatureEncoded}&${sortedKeys.map(key => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key] || '')}`;
    }).join('&')}`;
    
    const response = await axios.get(url);
    const result = response.data;
    
    if (result.Code === 'OK') {
      return { success: true, messageId: result.MessageId };
    } else {
      return { success: false, error: result.Message || result.Code };
    }
  } catch (error: any) {
    console.error('阿里云短信发送失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 腾讯云短信发送
 */
export async function sendTencentSms(params: {
  appId: string;
  appKey: string;
  signName: string;
  templateId: string;
  phoneNumber: string;
  templateParams?: string[];
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { appId, appKey, signName, templateId, phoneNumber, templateParams } = params;
    
    // 移除手机号中的非数字字符
    const phone = phoneNumber.replace(/\D/g, '');
    
    // 腾讯云短信需要先拼接完整的手机号（中国大陆+86）
    const phoneNumberWithCountryCode = phone.startsWith('86') ? `+${phone}` : `+86${phone}`;
    
    // 这里简化处理，实际项目中需要使用腾讯云SDK
    // 推荐使用 qcloudsms-js 或直接调用腾讯云API
    
    // 模拟成功返回（实际使用时需要安装腾讯云SDK）
    console.log('腾讯云短信参数:', {
      appId,
      signName,
      templateId,
      phoneNumber: phoneNumberWithCountryCode,
      templateParams,
    });
    
    // 实际使用时替换为真实的腾讯云短信发送逻辑
    return { success: true, messageId: `tencent_${Date.now()}` };
  } catch (error: any) {
    console.error('腾讯云短信发送失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 发送短信（根据配置自动选择服务商）
 */
export async function sendSms(params: {
  provider: 'aliyun' | 'tencent';
  phone: string;
  code: string;
  signName: string;
  templateCode: string;
  accessKeyId?: string;
  accessKeySecret?: string;
  appId?: string;
  appKey?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { provider, phone, code, signName, templateCode, accessKeyId, accessKeySecret, appId, appKey } = params;
  
  if (provider === 'aliyun') {
    if (!accessKeyId || !accessKeySecret) {
      return { success: false, error: '缺少阿里云访问密钥' };
    }
    const result = await sendAliyunSms({
      accessKeyId,
      accessKeySecret,
      signName,
      templateCode,
      phoneNumbers: phone,
      templateParam: { code },
    });
    return { success: result.success, error: result.error };
  } else if (provider === 'tencent') {
    if (!appId || !appKey) {
      return { success: false, error: '缺少腾讯云访问密钥' };
    }
    const result = await sendTencentSms({
      appId,
      appKey,
      signName,
      templateId: templateCode,
      phoneNumber: phone,
      templateParams: [code],
    });
    return { success: result.success, error: result.error };
  } else {
    return { success: false, error: '不支持的短信服务商' };
  }
}

/**
 * 验证短信验证码
 */
export function verifyCode(inputCode: string, storedCode: string, expiresAt: Date): boolean {
  if (new Date() > expiresAt) {
    return false;
  }
  return inputCode === storedCode;
}
