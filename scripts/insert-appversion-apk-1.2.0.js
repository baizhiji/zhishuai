const { PrismaClient } = require('/var/www/zhishuai/server/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const existing = await p.appVersion.findFirst({
    where: { version: '1.2.0', platform: 'android' },
  });
  if (existing) {
    console.log('EXISTS', existing.id);
    return;
  }
  const r = await p.appVersion.create({
    data: {
      id: 'version_apk_120_' + Date.now(),
      version: '1.2.0',
      platform: 'android',
      buildNumber: 120,
      changelog:
        'AI 创作工厂补全：视频生成真实成片、智能剪辑合成、配音、图片降级链路、数字人字段对齐、横幅视觉样式选择器；默认图片尺寸升级 2048x2048；修改密码功能；其他体验优化。',
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai.apk',
      forceUpdate: false,
      status: 'released',
      channel: 'stable',
      sha256: 'fc8c3a2c9b9bd675db7a273b17eecd727ffc61b9da49a93d776d171eb319f7dd',
      size: '70.1 MB',
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
  .finally(() => p['$disconnect']());
