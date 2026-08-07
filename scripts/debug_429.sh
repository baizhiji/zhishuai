#!/bin/bash
BASE="http://localhost:3001/api"
CUST='{"phone":"13800000001","password":"123456","loginType":"user"}'

sleep 10
TOKEN=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d "$CUST" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
echo "TOKEN OK"

# Test rate-limited endpoints
eps=("/materials/recent" "/ai-feedback" "/ai-feedback/my" "/scripts/list" "/business/list")
for ep in "${eps[@]}"; do
  resp=$(curl -s -w "\nHTTP:%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE$ep")
  code=$(echo "$resp" | grep -oP 'HTTP:\K\d+')
  body=$(echo "$resp" | head -c 300)
  echo "[$code] $ep -> ${body:0:200}"
  echo ""
  sleep 2
done
