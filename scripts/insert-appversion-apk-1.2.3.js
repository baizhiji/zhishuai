const { PrismaClient } = require('/var/www/zhishuai/server/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const existing = await p.appVersion.findFirst({
    where: { version: '1.2.3', platform: 'android' },
  });
  if (existing) {
    console.log('EXISTS', existing.id);
    return;
  }
  const r = await p.appVersion.create({
    data: {
      id: 'version_apk_123_' + Date.now(),
      version: '1.2.3',
      platform: 'android',
      buildNumber: 123,
      changelog:
        '修复手机端登录失败问题（token 存储安全兼容，登录恢复正常）。',
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai.apk',
      forceUpdate: false,
      status: 'released',
      channel: 'stable',
      sha256: '856270e92e58ae56c70383e060873ed37dd473354e795119cef0e22b1daa9473',
      size: '70.1 MB',
      releasedAt: new Date(),
    },
  });
  console.log('INSERTED', r.id);
}

main()
  .catch((e) => {
    console.error('ERR', e.message);
    process.exit(1);
  })
  .finally(() => p['$disconnect']());
