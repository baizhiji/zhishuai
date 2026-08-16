#!/usr/bin/env python3
"""Test Customer APIs - customer role (13800000001) with JWT token.
在线网页版已下线，本脚本仅验证后端 API 与 CRUD 操作。"""
import requests
import sys
import io
import urllib3

urllib3.disable_warnings()
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "https://baizhiji.net"
CUSTOMER_LOGIN = {"phone": "13800000001", "password": "123456", "loginType": "user"}

# API endpoints as verified against backend routes
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
print("Customer Terminal Test - API + CRUD")
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

# Step 2: Test API endpoints with token
print(f"\n[2] Testing {len(API_ENDPOINTS)} API endpoints (with JWT token)...")
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

# Step 3: Test critical CRUD operations
print(f"\n[3] Testing Customer CRUD operations...")
crud_results = []

# 3a: Get materials
try:
    r = requests.get(f"{BASE_URL}/api/materials", headers=headers, verify=False)
    crud_results.append(("PASS" if r.status_code == 200 else "FAIL", "GET /api/materials", r.status_code, ""))
    print(f"  {'OK' if r.status_code == 200 else 'XX'} [{r.status_code}] GET /api/materials")
except Exception as e:
    crud_results.append(("ERR", "GET /api/materials", str(e)[:80], ""))
    print(f"  [!!] {e}")

# 3b: Get tickets
try:
    r = requests.get(f"{BASE_URL}/api/tickets/my", headers=headers, verify=False)
    crud_results.append(("PASS" if r.status_code == 200 else "FAIL", "GET /api/tickets/my", r.status_code, ""))
    print(f"  {'OK' if r.status_code == 200 else 'XX'} [{r.status_code}] GET /api/tickets/my")
except Exception as e:
    crud_results.append(("ERR", "GET /api/tickets/my", str(e)[:80], ""))
    print(f"  [!!] {e}")

# 3c: Create ticket
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

# Step 4: Summary
print("\n" + "=" * 70)
print("TEST SUMMARY")
print("=" * 70)

ap = sum(1 for r in api_results if r[0] == "PASS")
af = sum(1 for r in api_results if r[0] == "FAIL")

cp = sum(1 for r in crud_results if r[0] == "PASS")
cf = sum(1 for r in crud_results if r[0] == "FAIL")

total_p = ap + cp
total_f = af + cf
total_all = len(API_ENDPOINTS) + len(crud_results)

print(f"API Endpoints: {ap:2d} PASS / {af} FAIL  ({len(API_ENDPOINTS)} total)")
print(f"CRUD Ops:     {cp:2d} PASS / {cf} FAIL  ({len(crud_results)} total)")
print(f"Overall:   {total_p:2d} PASS / {total_f} FAIL  ({total_all} total)")
print(f"Pass Rate: {total_p/total_all*100:.1f}%")

# Failed details
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
