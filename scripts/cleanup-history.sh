#!/bin/bash
# 清理 history API 测试数据
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800000001","password":"123456","loginType":"user"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
curl -s -X DELETE http://127.0.0.1:3001/api/ai-enhanced/history/f6c0bdda-5f2b-41a1-a45d-62bbacbb47c3 \
  -H "Authorization: Bearer $TOKEN"
echo
echo "CLEANUP_DONE"
