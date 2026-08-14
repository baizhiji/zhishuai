/**
 * 将 web/out 静态产物复制到 desktop/frontend（Tauri frontendDist）
 * 用于本地开发与构建。
 */
import { existsSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const WEB_OUT = resolve(ROOT, '../web/out');
const TARGET = resolve(ROOT, 'frontend');

if (!existsSync(WEB_OUT)) {
  console.error('[copy-web-build] web/out 不存在。请先执行: npm run build:web');
  process.exit(1);
}

rmSync(TARGET, { recursive: true, force: true });
mkdirSync(TARGET, { recursive: true });
cpSync(WEB_OUT, TARGET, { recursive: true });

console.log(`[copy-web-build] 已复制 ${WEB_OUT} → ${TARGET}`);
