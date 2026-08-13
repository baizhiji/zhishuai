#!/usr/bin/env python3
"""Fix agent user password and verify"""
import json, urllib.request, sys

BASE = "http://127.0.0.1:3001/api"

def post(path, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{BASE}{path}", data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode())

def get(path, token):
    headers = {"Authorization": f"Bearer {token}"}
    req = urllib.request.Request(f"{BASE}{path}", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode())

# Step 1: Login as admin
print("Step 1: Login as admin...")
resp = post("/auth/login", {"phone": "18601655222", "password": "123456", "loginType": "admin"})
if not resp.get("success"):
    print(f"  FAILED: {json.dumps(resp, ensure_ascii=False)[:200]}")
    sys.exit(1)
admin_token = resp["data"]["token"]
admin_id = resp["data"]["user"]["id"]
print(f"  OK: Admin {admin_id}")

# Step 2: Look for agent user
print("\nStep 2: Search for agent 13900000099...")
cust_resp = get("/agent/customers?keyword=13900000099&page=1&pageSize=10", admin_token)
print(f"  Customers search: success={cust_resp.get('success')}, total={cust_resp.get('data',{}).get('total', 0)}")

# Step 3: Try direct login as agent
print("\nStep 3: Agent login test...")
login_tests = [
    ("13900000099", "123456", "agent"),
    ("13900000099", "123456", "customer"),
]
for phone, pwd, lt in login_tests:
    resp = post("/auth/login", {"phone": phone, "password": pwd, "loginType": lt})
    ok = resp.get("success")
    print(f"  {phone} as {lt}: {'OK' if ok else 'FAILED'} - {json.dumps(resp, ensure_ascii=False)[:150]}")

print("\nDone!")
