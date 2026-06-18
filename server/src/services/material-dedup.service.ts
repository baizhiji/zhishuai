/**
 * 素材去重服务
 * 内容指纹/文件哈希/感知哈希 + 使用追踪
 */
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import { prisma } from '../utils/db';


/**
 * 计算文本内容的 SimHash 指纹
 * 用于检测标题/文案的相似度
 */
export function computeSimHash(text: string, hashBits: number = 64): string {
  if (!text || text.trim().length === 0) return '';

  // 分词（简单中文分词：按标点和空格分割，再提取2-4字ngram）
  const tokens = extractTokens(text);
  if (tokens.length === 0) return '';

  const v = new Array(hashBits).fill(0);

  for (const token of tokens) {
    const tokenHash = crypto.createHash('sha256').update(token).digest();
    for (let i = 0; i < hashBits; i++) {
      const byteIdx = Math.floor(i / 8);
      const bitIdx = i % 8;
      const isSet = (tokenHash[byteIdx] & (1 << bitIdx)) !== 0;
      v[i] += isSet ? 1 : -1;
    }
  }

  // 生成 SimHash
  let simHash = '';
  for (let i = 0; i < hashBits; i += 4) {
    let nibble = 0;
    for (let j = 0; j < 4 && (i + j) < hashBits; j++) {
      if (v[i + j] > 0) nibble |= (1 << j);
    }
    simHash += nibble.toString(16);
  }

  return simHash;
}

/**
 * 计算 SimHash 的海明距离
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return Infinity;

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const xor = parseInt(hash1[i], 16) ^ parseInt(hash2[i], 16);
    distance += popcount(xor);
  }
  return distance;
}

/**
 * 判断两个 SimHash 是否相似
 * 海明距离 <= 3 认为高度相似
 */
export function isSimilar(hash1: string, hash2: string, threshold: number = 3): boolean {
  return hammingDistance(hash1, hash2) <= threshold;
}

/**
 * 计算文件 SHA256 哈希
 */
export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * 计算文本内容的 SHA256 哈希（精确匹配）
 */
export function computeContentHash(content: string): string {
  return crypto.createHash('sha256').update(content.trim().toLowerCase()).digest('hex');
}

/**
 * 检查素材是否重复
 * 返回重复的素材ID列表
 */
export async function checkDuplicate(
  userId: string,
  type: string,
  content?: string,
  fileHash?: string,
  simHash?: string
): Promise<{ duplicateOf: string[]; similarTo: string[] }> {
  const duplicateOf: string[] = [];
  const similarTo: string[] = [];

  // 1. 精确匹配：通过 contentHash 或 fileHash 查找完全重复
  const exactMatches = await prisma.material.findMany({
    where: {
      userId,
      type,
      OR: [
        ...(content ? [{ contentHash: computeContentHash(content) }] : []),
        ...(fileHash ? [{ fileHash }] : []),
      ],
    },
    select: { id: true, title: true },
  });

  duplicateOf.push(...exactMatches.map(m => m.id));

  // 2. 模糊匹配：通过 simHash 查找相似内容
  if (simHash || content) {
    const hash = simHash || (content ? computeSimHash(content) : '');

    if (hash) {
      // 获取同类型素材的 simHash 进行比对
      const candidates = await prisma.material.findMany({
        where: {
          userId,
          type,
          simHash: { not: null },
        },
        select: { id: true, simHash: true, title: true },
      });

      for (const candidate of candidates) {
        if (candidate.simHash && isSimilar(hash, candidate.simHash)) {
          if (!duplicateOf.includes(candidate.id)) {
            similarTo.push(candidate.id);
          }
        }
      }
    }
  }

  return { duplicateOf, similarTo };
}

/**
 * 为素材计算并存储指纹
 */
export async function computeAndStoreFingerprint(materialId: string): Promise<void> {
  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) return;

  const updates: any = {};

  // 计算内容哈希
  if (material.content) {
    updates.contentHash = computeContentHash(material.content);
    updates.simHash = computeSimHash(material.content);
  }

  // 计算 SimHash（包含标题+内容）
  if (material.title || material.content) {
    const fullText = [material.title, material.content].filter(Boolean).join(' ');
    updates.simHash = computeSimHash(fullText);
  }

  if (Object.keys(updates).length > 0) {
    await prisma.material.update({
      where: { id: materialId },
      data: updates,
    });
  }
}

/**
 * 检查素材是否已在指定平台使用过
 * 需求：标题、图片、短视频在自动发布里只能使用一次
 */
export async function checkMaterialUsageOnPlatform(
  materialId: string,
  platform: string
): Promise<{ canUse: boolean; usedOnPlatforms: string[] }> {
  // 查找该素材的所有发布记录
  const records = await prisma.publishRecord.findMany({
    where: { materialId, status: { in: ['completed', 'published', 'pending'] } },
    select: { platform: true },
  });

  const usedOnPlatforms = [...new Set(records.map(r => r.platform))];

  return {
    canUse: !usedOnPlatforms.includes(platform),
    usedOnPlatforms,
  };
}

/**
 * 标记素材为已使用（发布成功后调用）
 * 更新 status + usedCount + usagePlatforms
 */
export async function markMaterialAsUsed(
  materialId: string,
  platform: string
): Promise<void> {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });

  if (!material) return;

  // 解析现有 usagePlatforms
  let platforms: string[] = [];
  try {
    platforms = material.usagePlatforms ? JSON.parse(material.usagePlatforms) : [];
  } catch { platforms = []; }

  if (!platforms.includes(platform)) {
    platforms.push(platform);
  }

  await prisma.material.update({
    where: { id: materialId },
    data: {
      status: 'used',
      usedCount: { increment: 1 },
      usagePlatforms: JSON.stringify(platforms),
    },
  });
}

/**
 * 批量检测素材库中的重复素材
 */
export async function batchDetectDuplicates(userId: string): Promise<{
  duplicateGroups: { hash: string; materialIds: string[] }[];
  similarGroups: { materialIds: string[]; distance: number }[];
}> {
  // 获取所有有指纹的素材
  const materials = await prisma.material.findMany({
    where: { userId, contentHash: { not: null } },
    select: { id: true, contentHash: true, simHash: true },
  });

  // 按 contentHash 分组（完全重复）
  const hashGroups: Record<string, string[]> = {};
  for (const m of materials) {
    if (m.contentHash) {
      if (!hashGroups[m.contentHash]) hashGroups[m.contentHash] = [];
      hashGroups[m.contentHash].push(m.id);
    }
  }

  const duplicateGroups = Object.entries(hashGroups)
    .filter(([, ids]) => ids.length > 1)
    .map(([hash, ids]) => ({ hash, materialIds: ids }));

  // 模糊匹配（simHash 距离 <= 3）
  const similarGroups: { materialIds: string[]; distance: number }[] = [];
  const simHashMaterials = materials.filter(m => m.simHash);

  for (let i = 0; i < simHashMaterials.length; i++) {
    for (let j = i + 1; j < simHashMaterials.length; j++) {
      const a = simHashMaterials[i];
      const b = simHashMaterials[j];
      if (a.simHash && b.simHash) {
        const distance = hammingDistance(a.simHash, b.simHash);
        if (distance <= 3 && distance > 0) {
          similarGroups.push({ materialIds: [a.id, b.id], distance });
        }
      }
    }
  }

  return { duplicateGroups, similarGroups };
}

// ========== 辅助函数 ==========

function extractTokens(text: string): string[] {
  const tokens: string[] = [];

  // 按标点和空格分割
  const words = text.split(/[\s,，。.!！?？、；：""''（）()\[\]【】\n\r]+/).filter(w => w.length > 0);
  tokens.push(...words);

  // 生成 bigram 和 trigram（对中文更有效）
  const cleanText = text.replace(/\s+/g, '');
  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i <= cleanText.length - n; i++) {
      tokens.push(cleanText.substring(i, i + n));
    }
  }

  return tokens;
}

function popcount(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}
