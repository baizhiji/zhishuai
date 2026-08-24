// 检查 provider 开关完整内容 + 测试配置接口
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // 完整读取 ai_provider_switches
  try {
    const rows = await p.setting.findMany();
    for (const r of rows) {
      console.log(`key=${r.key} value=${r.value} type=${r.type || ''}`);
    }
  } catch (e) { console.log('Setting 错误:', e.message); }

  // 检查是否有 provider 开关相关的读取逻辑
  await p.$disconnect();
}
main().catch(e => { console.log('ERR', e.message); process.exit(1); });
