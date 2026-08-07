#!/bin/bash
# 测试智能招聘 API 端点
API="http://localhost:3001/api/v1"

echo "=== Step 1: 登录获取 token ==="
LOGIN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"18601655222","password":"123456"}')
echo "Login response: $LOGIN"

TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))")
if [ -z "$TOKEN" ]; then
  echo "ERROR: Login failed, cannot get token"
  exit 1
fi
echo "Token obtained: ${TOKEN:0:20}..."

# Step 2: 获取岗位列表
echo ""
echo "=== Step 2: 获取岗位列表 ==="
curl -s -H "Authorization: Bearer $TOKEN" "$API/recruitment/posts" | python3 -m json.tool 2>/dev/null || curl -s -H "Authorization: Bearer $TOKEN" "$API/recruitment/posts"
echo ""

# Step 3: 获取统计
echo ""
echo "=== Step 3: 获取招聘统计 ==="
curl -s -H "Authorization: Bearer $TOKEN" "$API/recruitment/stats" | python3 -m json.tool 2>/dev/null || curl -s -H "Authorization: Bearer $TOKEN" "$API/recruitment/stats"
echo ""

# Step 4: 创建岗位
echo ""
echo "=== Step 4: 创建测试岗位 ==="
NEW_JOB=$(curl -s -X POST "$API/recruitment/jobs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"前端开发工程师","department":"技术部","location":"北京","salaryMin":15,"salaryMax":30,"experience":"3-5年","education":"本科","description":"负责前端页面开发","requirements":"熟悉React/Next.js"}')
echo "$NEW_JOB" | python3 -m json.tool 2>/dev/null || echo "$NEW_JOB"

JOB_ID=$(echo "$NEW_JOB" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null)
echo "Created job ID: $JOB_ID"

# Step 5: AI匹配候选人
if [ -n "$JOB_ID" ]; then
  echo ""
  echo "=== Step 5: AI匹配候选人 ==="
  curl -s -X POST "$API/recruitment/jobs/$JOB_ID/match" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}' | python3 -m json.tool 2>/dev/null || echo "Match result raw above"
  echo ""

  # Step 6: 获取候选人列表
  echo ""
  echo "=== Step 6: 获取候选人列表 ==="
  curl -s -H "Authorization: Bearer $TOKEN" "$API/recruitment/candidates" | python3 -m json.tool 2>/dev/null || curl -s -H "Authorization: Bearer $TOKEN" "$API/recruitment/candidates"
  echo ""

  # Step 7: 获取面试列表
  echo ""
  echo "=== Step 7: 获取面试列表 ==="
  curl -s -H "Authorization: Bearer $TOKEN" "$API/recruitment/interviews" | python3 -m json.tool 2>/dev/null || curl -s -H "Authorization: Bearer $TOKEN" "$API/recruitment/interviews"
  echo ""

  # Step 8: 再次获取岗位列表
  echo ""
  echo "=== Step 8: 确认岗位列表（含 candidateCount） ==="
  curl -s -H "Authorization: Bearer $TOKEN" "$API/recruitment/posts" | python3 -m json.tool 2>/dev/null || curl -s -H "Authorization: Bearer $TOKEN" "$API/recruitment/posts"
  echo ""
fi

echo ""
echo "=== 测试完成 ==="
