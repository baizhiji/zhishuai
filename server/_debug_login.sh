#!/bin/bash
echo "=== 1. customer loginType=user ==="
curl -s -w '\nHTTP:%{http_code}\n' -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800000001","password":"123456","loginType":"user"}'
echo "=== 2. customer no loginType ==="
curl -s -w '\nHTTP:%{http_code}\n' -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800000001","password":"123456"}'
echo "=== 3. admin with loginType=user (对照) ==="
curl -s -w '\nHTTP:%{http_code}\n' -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"18601655222","password":"123456","loginType":"user"}'
echo "=== 4. verify-login.sh 当前远端内容客户行 ==="
grep -n "13800000001" /var/www/zhishuai/scripts/verify-login.sh
