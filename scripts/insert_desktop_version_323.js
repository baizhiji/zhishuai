const { PrismaClient } = require('/var/www/zhishuai/server/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  // 将之前 released 的 windows 版本标记为 archived
  await p.appVersion.updateMany({
    where: { platform: 'windows', status: 'released' },
    data: { status: 'archived' },
  });

  // 插入 3.2.3 记录
  const record = await p.appVersion.create({
    data: {
      version: '3.2.3',
      platform: 'windows',
      buildNumber: 3230,
      status: 'released',
      size: '3.5 MB',
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai_3.2.3_x64-setup.exe',
      changelog: '修复桌面端客服中心配置中企业微信二维码上传失败的问题',
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
