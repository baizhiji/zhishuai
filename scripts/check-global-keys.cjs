// 检查系统级/全局 API Key 通道
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // 1. ApiProvider 表（admin 配置的全局 provider）
  try {
    const rows = await p.apiProvider.findMany();
    console.log('=== ApiProvider 表:', rows.length, '条 ===');
    for (const r of rows) console.log(JSON.stringify(r).slice(0, 300));
  } catch (e) { console.log('ApiProvider 表错误:', e.message); }

  // 2. Setting 表（可能有全局 Key）
  try {
    const rows = await p.setting.findMany();
    console.log('\n=== Setting 表:', rows.length, '条 ===');
    for (const r of rows) console.log(JSON.stringify(r).slice(0, 200));
  } catch (e) { console.log('Setting 表错误:', e.message); }

  // 3. AgentApiConfig（agent 专用）
  try {
    const rows = await p.agentApiConfig.findMany();
    console.log('\n=== AgentApiConfig 表:', rows.length, '条 ===');
    for (const r of rows) console.log(JSON.stringify(r).slice(0, 200));
  } catch (e) { console.log('AgentApiConfig 表错误:', e.message); }

  // 4. API 用量日志（看最近是否成功调用）
  try {
    const logs = await p.apiUsageLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { userId: true, providerName: true, model: true, status: true, errorMsg: true, createdAt: true } });
    console.log('\n=== 最近10条API用量日志 ===');
    for (const l of logs) console.log(JSON.stringify(l));
  } catch (e) { console.log('apiUsageLog 表错误:', e.message); }

  await p.$disconnect();
}
main().catch(e => { console.log('ERR', e.message); process.exit(1); });
