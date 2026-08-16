#!/bin/bash
# 智枢AI 部署验证脚本
# 验证三种角色登录 + 关键API端点健康检查

set -e

API_URL="${API_URL:-http://localhost:3001}"
WEB_URL="${WEB_URL:-http://localhost}"
PASS=0
FAIL=0

check() {
    local desc="$1"
    local url="$2"
    local expected="${3:-200}"
    local method="${4:-GET}"
    local data="${5:-}"

    if [ "$method" = "POST" ]; then
        code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data" 2>/dev/null || echo "000")
    else
        code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    fi

    if [ "$code" = "$expected" ]; then
        echo "  [PASS] $desc (HTTP $code)"
        PASS=$((PASS + 1))
    else
        echo "  [FAIL] $desc (expected $expected, got $code)"
        FAIL=$((FAIL + 1))
    fi
}

echo "=================================="
echo "智枢AI 部署验证"
echo "API:  $API_URL"
echo "Landing (已下线提示页):  $WEB_URL"
echo "=================================="

echo ""
echo "[1/4] 健康检查"
check "API Health"     "$API_URL/health"
check "API Ready"      "$API_URL/ready"
check "Landing Page"   "$WEB_URL"

echo ""
echo "[2/4] 登录验证 (三种角色)"

# 管理员登录
ADMIN_RESP=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"phone":"18601655222","password":"123456"}' 2>/dev/null)
ADMIN_CODE=$(echo "$ADMIN_RESP" | grep -o '"success":true' | head -1)
if [ -n "$ADMIN_CODE" ]; then
    echo "  [PASS] 管理员登录 (18601655222)"
    PASS=$((PASS + 1))
    ADMIN_TOKEN=$(echo "$ADMIN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo "  [FAIL] 管理员登录"
    FAIL=$((FAIL + 1))
fi

# 代理商登录
AGENT_RESP=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"phone":"13900000099","password":"123456"}' 2>/dev/null)
AGENT_CODE=$(echo "$AGENT_RESP" | grep -o '"success":true' | head -1)
if [ -n "$AGENT_CODE" ]; then
    echo "  [PASS] 代理商登录 (13900000099)"
    PASS=$((PASS + 1))
else
    echo "  [FAIL] 代理商登录"
    FAIL=$((FAIL + 1))
fi

# 客户登录
CLIENT_RESP=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"phone":"13800000001","password":"123456"}' 2>/dev/null)
CLIENT_CODE=$(echo "$CLIENT_RESP" | grep -o '"success":true' | head -1)
if [ -n "$CLIENT_CODE" ]; then
    echo "  [PASS] 客户登录 (13800000001)"
    PASS=$((PASS + 1))
else
    echo "  [FAIL] 客户登录"
    FAIL=$((FAIL + 1))
fi

echo ""
echo "[3/4] 关键API端点"
if [ -n "$ADMIN_TOKEN" ]; then
    check "管理员信息"    "$API_URL/api/v1/auth/me" "200" "GET" "" "-H 'Authorization: Bearer $ADMIN_TOKEN'"
    check "仪表盘数据"    "$API_URL/api/v1/admin/dashboard" "200" "GET" "" "-H 'Authorization: Bearer $ADMIN_TOKEN'"
fi

echo ""
echo "[4/4] 安全头检查"
check "Landing Headers" "$WEB_URL" "200" "GET" "" "-I"
SEC_HEADERS=$(curl -s -I "$WEB_URL" 2>/dev/null | grep -iE "x-frame-options|x-content-type-options|x-xss-protection|strict-transport-security" | wc -l)
if [ "$SEC_HEADERS" -ge 2 ]; then
    echo "  [PASS] 安全响应头 ($SEC_HEADERS headers found)"
    PASS=$((PASS + 1))
else
    echo "  [WARN] 安全响应头不足 (only $SEC_HEADERS found)"
fi

echo ""
echo "=================================="
echo "结果: $PASS 通过 / $FAIL 失败"
echo "=================================="

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
