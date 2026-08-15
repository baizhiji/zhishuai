/* 向 appVersion 表插入桌面版 3.0.0 发布记录（幂等：已存在则跳过） */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const SIGNATURE = `dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWTZvL0lSTWdRczJGYytUUmU3QWJtS2dTT2VLSnRUYjhpenpjZ2QxTDFqRWphU3lyVWpZZUIwWVMyb293WkJkK0Vxa3BlWks0bm1Hd0hlaUxaS0l3bWtGQVI3dTlTdmdvPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg2ODExNzg5CWZpbGU6emhpc2h1YWktc2V0dXAtMy4wLjAuZXhlClpleGlqay9GclZjNzY2RGN6Y0VNYmxtOHVkRG9kTDBWQ1d4YS9LUXpEVXQwTFI3YXRqUjBhNU5OVVNhV3BoZnBNcnUvdGpCUWNJMVFSRkYyTWNyb0NRPT0K`;

async function main() {
  const existing = await p.appVersion.findFirst({
    where: { version: '3.0.0', platform: 'desktop', channel: 'stable' },
  });
  if (existing) {
    console.log('SKIP: desktop 3.0.0 stable 记录已存在');
    console.log(JSON.stringify(existing, null, 2));
    return;
  }
  const created = await p.appVersion.create({
    data: {
      version: '3.0.0',
      platform: 'desktop',
      buildNumber: 300,
      changelog:
        '智枢AI 桌面版 3.0.0\n\n- 全新 V3.0 UI 界面，操作更流畅\n- AI 创作工厂、智能招聘、智能获客、推荐分享四大模块\n- 支持自动更新（本次启用签名更新机制）',
      downloadUrl: 'https://baizhiji.net/downloads/%E6%99%BA%E6%9E%A2AI_3.0.0_x64-setup.exe',
      forceUpdate: false,
      status: 'released',
      releasedAt: new Date(),
      channel: 'stable',
      sha256: '9de203e9849621b9d117f67fc67429928ed3a0a768f3ac1b8935706cddd3b50b',
      size: '4.1 MB',
      signature: SIGNATURE,
    },
  });
  console.log('CREATED:');
  console.log(JSON.stringify(created, null, 2));
}

main()
  .catch((e) => {
    console.error('ERR', e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
