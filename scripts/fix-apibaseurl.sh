#!/bin/bash
# 修复 API_BASE_URL：去掉多余的 /api 后缀，使上传文件 URL 与 nginx 静态路径一致
set -e
ENV_FILE=/var/www/zhishuai/server/.env
echo "--- before ---"
grep '^API_BASE_URL' "$ENV_FILE" || true
sudo cp "$ENV_FILE" "$ENV_FILE.bak.$(date +%s)"
sudo sed -i 's|^API_BASE_URL=.*|API_BASE_URL=https://api.baizhiji.net|' "$ENV_FILE"
echo "--- after ---"
grep '^API_BASE_URL' "$ENV_FILE"
# pm2 属于 ubuntu 用户，不能用 sudo 操作
pm2 restart zhishuai-api
sleep 4
curl -s -o /dev/null -w 'health=%{http_code}\n' --max-time 5 http://127.0.0.1:3001/health
