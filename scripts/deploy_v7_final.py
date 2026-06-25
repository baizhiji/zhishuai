#!/usr/bin/env python3
"""V7-final deployment script - popup window approach
Run this when the server is accessible again"""
import subprocess
import sys
import os

SERVER = "root@43.136.237.150"
REMOTE_BASE = "/workspace"

def run(cmd, timeout=60):
    print(f"  Running: {cmd[:60]}...")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
    if result.returncode != 0:
        print(f"  ERROR: {result.stderr[:100]}")
    else:
        print(f"  OK: {result.stdout[:100]}")
    return result.returncode == 0

def ssh(cmd):
    full = f'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 {SERVER} "{cmd}"'
    return run(full, timeout=30)

def scp(local, remote):
    full = f'scp -o StrictHostKeyChecking=no -o ConnectTimeout=15 {local} {SERVER}:{remote}'
    return run(full, timeout=60)

def scp_dir(local, remote):
    full = f'scp -r -o StrictHostKeyChecking=no -o ConnectTimeout=15 {local} {SERVER}:{remote}'
    return run(full, timeout=180)

print("=" * 50)
print("V7-Final Deployment: Popup Window Approach")
print("=" * 50)

# Step 1: Test connection
print("\n[1] Testing SSH connection...")
if not ssh("echo 'connection ok'"):
    print("  Server not accessible. Try again later.")
    print("  You can also deploy manually with:")
    print(f"    scp server/dist/services/browser-auth.service.js {SERVER}:{REMOTE_BASE}/server/dist/services/")
    print(f"    scp server/dist/routes/oauth.js {SERVER}:{REMOTE_BASE}/server/dist/routes/")
    print(f"    scp -r web/.next {SERVER}:{REMOTE_BASE}/web/")
    print(f"    ssh {SERVER} 'cd {REMOTE_BASE}/server && pm2 restart zhishuai'")
    sys.exit(1)

# Step 2: Upload backend files
print("\n[2] Uploading backend files...")
scp(
    "c:/Users/Administrator/zhishuai/server/dist/services/browser-auth.service.js",
    f"{REMOTE_BASE}/server/dist/services/browser-auth.service.js"
)
scp(
    "c:/Users/Administrator/zhishuai/server/dist/routes/oauth.js",
    f"{REMOTE_BASE}/server/dist/routes/oauth.js"
)

# Step 3: Upload frontend
print("\n[3] Uploading frontend build...")
scp_dir("c:/Users/Administrator/zhishuai/web/.next", f"{REMOTE_BASE}/web/.next")

# Step 4: Restart server
print("\n[4] Restarting server...")
ssh(f"cd {REMOTE_BASE}/server && pm2 restart zhishuai && sleep 3 && pm2 list")

# Step 5: Verify
print("\n[5] Verifying V7 deployment...")
ssh(f"grep -c 'V7' {REMOTE_BASE}/server/dist/services/browser-auth.service.js")
ssh(f"grep -c 'Playwright' {REMOTE_BASE}/server/dist/services/browser-auth.service.js || echo 0")
ssh(f"grep -c 'popupUrl' {REMOTE_BASE}/server/dist/routes/oauth.js")
ssh("curl -s http://localhost:3000/api/oauth/platforms | head -200")

print("\n" + "=" * 50)
print("V7 Deployment Complete!")
print("=" * 50)
