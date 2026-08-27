const { PrismaClient } = require('/var/www/zhishuai/server/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const existing = await p.appVersion.findFirst({
    where: { version: '1.2.2', platform: 'android' },
  });
  if (existing) {
    console.log('EXISTS', existing.id);
    return;
  }
  const r = await p.appVersion.create({
    data: {
      id: 'version_apk_122_' + Date.now(),
      version: '1.2.2',
      platform: 'android',
      buildNumber: 122,
      changelog:
        'AI创作工厂新增批量生成提示（手机端单次生成1条，批量生成请使用电脑端）；素材上传增加图片预览与旧类目筛选；修复客服二维码图片上传与展示；智能剪辑多素材合成优化。',
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai.apk',
      forceUpdate: false,
      status: 'released',
      channel: 'stable',
      sha256: '3bbd850ae699773ada7956bba0b36c6184ca78a3943b955410979e6443b0e9cb',
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
