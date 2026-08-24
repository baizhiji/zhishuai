#!/bin/bash
# 验证 admin 的 AI Key 配置状态
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"18601655222","password":"123456"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin).get("data",{}).get("token",""))')

echo "TOKEN_LEN:${#TOKEN}"

echo "=== GET /api/ai-config/keys ==="
curl -s http://127.0.0.1:3001/api/ai-config/keys -H "Authorization: Bearer $TOKEN" | head -c 800
echo

echo "=== GET /api/ai-chat/models ==="
curl -s http://127.0.0.1:3001/api/ai-chat/models -H "Authorization: Bearer $TOKEN" | head -c 1200
echo

echo "=== GET /api/admin/ai-provider-switches ==="
curl -s http://127.0.0.1:3001/api/admin/ai-provider-switches -H "Authorization: Bearer $TOKEN" | head -c 400
echo

echo "=== POST /api/ai-config/keys (测试写入接口) ==="
curl -s -X POST http://127.0.0.1:3001/api/ai-config/keys \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"provider":"tencent","apiKey":"test-invalid-key-for-verification","secretKey":"test-invalid-key-for-verification"}' | head -c 400
echo
