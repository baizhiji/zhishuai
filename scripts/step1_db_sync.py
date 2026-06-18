#!/usr/bin/env python3
"""Step 1: Sync database schema and check tables"""
import paramiko, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218')

def run(cmd, timeout=120):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out.strip(), err.strip()

BASE = '/www/zhishuai'

# 1. Check current DB tables
print('=== Current DB Tables ===')
out, err = run(f"cd {BASE}/server && npx prisma db execute --stdin 2>&1 <<'SQL'\nSELECT table_name FROM information_schema.tables WHERE table_schema='zhishuai' ORDER BY table_name;\nSQL")
print(out)

# 2. Run db push to sync schema
print('\n=== Running prisma db push ===')
out, err = run(f'cd {BASE}/server && npx prisma db push --accept-data-loss 2>&1', timeout=180)
print(out[-2000:])
print(err[-500:] if err else '')

ssh.close()
print('\n=== Step 1 Done ===')
