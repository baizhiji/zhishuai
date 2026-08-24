// 生产环境全面诊断
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // 1. Setting 表完整内容
  try {
    const rows = await p.setting.findMany();
    console.log('=== Setting 表:', rows.length, '条 ===');
    for (const r of rows) console.log(JSON.stringify(r).slice(0, 400));
  } catch (e) { console.log('Setting 表错误:', e.message); }

  // 2. ApiProvider 表
  try {
    const rows = await p.apiProvider.findMany();
    console.log('\n=== ApiProvider 表:', rows.length, '条 ===');
    for (const r of rows) console.log(JSON.stringify(r).slice(0, 300));
  } catch (e) { console.log('ApiProvider 表错误:', e.message); }

  // 3. 用量日志汇总
  try {
    const total = await p.apiUsageLog.count();
    const byProvider = await p.apiUsageLog.groupBy({ by: ['providerName', 'status'], _count: true });
    const recent = await p.apiUsageLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { userId: true, providerName: true, model: true, status: true, errorMsg: true, createdAt: true } });
    console.log('\n=== API用量日志 总数:', total, '===');
    for (const b of byProvider) console.log(JSON.stringify(b));
    console.log('最近5条:');
    for (const r of recent) console.log(JSON.stringify(r));
  } catch (e) { console.log('apiUsageLog 错误:', e.message); }

  // 4. 各业务表数据量
  const tables = {
    user: 'users', material: 'materials', job: 'jobs', candidate: 'candidates',
    lead: 'leads', acquisitionTask: 'acquisitionTasks', shareCode: 'shareCodes',
    creation: 'creations', businessPlan: 'businessPlans', ticket: 'tickets',
    notification: 'notifications', conversationLog: 'conversationLogs',
  };
  console.log('\n=== 业务数据量 ===');
  for (const [key, name] of Object.entries(tables)) {
    try {
      const c = await p[key].count();
      console.log(`${name}: ${c}`);
    } catch (e) { console.log(`${name}: ERROR ${e.message}`); }
  }

  await p.$disconnect();
}
main().catch(e => { console.log('ERR', e.message); process.exit(1); });
