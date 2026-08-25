// 幂等插入桌面端 3.2.5 发布记录（在服务器 server 目录执行：node /tmp/insert-appversion-3.2.5.js）
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VERSION = '3.2.5';
const SIGNATURE =
  'dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWTZvL0lSTWdRc3h0M3JBVXVROThxeWNETE1iMm9DeXNTQUl3czRnK0ZpSFJxQ1U2NVpUTjBzYk1mRWZXNTJPUmxQb2N2eFV5aHBzb1I3dlRKOFNGRTJLb0xadE8vdEFzPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg3NjU0NDA4CWZpbGU6emhpc2h1YWlfMy4yLjVfeDY0LXNldHVwLmV4ZQpVSG8wQjN5ekJrbjFQTTdDQXFEWE5OaVIwMmZQYlhuT2xNeWhxeTFGb21yVnpFTndaYkhONjQrU2NRNi9iUm5hYkYvMWRzdTlnL05pcDdjeUkvdURDZz09Cg==';

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
      buildNumber: 325,
      status: 'released',
      channel: 'stable',
      sha256: '2a001f134396c153ac03aff734c03fe0bcf4cd4c9ad0de21f8e2dbccc32ef451',
      size: '3.5 MB',
      signature: SIGNATURE,
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai_3.2.5_x64-setup.exe',
      forceUpdate: false,
      releasedAt: new Date(),
      changelog:
        '智枢AI 桌面版 3.2.5：修复代理商端创建客户/开通套餐失败时提示不具体的问题，错误信息现在会显示完整状态码与后端返回消息；创建客户时若未填写初始密码，服务端将统一使用默认密码 123456（与前端提示一致），避免生成的随机密码导致客户无法登录。',
    },
  });
  console.log(`[insert] AppVersion ${VERSION} created (buildNumber 325)`);
}

main()
  .catch((e) => {
    console.error('[insert] error:', e);
    process.exit(1);
  })
  .finally(() => prisma['$disconnect']());
