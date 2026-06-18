#!/usr/bin/env python3
"""Step 13: Fix PM2 startup service to use correct PM2 binary"""
import paramiko, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218')

def run(cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out.strip(), err.strip()

# 1. Find the actual PM2 binary path
out, _ = run('which pm2 2>/dev/null')
print(f'PM2 binary: {out}')

out, _ = run('readlink -f $(which pm2) 2>/dev/null')
print(f'PM2 real path: {out}')

# 2. Check current service file
out, _ = run('cat /etc/systemd/system/pm2-ubuntu.service 2>/dev/null')
print(f'\n=== Current PM2 Service ===\n{out}')

# 3. Fix the ExecStart to use the correct PM2 binary
# The service file references /usr/lib/node_modules/pm2/bin/pm2 but PM2 might be installed elsewhere
out, _ = run('ls /usr/lib/node_modules/pm2/bin/pm2 2>/dev/null')
print(f'\nPM2 at /usr/lib: {out if out else "NOT FOUND"}')

# 4. If PM2 is not at /usr/lib, update the service file
if not out:
    pm2_path = run('readlink -f $(which pm2) 2>/dev/null')[0]
    if pm2_path:
        # Update service file
        service_content = f'''[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=ubuntu
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin
Environment=PM2_HOME=/home/ubuntu/.pm2
PIDFile=/home/ubuntu/.pm2/pm2.pid
Restart=on-failure

ExecStart={pm2_path} resurrect
ExecReload={pm2_path} reload all
ExecStop={pm2_path} kill

[Install]
WantedBy=multi-user.target
'''
        # Write updated service
        sftp = ssh.open_sftp()
        with sftp.open('/tmp/pm2-ubuntu.service', 'w') as f:
            f.write(service_content)
        sftp.close()

        run('sudo cp /tmp/pm2-ubuntu.service /etc/systemd/system/pm2-ubuntu.service 2>&1')
        run('sudo systemctl daemon-reload 2>&1')
        run('sudo systemctl enable pm2-ubuntu 2>&1')
        print('Updated PM2 service with correct binary path')

# 5. Verify service
out, _ = run('systemctl status pm2-ubuntu 2>/dev/null | head -5')
print(f'\n=== PM2 Service Status ===\n{out}')

# 6. Test service start
out, err = run('sudo systemctl start pm2-ubuntu 2>&1')
print(f'\nStart PM2 service: {out if out else "OK"}')
if err:
    print(f'Err: {err}')

# 7. Check if processes are still running
import time
time.sleep(5)
out, _ = run('curl -s http://localhost:3001/api/health 2>/dev/null')
print(f'\nAPI Health: {out}')

out, _ = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null')
print(f'Web: {out}')

# 8. Final verification - all URLs
print('\n=== Final Verification ===')
out, _ = run('curl -sk -o /dev/null -w "%{http_code}" https://baizhiji.net/ 2>/dev/null')
print(f'https://baizhiji.net/ : {out}')

out, _ = run('curl -sk https://baizhiji.net/api/health 2>/dev/null')
print(f'https://baizhiji.net/api/health : {out}')

out, _ = run('curl -sk -o /dev/null -w "%{http_code}" https://api.baizhiji.net/ 2>/dev/null')
print(f'https://api.baizhiji.net/ : {out}')

ssh.close()
print('\n=== Configuration Complete ===')
