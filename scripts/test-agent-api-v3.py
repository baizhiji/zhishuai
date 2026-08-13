#!/usr/bin/env python3
"""Agent API Full Test v3 - Corrected route paths"""
import json, urllib.request, urllib.error, sys
from datetime import datetime

BASE = "http://127.0.0.1:3001/api"

def api(method, path, data=None, token=None, timeout=10):
    url = f"{BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except:
            return e.code, {"raw": e.read().decode()[:200]}
    except Exception as e:
        return 0, {"error": str(e)}

def test(label, method, path, data=None, critical=True):
    code, result = api(method, path, data, TOKEN)
    success = result.get("success", code < 400)
    status = "PASS" if success else "FAIL"
    marker = "!!!" if (critical and not success) else "   "
    print(f"{marker} [{code}] {status} | {label}")
    if not success:
        err = result.get("error", {}).get("message", result.get("message", str(result)[:200]))
        print(f"         Error: {err[:200]}")
    return success

# ── Login ──
print(f"Agent API Test v3 - {datetime.now().isoformat()}")
print(f"\n[0] Login (Agent 13900000099)")

code, data = api("POST", "/auth/login", {
    "phone": "13900000099",
    "password": "123456",
    "loginType": "agent"
})
if not data.get("success"):
    print(f"  FATAL: {json.dumps(data, ensure_ascii=False)[:300]}")
    sys.exit(1)
TOKEN = data["data"]["token"]
user = data["data"]["user"]
print(f"  OK - {user.get('name','?')} ({user.get('phone','?')}), role={user.get('role','?')}")

PASS, FAIL = 0, 0
def t(label, method, path, data=None, critical=True):
    global PASS, FAIL
    ok = test(label, method, path, data, critical)
    if ok: PASS += 1
    else: FAIL += 1
    return ok

# ── All Agent API tests with correct route paths ──

print("\n── Dashboard ──")
t("GET /agent/statistics", "GET", "/agent/statistics")

print("\n── Customers ──")
t("GET /agent/customers", "GET", "/agent/customers?page=1&pageSize=10")
# Get first customer for detail
code, cust = api("GET", "/agent/customers?page=1&pageSize=1")
cid_list = cust.get("data", {}).get("list", cust.get("data", []))
if cid_list:
    cid = cid_list[0].get("id", "")
    t(f"GET /agent/customers/{cid}", "GET", f"/agent/customers/{cid}")
t("POST /agent/customers (create)", "POST", "/agent/customers", {
    "name": "API测试客户", "phone": "13899999999", "company": "TestCorp"
}, critical=False)

print("\n── AI Factory ──")
t("GET /agent/ai-factory", "GET", "/agent/ai-factory", critical=False)

print("\n── Usage ──")
t("GET /agent/usage (overview)", "GET", "/agent/usage")

print("\n── API Keys ──")
t("GET /agent/api-keys", "GET", "/agent/api-keys")
t("POST /agent/api-keys", "POST", "/agent/api-keys", {
    "name": "TestKey", "customers": []
}, critical=False)

print("\n── Materials ──")
t("GET /agent/materials", "GET", "/agent/materials?page=1&pageSize=10")
t("POST /agent/materials", "POST", "/agent/materials", {
    "name": "TestMaterial", "type": "text", "content": "test"
}, critical=False)

print("\n── Shares ──")
t("GET /share (prefix)", "GET", "/share?page=1&pageSize=10", critical=False)

print("\n── Acquisition ──")
t("GET /acquisition (prefix)", "GET", "/acquisition?page=1&pageSize=10", critical=False)

print("\n── Tickets ──")
t("GET /tickets (prefix)", "GET", "/tickets?page=1&pageSize=10", critical=False)

print("\n── Settlement ──")
t("GET /agent/settlement/overview", "GET", "/agent/settlement/overview", critical=False)

print("\n── Version ──")
t("GET /version (prefix)", "GET", "/version", critical=False)

# ── Summary ──
total = PASS + FAIL
print(f"\n{'='*60}")
print(f"  TOTAL: {total} | PASS: {PASS} | FAIL: {FAIL} | RATE: {PASS/total*100:.0f}%" if total else f"  No tests run")
print(f"{'='*60}")
