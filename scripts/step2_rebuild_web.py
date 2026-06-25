#!/usr/bin/env python3
"""Step 2: Rebuild Next.js on server and restart web service"""
import paramiko, sys, time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print("[1] Connecting...")
client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
print("  Connected!")

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', 'replace')
    err = stderr.read().decode('utf-8', 'replace')
    return out, err

# ===== Clean old build =====
print("\n[2] Cleaning old build...")
out, err = run("rm -rf /var/www/zhishuai/web/.next 2>&1")
print("  Done")

# ===== Build =====
print("\n[3] Running npm run build (2-3 minutes)...")
out, err = run("cd /var/www/zhishuai/web && NODE_ENV=production npm run build 2>&1", timeout=300)

# Check result
if 'Failed to compile' in out:
    idx = out.find('Failed to compile')
    print(f"  BUILD FAILED!")
    print(out[idx:idx+1500])
    
    # Also check stderr
    if err:
        print(f"  stderr: {err[:500]}")
    
    client.close()
    sys.exit(1)
else:
    # Show last 300 chars for success confirmation
    print(f"  Build output (last 300): {out[-300:]}")

# ===== Verify BUILD_ID =====
print("\n[4] Checking BUILD_ID...")
out, err = run("cat /var/www/zhishuai/web/.next/BUILD_ID 2>&1")
build_id = out.strip()
print(f"  BUILD_ID: {build_id}")

if not build_id or 'No such file' in build_id or 'error' in build_id.lower():
    print("  Build artifacts missing!")
    # Show .next contents
    out2, err2 = run("ls -la /var/www/zhishuai/web/.next/ 2>&1")
    print(out2)
    client.close()
    sys.exit(1)
else:
    print("  Build artifacts OK!")

# ===== Restart =====
print("\n[5] Restarting web service...")
run("pm2 delete zhishuai-web 2>/dev/null")
out, err = run("cd /var/www/zhishuai/web && pm2 start ecosystem.config.cjs 2>&1")

# Check if online
time.sleep(3)
out, err = run("pm2 status 2>&1")
# Look for zhishuai-web status
if 'online' in out and 'zhishuai-web' in out:
    print("  Web service started (initially online)")
else:
    print(f"  Status: {out}")

run("pm2 save 2>/dev/null")

# ===== Final verification =====
print("\n[6] Waiting 20 seconds for service to stabilize...")
time.sleep(20)

out, err = run("pm2 status 2>&1")
print(out)

out, err = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>&1")
local_status = out.strip()
print(f"  localhost:3000 status: {local_status}")

out, err = run("curl -s -o /dev/null -w '%{http_code}' https://baizhiji.net 2>&1")
domain_status = out.strip()
print(f"  baizhiji.net status: {domain_status}")

out, err = run("curl -s http://localhost:3001/api/health 2>&1")
api_health = out.strip()[:150]
print(f"  API health: {api_health}")

if local_status != '200' or domain_status != '200':
    print("\n  [Debug] Web service logs:")
    out, err = run("pm2 logs zhishuai-web --lines 15 --nostream 2>&1")
    print(out[-1500:])

client.close()

print("\n=== RESULT ===")
if domain_status == '200':
    print("SUCCESS! Web is live at https://baizhiji.net")
elif local_status == '200':
    print("Local web OK, domain issue (check Nginx)")
else:
    print(f"Issue remains: local={local_status}, domain={domain_status}")
