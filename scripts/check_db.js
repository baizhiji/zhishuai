const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const u = await prisma.user.findUnique({ where: { phone: '13800000001' } });
  console.log('User:', JSON.stringify(u, null, 2));
  if (u && u.tenantId) {
    const t = await prisma.tenant.findUnique({ where: { id: u.tenantId } });
    console.log('Tenant:', JSON.stringify(t, null, 2));
  }
  await prisma.$disconnect();
})();
