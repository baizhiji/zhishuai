// 核查 Key 属于哪个用户 + 各用户是否都有 Key
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // 1. 列出所有用户
  const users = await p.user.findMany({
    select: { id: true, phone: true, name: true, role: true, status: true, lastLoginAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log('=== USERS ===');
  for (const u of users) {
    console.log(JSON.stringify({ id: u.id, phone: u.phone, name: u.name, role: u.role, status: u.status, lastLoginAt: u.lastLoginAt }));
  }

  // 2. 各用户的 Key 情况
  const keys = await p.apiKey.findMany({
    select: { id: true, userId: true, provider: true, status: true, isPrimary: true, lastUsedAt: true, failCount: true, usage: true },
  });
  console.log('\n=== API KEYS ===');
  for (const k of keys) {
    const u = users.find(x => x.id === k.userId);
    console.log(JSON.stringify({ keyId: k.id, userId: k.userId, ownerPhone: u ? u.phone : '?', ownerRole: u ? u.role : '?', provider: k.provider, status: k.status, isPrimary: k.isPrimary, lastUsedAt: k.lastUsedAt, failCount: k.failCount, usage: k.usage }));
  }

  // 3. 使用统计
  const usageCount = await p.apiUsageLog.count().catch(() => 0);
  const creationCount = await p.creation.count().catch(() => 0);
  const planCount = await p.businessPlan.count().catch(() => 0);
  console.log('\nUSAGE_LOGS:', usageCount, 'CREATIONS:', creationCount, 'PLANS:', planCount);

  await p.$disconnect();
}
main().catch(e => { console.log('ERR', e.message); process.exit(1); });
