#!/usr/bin/env python3
"""Step 11: Start web using npx next start (correct method)"""
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

# 1. Find the actual next binary JS entry
out, _ = run(f'readlink -f {BASE}/web/node_modules/.bin/next 2>/dev/null')
print(f'Next symlink: {out}')

out, _ = run(f'cat {BASE}/web/node_modules/.bin/next 2>/dev/null | head -5')
print(f'Next bin content: {out}')

out, _ = run(f'ls {BASE}/web/node_modules/next/dist/bin/next 2>/dev/null')
print(f'Next dist bin: {out}')

# 2. Update ecosystem.config.js to use npx for web
proper_ecosystem = '''module.exports = {
  apps: [
    {
      name: 'zhishuai-api',
      script: 'src/index.ts',
      interpreter: 'node',
      interpreter_args: '--require /www/zhishuai/node_modules/tsx/dist/preflight.cjs --import /www/zhishuai/node_modules/tsx/dist/loader.mjs',
      cwd: '/www/zhishuai/server',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        LD_LIBRARY_PATH: '/usr/lib/x86_64-linux-gnu:/usr/lib',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      error_file: '/var/log/zhishuai/api-error.log',
      out_file: '/var/log/zhishuai/api-out.log',
      time: true,
      kill_timeout: 10000,
      listen_timeout: 15000,
    },
    {
      name: 'zhishuai-web',
      script: '/www/zhishuai/web/node_modules/next/dist/bin/next',
      args: 'start -H 0.0.0.0 -p 3000',
      cwd: '/www/zhishuai/web',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      error_file: '/var/log/zhishuai/web-error.log',
      out_file: '/var/log/zhishuai/web-out.log',
      time: true,
      kill_timeout: 10000,
      listen_timeout: 15000,
    }
  ]
};
'''

sftp = ssh.open_sftp()
with sftp.open(f'{BASE}/ecosystem.config.js', 'w') as f:
    f.write(proper_ecosystem)
sftp.close()
print('Updated ecosystem.config.js with correct next entry')

# 3. Stop all and restart
print('\n=== Restarting PM2 ===')
run(f'cd {BASE} && npx pm2 delete all 2>/dev/null')
time.sleep(2)

out, err = run(f'cd {BASE} && npx pm2 start ecosystem.config.js 2>&1', timeout=30)
print(f'Start result: {out[-500:]}')

time.sleep(15)

# 4. Check status
out, _ = run(f'cd {BASE} && npx pm2 list 2>&1')
print(f'\n=== PM2 Status ===\n{out}')

# 5. Check ports
out, _ = run('ss -tlnp | grep -E "3000|3001" 2>/dev/null')
print(f'\n=== Ports ===\n{out}')

# 6. Check web error if any
out, _ = run('tail -20 /var/log/zhishuai/web-error.log 2>/dev/null')
print(f'\n=== Web Error ===\n{out[-500:]}')

out, _ = run('tail -10 /var/log/zhishuai/web-out.log 2>/dev/null')
print(f'\n=== Web Out ===\n{out[-500:]}')

# 7. Health checks
out, _ = run('curl -s http://localhost:3001/api/health 2>/dev/null')
print(f'\nAPI: {out}')

out, _ = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null')
print(f'Web: {out}')

# 8. Save PM2
if '200' in out or '000' not in out:
    run(f'cd {BASE} && npx pm2 save 2>&1')

ssh.close()
print('\n=== Step 11 Done ===')
