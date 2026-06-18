#!/usr/bin/env python3
"""Step 10: Debug web startup - capture error output"""
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

# 1. Try running next start and capture the actual error
print('=== Direct Next.js Start Test ===')
out, err = run(
    f'cd {BASE}/web && NODE_ENV=production PORT=3000 '
    f'timeout 15 node --max-old-space-size=384 ./node_modules/.bin/next start -H 0.0.0.0 -p 3000 2>&1',
    timeout=30
)
print(out[-2000:])
print(err[-500:] if err else '')

# 2. Check if port 3000 is now listening
out, _ = run('ss -tlnp | grep 3000 2>/dev/null')
print(f'\nPort 3000: {out}')

# 3. Check memory
out, _ = run('free -m 2>/dev/null')
print(f'\n=== Memory ===\n{out}')

ssh.close()
print('\n=== Step 10 Done ===')
