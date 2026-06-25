#!/usr/bin/env python3
import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', port=22, username='ubuntu', password='Hao20061218', timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8', errors='replace'), stderr.read().decode('utf-8', errors='replace')

print('=== Git Status on Server ===')
out, err = run('cd /var/www/zhishuai && git status 2>&1')
print(out)

print('=== Git Log (last 3) ===')
out, err = run('cd /var/www/zhishuai && git log --oneline -3 2>&1')
print(out)

print('=== Server schema.prisma (first 60 lines) ===')
out, err = run('head -60 /var/www/zhishuai/server/prisma/schema.prisma 2>&1')
print(out)

print('=== Server scheduler.ts (first 30 lines) ===')
out, err = run('head -30 /var/www/zhishuai/server/src/services/scheduler.ts 2>&1')
print(out)

print('=== Server auth.ts middleware (first 50 lines) ===')
out, err = run('head -50 /var/www/zhishuai/server/src/middleware/auth.ts 2>&1')
print(out)

ssh.close()
