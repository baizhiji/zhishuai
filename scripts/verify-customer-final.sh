#!/bin/bash
echo "=== Customer Terminal Final Verification ==="

# Login as customer
curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"18601655222","password":"123456","loginType":"user"}' > /tmp/login_resp.json

TOKEN=$(python3 -c "import json; d=json.load(open('/tmp/login_resp.json')); print(d.get('data',{}).get('token','') or d.get('token',''))")
echo "Login: ${#TOKEN} chars token"

pass=0
fail=0

echo ""
echo "=== Critical API Endpoints ==="
eps=(
  "/api/digital-human/avatars:NEW"
  "/api/social/list:NEW"
  "/api/hotspot/:NEW"
  "/api/ai-enhanced/history:NEW"
  "/api/enhancement/digital-human/avatars"
  "/api/version/latest"
  "/api/account/"
  "/api/announcements"
  "/api/recruitment/jobs"
  "/api/acquisition/tasks"
  "/api/notifications"
  "/api/tickets"
  "/api/materials"
  "/api/dashboard-stats/business-lines"
  "/api/dashboard-stats/customer-summary"
  "/api/business-lines:OPT"
  "/api/hot-topics:OPT"
  "/api/hotspot:OPT"
)

for entry in "${eps[@]}"; do
  ep="${entry%%:*}"
  tag="${entry##*:}"
  if [ "$ep" = "$tag" ]; then tag=""; fi
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3001${ep}" -H "Authorization: Bearer $TOKEN")
  if [ "$CODE" = "200" ]; then
    echo "  PASS $ep ($CODE) $tag"
    pass=$((pass+1))
  elif [ "$CODE" = "404" ] && [ "$tag" = "OPT" ]; then
    echo "  SKIP $ep ($CODE) - optional route"
  else
    echo "  FAIL $ep ($CODE) $tag"
    fail=$((fail+1))
  fi
done

echo ""
echo "=== Web Customer Pages ==="
for page in \
  /customer/dashboard \
  /customer/recruitment \
  /customer/acquisition/task \
  /customer/acquisition/discover \
  /customer/share/code \
  /customer/share/board \
  /customer/support \
  /customer/tickets \
  /customer/materials \
  /profile \
  /notifications
do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000${page}")
  if [ "$CODE" = "200" ] || [ "$CODE" = "307" ]; then
    echo "  PASS web${page} ($CODE)"
    pass=$((pass+1))
  else
    echo "  FAIL web${page} ($CODE)"
    fail=$((fail+1))
  fi
done

echo ""
echo "=== Final Summary: Pass=$pass Fail=$fail Total=$((pass+fail)) ==="
