#!/usr/bin/env python3
import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)
stdin, stdout, stderr = ssh.exec_command("grep -oP 'utils/request|services/api' /var/www/zhishuai/web/.next/server/app/customer/recruitment/platforms/page.js | head -5", 10)
print("Request module usage:", stdout.read().decode().strip())
# Also check the client-side JS
stdin, stdout, stderr = ssh.exec_command("grep -oP 'utils/request|services/api' /var/www/zhishuai/web/.next/static/chunks/app/customer/recruitment/platforms/*.js 2>/dev/null | head -5", 10)
print("Client JS request usage:", stdout.read().decode().strip())
ssh.close()
