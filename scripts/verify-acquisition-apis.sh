#!/bin/bash
# 验证智能获客新 API 链路（4平台 + 跟评中心）
BASE="http://127.0.0.1:3001"

login() {
  local phone=$1
  curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
    -d "{\"phone\":\"$phone\",\"password\":\"123456\",\"loginType\":\"user\"}" \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);console.log((j.data&&j.data.token)||j.token||"")}catch(e){console.log("")}})'
}

uid() {
  local phone=$1
  curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
    -d "{\"phone\":\"$phone\",\"password\":\"123456\",\"loginType\":\"user\"}" \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const u=(j.data&&j.data.user)||j.user||{};console.log(u.id||"")}catch(e){console.log("")}})'
}

TOKEN=$(login 13800000001)
ID=$(uid 13800000001)
echo "TOKEN_LEN=${#TOKEN} USER_ID=$ID"

echo "== GET /api/social/platforms =="
curl -s "$BASE/api/social/platforms" -H "Authorization: Bearer $TOKEN" -H "x-user-id: $ID"
echo ""

echo "== GET /api/comment-delivery/limits =="
curl -s "$BASE/api/comment-delivery/limits" -H "Authorization: Bearer $TOKEN" -H "x-user-id: $ID"
echo ""

echo "== GET /api/comment-delivery/quota?platform=douyin =="
curl -s "$BASE/api/comment-delivery/quota?platform=douyin" -H "Authorization: Bearer $TOKEN" -H "x-user-id: $ID"
echo ""

echo "== GET /api/comment-delivery/risk?platform=douyin =="
curl -s "$BASE/api/comment-delivery/risk?platform=douyin" -H "Authorization: Bearer $TOKEN" -H "x-user-id: $ID"
echo ""

echo "== POST /api/comment-delivery/preview-script =="
curl -s -X POST "$BASE/api/comment-delivery/preview-script" -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" -H "x-user-id: $ID" \
  -d '{"platform":"douyin","topic":"智能获客 4 平台跟评"}'
echo ""
