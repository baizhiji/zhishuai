#!/bin/bash
# 验证招聘平台授权接口支持 bosszhipin / zhilian
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"18601655222","password":"20061218","loginType":"admin"}' \
  | grep -oE '"token":"[^"]+"' | head -1 | cut -d'"' -f4)
echo "token_len=${#TOKEN}"
echo "=== /api/social/platforms ==="
curl -s --max-time 8 -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3001/api/social/platforms
echo ""
echo "=== /api/social/session/create (bosszhipin) ==="
curl -s --max-time 10 -X POST http://127.0.0.1:3001/api/social/session/create \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"platform":"bosszhipin","userId":"test-admin"}'
echo ""
