#!/bin/bash
# Agent 代理后台全功能 API 测试脚本
# 测试日期：$(date '+%Y-%m-%d %H:%M:%S')

set -e
BASE_URL="https://baizhiji.net/api"

echo "=============================================="
echo "  Agent 代理后台 API 全功能测试"
echo "  测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

# Step 1: 登录获取 Token
echo ""
echo ">>> [1] 登录 (Agent 13900000099)"
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13900000099","password":"123456","role":"agent"}')

echo "Response: $(echo $LOGIN_RESP | head -c 500)"

TOKEN=$(echo $LOGIN_RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))" 2>/dev/null || echo "")
if [ -z "$TOKEN" ]; then
  echo "!!! 登录失败，无法获取 Token，退出测试！"
  exit 1
fi
echo "Token: ${TOKEN:0:20}..."

AUTH="Authorization: Bearer $TOKEN"

# Step 2: 获取当前用户信息
echo ""
echo ">>> [2] 获取 Agent 用户信息"
curl -s "$BASE_URL/auth/me" -H "$AUTH" | python3 -m json.tool 2>/dev/null | head -30

# Step 3: Dashboard 统计数据
echo ""
echo ">>> [3] Agent Dashboard 统计数据"
curl -s "$BASE_URL/agent/dashboard/stats" -H "$AUTH" | python3 -m json.tool 2>/dev/null | head -30

# Step 4: 客户列表
echo ""
echo ">>> [4] 客户列表 (分页)"
curl -s "$BASE_URL/agent/customers?page=1&pageSize=10" -H "$AUTH" | python3 -m json.tool 2>/dev/null | head -30

# Step 5: 客户详情 (如果有客户)
echo ""
echo ">>> [5] 尝试获取第一个客户ID..."
FIRST_CUSTOMER_ID=$(curl -s "$BASE_URL/agent/customers?page=1&pageSize=1" -H "$AUTH" | python3 -c "import sys,json; d=json.load(sys.stdin); ids=[c.get('id','') for c in d.get('data',{}).get('list',d.get('data',[]))]; print(ids[0] if ids else '')" 2>/dev/null)

if [ -n "$FIRST_CUSTOMER_ID" ]; then
  echo "客户ID: $FIRST_CUSTOMER_ID"
  echo ">>> [5a] 客户详情"
  curl -s "$BASE_URL/agent/customers/$FIRST_CUSTOMER_ID" -H "$AUTH" | python3 -m json.tool 2>/dev/null | head -30
  
  echo ""
  echo ">>> [5b] 客户用量统计"
  curl -s "$BASE_URL/agent/customers/$FIRST_CUSTOMER_ID/usage" -H "$AUTH" | python3 -m json.tool 2>/dev/null | head -30
else
  echo "暂无客户数据，跳过客户详情测试"
fi

# Step 6: 获客链接列表
echo ""
echo ">>> [6] 获客链接列表"
curl -s "$BASE_URL/agent/acquisition/links" -H "$AUTH" | python3 -m json.tool 2>/dev/null | head -30

# Step 7: API Key 列表
echo ""
echo ">>> [7] API Key 列表"
curl -s "$BASE_URL/agent/api-keys" -H "$AUTH" | python3 -m json.tool 2>/dev/null | head -30

# Step 8: 素材库列表
echo ""
echo ">>> [8] 素材库列表"
curl -s "$BASE_URL/agent/materials?page=1&pageSize=10" -H "$AUTH" | python3 -m json.tool 2>/dev/null | head -30

# Step 9: 分享列表
echo ""
echo ">>> [9] 分享列表"
curl -s "$BASE_URL/agent/shares?page=1&pageSize=10" -H "$AUTH" | python3 -m json.tool 2>/dev/null | head -30

# Step 10: 总体用量统计
echo ""
echo ">>> [10] 总体用量统计"
curl -s "$BASE_URL/agent/usage/overview" -H "$AUTH" | python3 -m json.tool 2>/dev/null | head -30

# Step 11: 明细用量
echo ""
echo ">>> [11] 明细用量列表"
curl -s "$BASE_URL/agent/usage/details?page=1&pageSize=10" -H "$AUTH" | python3 -m json.tool 2>/dev/null | head -30

# Step 12: 工单列表
echo ""
echo ">>> [12] 工单列表"
curl -s "$BASE_URL/agent/tickets?page=1&pageSize=10" -H "$AUTH" | python3 -m json.tool 2>/dev/null | head -30

# Step 13: 结算/收益
echo ""
echo ">>> [13] 结算/收益数据"
curl -s "$BASE_URL/agent/settlement/overview" -H "$AUTH" | python3 -m json.tool 2>/dev/null | head -30

# Step 14: 支持/帮助
echo ""
echo ">>> [14] 支持/帮助信息"
curl -s "$BASE_URL/agent/support" -H "$AUTH" | python3 -m json.tool 2>/dev/null | head -30

# Step 15: 版本信息
echo ""
echo ">>> [15] 版本信息"
curl -s "$BASE_URL/agent/version" -H "$AUTH" | python3 -m json.tool 2>/dev/null | head -30

echo ""
echo "=============================================="
echo "  Agent 代理后台 API 全功能测试完成！"
echo "=============================================="
