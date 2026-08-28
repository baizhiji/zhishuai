/**
 * 一次性修复：补 3.6.0 的 releasedAt（INSERT 时未指定，排序落后导致 latest.json 取不到）
 * 用法：NODE_PATH=/var/www/zhishuai/server/node_modules node fix_360_releasedat.js（在服务器上执行）
 */
const fs = require('fs');
const { createConnection } = require('mysql2/promise');

async function main() {
  const env = fs.readFileSync('/var/www/zhishuai/server/.env', 'utf8');
  const m = env.match(/^DATABASE_URL=(.+)$/m);
  const raw = m[1].trim().replace(/^['"]|['"]$/g, '');
  const u = new URL(raw);
  const cfg = {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
  };
  let conn;
  try {
    conn = await createConnection(cfg);
  } catch (e) {
    conn = await createConnection({ ...cfg, ssl: { rejectUnauthorized: false } });
  }
  await conn.query(
    "UPDATE AppVersion SET releasedAt=NOW() WHERE version='3.6.0' AND platform='windows'"
  );
  const [rows] = await conn.query(
    "SELECT version, buildNumber, status, channel, releasedAt FROM AppVersion WHERE platform = 'windows' ORDER BY releasedAt DESC LIMIT 3"
  );
  await conn.end();
  console.log('current windows rows: ' + JSON.stringify(rows));
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
