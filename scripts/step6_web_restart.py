#!/usr/bin/env python3
"""Step 6: Properly restart web service"""
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

# 1. Stop everything
print('=== Stopping all processes ===')
run(f'cd {BASE} && npx pm2 delete all 2>/dev/null')
run('sudo fuser -k 3000/tcp 2>/dev/null')
run('sudo fuser -k 3001/tcp 2>/dev/null')
time.sleep(3)

# 2. Check ports are free
out, _ = run('ss -tlnp | grep -E "3000|3001" 2>/dev/null')
print(f'Ports after cleanup: {out if out else "FREE"}')

# 3. Update ecosystem.config.js with correct web config
# The issue is likely that PM2 cluster mode doesn't work with next start
# Let's use fork mode for both
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
      script: '/www/zhishuai/web/node_modules/.bin/next',
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
print('Updated ecosystem.config.js')

# 4. Start with ecosystem config
out, err = run(f'cd {BASE} && npx pm2 start ecosystem.config.js 2>&1', timeout=20)
print(f'\n=== PM2 Start ===\n{out[-500:]}')
if err:
    print(f'Err: {err[-300:]}')

# 5. Wait for services to start
time.sleep(10)

# 6. Check status
out, _ = run(f'cd {BASE} && npx pm2 list 2>&1')
print(f'\n=== PM2 Status ===\n{out}')

# 7. If web errored again, check the error
out, _ = run('tail -20 /var/log/zhishuai/web-error.log 2>/dev/null')
print(f'\n=== Web Error Log ===\n{out[-1000:]}')

# 8. Health checks
out, _ = run('curl -s http://localhost:3001/api/health 2>/dev/null')
print(f'\nAPI Health: {out}')

out, _ = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null')
print(f'Web HTTP: {out}')

ssh.close()
print('\n=== Step 6 Done ===')
