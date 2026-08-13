import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({
    where: { phone: { in: ['18601655222', '13900000099', '13800000001'] } },
    select: { id: true, phone: true, role: true, status: true, name: true },
  });
  console.log(JSON.stringify(users, null, 2));
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
