// 幂等插入桌面端 3.1.0 发布记录（在服务器 server 目录执行）
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VERSION = '3.1.0';
const SIGNATURE = 'dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWTZvL0lSTWdRcytESUtIRzB2dGJ0cWdNeXFycEdib2hLWEZmbHU0RlBxY1FYMlg5MEc2RmVUdGxib2p0TXBjcnVWODd2RW5sc0hVdnpra0JvU3VXQ1RPVXdEOFdtRXc0PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg3NTQwNzI1CWZpbGU6emhpc2h1YWlfMy4xLjBfeDY0LXNldHVwLmV4ZQo0K3Y4eDZLblRTbWZpRzRTaU14b1c2aG1YNi9aZzY2aVc0aGgyT1E1blNPYmdLVjdiZWZIOHNFYjNBZkx2ZGpLT0tLcFpWZmNZc0hBbi9JK3ZXVFZBUT09Cg==';

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
      buildNumber: 310,
      status: 'released',
      channel: 'stable',
      sha256: 'ceaf3d222ca45c89e3cb50e150f417ec8af1cd62bb097a96c0ac2f3ce709dd3e',
      size: '3.5 MB',
      signature: SIGNATURE,
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai_3.1.0_x64-setup.exe',
      forceUpdate: false,
      releasedAt: new Date(),
      changelog: '智枢AI 桌面版 3.1.0：商业助手新增火山方舟支持（五模型链路）；桌面端废弃页面与权限清理；多项界面与体验修正。',
    },
  });
  console.log(`[insert] AppVersion ${VERSION} created (buildNumber 310)`);
}

main()
  .catch((e) => {
    console.error('[insert] error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
