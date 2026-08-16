/**
 * 将 desktop-ui/out 静态产物复制到 desktop/frontend（Tauri frontendDist）
 * 用于本地开发与构建。
 */
import { existsSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DESKTOP_UI_OUT = resolve(ROOT, '../desktop-ui/out');
const TARGET = resolve(ROOT, 'frontend');

if (!existsSync(DESKTOP_UI_OUT)) {
  console.error('[copy-desktop-ui-build] desktop-ui/out 不存在。请先执行: npm run build:desktop-ui');
  process.exit(1);
}

rmSync(TARGET, { recursive: true, force: true });
mkdirSync(TARGET, { recursive: true });
cpSync(DESKTOP_UI_OUT, TARGET, { recursive: true });

console.log(`[copy-desktop-ui-build] 已复制 ${DESKTOP_UI_OUT} → ${TARGET}`);
