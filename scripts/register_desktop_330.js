/**
 * 一次性发布脚本：登记桌面版 3.3.0（archive 旧 released windows → insert 3.3.0）
 * 用法：node register_desktop_330.js（在服务器上执行，读取 server/.env 的 DATABASE_URL）
 */
const fs = require('fs');
const { createConnection } = require('mysql2/promise');

const envPath = '/var/www/zhishuai/server/.env';
const env = fs.readFileSync(envPath, 'utf8');
const m = env.match(/^DATABASE_URL=(.+)$/m);
if (!m) {
  console.error('FAIL: DATABASE_URL not found in ' + envPath);
  process.exit(1);
}
const raw = m[1].trim().replace(/^['"]|['"]$/g, '');
const u = new URL(raw);

const cfg = {
  host: u.hostname,
  port: Number(u.port || 3306),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, ''),
};

async function main() {
  let conn;
  try {
    conn = await createConnection(cfg);
  } catch (e) {
    console.log('plain connect failed (' + e.message + '), retry with SSL');
    conn = await createConnection({ ...cfg, ssl: { rejectUnauthorized: false } });
  }
  const [archived] = await conn.query(
    "UPDATE AppVersion SET status = 'archived' WHERE platform = 'windows' AND status = 'released'"
  );
  await conn.query(
    "INSERT INTO AppVersion (id, platform, version, buildNumber, status, forceUpdate, downloadUrl, changelog, channel, createdAt, updatedAt) VALUES (UUID(), 'windows', '3.3.0', 330, 'released', false, 'https://baizhiji.net/downloads/zhishuai_3.3.0_x64-setup.exe', '修复 AI 创作工厂生成完成但拿不到结果的问题：补齐流水线任务 output、智能剪辑本地合成回退、失败自动重试', 'stable', NOW(), NOW())"
  );
  const [rows] = await conn.query(
    "SELECT version, buildNumber, status, channel FROM AppVersion WHERE platform = 'windows' ORDER BY releasedAt DESC LIMIT 3"
  );
  await conn.end();
  console.log('OK: archived=' + JSON.stringify(archived));
  console.log('current windows rows: ' + JSON.stringify(rows));
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
