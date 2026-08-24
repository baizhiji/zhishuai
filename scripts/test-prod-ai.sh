#!/bin/bash
# 生产环境 AI 功能实测脚本
BASE="http://127.0.0.1:3001"

echo "=== 1. 登录测试 (admin) ==="
LOGIN=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d '{"phone":"18601655222","password":"123456"}')
echo "$LOGIN" | head -c 300
echo
TOKEN=$(echo "$LOGIN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);console.log(j.data?.token||j.token||'')}catch(e){console.log('')}})")
if [ -z "$TOKEN" ]; then echo "LOGIN FAILED"; exit 1; fi
echo "TOKEN OK (len=${#TOKEN})"

echo
echo "=== 2. AI 对话测试 /api/ai-chat/chat ==="
curl -s -X POST $BASE/api/ai-chat/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"你好，请用一句话介绍你自己"}],"stream":false}' \
  | head -c 600
echo

echo
echo "=== 3. AI 工具箱测试 /api/ai/tools/generate ==="
curl -s -X POST $BASE/api/ai/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"type":"话术","topic":"产品推广","content":"帮我写一段产品推广话术"}' \
  | head -c 400
echo

echo
echo "=== 4. 商业助手方案生成测试 /api/business-assistant/generate ==="
curl -s -X POST $BASE/api/business-assistant/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"scenario":"business_diagnosis","companyName":"测试公司","industry":"电商","scale":"0-10人","painPoints":"获客难"}' \
  | head -c 400
echo

echo
echo "=== 5. AI创作工厂 /api/ai-factory/generate ==="
curl -s -X POST $BASE/api/ai-factory/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"type":"ARTICLE","prompt":"写一篇关于AI的300字短文"}' \
  | head -c 400
echo
