#!/bin/bash
# 验证"代理商开通套餐"闭环 - 对名下客户 13899999999 查询订阅状态
BASE="http://127.0.0.1:3001"

login() {
  local phone=$1
  curl -s -X POST "$BASE/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"phone\":\"$phone\",\"password\":\"123456\",\"loginType\":\"user\"}" \
    | python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('token','') or '')"
}

ATOKEN=$(login 13900000099)
CTOKEN=$(login 13899999999)
if [ -z "$CTOKEN" ]; then
  echo "!! 13899999999 登录失败(密码可能非123456), 尝试获取其 id 直查"
  CID=$(curl -s "$BASE/api/agent/customers?page=1&pageSize=50" -H "Authorization: Bearer $ATOKEN" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); l=d.get('data',{}).get('list',[]); print(l[0]['id'] if l else '')")
  echo "客户 id: $CID"
  echo "== 客户详情(套餐字段) =="
  curl -s "$BASE/api/agent/customers/$CID" -H "Authorization: Bearer $ATOKEN"
  echo ""
  exit 0
fi

echo "== 开通后订阅状态(13899999999) =="
curl -s "$BASE/api/account/subscription" -H "Authorization: Bearer $CTOKEN"
echo ""

echo "== 代理商结算概览 =="
curl -s "$BASE/api/agent/settlement/overview" -H "Authorization: Bearer $ATOKEN"
echo ""
