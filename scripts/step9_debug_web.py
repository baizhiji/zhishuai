#!/usr/bin/env python3
"""Step 9: Debug OOM and try starting web directly"""
import paramiko, sys, time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218')

def run(cmd, timeout=60):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out.strip(), err.strip()

BASE = '/www/zhishuai'

# 1. Check dmesg for OOM killer
out, _ = run('sudo dmesg | grep -i "oom\|killed" | tail -10 2>/dev/null')
print(f'=== OOM Messages ===\n{out}')

# 2. Check current memory
out, _ = run('free -m 2>/dev/null')
print(f'\n=== Memory ===\n{out}')

# 3. Try running next directly (not via PM2) - with more memory and swap active
print('\n=== Starting Next.js directly ===')

# First delete PM2 web process
run(f'cd {BASE} && npx pm2 delete zhishuai-web 2>/dev/null')

# Start next directly in background
out, _ = run(
    f'cd {BASE}/web && NODE_ENV=production PORT=3000 '
    f'node --max-old-space-size=384 ./node_modules/.bin/next start -H 0.0.0.0 -p 3000 &',
    timeout=5
)
print(f'Started next in background')

# Wait for it to start
time.sleep(15)

# Check if it's running
out, _ = run('ps aux | grep "next" | grep -v grep | head -5')
print(f'\n=== Next Processes ===\n{out}')

out, _ = run('ss -tlnp | grep 3000 2>/dev/null')
print(f'Port 3000: {out}')

# 4. Health check
out, _ = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null')
print(f'Web HTTP: {out}')

# 5. If still failing, check if it's actually the OOM killer
out, _ = run('sudo dmesg | tail -20 2>/dev/null')
print(f'\n=== Recent dmesg ===\n{out[-1000:]}')

# 6. Check web standalone server
out, _ = run(f'ls {BASE}/web/.next/standalone/ 2>/dev/null')
print(f'\n=== Standalone Build ===\n{out if out else "No standalone build"}')

# 7. If direct start works, register it with PM2
out, _ = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null')
if out == '200':
    print('\nDirect start works! Now registering with PM2...')
    # Kill the manual process first
    run('sudo fuser -k 3000/tcp 2>/dev/null')
    time.sleep(2)

    # Use PM2 with correct config
    out, err = run(
        f'cd {BASE} && npx pm2 start "node --max-old-space-size=384 ./node_modules/.bin/next" '
        f'--name zhishuai-web --cwd {BASE}/web '
        f'-- start -H 0.0.0.0 -p 3000 2>&1',
        timeout=15
    )
    print(f'PM2 start: {out[-300:]}')
    time.sleep(10)

    out, _ = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null')
    print(f'Web HTTP: {out}')
else:
    print('\nDirect start also failed. Checking further...')
    # Maybe it's a different issue
    out, _ = run(f'cd {BASE}/web && NODE_ENV=production node -e "require(\'next\'); console.log(\'next loads OK\')" 2>&1')
    print(f'Next require test: {out}')

ssh.close()
print('\n=== Step 9 Done ===')
