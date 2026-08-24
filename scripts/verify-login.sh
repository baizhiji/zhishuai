#!/bin/bash
# 验证脚本 - 管理员登录 + 测试账号清理确认
# 商用模式：账号由管理员/代理商统一开通，仅保留 admin 账号
echo "=== 验证登录 ==="

# 管理员入口 (loginType=admin) - 应返回 200
echo -n "管理员入口(18601655222 admin): "
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"18601655222","password":"123456","loginType":"admin"}')
echo "$HTTP"
if [ "$HTTP" != "200" ]; then
  echo "ERROR: 管理员登录失败"
  exit 1
fi

# 测试代理商 (13900000099) - 已删除，应返回 401
echo -n "测试代理商(13900000099): "
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13900000099","password":"123456","loginType":"agent"}')
echo "$HTTP"

# 测试客户 (13800000001) - 已删除，应返回 401
echo -n "测试客户(13800000001):     "
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800000001","password":"123456","loginType":"user"}')
echo "$HTTP"

# 自助注册 - 生产环境应返回 403
echo -n "自助注册(register):         "
HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800138000","password":"123456","code":"123456"}')
echo "$HTTP"
if [ "$HTTP" != "403" ]; then
  echo "WARN: 自助注册未被禁用 (期望403)"
fi

echo "=== 验证完成 ==="
