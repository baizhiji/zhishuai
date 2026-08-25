const { PrismaClient } = require('/var/www/zhishuai/server/node_modules/@prisma/client');
const p = new PrismaClient();
p.appVersion.findMany({ orderBy: { releasedAt: 'desc' } })
  .then((rows) => {
    rows.forEach((x) => {
      console.log(JSON.stringify({
        id: x.id,
        version: x.version,
        platform: x.platform,
        buildNumber: x.buildNumber,
        status: x.status,
        size: x.size,
        downloadUrl: x.downloadUrl,
        releasedAt: x.releasedAt,
        createdAt: x.createdAt,
      }));
    });
    console.log('TOTAL:' + rows.length);
    return p.$disconnect();
  })
  .catch((e) => {
    console.error('ERR:' + e.message);
    process.exit(1);
  });
