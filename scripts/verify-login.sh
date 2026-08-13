#!/bin/bash
# 验证脚本 - 三种角色登录
echo "=== 验证登录 ==="

# 管理员入口 (loginType=admin)
echo -n "管理员入口(18601655222 admin): "
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"18601655222","password":"123456","loginType":"admin"}')
echo "$HTTP"

# 代理商入口 (loginType=agent)
echo -n "代理商入口(13900000099 agent): "
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13900000099","password":"123456","loginType":"agent"}')
echo "$HTTP"

# 客户入口 (loginType=user)
echo -n "客户入口(13800000001 user):   "
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800000001","password":"123456","loginType":"user"}')
echo "$HTTP"

echo "=== 验证完成 ==="
