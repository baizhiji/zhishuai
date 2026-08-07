#!/usr/bin/env python3
"""Test all Customer WEB pages and APIs - customer role (13800000001) with JWT token"""
import requests
import sys
import io
import urllib3

urllib3.disable_warnings()
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "https://baizhiji.net"
CUSTOMER_LOGIN = {"phone": "13800000001", "password": "123456", "loginType": "user"}

WEB_PAGES = [
    "/customer", "/customer/dashboard", "/customer/ai-factory",
    "/customer/ai-chat", "/customer/digital-human",
    "/customer/recruitment", "/customer/recruitment/publish",
    "/customer/recruitment/platforms", "/customer/recruitment/auto",
    "/customer/acquisition/board", "/customer/acquisition/discover",
    "/customer/acquisition/task",
    "/customer/share/board", "/customer/share/code", "/customer/share/track",
    "/customer/materials", "/customer/tickets", "/customer/support",
    "/customer/api-keys", "/customer/login-logs",
    "/customer/settings/security", "/customer/settings/app-download",
]

# Correct API endpoints as verified against backend routes
API_ENDPOINTS = [
    ("GET", "/api/auth/me", "User info"),
    ("GET", "/api/dashboard-stats/customer-summary", "Dashboard"),
    ("GET", "/api/acquisition/stats", "Acquisition stats"),
    ("GET", "/api/referral/stats", "Referral stats"),
    ("GET", "/api/features", "Features"),
    ("GET", "/api/tickets/my", "Tickets"),
    ("GET", "/api/materials", "Materials"),
    ("GET", "/api/version", "App version"),
]

# Step 1: Login to get JWT token
print("=" * 70)
print("Customer Terminal Full Test - WEB + API")
print("=" * 70)

print("\n[1] Login as customer (13800000001)...")
r = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER_LOGIN, verify=False)
data = r.json()
if r.status_code == 200 and data.get("success"):
    token = data["data"]["token"]
    user = data["data"]["user"]
    print(f"  OK Logged in: {user.get('name','?')} | role={user.get('role')} | phone={user.get('phone')}")
else:
    print(f"  FAIL: {r.status_code}")
    sys.exit(1)

headers = {"Authorization": f"Bearer {token}"}

# Step 2: Test web pages
print(f"\n[2] Testing {len(WEB_PAGES)} Customer pages...")
page_results = []
for i, page in enumerate(WEB_PAGES, 1):
    url = f"{BASE_URL}{page}"
    try:
        r = requests.get(url, headers=headers, timeout=15, allow_redirects=True, verify=False)
        s, clen = r.status_code, len(r.text or "")
        has_err = "Internal Server Error" in (r.text or "")
        if s == 200 and clen > 500 and not has_err:
            page_results.append(("PASS", page, s, clen))
            flag = "OK"
        elif s in (301,302,307,308):
            page_results.append(("REDIR", page, s, 0))
            flag = "->"
        else:
            page_results.append(("FAIL", page, s, clen))
            flag = "XX"
        print(f"  [{flag}] {s:3d} {page:45s} ({clen}B)")
    except Exception as e:
        page_results.append(("ERR", page, 0, str(e)[:80]))
        print(f"  [!!] ERR {page}: {e}")

# Step 3: Test API endpoints with token
print(f"\n[3] Testing {len(API_ENDPOINTS)} API endpoints (with JWT token)...")
api_results = []
for method, endpoint, desc in API_ENDPOINTS:
    url = f"{BASE_URL}{endpoint}"
    try:
        r = requests.get(url, headers=headers, timeout=10, verify=False)
        s = r.status_code
        body = r.text[:150]
        try:
            j = r.json()
            ok = s == 200 and j.get("success", True)
        except:
            ok = s == 200
        api_results.append(("PASS" if ok else "FAIL", endpoint, s, body))
        flag = "OK" if ok else "XX"
        print(f"  [{flag}] {s:3d} {method} {endpoint:45s} ({desc})")
        if not ok:
            print(f"         {body}")
    except Exception as e:
        api_results.append(("ERR", endpoint, str(e)[:80], ""))
        print(f"  [!!] ERR {method} {endpoint}: {e}")

# Step 4: Test critical CRUD operations
print(f"\n[4] Testing Customer CRUD operations...")
crud_results = []

# 4a: Get materials
try:
    r = requests.get(f"{BASE_URL}/api/materials", headers=headers, verify=False)
    crud_results.append(("PASS" if r.status_code == 200 else "FAIL", "GET /api/materials", r.status_code, ""))
    print(f"  {'OK' if r.status_code == 200 else 'XX'} [{r.status_code}] GET /api/materials")
except Exception as e:
    crud_results.append(("ERR", "GET /api/materials", str(e)[:80], ""))
    print(f"  [!!] {e}")

# 4b: Get tickets
try:
    r = requests.get(f"{BASE_URL}/api/tickets/my", headers=headers, verify=False)
    crud_results.append(("PASS" if r.status_code == 200 else "FAIL", "GET /api/tickets/my", r.status_code, ""))
    print(f"  {'OK' if r.status_code == 200 else 'XX'} [{r.status_code}] GET /api/tickets/my")
except Exception as e:
    crud_results.append(("ERR", "GET /api/tickets/my", str(e)[:80], ""))
    print(f"  [!!] {e}")

# 4c: Create ticket
try:
    r = requests.post(f"{BASE_URL}/api/tickets", headers=headers, json={
        "title": "Test ticket from auto-test",
        "description": "Automated test ticket"
    }, verify=False)
    crud_results.append(("PASS" if r.status_code in (200, 201) else "FAIL", "POST /api/tickets", r.status_code, ""))
    print(f"  {'OK' if r.status_code in (200,201) else 'XX'} [{r.status_code}] POST /api/tickets")
except Exception as e:
    crud_results.append(("ERR", "POST /api/tickets", str(e)[:80], ""))
    print(f"  [!!] {e}")

# Step 5: Summary
print("\n" + "=" * 70)
print("TEST SUMMARY")
print("=" * 70)

pp = sum(1 for r in page_results if r[0] == "PASS")
pr = sum(1 for r in page_results if r[0] == "REDIR")
pf = sum(1 for r in page_results if r[0] == "FAIL")
pe = sum(1 for r in page_results if r[0] == "ERR")

ap = sum(1 for r in api_results if r[0] == "PASS")
af = sum(1 for r in api_results if r[0] == "FAIL")

cp = sum(1 for r in crud_results if r[0] == "PASS")
cf = sum(1 for r in crud_results if r[0] == "FAIL")

total_p = pp + ap + cp
total_f = pf + af + cf
total_all = len(WEB_PAGES) + len(API_ENDPOINTS) + len(crud_results)

print(f"Web Pages:   {pp:2d} PASS / {pf} FAIL / {pr} REDIR / {pe} ERR  ({len(WEB_PAGES)} total)")
print(f"API Endpoints: {ap:2d} PASS / {af} FAIL  ({len(API_ENDPOINTS)} total)")
print(f"CRUD Ops:     {cp:2d} PASS / {cf} FAIL  ({len(crud_results)} total)")
print(f"Overall:   {total_p:2d} PASS / {total_f} FAIL  ({total_all} total)")
print(f"Pass Rate: {total_p/total_all*100:.1f}%")

# Failed details
if pf > 0:
    print("\n--- Failed Pages ---")
    for r in page_results:
        if r[0] == "FAIL":
            print(f"  {r[1]:50s} HTTP {r[2]} ({r[3]}B)")

if af > 0:
    print("\n--- Failed APIs ---")
    for r in api_results:
        if r[0] == "FAIL":
            print(f"  {r[1]:50s} HTTP {r[2]}")

if cf > 0:
    print("\n--- Failed CRUD ---")
    for r in crud_results:
        if r[0] == "FAIL":
            print(f"  {r[1]:50s} HTTP {r[2]}")

print("\n" + "=" * 70)
