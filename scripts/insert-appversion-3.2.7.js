// 幂等插入桌面端 3.2.7 发布记录（拷贝到服务器 server 目录执行：node insert-appversion-3.2.7.js）
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VERSION = '3.2.7';
const SIGNATURE =
  'dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWTZvL0lSTWdRczJ1eVpXbjlVcVhPRUd2UVRJeWNpdG5xUDl4YzY5b0xtRTVNU0YrNm1wWHpTdWx0d1BjMXVyR2VJSnB5Qm0wYXVZRWM0Z2FYcFpqSU9aOEZTNG0zdGdRPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg3ODA3NzAyCWZpbGU65pm65p6iQUlfMy4yLjdfeDY0LXNldHVwLmV4ZQpHRVk2WTZTMVRHeWJCVU1hODBmeEVFMFVPZGhING9XOVE2d3hOVjNuZTNMOU1RZFYxc2R0Ym5uSnY5SFh5SnZKajhHVEJORVNtWmJTVk5vV1FoOHpBdz09Cg==';

async function main() {
  const exists = await prisma.appVersion.findFirst({
    where: { platform: 'desktop', version: VERSION },
  });
  if (exists) {
    console.log(`[insert] AppVersion ${VERSION} already exists, skip`);
    return;
  }

  const archived = await prisma.appVersion.updateMany({
    where: { platform: { in: ['desktop', 'windows'] }, status: 'released' },
    data: { status: 'archived' },
  });
  console.log(`[insert] archived ${archived.count} old desktop/windows released record(s)`);

  await prisma.appVersion.create({
    data: {
      version: VERSION,
      platform: 'desktop',
      buildNumber: 327,
      status: 'released',
      channel: 'stable',
      sha256: '2a8abbeeab536bf1f00e5100cdf9f1195e75d35c114ccd061bf86a3ba410cb56',
      size: '3.5 MB',
      signature: SIGNATURE,
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai_3.2.7_x64-setup.exe',
      forceUpdate: false,
      releasedAt: new Date(),
      changelog:
        '智枢AI 桌面版 3.2.7：AI创作工厂升级——生成数量支持一次生成多条（1-10条）；配图与视频成片可直接播放查看；上传素材增加图片预览与进度反馈；素材库支持筛选旧类目；修复客服二维码图片上传与展示。',
    },
  });
  console.log(`[insert] AppVersion ${VERSION} created (buildNumber 327)`);
}

main()
  .catch((e) => {
    console.error('[insert] error:', e);
    process.exit(1);
  })
  .finally(() => prisma['$disconnect']());
