#!/bin/bash
# 验证脚本 - admin账号三种入口登录
echo "=== 验证登录 ==="

# 管理员入口 (loginType=admin)
echo -n "管理员入口(18601655222->admin): "
RESP=$(curl -s -w ' HTTP:%{http_code}' -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"18601655222","password":"123456","loginType":"admin"}')
HTTP=$(echo "$RESP" | grep -oP 'HTTP:\K\d+')
echo "$HTTP"

# 代理商入口 (loginType=agent)
echo -n "代理商入口(18601655222->agent): "
RESP=$(curl -s -w ' HTTP:%{http_code}' -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"18601655222","password":"123456","loginType":"agent"}')
HTTP=$(echo "$RESP" | grep -oP 'HTTP:\K\d+')
echo "$HTTP"

# 客户入口 (loginType=user)
echo -n "客户入口(18601655222->user):  "
RESP=$(curl -s -w ' HTTP:%{http_code}' -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"18601655222","password":"123456","loginType":"user"}')
HTTP=$(echo "$RESP" | grep -oP 'HTTP:\K\d+')
echo "$HTTP"

echo "=== 验证完成 ==="
