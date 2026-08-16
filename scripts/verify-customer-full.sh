#!/bin/bash
echo "=== Customer Terminal Full Verification ==="

# Use admin user to login as customer role (can test all customer APIs)
curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"18601655222","password":"123456","loginType":"user"}' > /tmp/login_resp.json

TOKEN=$(python3 -c "import json; d=json.load(open('/tmp/login_resp.json')); print(d.get('data',{}).get('token','') or d.get('token',''))")
echo "Login response saved, token: ${#TOKEN} chars"

if [ -z "$TOKEN" ]; then
  echo "ERROR: Could not extract token. Response:"
  cat /tmp/login_resp.json
  exit 1
fi

echo ""
echo "=== API Endpoints ==="
pass=0
fail=0
for ep in \
  /api/digital-human/avatars \
  /api/social/list \
  /api/business-lines \
  /api/enhancement/digital-human/avatars \
  /api/version/latest \
  /api/account/ \
  /api/announcements \
  /api/recruitment/jobs \
  /api/acquisition/tasks \
  /api/notifications \
  /api/tickets \
  /api/materials \
  /api/hotspot \
  /api/ai-enhanced/history \
  /api/dashboard-stats/business-lines \
  /api/dashboard-stats/customer-summary
do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3001${ep}" -H "Authorization: Bearer $TOKEN")
  if [ "$CODE" = "200" ]; then
    echo "  PASS $ep ($CODE)"
    pass=$((pass+1))
  else
    echo "  FAIL $ep ($CODE)"
    fail=$((fail+1))
  fi
done

echo ""
echo "=== Summary: Pass=$pass Fail=$fail Total=$((pass+fail)) ==="
