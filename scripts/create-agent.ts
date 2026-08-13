import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function genUUID(): string {
  return crypto.randomUUID();
}

async function main() {
  const phone = '13900000099';
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user exists
  let user = await prisma.user.findUnique({ where: { phone } });
  
  if (user) {
    console.log(`User ${phone} exists (id=${user.id}, role=${user.role}), updating...`);
    user = await prisma.user.update({
      where: { phone },
      data: { 
        password: hashedPassword,
        role: 'agent',
        name: '测试代理商',
        status: 'active',
      }
    });
  } else {
    console.log(`Creating agent user ${phone}...`);
    user = await prisma.user.create({
      data: {
        id: genUUID(),
        phone,
        password: hashedPassword,
        role: 'agent',
        name: '测试代理商',
        status: 'active',
        updatedAt: new Date(),
      }
    });
  }
  console.log(`User: id=${user.id}, role=${user.role}, status=${user.status}`);

  // Create Agent record if not exists
  let agent = await prisma.agent.findUnique({ where: { userId: user.id } });
  if (!agent) {
    console.log('Creating Agent record...');
    agent = await prisma.agent.create({
      data: {
        id: genUUID(),
        userId: user.id,
        name: '测试代理商',
        level: 'district',
        status: 'active',
        agentType: 'commission',
        commissionRate: 0.30,
        updatedAt: new Date(),
      }
    });
    console.log(`Agent created: id=${agent.id}, userId=${agent.userId}`);
  } else {
    console.log(`Agent exists: id=${agent.id}`);
  }

  console.log('Done!');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('FAILED:', e);
  process.exit(1);
});
