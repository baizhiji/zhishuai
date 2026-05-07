// 测试数据库连接
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://myadmin:Hao-20061218@sh-postgres-jtrtrpfu.sql.tencentcdb.com:23406/postgres'
    }
  }
});

async function testConnection() {
  console.log('正在测试连接...');
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功！');
    
    // 测试查询
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('数据库版本:', result);
    
  } catch (error) {
    console.error('❌ 数据库连接失败:');
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
