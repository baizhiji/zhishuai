const { PrismaClient } = require('/var/www/zhishuai/server/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  // 将之前 released 的 windows 版本标记为 archived
  await p.appVersion.updateMany({
    where: { platform: 'windows', status: 'released' },
    data: { status: 'archived' },
  });

  // 插入 3.2.2 记录
  const record = await p.appVersion.create({
    data: {
      version: '3.2.2',
      platform: 'windows',
      buildNumber: 3220,
      status: 'released',
      size: '3.5 MB',
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai_3.2.2_x64-setup.exe',
      changelog: '修复桌面端 APP 下载页无法同步服务器最新 APK 版本的问题',
      releasedAt: new Date(),
    },
  });

  console.log('INSERTED:' + JSON.stringify(record));
  await p.$disconnect();
}

main().catch((e) => {
  console.error('ERR:' + e.message);
  process.exit(1);
});
