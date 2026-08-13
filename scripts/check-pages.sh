#!/bin/bash
echo "=== Checking customer pages ==="
for d in customer/acquisition customer/share customer/profile customer/notifications customer recruitment support tickets materials dashboard; do
  if [ -f "/var/www/zhishuai/web/app/$d/page.tsx" ]; then
    echo "  OK: /$d (page.tsx exists)"
  else
    echo "  MISSING: /$d (no page.tsx)"
  fi
done
echo ""
echo "=== Direct testing using customer login cookie ==="
# Get session cookie
COOKIE=$(curl -s -c - -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"18601655222","password":"123456","loginType":"user"}' | grep -oP 'token=\K[^;]+' || echo "")
echo "Token: ${COOKIE:0:20}..."

for url in \
  http://localhost:3000/customer/acquisition \
  http://localhost:3000/customer/share \
  http://localhost:3000/profile \
  http://localhost:3000/notifications
do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "$url" -H "Authorization: Bearer $COOKIE")
  echo "  $CODE $url"
done
