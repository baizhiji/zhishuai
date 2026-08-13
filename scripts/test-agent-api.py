#!/usr/bin/env python3
"""Agent 代理后台全功能API测试"""
import json, urllib.request, urllib.error, sys, os

BASE_URL = "http://127.0.0.1:3001/api"
AGENT_PHONE = "13900000099"
AGENT_PASSWORD = "123456"

def api(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def p(label, resp):
    code, data = resp
    print(f"  [{code}] {label}")
    if code < 400:
        print(f"    {json.dumps(data, ensure_ascii=False, indent=2)[:400]}")
    else:
        print(f"    ERROR: {json.dumps(data, ensure_ascii=False)[:400]}")

print("=" * 60)
print("  Agent 代理后台 API 全功能测试")
print(f"  时间: {__import__('datetime').datetime.now()}")
print("=" * 60)

# 1. Login
print("\n[1] 登录")
code, data = api("POST", "/auth/login", {"phone": AGENT_PHONE, "password": AGENT_PASSWORD, "loginType": "agent"})
print(f"  [{code}] Login: {'OK' if data.get('success') else 'FAILED'}")
if not data.get("success"):
    print(f"    Error: {json.dumps(data, ensure_ascii=False)}")
    sys.exit(1)
token = data.get("data", {}).get("token", "")
print(f"  Token: {token[:20]}...")

# 2. User Info
print("\n[2] 获取用户信息")
p("me", api("GET", "/auth/me", token=token))

# 3. Dashboard Stats
print("\n[3] Dashboard 统计")
p("stats", api("GET", "/agent/dashboard/stats", token=token))

# 4. Customers List
print("\n[4] 客户列表")
p("customers", api("GET", "/agent/customers?page=1&pageSize=10", token=token))

# 5. Usage Overview
print("\n[5] 总体用量")
p("usage", api("GET", "/agent/usage/overview", token=token))

# 6. Usage Details
print("\n[6] 用量明细")
p("usage details", api("GET", "/agent/usage/details?page=1&pageSize=10", token=token))

# 7. Tickets
print("\n[7] 工单列表")
p("tickets", api("GET", "/agent/tickets?page=1&pageSize=10", token=token))

# 8. Settlement
print("\n[8] 结算数据")
p("settlement", api("GET", "/agent/settlement/overview", token=token))

# 9. API Keys
print("\n[9] API Key 列表")
p("apikeys", api("GET", "/agent/api-keys", token=token))

# 10. Materials
print("\n[10] 素材库")
p("materials", api("GET", "/agent/materials?page=1&pageSize=10", token=token))

# 11. Shares
print("\n[11] 分享列表")
p("shares", api("GET", "/agent/shares?page=1&pageSize=10", token=token))

# 12. Acquisition Links
print("\n[12] 获客链接")
p("acquisition", api("GET", "/agent/acquisition/links", token=token))

# 13. Customer Detail (if any)
print("\n[13] 客户详情")
code, cust_data = api("GET", "/agent/customers?page=1&pageSize=1", token=token)
cust_list = cust_data.get("data", {}).get("list", cust_data.get("data", []))
if cust_list:
    cid = cust_list[0].get("id")
    p(f"customer/{cid}", api("GET", f"/agent/customers/{cid}", token=token))
    p(f"customer/{cid}/usage", api("GET", f"/agent/customers/{cid}/usage", token=token))

# 14. Support
print("\n[14] 支持信息")
p("support", api("GET", "/agent/support", token=token))

# 15. Version
print("\n[15] 版本信息")
p("version", api("GET", "/agent/version", token=token))

print("\n" + "=" * 60)
print("  Agent 代理后台 API 全功能测试完成！")
print("=" * 60)
