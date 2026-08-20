/* 向 appVersion 表插入桌面版 3.0.3 发布记录（幂等：已存在则跳过） */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const SHA256 = 'CCE4694C45C7797C0434E1BCA1D9EA84B62EDB21F520F479ED10AC2D38D3EFC4';
const SIGNATURE = `dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWTZvL0lSTWdRczR6aFdqa2QzclgyaURJc0hFSG52ZGlnemVrUHdPMTRvV1oyTE9jNDFubEdJNUdCVWJtaXlqV0lPTkRRY1ladEdaeGh2VzRjVzF1Q21hYkp4ajhGdFEwPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg3MjQyMzM4CWZpbGU6emhpc2h1YWlfMy4wLjNfeDY0LXNldHVwLmV4ZQpmMSt6a2RRNzVzN0kwc1Z4WlA5KzN4eEp6cVFOcVR6RkpuSVhIR1FlRUlXN2c3bFQ3NFRaaElGZUY5NGpSVlhKRVNPQ01hcXNoWmRORlQ1OE9NUHdCQT09Cg==`;

async function main() {
  const existing = await p.appVersion.findFirst({
    where: { version: '3.0.3', platform: 'desktop', channel: 'stable' },
  });
  if (existing) {
    console.log('SKIP: desktop 3.0.3 stable 记录已存在');
    console.log(JSON.stringify(existing, null, 2));
    return;
  }
  const created = await p.appVersion.create({
    data: {
      version: '3.0.3',
      platform: 'desktop',
      buildNumber: 303,
      changelog: '智枢AI 桌面版 3.0.3\n\n- 修复桌面 UI 内部 LOGO 仍为旧版本的问题\n- 统一使用紫色科技风方案 B LOGO\n- 应用图标、安装包图标与 UI LOGO 保持一致',
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai_3.0.3_x64-setup.exe',
      forceUpdate: false,
      status: 'released',
      releasedAt: new Date(),
      channel: 'stable',
      sha256: SHA256,
      size: '3.5 MB',
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
