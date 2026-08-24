// 核查孤儿 Key 归属 + 各用户 Key 配置情况
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // 1. 孤儿 Key 的用户是否存在
  const orphanId = '45d3dd11-27a8-4645-b021-801a0d4d7622';
  const orphanUser = await p.user.findUnique({ where: { id: orphanId }, select: { id: true, phone: true, role: true } });
  console.log('孤儿Key用户是否存在:', orphanUser ? JSON.stringify(orphanUser) : '不存在(已删除)');

  // 2. 所有用户
  const users = await p.user.findMany({ select: { id: true, phone: true, role: true } });
  console.log('\n所有用户:');
  for (const u of users) console.log(' ', JSON.stringify(u));

  // 3. 所有 apiKey 记录（含归属用户）
  const keys = await p.apiKey.findMany({ select: { id: true, userId: true, provider: true, status: true, isPrimary: true, isSecondary: true, usage: true, failCount: true } });
  console.log('\n所有API Key记录:');
  for (const k of keys) {
    const owner = users.find(u => u.id === k.userId);
    console.log(' ', JSON.stringify({ ...k, ownerPhone: owner?.phone, ownerRole: owner?.role }));
  }

  // 4. agentApiConfig 表（agent 专用 Key）
  try {
    const agentKeys = await p.agentApiConfig.count();
    console.log('\nagentApiConfig记录数:', agentKeys);
  } catch (e) { console.log('\nagentApiConfig: 表不存在或错误', e.message); }

  await p.$disconnect();
}
main().catch(e => { console.log('ERR', e.message); process.exit(1); });
