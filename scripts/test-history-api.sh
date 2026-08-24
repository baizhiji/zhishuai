#!/bin/bash
# 部署验证：登录 + history API POST/GET 闭环
set -e
echo "=== 登录验证 ==="
bash /var/www/zhishuai/scripts/verify-login.sh

echo "=== history API 测试 ==="
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800000001","password":"123456","loginType":"user"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

echo "POST /history:"
curl -s -X POST http://127.0.0.1:3001/api/ai-enhanced/history \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"feature":"ai-factory","category":"xiaohongshu","title":"部署验证","content":"测试历史记录-部署验证","source":"web"}'
echo
echo "GET /history:"
curl -s "http://127.0.0.1:3001/api/ai-enhanced/history?page=1&pageSize=5" \
  -H "Authorization: Bearer $TOKEN"
echo
echo "=== 完成 ==="
