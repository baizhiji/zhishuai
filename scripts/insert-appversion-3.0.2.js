/* 向 appVersion 表插入桌面版 3.0.2 发布记录（幂等：已存在则跳过） */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const SHA256 = 'C876ABE557CDFC8DB4D8622896925DB0F1755AF9062B94580DF1592BA98E4BFA';
const SIGNATURE = `dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWTZvL0lSTWdRczJiYjM2VGdHK2hocldPMHBIRmdHZkIyLytRSy82TXprUUNYTXczNnBNM1I5M0FVckpOZFI5MGZuSmJHS3l3cENJYk5VbjBKYS85QzJPdWt0cGlxTWcwPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg3MjQxMzQ4CWZpbGU6emhpc2h1YWlfMy4wLjJfeDY0LXNldHVwLmV4ZQpBS1dNTjNWcUM1N3kxOTkrbFdUQTFKOFJTSWpic2pFTG1kR2E5WDhJcVc0SjZ1WFVNaENvVUpVRTExak9jZWQraVZYUTVmU2xqK3dyR25LcFI2S2hEZz09Cg==`;

async function main() {
  const existing = await p.appVersion.findFirst({
    where: { version: '3.0.2', platform: 'desktop', channel: 'stable' },
  });
  if (existing) {
    console.log('SKIP: desktop 3.0.2 stable 记录已存在');
    console.log(JSON.stringify(existing, null, 2));
    return;
  }
  const created = await p.appVersion.create({
    data: {
      version: '3.0.2',
      platform: 'desktop',
      buildNumber: 302,
      changelog: '智枢AI 桌面版 3.0.2\n\n- 全新紫色品牌视觉升级\n- 更新 LOGO 图标方案\n- 优化界面样式适配',
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai_3.0.2_x64-setup.exe',
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
