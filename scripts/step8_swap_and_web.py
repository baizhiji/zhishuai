#!/usr/bin/env python3
"""Step 8: Add swap space and restart web service"""
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

# 1. Check if swap already exists
out, _ = run('swapon --show 2>/dev/null')
print(f'=== Current Swap ===\n{out if out else "No swap configured"}')

# 2. Create 2GB swap file
print('\n=== Creating Swap ===')
out, err = run('sudo fallocate -l 2G /swapfile 2>&1')
print(f'fallocate: {out if out else "OK"}')

out, err = run('sudo chmod 600 /swapfile 2>&1')
print(f'chmod: {out if out else "OK"}')

out, err = run('sudo mkswap /swapfile 2>&1')
print(f'mkswap: {out[-200:]}')

out, err = run('sudo swapon /swapfile 2>&1')
print(f'swapon: {out if out else "OK"}')
if err:
    print(f'swapon err: {err}')

# 3. Make swap permanent
out, _ = run('grep swapfile /etc/fstab 2>/dev/null')
if not out:
    run('echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab 2>/dev/null')
    print('Added swap to /etc/fstab')
else:
    print('Swap already in /etc/fstab')

# 4. Optimize swappiness for server
run('sudo sysctl vm.swappiness=10 2>/dev/null')
run('echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf 2>/dev/null')
print('Set swappiness to 10')

# 5. Verify swap
out, _ = run('free -h 2>/dev/null')
print(f'\n=== Memory After Swap ===\n{out}')

# 6. Start web service
print('\n=== Starting Web ===')
# Delete errored web process
run(f'cd {BASE} && npx pm2 delete zhishuai-web 2>/dev/null')

# Start web with more generous memory limit
out, err = run(
    f'cd {BASE} && npx pm2 start "{BASE}/web/node_modules/.bin/next" '
    f'--name zhishuai-web --cwd {BASE}/web '
    f'--node-args="--max-old-space-size=384" '
    f'-- start -H 0.0.0.0 -p 3000 2>&1',
    timeout=20
)
print(f'PM2 start web: {out[-300:]}')

# Wait longer for Next.js to start
time.sleep(20)

# 7. Check status
out, _ = run(f'cd {BASE} && npx pm2 list 2>&1')
print(f'\n=== PM2 Status ===\n{out}')

# 8. Check if web is listening
out, _ = run('ss -tlnp | grep 3000 2>/dev/null')
print(f'\nPort 3000: {out}')

# 9. Check error log if still errored
out, _ = run('tail -10 /var/log/zhishuai/web-error.log 2>/dev/null')
print(f'Web error: {out[-500:]}')

# 10. Health checks
out, _ = run('curl -s http://localhost:3001/api/health 2>/dev/null')
print(f'\nAPI: {out}')

out, _ = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null')
print(f'Web: {out}')

# 11. Save PM2
run(f'cd {BASE} && npx pm2 save 2>&1')

ssh.close()
print('\n=== Step 8 Done ===')
