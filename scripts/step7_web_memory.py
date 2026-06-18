#!/usr/bin/env python3
"""Step 7: Start web with increased memory limit and check build"""
import paramiko, sys, time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218')

def run(cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out.strip(), err.strip()

BASE = '/www/zhishuai'

# 1. Check memory
out, _ = run('free -m 2>/dev/null')
print(f'=== Memory ===\n{out}')

# 2. Check web build
out, _ = run(f'ls -la {BASE}/web/.next/ 2>/dev/null | head -15')
print(f'\n=== Web Build ===\n{out}')

out, _ = run(f'cat {BASE}/web/.next/BUILD_ID 2>/dev/null')
print(f'Build ID: {out}')

# 3. Check web next.config
out, _ = run(f'cat {BASE}/web/next.config.mjs 2>/dev/null || cat {BASE}/web/next.config.js 2>/dev/null')
print(f'\n=== Next Config ===\n{out}')

# 4. Try starting web with Node.js max-old-space-size
# First stop the errored one
run(f'cd {BASE} && npx pm2 delete zhishuai-web 2>/dev/null')

# Start with increased memory and standalone mode if available
out, err = run(
    f'cd {BASE} && npx pm2 start "{BASE}/web/node_modules/.bin/next" '
    f'--name zhishuai-web --cwd {BASE}/web '
    f'--node-args="--max-old-space-size=256" '
    f'-- start -H 0.0.0.0 -p 3000 2>&1',
    timeout=20
)
print(f'\n=== PM2 Start Web ===\n{out[-500:]}')

time.sleep(15)

# 5. Check status
out, _ = run(f'cd {BASE} && npx pm2 list 2>&1')
print(f'\n=== PM2 Status ===\n{out}')

# 6. Check web error
out, _ = run('tail -10 /var/log/zhishuai/web-error.log 2>/dev/null')
print(f'\n=== Web Error ===\n{out[-500:]}')

# 7. Health
out, _ = run('curl -s http://localhost:3001/api/health 2>/dev/null')
print(f'\nAPI: {out}')
out, _ = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null')
print(f'Web: {out}')

ssh.close()
print('\n=== Step 7 Done ===')
