#!/usr/bin/env python3
"""Step 3: Run seed and fix admin user name"""
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

# 1. Fix admin name via Prisma script
fix_script = '''
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Update admin user name
  const admin = await prisma.user.updateMany({
    where: { role: 'admin', name: 'test' },
    data: { name: '超级管理员' }
  });
  console.log('Updated admin name:', admin.count, 'records');
  
  // Verify
  const user = await prisma.user.findFirst({ where: { role: 'admin' } });
  console.log('Admin:', user.phone, user.name, user.role);
  
  await prisma.$disconnect();
}
main();
'''

sftp = ssh.open_sftp()
with sftp.open(f'{BASE}/server/fix_admin.js', 'w') as f:
    f.write(fix_script)
sftp.close()

out, err = run(f'cd {BASE}/server && node fix_admin.js 2>&1', timeout=30)
print('=== Fix Admin Name ===')
print(out)
if err:
    print(err)

# 2. Run Prisma seed
print('\n=== Running Seed ===')
out, err = run(f'cd {BASE}/server && npx prisma db seed 2>&1', timeout=60)
print(out[-1500:])
if err:
    print(err[-500:])

# Clean up
run(f'rm {BASE}/server/fix_admin.js')

ssh.close()
print('\n=== Step 3 Done ===')
