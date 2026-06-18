#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import subprocess, json, sys, os

os.environ['PYTHONIOENCODING'] = 'utf-8'

def run(cmd, timeout=15):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, timeout=timeout,
                          encoding='utf-8', errors='replace')
        return r.stdout.strip(), r.stderr.strip(), r.returncode
    except Exception as e:
        return "", str(e), -1

# 1. Login test
print("=== LOGIN TESTS ===")
login_url = "https://baizhiji.net/api/auth/login"
data = json.dumps({"phone": "18601655222", "password": "20061218"})
out, err, code = run(f'curl -sk -X POST "{login_url}" -H "Content-Type: application/json" -d \'{data}\'')
print(f"Main site login: {out[:200]}")

out2, err2, code2 = run(f'curl -sk -X POST "https://api.baizhiji.net/api/auth/login" -H "Content-Type: application/json" -d \'{data}\'')
print(f"API subdomain login: {out2[:200]}")

# Extract token
token = ""
try:
    result = json.loads(out)
    token = result.get('token') or result.get('data', {}).get('token', '')
except:
    pass
print(f"Token: {token[:40]}..." if token else "NO TOKEN!")

# 2. Check all API routes on server
print("\n=== SERVER API ROUTES ===")
out, err, _ = run('ssh root@150.109.60.130 "cd /www/wwwroot/baizhiji/server && cat src/routes/index.ts 2>/dev/null || cat src/app.ts 2>/dev/null | head -100"', timeout=20)
print(out[:1000] if out else f"Failed: {err[:200]}")

# 3. Check what routes exist
print("\n=== ROUTE FILES ===")
out, err, _ = run('ssh root@150.109.60.130 "ls -la /www/wwwroot/baizhiji/server/src/routes/"', timeout=15)
print(out if out else f"Failed: {err[:200]}")

# 4. Check frontend routes
print("\n=== FRONTEND ROUTES ===")
out, err, _ = run('ssh root@150.109.60.130 "ls -la /www/wwwroot/baizhiji/web/src/ 2>/dev/null; cat /www/wwwroot/baizhiji/web/src/App.tsx 2>/dev/null | head -80"', timeout=15)
print(out[:1500] if out else f"Failed: {err[:200]}")

# 5. Check API health on both domains
print("\n=== API HEALTH ===")
out, _, _ = run('curl -sk "https://baizhiji.net/api/health"')
print(f"Main: {out[:200]}")
out, _, _ = run('curl -sk "https://api.baizhiji.net/api/health"')
print(f"API sub: {out[:200]}")

# 6. Check PM2 status
print("\n=== PM2 STATUS ===")
out, _, _ = run('ssh root@150.109.60.130 "pm2 list"')
print(out if out else "Failed")

# 7. Check Nginx configs
print("\n=== NGINX CONFIGS ===")
out, _, _ = run('ssh root@150.109.60.130 "ls /etc/nginx/sites-enabled/ 2>/dev/null; ls /etc/nginx/conf.d/ 2>/dev/null"')
print(out if out else "Failed")

# 8. Test authenticated endpoints with token
if token:
    print("\n=== AUTHENTICATED API TESTS ===")
    endpoints = [
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
    ]
    for ep in endpoints:
        url = f"https://baizhiji.net{ep}"
        out, _, _ = run(f'curl -sk -o /dev/null -w "%{{http_code}}" -H "Authorization: Bearer {token}" "{url}"')
        print(f"  [{out}] {ep}")

print("\nDone!")
