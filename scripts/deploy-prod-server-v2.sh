#!/bin/bash
# 部署 server v2：multer 2.2.0 + uuid overrides + materials 图片白名单
set -e
cd /var/www/zhishuai/server || exit 1

echo "=== 备份旧 dist ==="
[ -d dist.bak_v1 ] || cp -r dist dist.bak_v1
echo "备份完成: dist.bak_v1"

echo "=== 切换 dist ==="
rm -rf dist
mv dist.v2 dist
ls dist/index.js && echo "dist 切换完成"

echo "=== 安装依赖（应用 overrides）==="
npm install --no-audit --no-fund 2>&1 | tail -5

echo "=== 校验关键依赖版本 ==="
node -e '
const m = require("./node_modules/multer/package.json");
console.log("multer:", m.version);
try {
  const u = require("./node_modules/uuid/package.json");
  console.log("uuid(top):", u.version);
} catch(e) { console.log("uuid(top): N/A"); }
try {
  const u = require("./node_modules/exceljs/node_modules/uuid/package.json");
  console.log("uuid(exceljs):", u.version, "(应为 hoisted 或 11.x)");
} catch(e) { console.log("uuid(exceljs): hoisted to top"); }
'
