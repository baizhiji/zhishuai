const { PrismaClient } = require('/var/www/zhishuai/server/node_modules/@prisma/client');
const p = new PrismaClient();
p.user.findMany({ orderBy: { createdAt: 'asc' } })
  .then((u) => {
    u.forEach((x) => {
      console.log(JSON.stringify({
        phone: x.phone,
        role: x.role,
        name: x.name,
        status: x.status,
        createdAt: x.createdAt,
        lastLoginAt: x.lastLoginAt,
        fee: String(x.fee),
        totalPaid: String(x.totalPaid),
      }));
    });
    console.log('TOTAL:' + u.length);
    return p.$disconnect();
  })
  .catch((e) => {
    console.error('ERR:' + e.message);
    process.exit(1);
  });
