#!/usr/bin/env python3
"""Step 12: Finalize - save PM2, setup startup, verify HTTPS"""
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

# 1. Save PM2 process list
print('=== Saving PM2 ===')
out, _ = run(f'cd {BASE} && npx pm2 save 2>&1')
print(out)

# 2. Setup PM2 startup for auto-restart on reboot
print('\n=== PM2 Startup ===')
out, err = run(f'cd {BASE} && npx pm2 startup ubuntu -u ubuntu --hp /home/ubuntu 2>&1')
# Check if we need to run a sudo command
print(out[-500:])
if 'sudo' in out:
    # Extract the sudo command and run it
    import re
    sudo_cmd = re.search(r'sudo.*$', out, re.MULTILINE)
    if sudo_cmd:
        print(f'Running: {sudo_cmd.group()}')
        out2, _ = run(f'{sudo_cmd.group()} 2>&1')
        print(out2)

# 3. Verify the systemd service
out, _ = run('systemctl status pm2-ubuntu 2>/dev/null | head -5')
print(f'\n=== PM2 Service ===\n{out}')

# 4. Comprehensive health checks
print('\n=== Health Checks ===')

# API Health
out, _ = run('curl -s http://localhost:3001/api/health 2>/dev/null')
print(f'API (localhost): {out}')

# Web HTTP
out, _ = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null')
print(f'Web (localhost): {out}')

# HTTPS Web
out, _ = run('curl -sk -o /dev/null -w "%{http_code}" https://baizhiji.net/ 2>/dev/null')
print(f'HTTPS Web: {out}')

# HTTPS API
out, _ = run('curl -sk -o /dev/null -w "%{http_code}" https://baizhiji.net/api/health 2>/dev/null')
print(f'HTTPS API: {out}')

# API subdomain
out, _ = run('curl -sk -o /dev/null -w "%{http_code}" https://api.baizhiji.net/api/health 2>/dev/null')
print(f'HTTPS API (api.baizhiji.net): {out}')

# 5. API endpoint tests
print('\n=== API Endpoints ===')
endpoints = [
    '/api/health',
    '/api/auth/me',
    '/api/social-accounts',
    '/api/materials',
    '/api/ai/models',
    '/api/config',
]
for ep in endpoints:
    out, _ = run(f'curl -sk -o /dev/null -w "%{{http_code}}" https://baizhiji.net{ep} 2>/dev/null')
    print(f'  {ep}: {out}')

# 6. PM2 process details
out, _ = run(f'cd {BASE} && npx pm2 list 2>&1')
print(f'\n=== Final PM2 Status ===\n{out}')

# 7. Memory and disk
out, _ = run('free -h 2>/dev/null')
print(f'\n=== Memory ===\n{out}')

out, _ = run('df -h / 2>/dev/null | tail -1')
print(f'Disk: {out}')

ssh.close()
print('\n=== Finalization Complete ===')
