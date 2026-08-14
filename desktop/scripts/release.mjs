/**
 * 发布辅助脚本：构建 → 计算 SHA256 → 生成 tauri updater 更新清单（latest.json）
 *
 * 用法：
 *   node scripts/release.mjs --version 3.0.0 --bundle nsis --url https://api.zhishuai.example
 *
 * 产物：
 *   src-tauri/target/release/bundle/nsis/*-setup.exe
 *   dist/latest.json（需上传至 /api/version/desktop/latest.json 或托管静态目录）
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, '').split('='))
);
const version = args.version || '3.0.0';
const bundle = args.bundle || 'nsis';
const baseUrl = args.url || 'https://api.zhishuai.example';

// 1. 构建
console.log('[release] 构建桌面安装包...');
execSync(`npx tauri build --bundles ${bundle}`, { stdio: 'inherit', cwd: ROOT });

// 2. 定位安装包
const bundleDir = resolve(
  ROOT,
  'src-tauri/target/release/bundle',
  bundle === 'msi' ? 'msi' : 'nsis'
);
const candidates = bundle === 'msi'
  ? ['*.msi']
  : ['*-setup.exe', '*.exe'];
const { readdirSync } = await import('node:fs');
const allFiles = readdirSync(bundleDir);
const files = allFiles.filter((f) =>
  candidates.some((c) => {
    const re = new RegExp('^' + c.replace(/\*/g, '.*') + '$');
    return re.test(f);
  })
).filter((f) => !f.endsWith('.sig') && !f.endsWith('.blockmap'));

if (files.length === 0) {
  console.error('[release] 未找到安装包，请检查 tauri.conf.json 的 bundle.targets');
  process.exit(1);
}
const installer = resolve(bundleDir, files[0]);
const data = readFileSync(installer);
const sha256 = createHash('sha256').update(data).digest('hex');
const sizeMB = (data.length / 1024 / 1024).toFixed(1);

// 3. 读取签名（tauri 在 updater 启用时生成 <installer>.sig）
const installerBase = files[0].replace(/\.(exe|msi)$/i, '');
const sigName = allFiles.find(
  (f) => f === `${installerBase}.sig` || f === `${files[0]}.sig`
);
const signature = sigName
  ? readFileSync(resolve(bundleDir, sigName), 'utf-8').trim()
  : '';

// 4. 生成 latest.json（tauri updater v2 静态 JSON 端点：platforms 嵌套格式）
const manifest = {
  version,
  notes: `智枢AI 桌面版 ${version} 更新`,
  pub_date: new Date().toISOString(),
  platforms: {
    'windows-x86_64': {
      signature,
      url: `${baseUrl}/downloads/${files[0]}`,
    },
  },
};

const distDir = resolve(ROOT, 'dist');
mkdirSync(distDir, { recursive: true });
writeFileSync(
  resolve(distDir, 'latest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log(`[release] 安装包: ${installer}`);
console.log(`[release] SHA256: ${sha256}`);
console.log(`[release] 大小: ${sizeMB} MB`);
console.log(`[release] 签名: ${signature ? '已签名' : '未签名（需配置 TAURI_SIGNING_PRIVATE_KEY）'}`);
console.log(`[release] 更新清单: ${resolve(distDir, 'latest.json')}`);
