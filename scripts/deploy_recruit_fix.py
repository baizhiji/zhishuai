#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko, base64, os, sys, io, glob, time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)
print("[OK] SSH connected")

REMOTE = '/var/www/zhishuai'

# Upload recruitment page JS (server)
local_page = r'c:\Users\Administrator\zhishuai\web\.next\server\app\customer\recruitment\platforms\page.js'
if os.path.exists(local_page):
    remote_page = f'{REMOTE}/web/.next/server/app/customer/recruitment/platforms/page.js'
    data = open(local_page, 'rb').read()
    b64 = base64.b64encode(data).decode('ascii')
    cmd = f"mkdir -p $(dirname '{remote_page}') && echo '{b64}' | base64 -d > '{remote_page}' && ls -la '{remote_page}'"
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    print(f"[UPLOADED] server page.js ({len(data)} bytes): {out[:100]}")

# Upload client JS files
client_dir = r'c:\Users\Administrator\zhishuai\web\.next\static\chunks\app\customer\recruitment\platforms'
files = glob.glob(os.path.join(client_dir, '*.js'))
print(f"[INFO] Found {len(files)} client JS files")
for gf in files:
    fname = os.path.basename(gf)
    rc = f'{REMOTE}/web/.next/static/chunks/app/customer/recruitment/platforms/{fname}'
    data = open(gf, 'rb').read()
    b64 = base64.b64encode(data).decode('ascii')
    ssh.exec_command(f"echo '{b64}' | base64 -d > '{rc}'", 30)

# Restart web
print("[RESTART] Web service...")
ssh.exec_command(f"cd {REMOTE}/web && pm2 restart zhishuai-web", 20)
time.sleep(4)

# Verify
stdin, stdout, stderr = ssh.exec_command("pm2 list --no-color | grep zhishuai", 10)
print(f"\n[PM2]\n{stdout.read().decode()}")

stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000", 10)
print(f"Web HTTP: {stdout.read().decode()}")

ssh.close()
print("\n[DONE] Recruitment page fix deployed!")
