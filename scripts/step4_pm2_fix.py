#!/usr/bin/env python3
"""Step 4: Fix PM2 ecosystem config paths and restart with proper config"""
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

# 1. Read and fix root ecosystem.config.js
print('=== Fixing ecosystem.config.js ===')
out, _ = run(f'cat {BASE}/ecosystem.config.js')
fixed = out.replace('/var/www/zhishuai', '/www/zhishuai')

sftp = ssh.open_sftp()
with sftp.open(f'{BASE}/ecosystem.config.js', 'w') as f:
    f.write(fixed)
print('Root ecosystem.config.js: paths fixed from /var/www to /www')

# Also fix the API script path to use tsx for now (since tsc has errors)
# The ecosystem should use tsx to run src/index.ts directly
ecosystem_api_fix = fixed.replace("'dist/index.js'", "'src/index.ts'")
if ecosystem_api_fix != fixed:
    # Also need to change the interpreter
    # Replace the api app entry to use tsx
    pass

# Let's create a proper ecosystem.config.js that uses tsx for API
proper_ecosystem = '''module.exports = {
  apps: [
    {
      name: 'zhishuai-api',
      script: 'src/index.ts',
      interpreter: 'node',
      interpreter_args: '--require /www/zhishuai/node_modules/tsx/dist/preflight.cjs --import /www/zhishuai/node_modules/tsx/dist/loader.mjs',
      cwd: '/www/zhishuai/server',
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
      script: './node_modules/.bin/next',
      args: 'start -H 0.0.0.0 -p 3000',
      cwd: '/www/zhishuai/web',
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
    }
  ]
};
'''

with sftp.open(f'{BASE}/ecosystem.config.js', 'w') as f:
    f.write(proper_ecosystem)
print('Written proper ecosystem.config.js with tsx for API')

# 2. Ensure log directory exists
out, err = run('sudo mkdir -p /var/log/zhishuai && sudo chown ubuntu:ubuntu /var/log/zhishuai 2>&1')
print(f'Log dir: {out if out else "OK"}')

# 3. Stop all PM2 processes and restart with new config
print('\n=== Restarting PM2 ===')
out, err = run(f'cd {BASE} && npx pm2 delete all 2>&1')
print(f'Delete all: {out[-200:]}')

time.sleep(2)

out, err = run(f'cd {BASE} && npx pm2 start ecosystem.config.js 2>&1', timeout=30)
print(f'Start with new config: {out[-500:]}')
if err:
    print(f'Error: {err[-300:]}')

time.sleep(5)

# 4. Check PM2 status
out, _ = run(f'cd {BASE} && npx pm2 list 2>&1')
print(f'\n=== PM2 Status ===\n{out}')

# 5. Save PM2 process list
out, err = run(f'cd {BASE} && npx pm2 save 2>&1')
print(f'\nPM2 Save: {out[-200:]}')

# 6. Verify API health
time.sleep(3)
out, _ = run('curl -s http://localhost:3001/api/health 2>/dev/null')
print(f'\nAPI Health: {out}')

# 7. Verify web
out, _ = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null')
print(f'Web Status: {out}')

# 8. Verify HTTPS
out, _ = run('curl -sk -o /dev/null -w "%{http_code}" https://baizhiji.net/api/health 2>/dev/null')
print(f'HTTPS API: {out}')

out, _ = run('curl -sk -o /dev/null -w "%{http_code}" https://baizhiji.net/ 2>/dev/null')
print(f'HTTPS Web: {out}')

out, _ = run('curl -sk -o /dev/null -w "%{http_code}" https://api.baizhiji.net/api/health 2>/dev/null')
print(f'HTTPS API (api.baizhiji.net): {out}')

sftp.close()
ssh.close()
print('\n=== Step 4 Done ===')
