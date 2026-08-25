const { PrismaClient } = require('/var/www/zhishuai/server/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  // 清空测试二维码配置
  const upd = await p.setting.updateMany({
    where: { key: 'support_qrcode' },
    data: { value: '' },
  });
  console.log('CLEARED:' + upd.count);
  await p.$disconnect();
}

main().catch((e) => {
  console.error('ERR:' + e.message);
  process.exit(1);
});
