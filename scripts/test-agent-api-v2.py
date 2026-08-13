#!/usr/bin/env python3
"""Agent 代理后台全功能 API 测试 v2 - 使用 admin-as-agent 登录"""
import json, urllib.request, urllib.error, sys, os
from datetime import datetime

BASE_URL = "http://127.0.0.1:3001/api"

def api(method, path, data=None, token=None, timeout=10):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except:
            return e.code, {"raw": body}
    except Exception as e:
        return 0, {"error": str(e)}

def test(label, method, path, data=None, is_critical=True):
    code, result = api(method, path, data, TOKEN)
    success = result.get("success", code < 400)
    status = "PASS" if success else "FAIL"
    marker = "!!!" if (is_critical and not success) else "   "
    print(f"{marker} [{code}] {status} | {label}")
    if not success:
        err = result.get("error", {}).get("message", json.dumps(result, ensure_ascii=False))
        print(f"         Error: {err[:200]}")
    return success

def print_divider(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

# ── MAIN ──
print(f"Agent API Test - {datetime.now().isoformat()}")

# 1. Login as admin with agent targetRole
print("\n[0] Login (Admin -> Agent)")
code, data = api("POST", "/auth/login", {
    "phone": "18601655222",
    "password": "123456",
    "loginType": "agent"
})
if not data.get("success"):
    print(f"  FATAL: Login failed - {json.dumps(data, ensure_ascii=False)[:200]}")
    sys.exit(1)

TOKEN = data["data"]["token"]
user = data["data"]["user"]
print(f"  OK - User: {user['name']} ({user['phone']}), Role: {user.get('targetRole', user['role'])}")
print(f"  Token: {TOKEN[:30]}...")

results = {"pass": 0, "fail": 0}

def t(label, method, path, data=None, critical=True):
    ok = test(label, method, path, data, critical)
    if ok:
        results["pass"] += 1
    else:
        results["fail"] += 1
    return ok

# ── Dashboard ──
print_divider("1. Dashboard 仪表盘")
t("GET /agent/dashboard/stats", "GET", "/agent/dashboard/stats")

# ── Customers ──
print_divider("2. 客户管理")
t("GET /agent/customers (list)", "GET", "/agent/customers?page=1&pageSize=10")

# Get first customer for detail tests
code, cust_list = api("GET", "/agent/customers?page=1&pageSize=1")
customers = cust_list.get("data", {}).get("list", cust_list.get("data", []))
if customers:
    cid = customers[0].get("id", "")
    print(f"  Found customer: ID={cid}")
    t(f"GET /agent/customers/{cid} (detail)", "GET", f"/agent/customers/{cid}")
    t(f"GET /agent/customers/{cid}/usage", "GET", f"/agent/customers/{cid}/usage")

# Test customer creation
t("POST /agent/customers (create)", "POST", "/agent/customers", {
    "name": "Test Customer",
    "phone": "13811111111",
    "company": "Test Company"
}, critical=False)

# ── Usage ──
print_divider("3. 用量统计")
t("GET /agent/usage/overview", "GET", "/agent/usage/overview")
t("GET /agent/usage/details", "GET", "/agent/usage/details?page=1&pageSize=10")

# ── Tickets ──
print_divider("4. 工单支持")
t("GET /agent/tickets", "GET", "/agent/tickets?page=1&pageSize=10")

# ── Settlement ──
print_divider("5. 结算管理")
t("GET /agent/settlement/overview", "GET", "/agent/settlement/overview")

# ── API Keys ──
print_divider("6. API 密钥")
t("GET /agent/api-keys", "GET", "/agent/api-keys")

# ── Materials ──
print_divider("7. 素材库")
t("GET /agent/materials (list)", "GET", "/agent/materials?page=1&pageSize=10")

# ── Shares ──
print_divider("8. 分享管理")
t("GET /agent/shares", "GET", "/agent/shares?page=1&pageSize=10")

# ── Acquisition ──
print_divider("9. 获客管理")
t("GET /agent/acquisition/links", "GET", "/agent/acquisition/links")

# ── Version ──
print_divider("10. 版本信息")
t("GET /agent/version", "GET", "/agent/version")

# ── Social Accounts ──
print_divider("11. 社交媒体账号")
t("GET /agent/social-accounts", "GET", "/agent/social-accounts", critical=False)

# ── Summary ──
print_divider("测试总结")
total = results["pass"] + results["fail"]
print(f"  Total: {total} | PASS: {results['pass']} | FAIL: {results['fail']}")
print(f"  Rate: {results['pass']/total*100:.0f}%" if total > 0 else "  Rate: N/A")
print()
