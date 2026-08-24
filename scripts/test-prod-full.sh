#!/bin/bash
# 生产环境全功能实测脚本
BASE="http://127.0.0.1:3001"

echo "=== 1. 登录 (admin) ==="
LOGIN=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d '{"phone":"18601655222","password":"123456"}')
TOKEN=$(echo "$LOGIN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);console.log(j.data?.token||j.token||'')}catch(e){console.log('')}})")
echo "TOKEN len=${#TOKEN}"
AUTH="Authorization: Bearer $TOKEN"
CT="Content-Type: application/json"

echo; echo "=== 2. AI 对话 /api/ai-chat/chat ==="
curl -s -X POST $BASE/api/ai-chat/chat -H "$AUTH" -H "$CT" -d '{"messages":[{"role":"user","content":"你好"}],"stream":false}' | head -c 400
echo

echo; echo "=== 3. AI工具箱 /api/ai/generate (先查路径) ==="
curl -s -X GET $BASE/api/ai-chat/models -H "$AUTH" | head -c 300
echo

echo; echo "=== 4. 商业助手 /api/business/scenarios ==="
curl -s $BASE/api/business/scenarios -H "$AUTH" | head -c 300
echo

echo; echo "=== 5. API Key 列表 /api/api-providers ==="
curl -s $BASE/api/api-providers -H "$AUTH" | head -c 400
echo

echo; echo "=== 6. 数据总览 /api/statistics/overview ==="
curl -s $BASE/api/statistics/overview -H "$AUTH" | head -c 300
echo

echo; echo "=== 7. 内容中心 /api/materials ==="
curl -s "$BASE/api/materials?page=1&pageSize=5" -H "$AUTH" | head -c 300
echo

echo; echo "=== 8. 智能招聘 /api/recruitment/jobs ==="
curl -s "$BASE/api/recruitment/jobs?page=1&pageSize=3" -H "$AUTH" | head -c 300
echo

echo; echo "=== 9. 智能获客 /api/acquisition/leads ==="
curl -s "$BASE/api/acquisition/leads?page=1&pageSize=3" -H "$AUTH" | head -c 300
echo

echo; echo "=== 10. 推荐分享 /api/share/overview ==="
curl -s $BASE/api/share/overview -H "$AUTH" | head -c 300
echo

echo; echo "=== 11. 工单 /api/tickets ==="
curl -s "$BASE/api/tickets?page=1&pageSize=3" -H "$AUTH" | head -c 300
echo

echo; echo "=== 12. 通知 /api/notifications ==="
curl -s "$BASE/api/notifications?page=1&pageSize=3" -H "$AUTH" | head -c 300
echo
