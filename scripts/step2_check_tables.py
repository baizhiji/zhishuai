#!/usr/bin/env python3
"""Step 2: Check DB tables using Node.js script on server"""
import paramiko, sys

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

# Create a Node.js script to check DB
check_script = '''
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Table counts
    const tables = ['User', 'CompanyInfo', 'RecruitmentPost', 'AcquisitionTask', 
                    'Material', 'CrmCustomer', 'SocialAccount', 'Order', 'LiveRoom',
                    'DigitalHuman', 'MapFavorite', 'BrandingConfig', 'Agent'];
    console.log('=== Table Row Counts ===');
    for (const t of tables) {
      try {
        const count = await prisma[t].count();
        console.log(t + ': ' + count);
      } catch(e) {
        console.log(t + ': ERROR - ' + e.message.split('\\n')[0]);
      }
    }
    
    // Admin user
    console.log('\\n=== Admin User ===');
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (admin) {
      console.log('Phone: ' + admin.phone + ', Name: ' + admin.name + ', Role: ' + admin.role);
    } else {
      console.log('No admin user found');
    }
    
    // CompanyInfo
    console.log('\\n=== Company Info ===');
    const companies = await prisma.companyInfo.findMany({ take: 3 });
    companies.forEach(c => console.log(c.name));
    
  } catch(e) {
    console.error('Error: ' + e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
'''

# Upload the check script
sftp = ssh.open_sftp()
with sftp.open(f'{BASE}/server/check_db.js', 'w') as f:
    f.write(check_script)
sftp.close()

# Run it
out, err = run(f'cd {BASE}/server && node check_db.js 2>&1', timeout=30)
print(out)
print(err if err else '')

# Clean up
run(f'rm {BASE}/server/check_db.js')

ssh.close()
print('\n=== Done ===')
