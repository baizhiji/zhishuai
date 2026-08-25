// 幂等插入桌面端 3.2.1 发布记录（在服务器 server 目录执行）
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VERSION = '3.2.1';
const SIGNATURE =
  'dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWTZvL0lSTWdRc3hZaXB4UHJSUVI1M2FsbUVsOHhZWUJEWFBKeTcyb3ZZb2hzcThnTk14N2ZRZHkvWCtJQmtWVGNaaEMzR3QzaEpXNGdyS3J6c2JrQXlWTGVjTnQzZ3dBPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg3NjM1NzY4CWZpbGU65pm65p6iQUlfMy4yLjFfeDY0LXNldHVwLmV4ZQorTWtzSUpxQ0d0eXNramVNR1pQLzVXVC9VVjJOS0ZMZld6OVByYy9vY2FRM3VSUjhhV2RXN0d2S0xXbjYxVlUyRituS2Fpc01yVUp1UWwyUGFZdWFCUT09Cg==';

async function main() {
  const exists = await prisma.appVersion.findFirst({
    where: { platform: 'desktop', version: VERSION },
  });
  if (exists) {
    console.log(`[insert] AppVersion ${VERSION} already exists, skip`);
    return;
  }
  await prisma.appVersion.create({
    data: {
      version: VERSION,
      platform: 'desktop',
      buildNumber: 321,
      status: 'released',
      channel: 'stable',
      sha256: 'C1F8B39213B60FA44D92101B399A450EC9D6723D0583B3145E00952A7AD696B4',
      size: '3.48 MB',
      signature: SIGNATURE,
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai_3.2.1_x64-setup.exe',
      forceUpdate: false,
      releasedAt: new Date(),
      changelog:
        '智枢AI 桌面版 3.2.1：登录入口角色隔离——代理商账号只能从"区域代理"入口登录代理商端，如需使用客户端功能请开通独立的客户账号；管理员账号仅能从管理员入口登录。',
    },
  });
  console.log(`[insert] AppVersion ${VERSION} created (buildNumber 321)`);
}

main()
  .catch((e) => {
    console.error('[insert] error:', e);
    process.exit(1);
  })
  .finally(() => prisma['$disconnect']());
