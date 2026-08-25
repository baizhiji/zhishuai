// 幂等插入桌面端 3.2.6 发布记录（拷贝到服务器 server 目录执行：node insert-appversion-3.2.6.js）
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VERSION = '3.2.6';
const SIGNATURE =
  'dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWTZvL0lSTWdRc3luTi9uUjNMMXNranFRMTVpbUdxMTZrbUtXTFpoWS9qQmVvODBGVjRHUHU5OFpjcHJyblNyRkRySnZ6em1GWmNwb0s1Y2lPL1hlOGlnY05uUEJlaUFNPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg3NjY5MTE5CWZpbGU6emhpc2h1YWlfMy4yLjZfeDY0LXNldHVwLmV4ZQp3VENMUVk2UlB2dGxyL2NtbGF6U3JMalA5MjlwQm0rZEZ1RVA3cVlpNzdkUnpVQUxDSiswU2ZmNkVHdHVVY1hZektxT1k2Q2wvZVhQNExRTWdIN0tEdz09Cg==';

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
      buildNumber: 326,
      status: 'released',
      channel: 'stable',
      sha256: '581102cc2a7c0c3da63220e29a23c69b11a38abe27fd7f901a13f8321c86e3a1',
      size: '3.5 MB',
      signature: SIGNATURE,
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai_3.2.6_x64-setup.exe',
      forceUpdate: false,
      releasedAt: new Date(),
      changelog:
        '智枢AI 桌面版 3.2.6：全面修复前端 API 响应格式不匹配问题——工单列表/详情、员工管理、推荐分享、通知、登录日志、数字人、AI创作、招聘、Token用量统计等页面与后端统一后的 {success,data} 响应格式对齐，修复多页面列表读取为空、详情打不开、统计数据不显示等问题。',
    },
  });
  console.log(`[insert] AppVersion ${VERSION} created (buildNumber 326)`);
}

main()
  .catch((e) => {
    console.error('[insert] error:', e);
    process.exit(1);
  })
  .finally(() => prisma['$disconnect']());
