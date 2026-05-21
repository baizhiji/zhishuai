/**
 * 数据库初始化脚本
 * 创建管理员账号
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function init() {
  const password = await bcrypt.hash('admin123', 10);
  
  console.log('开始初始化数据库...');

  // 创建管理员
  const admin = await prisma.user.upsert({
    where: { phone: '18601655222' },
    update: {},
    create: {
      phone: '18601655222',
      password: password,
      name: '管理员',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });
  console.log('✅ 管理员创建成功:', admin.phone);

  // 创建代理商
  const agent = await prisma.agent.upsert({
    where: { phone: '18601655222' },
    update: {},
    create: {
      phone: '18601655222',
      password: password,
      name: '代理商',
      status: 'ACTIVE'
    }
  });
  console.log('✅ 代理商创建成功:', agent.phone);

  console.log('\n初始化完成！');
  console.log('管理员账号: 18601655222');
  console.log('密码: admin123');
}

init()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
