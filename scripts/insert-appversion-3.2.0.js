// 幂等插入桌面端 3.2.0 发布记录（在服务器 server 目录执行）
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VERSION = '3.2.0';
const SIGNATURE =
  'ZFc1MGNuVnpkR1ZrSUdOdmJXMWxiblE2SUhOcFoyNWhkSFZ5WlNCbWNtOXRJSFJoZFhKcElITmxZM0psZENCclpYa0tVbFZVV1RadkwwbFNUV2RSY3k4dlVXSnlhVGhCVDJoNlQxYzRkVGRLYUVZMmJrMXdObEV6YjBGWlNuTnNiVFExYVZKdFZscFNRVFJQY3psNFR5dFNkbGQxUzFCUWRuUmFTV3RZY1hWVWJqTkdRazgyTkhrM1drOTRPVlk1UlRkdU5uZFpQUXAwY25WemRHVmtJR052YlcxbGJuUTZJSFJwYldWemRHRnRjRG94TnpnM05UZzFPRGt3Q1dacGJHVTZlbWhwYzJoMVlXbGZNeTR5TGpCZmVEWTBMWE5sZEhWd0xtVjRaUW96WjFCNlNXRjJVamxWUlNzclRHZ3dMekowVWpCRE1uSmFNSEpXU25sWldFdFZaV3hKVkVjeVExQkhXa3hHYTJ0emVHZFdla2xNTUZKQ1RsSjVNRTVGTlRkak56VXdRekJpUjI1UU1IVlpTazVvVEVORVFUMDlDZz09';

async function main() {
  const exists = await prisma.appVersion.findFirst({
    where: { platform: 'desktop', version: VERSION },
  });
  if (exists) {
    console.log(`[insert] AppVersion ${VERSION} already exists, skip`);
    return;
  }
  await prisma.appVersion.create({
    data: {
      version: VERSION,
      platform: 'desktop',
      buildNumber: 320,
      status: 'released',
      channel: 'stable',
      sha256: '0A4C26CD2060593947DF8A0BBF90B122A3EA23BFF862C1DD8E1681B5C33DBB2B',
      size: '3.6 MB',
      signature: SIGNATURE,
      downloadUrl: 'https://baizhiji.net/downloads/zhishuai_3.2.0_x64-setup.exe',
      forceUpdate: false,
      releasedAt: new Date(),
      changelog:
        '智枢AI 桌面版 3.2.0：AI 创作工厂补全（视频生成真实成片、AI 剪辑合成、配音、图片降级链路、数字人字段对齐）；API Key 管理页补全（新增/删除/测试连通）；素材中心改造（视频素材下载）；其他体验修正。',
    },
  });
  console.log(`[insert] AppVersion ${VERSION} created (buildNumber 320)`);
}

main()
  .catch((e) => {
    console.error('[insert] error:', e);
    process.exit(1);
  })
  .finally(() => prisma['$disconnect']());
