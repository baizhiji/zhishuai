#!/usr/bin/env python3
"""V7 deployment - API direct QR + popup approach"""
import subprocess
import base64
import os
import sys

SERVER = "root@43.136.237.150"
REMOTE_BASE = "/workspace"

def run_cmd(cmd, timeout=30):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
    return result.stdout.strip(), result.stderr.strip(), result.returncode

def ssh_cmd(cmd):
    full = f'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 {SERVER} "{cmd}"'
    return run_cmd(full, timeout=30)

def scp_file(local, remote):
    full = f'scp -o StrictHostKeyChecking=no -o ConnectTimeout=15 {local} {SERVER}:{remote}'
    return run_cmd(full, timeout=60)

def scp_dir(local, remote):
    full = f'scp -r -o StrictHostKeyChecking=no -o ConnectTimeout=15 {local} {SERVER}:{remote}'
    return run_cmd(full, timeout=120)

print("=" * 50)
print("V7 Deployment: API QR + Popup")
print("=" * 50)

# Step 1: Upload server backend files
print("\n[1] Uploading server backend files...")
out, err, rc = scp_file(
    "c:/Users/Administrator/zhishuai/server/dist/services/browser-auth.service.js",
    f"{REMOTE_BASE}/server/dist/services/browser-auth.service.js"
)
print(f"  browser-auth.service.js: rc={rc}")

out, err, rc = scp_file(
    "c:/Users/Administrator/zhishuai/server/dist/routes/oauth.js",
    f"{REMOTE_BASE}/server/dist/routes/oauth.js"
)
print(f"  oauth.js: rc={rc}")

# Step 2: Upload frontend
print("\n[2] Uploading frontend build...")
out, err, rc = scp_dir(
    "c:/Users/Administrator/zhishuai/web/.next",
    f"{REMOTE_BASE}/web/.next"
)
print(f"  .next directory: rc={rc}")

# Step 3: Restart server
print("\n[3] Restarting server...")
out, err, rc = ssh_cmd("cd /workspace/server && pm2 restart zhishuai && sleep 3 && pm2 list")
print(f"  Restart result: rc={rc}")
print(f"  Output: {out[:300]}")

# Step 4: Verify V7 markers
print("\n[4] Verifying V7 code...")
out, err, rc = ssh_cmd("grep -c 'V7' /workspace/server/dist/services/browser-auth.service.js")
print(f"  V7 markers: {out}")

out, err, rc = ssh_cmd("grep -c 'Playwright' /workspace/server/dist/services/browser-auth.service.js || echo 0")
print(f"  Playwright refs: {out}")

out, err, rc = ssh_cmd("grep -c 'iframeLoginUrl' /workspace/server/dist/services/browser-auth.service.js || echo 0")
print(f"  iframeLoginUrl refs (should be 0): {out}")

out, err, rc = ssh_cmd("grep -c 'popupUrl' /workspace/server/dist/routes/oauth.js")
print(f"  popupUrl refs: {out}")

# Step 5: Test API
print("\n[5] Testing API...")
out, err, rc = ssh_cmd("curl -s http://localhost:3000/api/oauth/platforms")
print(f"  Platforms API: {out[:200]}")

print("\n" + "=" * 50)
print("V7 Deployment Complete!")
print("=" * 50)
