#!/usr/bin/env python3
"""Step 5: Fix zhishuai-web - simpler approach"""
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

# 1. Check web error logs
print('=== Web Error Logs ===')
out, _ = run('tail -30 /var/log/zhishuai/web-error.log 2>/dev/null')
print(out[-1500:] if out else 'No error log')

# 2. Check port 3000
out, _ = run('ss -tlnp | grep 3000 2>/dev/null')
print(f'\n=== Port 3000 ===\n{out}')

# 3. Check next binary
out, _ = run(f'ls -la {BASE}/web/node_modules/.bin/next 2>/dev/null')
print(f'\nNext binary: {out}')

out, _ = run(f'ls {BASE}/web/.next/BUILD_ID 2>/dev/null')
print(f'Build ID: {out}')

# 4. Kill stale processes on port 3000
run('sudo fuser -k 3000/tcp 2>/dev/null')
time.sleep(2)

# 5. Delete errored PM2 web process
run(f'cd {BASE} && npx pm2 delete zhishuai-web 2>/dev/null')

# 6. Start web using PM2 with fork mode (not cluster)
out, err = run(
    f'cd {BASE} && npx pm2 start "{BASE}/web/node_modules/.bin/next" '
    f'--name zhishuai-web --cwd {BASE}/web '
    f'-- start -H 0.0.0.0 -p 3000 2>&1',
    timeout=20
)
print(f'\n=== PM2 Start Web ===\n{out[-500:]}')
if err:
    print(f'Err: {err[-300:]}')

# 7. Save PM2
run(f'cd {BASE} && npx pm2 save 2>&1')

# 8. Wait and check
time.sleep(8)

out, _ = run(f'cd {BASE} && npx pm2 list 2>&1')
print(f'\n=== PM2 Status ===\n{out}')

# 9. Health checks
out, _ = run('curl -s http://localhost:3001/api/health 2>/dev/null')
print(f'\nAPI Health: {out}')

out, _ = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null')
print(f'Web HTTP: {out}')

out, _ = run('curl -sk -o /dev/null -w "%{http_code}" https://baizhiji.net/ 2>/dev/null')
print(f'HTTPS Web: {out}')

out, _ = run('curl -sk -o /dev/null -w "%{http_code}" https://baizhiji.net/api/health 2>/dev/null')
print(f'HTTPS API: {out}')

ssh.close()
print('\n=== Step 5 Done ===')
