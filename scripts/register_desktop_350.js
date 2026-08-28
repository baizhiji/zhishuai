/**
 * 一次性发布脚本：登记桌面版 3.5.0（archive 旧 released windows → insert 3.5.0）
 * 用法：node register_desktop_350.js（在服务器上执行，读取 server/.env 的 DATABASE_URL）
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

const SIGNATURE =
  'dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWTZvL0lSTWdRczV3YTI4cDUzSi9hWEhWN3VKSnNJdFMyakd6ZGdsMlV6SW5xQUdZYStKYi8rSjVoQmpjMFcrZ2ZMcUJIenJQQUhpUllWR2NqVi9yN0FSaFQ2Rys0WlFvPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg3ODkzNTI2CWZpbGU65pm65p6iQUlfMy41LjBfeDY0LXNldHVwLmV4ZQpyTDBtWEZMZHFjRVJUWllBcElqRHhpV3dXaUd1QVNXQWhobjIyMlZBTmRIVjFZcEl4Q2p3Z1lvVmg1TWdTUWZVUGN2M2paRThqblJCVk05MGtQZENDQT09Cg==';
const SHA256 =
  '5a136f867cacc722418b48506dad27a703bb0e870aa25a12ee231ed6c877e04e';
const CHANGELOG =
  '修复AI创作工厂全部生成功能：API Key改为后端代理，彻底解决「已配置却报未配置」问题；文本/图片/多阶段流水线统一从服务器读取Key并自动择优降级；视频/数字人/TTS Key自动同步';

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
    "INSERT INTO AppVersion (id, platform, version, buildNumber, status, forceUpdate, downloadUrl, changelog, channel, sha256, size, signature, createdAt, updatedAt) VALUES (UUID(), 'windows', '3.5.0', 350, 'released', false, 'https://baizhiji.net/downloads/zhishuai_3.5.0_x64-setup.exe', '" +
      CHANGELOG +
      "', 'stable', '" +
      SHA256 +
      "', '3.5 MB', '" +
      SIGNATURE +
      "', NOW(), NOW())"
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
