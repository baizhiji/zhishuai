// 重置指定客户账号密码为 123456（在 server 目录执行：node reset-customer-passwords.js）
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const PHONES = ['13166262006', '13162360667'];
const PLAIN_PASSWORD = '123456';

async function main() {
  const prisma = new PrismaClient();
  try {
    const hashed = await bcrypt.hash(PLAIN_PASSWORD, 10);
    for (const phone of PHONES) {
      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        console.log(`[skip] ${phone} not found`);
        continue;
      }
      await prisma.user.update({
        where: { phone },
        data: { password: hashed },
      });
      console.log(`[reset] ${phone} password -> ${PLAIN_PASSWORD}`);
    }
  } catch (e) {
    console.error('[error]', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
