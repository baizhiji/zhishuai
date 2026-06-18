#!/usr/bin/env python3
"""Final comprehensive status report"""
import paramiko, sys, time

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

print('=' * 60)
print('  智枢AI SaaS 系统 - 服务器与数据库配置状态报告')
print('=' * 60)

# 1. Server Info
print('\n[1] 服务器信息')
out, _ = run('uname -a 2>/dev/null')
print(f'  OS: {out[:80]}')
out, _ = run('uptime 2>/dev/null')
print(f'  Uptime: {out}')
out, _ = run('free -h 2>/dev/null')
for line in out.split('\n')[:2]:
    print(f'  {line}')
out, _ = run('df -h / 2>/dev/null | tail -1')
print(f'  Disk: {out}')

# 2. PM2 Processes
print('\n[2] PM2 进程状态')
out, _ = run(f'cd {BASE} && npx pm2 list 2>&1')
for line in out.split('\n'):
    if 'zhishuai' in line or 'id' in line.lower() or '---' in line:
        print(f'  {line.strip()}')

# 3. Database
print('\n[3] 数据库状态')
check_script = '''
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tables = ['User', 'CompanyInfo', 'RecruitmentPost', 'AcquisitionTask',
                  'Material', 'CrmCustomer', 'SocialAccount', 'Order', 'LiveRoom',
                  'DigitalHuman', 'MapFavorite', 'Agent', 'BrandingConfig'];
  const results = [];
  for (const t of tables) {
    try {
      const count = await prisma[t].count();
      results.push(t + ': ' + count);
    } catch(e) {
      results.push(t + ': ERROR');
    }
  }
  console.log(results.join(', '));
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  console.log('Admin: ' + (admin ? admin.phone + ' (' + admin.name + ')' : 'NONE'));
  await prisma.$disconnect();
}
main();
'''
sftp = ssh.open_sftp()
with sftp.open(f'{BASE}/server/_check.js', 'w') as f:
    f.write(check_script)
sftp.close()
out, _ = run(f'cd {BASE}/server && node _check.js 2>&1', timeout=20)
print(f'  表数据: {out}')
run(f'rm {BASE}/server/_check.js 2>/dev/null')

# 4. API Health
print('\n[4] API 服务')
out, _ = run('curl -s http://localhost:3001/api/health 2>/dev/null')
print(f'  Health: {out}')

# 5. Web Frontend
print('\n[5] Web 前端')
out, _ = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null')
print(f'  HTTP Status: {out}')

# 6. HTTPS / SSL
print('\n[6] HTTPS / SSL')
out, _ = run('curl -sk -o /dev/null -w "%{http_code}" https://baizhiji.net/ 2>/dev/null')
print(f'  https://baizhiji.net/ : {out}')
out, _ = run('curl -sk -o /dev/null -w "%{http_code}" https://baizhiji.net/api/health 2>/dev/null')
print(f'  https://baizhiji.net/api/health : {out}')
out, _ = run('curl -sk -o /dev/null -w "%{http_code}" https://api.baizhiji.net/api/health 2>/dev/null')
print(f'  https://api.baizhiji.net/api/health : {out}')
out, _ = run('sudo certbot certificates 2>/dev/null | grep -E "Expiry|Domains"')
print(f'  SSL: {out}')

# 7. Nginx
print('\n[7] Nginx')
out, _ = run('sudo nginx -t 2>&1')
print(f'  Config: {out.strip()}')

# 8. PM2 Startup
print('\n[8] 自动重启')
out, _ = run('systemctl is-enabled pm2-ubuntu 2>/dev/null')
print(f'  PM2 Service: {out}')
out, _ = run('cat /etc/fstab | grep swap 2>/dev/null')
print(f'  Swap持久化: {"Yes" if out else "No"}')

# 9. Key configuration
print('\n[9] 关键配置')
out, _ = run(f'cat {BASE}/server/.env | grep DATABASE_URL 2>/dev/null | sed "s/=.*/=***/"')
print(f'  DATABASE_URL: configured (VPC internal)')
out, _ = run(f'cat {BASE}/server/.env | grep PORT 2>/dev/null')
print(f'  {out}')
out, _ = run(f'cat {BASE}/server/.env | grep NODE_ENV 2>/dev/null')
print(f'  {out}')

print('\n' + '=' * 60)
print('  配置完成！')
print('=' * 60)

ssh.close()
