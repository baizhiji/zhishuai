import { PrismaClient } from '/var/www/zhishuai/server/node_modules/@prisma/client';

const p = new PrismaClient();

async function main() {
  const existing = await p.appVersion.findFirst({
    where: { version: '1.1.1', platform: 'android' },
  });
  if (existing) {
    console.log('EXISTS', existing.id);
    return;
  }
  const r = await p.appVersion.create({
    data: {
      id: 'version_apk_111_' + Date.now(),
      version: '1.1.1',
      platform: 'android',
      buildNumber: 111,
      changelog: '修复登录错误提示文案; 首页交互优化',
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai.apk',
      forceUpdate: false,
      status: 'released',
      channel: 'stable',
      sha256: 'bbb2e8c68ff12799ad68ba036c0f49990b2a9a62c9d1be2d58a9f6ca1e53cf43',
      size: '70.0 MB',
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
  .finally(() => p.$disconnect());
