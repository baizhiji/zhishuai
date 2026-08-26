const { PrismaClient } = require('/var/www/zhishuai/server/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const existing = await p.appVersion.findFirst({
    where: { version: '1.2.1', platform: 'android' },
  });
  if (existing) {
    console.log('EXISTS', existing.id);
    return;
  }
  const r = await p.appVersion.create({
    data: {
      id: 'version_apk_121_' + Date.now(),
      version: '1.2.1',
      platform: 'android',
      buildNumber: 121,
      changelog:
        '修复 AI 创作工厂结果展示：配图与视频成片可直接查看播放；智能剪辑支持多段素材合成成片。',
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai.apk',
      forceUpdate: false,
      status: 'released',
      channel: 'stable',
      sha256: '13299a02fb2d0ca44486bd8c1b62c3ad9148875a6b0cdef4e63d0d35e0339b69',
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
