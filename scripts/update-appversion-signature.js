/* 更新 appVersion 表中 desktop 3.0.0 的 sha256 + signature（幂等） */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const SHA256 = '9fa85cf2d5066dff9042a58d9c5b938666123023a3bf94f83244928a762b30e3';
const SIGNATURE = `dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWTZvL0lSTWdRczMxODY3NFBzN1NKa3FRbFBTNjlQME92dE9ETzdaZ0dmdVpuY0hESHY4d05RcHpSZCs1QjNjcnYzalE3THA0cFRFRVJRWTQrbVpWbHZPU3BSRkRES0FNPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg2ODEzMzI2CWZpbGU6emhpc2h1YWktc2V0dXAtMy4wLjAtbmV3LmV4ZQo3V1BOM21qWTlFQmZVWTJIVXJKVWdoL2Q3ZFVrblJ0bkZ3NDRwQzdud1g4S0NSb21TQ2RmVk9TcCt0ZWZjby9yQmw4YjkxUDF1MUtOdlRZdGJ1eCtCQT09Cg==`;

async function main() {
  const updated = await p.appVersion.updateMany({
    where: { version: '3.0.0', platform: 'desktop', channel: 'stable' },
    data: { sha256: SHA256, signature: SIGNATURE },
  });
  console.log(`updated rows: ${updated.count}`);
  const rows = await p.appVersion.findMany({
    where: { version: '3.0.0', platform: 'desktop', channel: 'stable' },
  });
  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch((e) => {
    console.error('ERR', e.message);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
