/* 更新 appVersion 表中 desktop 3.0.0 的 sha256 + signature（幂等） */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const SHA256 = '862cd077d69f735b568048460ffe1efafb3d5952539170fbc65124667d7c616f';
const SIGNATURE = `dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWTZvL0lSTWdRczJ5QTYrSm9DZUt1eFhZZDlpejhiMVl3RXMrU1I5MUY3RFBOWWhONkVVVWp6WUZBc1NLdW83R2pjY1RpeTU0NXFmcDkvRHI1NG1Rd2dmd3A1QVE1TEFZPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg2ODU5NTA2CWZpbGU6dG1wLXpoaXNodWFpLXNldHVwLmV4ZQpvSFN5SnFBOCtSc0h5aittbHI3V1A2R1hoTTZVZjg2RWZzb0RNYWRXWnd3MGI5aG56c1pwdlMrd0kyMWlxNk5IaE5XdzZTdEhPa2J4Nlp5Vmc0dURDQT09Cg==`;

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
