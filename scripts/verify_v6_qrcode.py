#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V6 QR code display verification"""
import subprocess
import json
import sys
import os

os.environ['PYTHONIOENCODING'] = 'utf-8'

SSH = "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@43.136.237.150"

def run_ssh(cmd):
    full_cmd = f'{SSH} "{cmd}"'
    result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, timeout=30)
    return result.stdout.strip()

print("=" * 60)
print("V6 QR Code Display Verification")
print("=" * 60)

# 1. Check server logs
print("\n[1] Checking recent server logs...")
logs = run_ssh("cd /workspace/server && pm2 logs zhishuai --lines 20 --nostream 2>&1")
print(logs[:500])

# 2. Check V6 markers
print("\n[2] Checking browser-auth.service.js version...")
v6_count = run_ssh("grep -c 'V6' /workspace/server/dist/services/browser-auth.service.js")
pw_count = run_ssh("grep -c 'Playwright' /workspace/server/dist/services/browser-auth.service.js || echo 0")
iframe_count = run_ssh("grep -c 'iframeLoginUrl' /workspace/server/dist/services/browser-auth.service.js")
print(f"  V6 markers: {v6_count}")
print(f"  Playwright refs: {pw_count}")
print(f"  iframeLoginUrl refs: {iframe_count}")

# 3. Check oauth.js
print("\n[3] Checking oauth.js version...")
qr_method_count = run_ssh("grep -c 'qrMethod' /workspace/server/dist/routes/oauth.js")
iframe_count2 = run_ssh("grep -c 'iframeLoginUrl' /workspace/server/dist/routes/oauth.js")
confirm_count = run_ssh("grep -c 'confirm-session' /workspace/server/dist/routes/oauth.js")
print(f"  qrMethod refs: {qr_method_count}")
print(f"  iframeLoginUrl refs: {iframe_count2}")
print(f"  confirm-session refs: {confirm_count}")

# 4. Test API - platform list
print("\n[4] Testing API - platform list...")
resp = run_ssh("curl -s http://localhost:3000/api/oauth/platforms")
try:
    data = json.loads(resp)
    if data.get('success'):
        platforms = data.get('data', {}).get('platforms', [])
        print(f"  Platform count: {len(platforms)}")
        for p in platforms:
            name = p.get('name', 'N/A')
            method = p.get('qrMethod', 'N/A')
            url = p.get('iframeLoginUrl', '')
            print(f"  - {name}: qrMethod={method}, iframeUrl={url[:80]}")
    else:
        print(f"  API error: {json.dumps(data, ensure_ascii=False)[:200]}")
except Exception as e:
    print(f"  Parse error: {e}")
    print(f"  Raw: {resp[:200]}")

# 5. Test create session (douyin) - no auth token
print("\n[5] Test create session (douyin) - without JWT...")
resp = run_ssh("curl -s -X POST http://localhost:3000/api/oauth/sessions -H 'Content-Type: application/json' -d '{\"platform\": \"douyin\"}'")
try:
    data = json.loads(resp)
    print(f"  Response: {json.dumps(data, ensure_ascii=False)[:300]}")
    if data.get('success'):
        d = data.get('data', {})
        print(f"  sessionId: {d.get('sessionId', 'N/A')}")
        print(f"  qrMethod: {d.get('qrMethod', 'N/A')}")
        print(f"  iframeUrl: {d.get('iframeUrl', 'N/A')[:100]}")
    else:
        err = data.get('error', data.get('message', ''))
        print(f"  Error: {err}")
        if 'token' in str(err).lower() or 'auth' in str(err).lower():
            print("  (Expected - no JWT token in curl test)")
except Exception as e:
    print(f"  Parse error: {e}")
    print(f"  Raw: {resp[:200]}")

# 6. Test xiaohongshu
print("\n[6] Test create session (xiaohongshu)...")
resp = run_ssh("curl -s -X POST http://localhost:3000/api/oauth/sessions -H 'Content-Type: application/json' -d '{\"platform\": \"xiaohongshu\"}'")
try:
    data = json.loads(resp)
    print(f"  Response: {json.dumps(data, ensure_ascii=False)[:300]}")
except Exception as e:
    print(f"  Parse error: {e}")
    print(f"  Raw: {resp[:200]}")

# 7. Check frontend iframe code
print("\n[7] Checking frontend iframe code...")
iframe_in_frontend = run_ssh("grep -rl 'iframeUrl' /workspace/web/.next/static/chunks/ 2>/dev/null | head -3")
if iframe_in_frontend:
    print(f"  Frontend has iframe code: YES")
    print(f"  Files: {iframe_in_frontend[:200]}")
else:
    print(f"  Frontend has iframe code: NO (need rebuild?)")

# 8. PM2 status
print("\n[8] PM2 process status...")
pm2_status = run_ssh("pm2 jlist 2>&1 | python3 -c \"import sys,json; d=json.load(sys.stdin); [print(f'  {p[\"name\"]}: {p[\"pm2_env\"][\"status\"]}') for p in d]\" 2>&1 || pm2 list --nostream 2>&1")
print(pm2_status[:300])

print("\n" + "=" * 60)
print("Verification Complete")
print("=" * 60)
