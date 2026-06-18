const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  const hash = bcrypt.hashSync('123456', 10);
  console.log('Generated hash:', hash);
  
  const result = await prisma.user.update({
    where: { phone: '18601655222' },
    data: { password: hash }
  });
  
  console.log('Updated user:', JSON.stringify(result));
  await prisma.$disconnect();
}

main().catch(console.error);
