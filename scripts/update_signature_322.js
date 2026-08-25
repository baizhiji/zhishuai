const { PrismaClient } = require('/var/www/zhishuai/server/node_modules/@prisma/client');
const p = new PrismaClient();

const signature = `dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWTZvL0lSTWdRczNKVnB0WWJyOUZSWU5BNmg1UFZNVFdvb3pBSCtRVE1Bblp3NXZORCt6bmUvRkdhako2b0lJMEc0UHBpSTR3VFBZK0pnQngwYm5Yb3prYVNWSVJXelFVPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg3NjM5MzYzCWZpbGU6emhpc2h1YWlfMy4yLjJfeDY0LXNldHVwLmV4ZQptL3AzNTd1UEhvU2FRNTdJVXozbXY0UTdnV0pYbFJXOTZrZ3VwUmZ0RTVTdFVRdEJDdEhxS1lNWU9VYnFTQUlzQzhDV1R5MC9ON1M2cG9HM2hYVDlDQT09Cg==`;

async function main() {
  const rec = await p.appVersion.updateMany({
    where: { version: '3.2.2', platform: 'windows' },
    data: { signature },
  });
  console.log('UPDATED:' + rec.count);
  await p.$disconnect();
}

main().catch((e) => {
  console.error('ERR:' + e.message);
  process.exit(1);
});
