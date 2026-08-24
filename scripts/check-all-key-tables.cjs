// 全面检查所有可能的 API Key 存储表
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const tables = ['apiKey', 'aiProvider', 'aiProviderConfig', 'providerConfig', 'apiKeyConfig', 'userApiKey', 'modelConfig', 'aiConfig', 'systemConfig', 'globalApiKey'];
  for (const t of tables) {
    try {
      const count = await p[t].count();
      console.log(`表 ${t}: ${count} 条`);
      if (count > 0) {
        const rows = await p[t].findMany();
        console.log('  样本:', JSON.stringify(rows.slice(0, 2)).slice(0, 500));
      }
    } catch (e) {
      // 表不存在跳过
    }
  }
  // 列出所有模型表名
  const tablesList = await p.$queryRawUnsafe(`SHOW TABLES`);
  console.log('\n全部表:', tablesList.map(t => Object.values(t)[0]).join(', '));
  await p.$disconnect();
}
main().catch(e => { console.log('ERR', e.message); process.exit(1); });
