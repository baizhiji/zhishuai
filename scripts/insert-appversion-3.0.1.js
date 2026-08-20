/* 向 appVersion 表插入桌面版 3.0.1 发布记录（幂等：已存在则跳过） */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const SHA256 = '6879cc66a67b96dc76340b2bf94359de92bf4bf5d0b27e4c7d066a5115c36204';
const SIGNATURE = `dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWTZvL0lSTWdRczJDdlZFR0xJTjBJMC83WmN0dlRSUVVHRU9IMENyaklmdWdRR0Y4R09yUTFGMzdpQXZWZmpraDh2Q0hrVEw1c3N2SGNuSlpCdUlyamdVQXdXY0J1UUE0PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg3MjA4ODM3CWZpbGU6emhpc2h1YWlfMy4wLjFfeDY0LXNldHVwLmV4ZQpWOWxhMlpqNWJHTHZoUTdkd0pmRlkvU1ZacnRId2JNNWJPY0VHZDNBMzhsU3IrM29jdlNIZHpwZU0wcWRGVTJwR0wzaWl0b21YQUVlOFdmTHRPSUxEdz09Cg==`;

async function main() {
  const existing = await p.appVersion.findFirst({
    where: { version: '3.0.1', platform: 'desktop', channel: 'stable' },
  });
  if (existing) {
    console.log('SKIP: desktop 3.0.1 stable 记录已存在');
    console.log(JSON.stringify(existing, null, 2));
    return;
  }
  const created = await p.appVersion.create({
    data: {
      version: '3.0.1',
      platform: 'desktop',
      buildNumber: 301,
      changelog: '智枢AI 桌面版 3.0.1\n\n- 修复界面样式适配问题\n- 优化自动更新稳定性',
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai_3.0.1_x64-setup.exe',
      forceUpdate: false,
      status: 'released',
      releasedAt: new Date(),
      channel: 'stable',
      sha256: SHA256,
      size: '4.2 MB',
      signature: SIGNATURE,
    },
  });
  console.log('CREATED:');
  console.log(JSON.stringify(created, null, 2));
}

main()
  .catch((e) => {
    console.error('ERR', e.message);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
