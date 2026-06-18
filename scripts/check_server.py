#!/usr/bin/env python3
"""Comprehensive server check with correct path /www/zhishuai"""
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

BASE = '/www/zhishuai'

# 1. Project structure
print('=== Project Structure ===')
out, _ = run(f'ls -la {BASE}/')
print(out)

# 2. Server directory
print('\n=== Server Directory ===')
out, _ = run(f'ls -la {BASE}/server/')
print(out)

# 3. .env file
print('\n=== Server .env (sanitized) ===')
out, _ = run(f'cat {BASE}/server/.env 2>/dev/null')
lines = out.split('\n')
for line in lines:
    if '=' in line and any(k in line.upper() for k in ['PASSWORD', 'SECRET', 'KEY', 'TOKEN']):
        key = line.split('=')[0]
        print(f'{key}=***')
    else:
        print(line)

# 4. PM2 status
print('\n=== PM2 Process List ===')
out, err = run(f'cd {BASE} && npx pm2 list 2>&1')
print(out)
if err and 'error' in err.lower():
    print(f'ERR: {err}')

# 5. Ecosystem config
print('\n=== Ecosystem Config ===')
out, _ = run(f'cat {BASE}/ecosystem.config.js 2>/dev/null')
print(out)

# 6. Prisma schema and migration status
print('\n=== Prisma Schema ===')
out, _ = run(f'ls -la {BASE}/server/prisma/ 2>/dev/null')
print(out)

print('\n=== Migration Status ===')
out, err = run(f'cd {BASE}/server && npx prisma migrate status 2>&1 | head -25')
print(out)
print(err)

# 7. Database tables
print('\n=== DB Tables (via prisma) ===')
out, err = run(f"cd {BASE}/server && npx prisma db execute --stdin 2>&1 <<'SQL'\nSELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='zhishuai';\nSQL")
print(out)
print(err)

# 8. Check seed data
print('\n=== Key Data Checks ===')
queries = [
    ("Admin User", "SELECT id, username, phone FROM User WHERE role='ADMIN' LIMIT 3;"),
    ("Companies", "SELECT COUNT(*) as cnt FROM Company;"),
    ("Materials", "SELECT COUNT(*) as cnt FROM Material;"),
    ("SocialAccounts", "SELECT COUNT(*) as cnt FROM SocialAccount;"),
    ("CRM Customers", "SELECT COUNT(*) as cnt FROM Customer;"),
    ("Posts", "SELECT COUNT(*) as cnt FROM Post;"),
]
for name, sql in queries:
    out, err = run(f"cd {BASE}/server && npx prisma db execute --stdin 2>&1 <<'SQL'\n{sql}\nSQL")
    # Extract result
    result = out.split('\n')[-3:] if out else 'N/A'
    print(f'  {name}: {result}')

# 9. TypeScript build check
print('\n=== Build Status ===')
out, _ = run(f'ls -la {BASE}/server/dist/index.js 2>/dev/null')
print(out if out else 'No compiled dist/index.js - running via tsx')

# 10. PM2 startup / resurrect config
print('\n=== PM2 Startup Config ===')
out, _ = run('systemctl status pm2-ubuntu 2>/dev/null | head -10')
print(out)

ssh.close()
print('\n=== Done ===')
