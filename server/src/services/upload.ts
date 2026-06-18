// 文件上传服务 - 支持本地存储和腾讯云COS
// 安装COS SDK: npm install cos-nodejs-sdk-v5

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 存储类型配置
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local'; // 'local' | 'cos'
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// COS配置
const COS_CONFIG = {
  SecretId: process.env.COS_SECRET_ID || '',
  SecretKey: process.env.COS_SECRET_KEY || '',
  Bucket: process.env.COS_BUCKET || '',
  Region: process.env.COS_REGION || 'ap-guangzhou',
};

interface UploadResult {
  url: string;
  key: string;
  size: number;
}

// 生成唯一文件名
function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${date}/${hash}${ext}`;
}

// 本地存储上传
async function uploadToLocal(filePath: string, originalName: string): Promise<UploadResult> {
  const key = generateFilename(originalName);
  const destPath = path.join(UPLOAD_DIR, key);

  // 确保目录存在
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });

  // 移动文件
  await fs.promises.copyFile(filePath, destPath);

  const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
  return {
    url: `${baseUrl}/uploads/${key}`,
    key,
    size: (await fs.promises.stat(destPath)).size,
  };
}

// COS上传
async function uploadToCOS(filePath: string, originalName: string): Promise<UploadResult> {
  try {
    const COS = await import('cos-nodejs-sdk-v5');
    const cos = new COS.default({
      SecretId: COS_CONFIG.SecretId,
      SecretKey: COS_CONFIG.SecretKey,
    });

    const key = generateFilename(originalName);
    const fileSize = (await fs.promises.stat(filePath)).size;

    await cos.putObject({
      Bucket: COS_CONFIG.Bucket,
      Region: COS_CONFIG.Region,
      Key: key,
      Body: fs.createReadStream(filePath),
      ContentLength: fileSize,
    });

    const url = `https://${COS_CONFIG.Bucket}.cos.${COS_CONFIG.Region}.myqcloud.com/${key}`;
    return { url, key, size: fileSize };
  } catch (error: any) {
    console.error('COS upload failed, falling back to local:', error.message);
    return uploadToLocal(filePath, originalName);
  }
}

// 统一上传接口
export async function uploadFile(filePath: string, originalName: string): Promise<UploadResult> {
  if (STORAGE_TYPE === 'cos' && COS_CONFIG.SecretId && COS_CONFIG.Bucket) {
    return uploadToCOS(filePath, originalName);
  }
  return uploadToLocal(filePath, originalName);
}

// Buffer上传（适用于内存中的文件）
export async function uploadBuffer(buffer: Buffer, originalName: string): Promise<UploadResult> {
  const key = generateFilename(originalName);
  const destPath = path.join(UPLOAD_DIR, key);

  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  await fs.promises.writeFile(destPath, buffer);

  const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
  return {
    url: `${baseUrl}/uploads/${key}`,
    key,
    size: buffer.length,
  };
}

// 删除文件
export async function deleteFile(key: string): Promise<void> {
  if (STORAGE_TYPE === 'cos' && COS_CONFIG.SecretId) {
    try {
      const COS = await import('cos-nodejs-sdk-v5');
      const cos = new COS.default({
        SecretId: COS_CONFIG.SecretId,
        SecretKey: COS_CONFIG.SecretKey,
      });
      await cos.deleteObject({
        Bucket: COS_CONFIG.Bucket,
        Region: COS_CONFIG.Region,
        Key: key,
      });
      return;
    } catch (error: any) {
      console.error('COS delete failed:', error.message);
    }
  }

  // 本地删除
  const localPath = path.join(UPLOAD_DIR, key);
  try {
    await fs.promises.unlink(localPath);
  } catch (e) {
    // 文件不存在忽略
  }
}
