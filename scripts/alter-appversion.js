/* 修改 appVersion 表列类型：signature/changelog VARCHAR(191) → TEXT */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const tables = await p.$queryRawUnsafe(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE '%ersion%'"
  );
  console.log('version tables:', JSON.stringify(tables));

  const tableName = 'AppVersion';
  await p.$executeRawUnsafe(`ALTER TABLE \`${tableName}\` MODIFY COLUMN changelog TEXT NULL`);
  console.log('changelog -> TEXT OK');
  await p.$executeRawUnsafe(`ALTER TABLE \`${tableName}\` MODIFY COLUMN signature TEXT NULL`);
  console.log('signature -> TEXT OK');
  const cols = await p.$queryRawUnsafe(
    "SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME IN ('changelog','signature')",
    tableName
  );
  console.log(JSON.stringify(cols));
}

main()
  .catch((e) => {
    console.error('ERR', e.message);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
