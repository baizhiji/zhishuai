/**
 * 一次性发布脚本：登记桌面版 3.4.0（archive 旧 released windows → insert 3.4.0）
 * 用法：node register_desktop_340.js（在服务器上执行，读取 server/.env 的 DATABASE_URL）
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
    "INSERT INTO AppVersion (id, platform, version, buildNumber, status, forceUpdate, downloadUrl, changelog, channel, createdAt, updatedAt) VALUES (UUID(), 'windows', '3.4.0', 340, 'released', false, 'https://baizhiji.net/downloads/zhishuai_3.4.0_x64-setup.exe', '新增候选人库页面；评论获客全自动化（自动跟评任务）；招聘平台授权修复（boss直聘/猎聘/智联/51job）；数据总览显示真实数据（获客漏斗已确认/招聘新增候选人/在招职位）；新增平台管理入口引导', 'stable', NOW(), NOW())"
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
