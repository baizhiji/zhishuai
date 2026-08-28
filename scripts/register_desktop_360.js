/**
 * 发布脚本：登记桌面版 3.6.0
 * 自动从 /var/www/zhishuai/downloads 读取安装包计算 SHA256 + 读取 .sig 签名，
 * archive 旧 released windows → insert 3.6.0。
 * 用法：node register_desktop_360.js（在服务器上执行，读取 server/.env 的 DATABASE_URL）
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createConnection } = require('mysql2/promise');

const VERSION = '3.6.0';
const BUILD_NUMBER = 360;
const DOWNLOADS_DIR = '/var/www/zhishuai/downloads';
const EXE_NAME = `zhishuai_${VERSION}_x64-setup.exe`;
const SIG_NAME = `${EXE_NAME}.sig`;
const CHANGELOG =
  '修复AI创作工厂图片生成超时问题：图片生成超时由30秒提升至5分钟，彻底解决「生成完成但未获得结果」问题；同步提升服务端nginx代理超时，大图/复杂图片生成不再被中断';

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function main() {
  const exePath = path.join(DOWNLOADS_DIR, EXE_NAME);
  const sigPath = path.join(DOWNLOADS_DIR, SIG_NAME);
  if (!fs.existsSync(exePath)) {
    console.error(`FAIL: 安装包不存在 ${exePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(sigPath)) {
    console.error(`FAIL: 签名文件不存在 ${sigPath}`);
    process.exit(1);
  }
  const sha256 = sha256File(exePath);
  const signature = fs.readFileSync(sigPath, 'utf8').trim();
  const sizeMb = (fs.statSync(exePath).size / 1024 / 1024).toFixed(1);

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
    "INSERT INTO AppVersion (id, platform, version, buildNumber, status, forceUpdate, downloadUrl, changelog, channel, sha256, size, signature, createdAt, updatedAt) VALUES (UUID(), 'windows', ?, ?, 'released', false, ?, ?, 'stable', ?, ?, ?, NOW(), NOW())",
    [VERSION, BUILD_NUMBER, `https://baizhiji.net/downloads/${EXE_NAME}`, CHANGELOG, sha256, `${sizeMb} MB`, signature]
  );
  const [rows] = await conn.query(
    "SELECT version, buildNumber, status, channel FROM AppVersion WHERE platform = 'windows' ORDER BY releasedAt DESC LIMIT 3"
  );
  await conn.end();
  console.log('OK: archived=' + JSON.stringify(archived));
  console.log('sha256=' + sha256);
  console.log('signature len=' + signature.length);
  console.log('current windows rows: ' + JSON.stringify(rows));
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
