# -*- coding: utf-8 -*-
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', port=22, username='ubuntu', password='Hao20061218', timeout=15)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out.strip(), err.strip()

print("=== 服务器目录结构 ===")
out, _ = run("ls -la /var/www/zhishuai/")
print(out)

print()
print("=== server/src 目录 ===")
out, _ = run("ls -la /var/www/zhishuai/server/src/ 2>&1")
print(out)

print()
print("=== server/src/routes ===")
out, _ = run("ls -la /var/www/zhishuai/server/src/routes/ 2>&1")
print(out)

print()
print("=== server/src/services ===")
out, _ = run("ls -la /var/www/zhishuai/server/src/services/ 2>&1")
print(out)

print()
print("=== web/app 目录 ===")
out, _ = run("ls -la /var/www/zhishuai/web/app/ 2>&1")
print(out)

print()
print("=== PM2 cwd ===")
out, _ = run("pm2 jlist 2>&1")
import json
try:
    procs = json.loads(out)
    for p in procs:
        name = p.get('name', '?')
        cwd = p.get('pm2_env', {}).get('pm_cwd', '?')
        exec_path = p.get('pm2_env', {}).get('pm_exec_path', '?')
        print(f"  {name}: cwd={cwd}, exec_path={exec_path}")
except:
    print(out)

print()
print("=== 服务器上 npm run build 产物目录 ===")
out, _ = run("ls -la /var/www/zhishuai/server/dist/ 2>&1 | head -10")
print(out)
out, _ = run("ls -la /var/www/zhishuai/web/.next/ 2>&1 | head -10")
print(out)

ssh.close()
