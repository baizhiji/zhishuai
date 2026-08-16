/* 查询 appVersion 表当前记录 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.appVersion
  .findMany({ orderBy: { createdAt: 'desc' } })
  .then((rows) => {
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  })
  .catch((e) => {
    console.error('ERR', e.message);
    process.exit(1);
  });
