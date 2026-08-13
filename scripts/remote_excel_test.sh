#!/bin/bash
BASE=http://127.0.0.1:3001
TOKEN=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d '{"phone":"13800000001","password":"123456","loginType":"user"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);console.log((j.data&&(j.data.token||j.data.accessToken))||j.token||'')}catch(e){console.log('')}})")
echo "token-len:${#TOKEN}"
PLAN_ID=$(curl -s $BASE/api/business-assistant/plans -H "Authorization: Bearer $TOKEN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);const list=(j.data&&j.data.list)||j.data||j.list||[];console.log(list.length?list[0].id:'')}catch(e){console.log('')}})")
echo "plan-id:$PLAN_ID"
if [ -z "$PLAN_ID" ]; then
  echo "NO-PLAN-FOUND"
  exit 1
fi
curl -s -o /tmp/plan.xlsx -w "http-code:%{http_code} type:%{content_type} size:%{size_download}\n" $BASE/api/business-assistant/export/xlsx/$PLAN_ID -H "Authorization: Bearer $TOKEN"
echo "magic:$(head -c 2 /tmp/plan.xlsx)"
