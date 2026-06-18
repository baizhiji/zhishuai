#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""全面检查脚本 - 使用subprocess调用powershell"""
import subprocess, json

def ps(cmd):
    """Run PowerShell command"""
    r = subprocess.run(['powershell', '-Command', cmd], capture_output=True, timeout=30,
                       encoding='utf-8', errors='replace')
    return r.stdout.strip(), r.stderr.strip()

# Token from previous login
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3M2Q4YmY1Ni1iNTMxLTQxMWUtOWY4OC03MTVlODIxYWIzZjUiLCJyb2xlIjoiYWRtaW4iLCJzdGF0dXMiOiJhY3RpdmUiLCJpYXQiOjE3ODE3ODQ3MjUsImV4cCI6MTc4MjM4OTUyNX0.dBcco_1p063o0VA8nTql-7ULkYFejpLYk19R3JpcyaQ"

headers = f'@{{"Authorization"="Bearer {TOKEN}"}}'

print("=" * 70)
print("1. 登录入口测试")
print("=" * 70)

# Test different login entries
login_tests = [
    ("https://baizhiji.net/api/auth/login", "主站登录"),
]

for url, desc in login_tests:
    out, err = ps(f'Invoke-RestMethod -Uri "{url}" -Method POST -ContentType "application/json" -Body \'{{"phone":"18601655222","password":"20061218"}}\' | ConvertTo-Json -Depth 3')
    print(f"\n[{desc}] {url}")
    if out:
        print(out[:300])
    else:
        print(f"ERROR: {err[:100]}")

# Test customer login (different role)
print("\n--- 尝试终端客户登录 ---")
out, err = ps(f'Invoke-RestMethod -Uri "https://baizhiji.net/api/auth/login" -Method POST -ContentType "application/json" -Body \'{{"phone":"18601655222","password":"20061218"}}\' | ConvertTo-Json -Depth 3')
print(out[:300] if out else f"ERROR: {err[:100]}")

print("\n" + "=" * 70)
print("2. 页面访问测试")
print("=" * 70)

pages = [
    "https://baizhiji.net/",
    "https://baizhiji.net/login",
    "https://baizhiji.net/dashboard",
    "https://baizhiji.net/customers",
    "https://baizhiji.net/crm",
    "https://baizhiji.net/marketing",
    "https://baizhiji.net/materials",
    "https://baizhiji.net/ai",
    "https://baizhiji.net/recruitment",
    "https://baizhiji.net/data",
    "https://baizhiji.net/matrix-accounts",
    "https://baizhiji.net/acquisition",
    "https://baizhiji.net/accounts",
    "https://baizhiji.net/settings",
]

for url in pages:
    out, err = ps(f'(Invoke-WebRequest -Uri "{url}" -UseBasicParsing).StatusCode')
    path = url.replace("https://baizhiji.net", "")
    status = out if out else "ERR"
    # SPA should return 200 for all routes (client-side routing)
    print(f"  [{status}] {path}")

print("\n" + "=" * 70)
print("3. API端点认证测试")
print("=" * 70)

# Without token
print("\n--- 无Token(应返回401) ---")
auth_required = [
    "/api/auth/me",
    "/api/customers",
    "/api/materials",
    "/api/recruitment/jobs",
]
for path in auth_required:
    out, err = ps(f'try {{ (Invoke-WebRequest -Uri "https://baizhiji.net{path}" -UseBasicParsing).StatusCode }} catch {{ $_.Exception.Response.StatusCode.value__ }}')
    print(f"  [{out}] {path}")

# With token
print("\n--- 有Token(应返回200或404) ---")
api_endpoints = [
    "/api/auth/me",
    "/api/customers",
    "/api/crm/contacts",
    "/api/marketing/campaigns",
    "/api/materials",
    "/api/ai/templates",
    "/api/recruitment/jobs",
    "/api/data/reports",
    "/api/matrix-accounts",
    "/api/acquisition/channels",
    "/api/settings",
    "/api/users",
    "/api/accounts",
]

for path in api_endpoints:
    out, err = ps(f'try {{ $r = Invoke-WebRequest -Uri "https://baizhiji.net{path}" -Headers {headers} -UseBasicParsing; $r.StatusCode }} catch {{ if($_.Exception.Response) {{ $_.Exception.Response.StatusCode.value__ }} else {{ "ERR" }} }}')
    print(f"  [{out}] {path}")

print("\n" + "=" * 70)
print("4. 检查数据库用户(SSH)")
print("=" * 70)
out, err = ps(f'ssh root@150.109.60.130 "cd /www/wwwroot/baizhiji/server && node -e \"const {{PrismaClient}}=require(\'@prisma/client\');const p=new PrismaClient();p.user.findMany({{select:{{phone:true,name:true,role:true}}}}).then(r=>console.log(JSON.stringify(r))).catch(e=>console.error(e.message))\""')
if out:
    try:
        users = json.loads(out)
        for u in users:
            print(f"  {u.get('phone','?')} | {u.get('name','?')} | {u.get('role','?')}")
    except:
        print(out[:500])
else:
    print(f"SSH failed: {err[:200]}")

print("\n" + "=" * 70)
print("5. api.baizhiji.net DNS检查")
print("=" * 70)
out, err = ps(f'ssh root@150.109.60.130 "curl -sk https://api.baizhiji.net/api/health"')
print(f"Server-side API health: {out[:200] if out else f'Failed: {err[:100]}'}")

# Check DNS resolution
out2, err2 = ps(f'[System.Net.Dns]::GetHostAddresses("api.baizhiji.net") | Select -ExpandProperty IPAddressToString')
print(f"Local DNS: {out2 if out2 else f'Failed: {err2[:100]}'}")

print("\nDone!")
