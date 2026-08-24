// 幂等插入 APK 端 1.1.0 发布记录（在服务器 server 目录执行）
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VERSION = '1.1.0';

async function main() {
  const exists = await prisma.appVersion.findFirst({
    where: { platform: 'android', version: VERSION },
  });
  if (exists) {
    console.log(`[insert] AppVersion ${VERSION} (android) already exists, skip`);
    return;
  }
  await prisma.appVersion.create({
    data: {
      version: VERSION,
      platform: 'android',
      buildNumber: 110,
      status: 'released',
      channel: 'stable',
      sha256: '38166467dcf9ab49ef17bb126e670cabb99fa9a81cbc3ff42830b2917f1af21d',
      size: '70.0 MB',
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai.apk',
      forceUpdate: false,
      releasedAt: new Date(),
      changelog: '智枢AI 1.1.0：商业助手适配三服务商客户 API Key（阿里云百炼/腾讯云 TokenHub/火山方舟）；界面与协议修正。',
    },
  });
  console.log(`[insert] AppVersion ${VERSION} (android) created (buildNumber 110)`);
}

main()
  .catch((e) => {
    console.error('[insert] error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
