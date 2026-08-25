// 幂等插入桌面端 3.2.4 发布记录（在服务器 server 目录执行：node /tmp/insert-appversion-3.2.4.js）
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VERSION = '3.2.4';
const SIGNATURE =
  'dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWTZvL0lSTWdRc3dBZGtoaUVQVVY4TVVYMUlwVXdvUml2NERHTXFmK2o0VDRobVRIOWE4RDY3UlZTaDdxSEM0QUV1Skc3WGdvM3l1eUtpOUREWGpyQi90c0pmV2dBR1F3PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg3NjQ0ODY1CWZpbGU6emhpc2h1YWlfMy4yLjRfeDY0LXNldHVwLmV4ZQpadnVVTktnTE5TbFlyYnN2eWRNZE9qcy84MFRWN0JhQ1NTRkdMN1hjVFh0WGNxRFRNZ1RPZlJtU1NEZEQzN2xmMHhpbkY0WUN1RHRrMmtNdjFYazJEQT09Cg==';

async function main() {
  const exists = await prisma.appVersion.findFirst({
    where: { platform: 'desktop', version: VERSION },
  });
  if (exists) {
    console.log(`[insert] AppVersion ${VERSION} already exists, skip`);
    return;
  }

  // 归档旧桌面端 released 记录（避免管理页多版本 released 混淆）
  const archived = await prisma.appVersion.updateMany({
    where: { platform: { in: ['desktop', 'windows'] }, status: 'released' },
    data: { status: 'archived' },
  });
  console.log(`[insert] archived ${archived.count} old desktop/windows released record(s)`);

  await prisma.appVersion.create({
    data: {
      version: VERSION,
      platform: 'desktop',
      buildNumber: 324,
      status: 'released',
      channel: 'stable',
      sha256: 'b5e307da8316fdd31fa58b7a601de6906c14049f42cef798159b41fb3ffc42f2',
      size: '3.5 MB',
      signature: SIGNATURE,
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai_3.2.4_x64-setup.exe',
      forceUpdate: false,
      releasedAt: new Date(),
      changelog:
        '智枢AI 桌面版 3.2.4：修复代理商端"开通客户"点击后无反馈的问题——点击"开通"后按钮显示提交中状态；若请求超时或网络异常，会自动刷新客户列表（账号可能已在服务端创建成功），无需切换页面即可看到新账号。同时包含客服中心企业微信二维码上传修复。',
    },
  });
  console.log(`[insert] AppVersion ${VERSION} created (buildNumber 324)`);
}

main()
  .catch((e) => {
    console.error('[insert] error:', e);
    process.exit(1);
  })
  .finally(() => prisma['$disconnect']());
