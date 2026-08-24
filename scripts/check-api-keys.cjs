// 生产环境 API Key 配置核查脚本
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const p = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'zhishuai-encrypt-key-2024-32char';

function decrypt(text) {
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    return text;
  }
}

async function main() {
  const keys = await p.apiKey.findMany({
    select: { id: true, userId: true, provider: true, status: true, isPrimary: true, isSecondary: true, createdAt: true, apiKey: true, secretKey: true },
  });
  console.log('TOTAL_KEYS:', keys.length);
  for (const k of keys) {
    const ak = decrypt(k.apiKey);
    const sk = k.secretKey ? decrypt(k.secretKey) : '';
    console.log(JSON.stringify({
      id: k.id,
      userId: k.userId,
      provider: k.provider,
      status: k.status,
      isPrimary: k.isPrimary,
      isSecondary: k.isSecondary,
      createdAt: k.createdAt,
      apiKeyPrefix: ak.slice(0, 10) + '...',
      apiKeyLen: ak.length,
      secretKeyLen: sk ? sk.length : 0,
      secretPrefix: sk ? sk.slice(0, 4) + '...' : null,
    }));
  }

  // 统计用户数
  const users = await p.user.count();
  const agents = await p.agent.count();
  const plans = await p.businessPlan.count().catch(() => 0);
  const creations = await p.creation.count().catch(() => 0);
  console.log('USERS:', users, 'AGENTS:', agents, 'PLANS:', plans, 'CREATIONS:', creations);

  await p.$disconnect();
}
main().catch(e => { console.log('ERR', e.message); process.exit(1); });
