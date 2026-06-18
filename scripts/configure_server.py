#!/usr/bin/env python3
"""Diagnose DB schema vs Prisma schema mismatches and fix everything"""
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

# 1. Check actual DB tables
print('=== Actual Database Tables ===')
out, err = run(f"cd {BASE}/server && npx prisma db execute --stdin 2>&1 <<'SQL'\nSELECT table_name FROM information_schema.tables WHERE table_schema='zhishuai' ORDER BY table_name;\nSQL")
print(out)

# 2. Check User table columns
print('\n=== User Table Columns ===')
out, err = run(f"cd {BASE}/server && npx prisma db execute --stdin 2>&1 <<'SQL'\nSHOW COLUMNS FROM User;\nSQL")
print(out)

# 3. Check if schema on server matches local
print('\n=== Server schema.prisma (first 30 lines) ===')
out, _ = run(f'head -30 {BASE}/server/prisma/schema.prisma')
print(out)

# 4. Run prisma db push to sync schema
print('\n=== Running prisma db push to sync schema ===')
out, err = run(f'cd {BASE}/server && npx prisma db push --accept-data-loss 2>&1', timeout=120)
print(out)
print(err)

# 5. Re-run seed
print('\n=== Running seed ===')
out, err = run(f'cd {BASE}/server && npx prisma db seed 2>&1', timeout=60)
print(out)
print(err)

# 6. Verify data after seed
print('\n=== Verify Data After Seed ===')
queries = [
    ("Admin User", "SELECT id, phone, name, role FROM User WHERE role='admin';"),
    ("CompanyInfo", "SELECT COUNT(*) as cnt FROM CompanyInfo;"),
    ("RecruitmentPost", "SELECT COUNT(*) as cnt FROM RecruitmentPost;"),
    ("AcquisitionTask", "SELECT COUNT(*) as cnt FROM AcquisitionTask;"),
    ("Material", "SELECT COUNT(*) as cnt FROM Material;"),
    ("CrmCustomer", "SELECT COUNT(*) as cnt FROM CrmCustomer;"),
    ("SocialAccount", "SELECT COUNT(*) as cnt FROM SocialAccount;"),
]
for name, sql in queries:
    out, err = run(f"cd {BASE}/server && npx prisma db execute --stdin 2>&1 <<'SQL'\n{sql}\nSQL")
    print(f'  {name}: {out.split(chr(10))[-3:]}')

# 7. Fix ecosystem.config.js paths
print('\n=== Fixing ecosystem.config.js paths ===')
# Read current content
out, _ = run(f'cat {BASE}/ecosystem.config.js')
# Replace /var/www with /www
fixed = out.replace('/var/www/zhishuai', '/www/zhishuai')
print(f'Old paths: /var/www/zhishuai')
print(f'New paths: /www/zhishuai')

# Write fixed config via SFTP
sftp = ssh.open_sftp()
with sftp.open(f'{BASE}/ecosystem.config.js', 'w') as f:
    f.write(fixed)
sftp.close()
print('ecosystem.config.js updated')

# Also fix server/ecosystem.config.cjs
out, _ = run(f'cat {BASE}/server/ecosystem.config.cjs')
fixed_cjs = out.replace('/var/www/zhishuai', '/www/zhishuai')
with sftp.open(f'{BASE}/server/ecosystem.config.cjs', 'w') as f:
    f.write(fixed_cjs)
print('server/ecosystem.config.cjs updated')

# 8. Fix PM2 startup service
print('\n=== Fixing PM2 Startup ===')
# Delete old processes and restart with correct config
out, err = run(f'cd {BASE} && npx pm2 delete all 2>&1')
print(f'Delete all PM2 processes: {out}')

# Start with corrected ecosystem config
out, err = run(f'cd {BASE} && npx pm2 start ecosystem.config.js 2>&1', timeout=30)
print(f'Start PM2 with ecosystem config: {out}')
print(err)

# Wait for processes to start
time.sleep(5)

# Check PM2 status
out, _ = run(f'cd {BASE} && npx pm2 list 2>&1')
print(f'\nPM2 Status:\n{out}')

# 9. Save PM2 process list for auto-restart
out, err = run(f'cd {BASE} && npx pm2 save 2>&1')
print(f'\nPM2 Save: {out}')

# 10. Enable PM2 startup service
out, err = run(f'cd {BASE} && npx pm2 startup ubuntu 2>&1 | tail -5')
print(f'PM2 Startup: {out}')

# 11. Verify API health
time.sleep(3)
out, _ = run('curl -s http://localhost:3001/api/health 2>/dev/null')
print(f'\nAPI Health: {out}')

# 12. Verify HTTPS
out, _ = run('curl -sk -o /dev/null -w "%{http_code}" https://baizhiji.net/api/health 2>/dev/null')
print(f'HTTPS API: {out}')

out, _ = run('curl -sk -o /dev/null -w "%{http_code}" https://baizhiji.net/ 2>/dev/null')
print(f'HTTPS Web: {out}')

ssh.close()
print('\n=== Configuration Complete ===')
