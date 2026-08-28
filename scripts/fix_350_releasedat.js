/** 一次性修复：为 3.5.0 补写 releasedAt（避免排序/日期异常） */
const fs = require('fs');
const { createConnection } = require('mysql2/promise');

const envPath = '/var/www/zhishuai/server/.env';
const env = fs.readFileSync(envPath, 'utf8');
const m = env.match(/^DATABASE_URL=(.+)$/m);
const u = new URL(m[1].trim().replace(/^['"]|['"]$/g, ''));

async function main() {
  const conn = await createConnection({
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
  }).catch(() =>
    createConnection({
      host: u.hostname,
      port: Number(u.port || 3306),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
      ssl: { rejectUnauthorized: false },
    })
  );
  const [r] = await conn.query(
    "UPDATE AppVersion SET releasedAt = NOW() WHERE version = '3.5.0' AND platform = 'windows'"
  );
  console.log('UPDATED:', r.affectedRows);
  await conn.end();
}
main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
