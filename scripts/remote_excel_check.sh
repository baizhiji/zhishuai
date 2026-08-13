#!/bin/bash
cd /var/www/zhishuai/server
echo "=== package.json scripts ==="
node -e "console.log(JSON.stringify(require('./package.json').scripts))"
echo "=== pm2 api exec path ==="
pm2 prettylist zhishuai-api 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const arr=JSON.parse(d);if(arr.length){console.log(arr[0].pm2_env.pm_exec_path)}})"
echo "=== dist check ==="
if [ -f dist/index.js ]; then
  echo "dist-exists"
else
  echo "no-dist"
fi
grep -c exportXLSX dist/services/business-assistant.service.js 2>/dev/null || echo "no-exportXLSX-in-dist"
