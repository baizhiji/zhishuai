import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)

# ============================================================
# Fix 1: Check and fix the admin user password
# ============================================================
print('='*60)
print('FIX 1: Reset Admin Password to 20061218')
print('-'*40)

fix_password_script = '''
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function fixPassword() {
    const prisma = new PrismaClient();
    
    try {
        const user = await prisma.user.findUnique({ where: { phone: '18601655222' } });
        
        if (!user) {
            console.log('ERROR: User not found! Creating...');
            const newUser = await prisma.user.create({
                data: {
                    phone: '18601655222',
                    password: bcrypt.hashSync('20061218', 10),
                    name: '管理员',
                    role: 'admin',
                    status: 'active',
                    username: 'admin'
                }
            });
            console.log('Created new user:', JSON.stringify(newUser));
        } else {
            console.log('Current user:', JSON.stringify({id: user.id, phone: user.phone, name: user.name, role: user.role, status: user.status, passwordPreview: user.password ? user.password.substring(0, 30) : null}));
            
            // Hash and update the password
            const newPassword = bcrypt.hashSync('20061218', 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { 
                    password: newPassword,
                    status: 'active'  // Make sure account is active
                }
            });
            console.log('Password updated to 20061218 (bcrypt hash)');
            
            // Verify
            const verifyUser = await prisma.user.findUnique({ where: { phone: '18601655222' } });
            const isValid = bcrypt.compareSync('20061218', verifyUser.password);
            console.log('Verification passed:', isValid);
        }
        
        // List all users for reference
        console.log('\\n=== All Users ===');
        const users = await prisma.user.findMany({ select: {id: true, phone: true, name: true, role: true, status: true} });
        users.forEach(u => console.log(JSON.stringify(u)));
        
    } catch(e) {
        console.error('ERROR:', e.message);
        console.error(e.stack?.substring(0, 500));
    } finally {
        await prisma.$disconnect();
    }
}

fixPassword();
'''

cmd = f'''cd /www/zhishuai/server && cat > /tmp/fix_password.js << 'ENDSCRIPT'
{fix_password_script}
ENDSCRIPT
node /tmp/fix_password.js 2>&1'''
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=20)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print(out)
if err:
    print(f'STDERR: {err}')

# ============================================================
# Fix 2: Test login after password reset  
# ============================================================
print('\n' + '='*60)
print('FIX 2: Test Login After Password Reset')
print('-'*40)

cmd2 = '''curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"18601655222","password":"20061218","loginType":"admin"}' 2>&1'''
stdin, stdout, stderr = ssh.exec_command(cmd2, timeout=15)
print(stdout.read().decode('utf-8', errors='replace'))

# Also test with loginType=user (terminal customer login as shown in screenshot)
cmd3 = '''curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"18601655222","password":"20061218","loginType":"user"}' 2>&1'''
stdin, stdout, stderr = ssh.exec_command(cmd3, timeout=15)
print('\nLogin as user (terminal):')
print(stdout.read().decode('utf-8', errors='replace'))

# ============================================================
# Fix 3: Verify api.baizhiji.net works now
# ============================================================
print('\n' + '='*60)
print('FIX 3: Verify API Subdomain')
print('-'*40)

cmd4 = 'sudo nginx -t 2>&1 && sudo systemctl reload nginx 2>&1 && echo "---" && curl -s -o /dev/null -w "%{http_code}" https://api.baizhiji.net/api/health 2>/dev/null && echo "" && curl -s https://api.baizhiji.net/api/health 2>/dev/null | head -1'
stdin, stdout, stderr = ssh.exec_command(cmd4, timeout=20)
print(stdout.read().decode('utf-8', errors='replace'))

# ============================================================
# Fix 4: Verify main site login via HTTPS
# ============================================================
print('\n' + '='*60)
print('FIX 4: Verify Main Site Login via HTTPS')
print('-'*40)

cmd5 = 'curl -s -o /dev/null -w "%{http_code}" https://baizhiji.net/ 2>/dev/null && echo "" && curl -s -X POST https://baizhiji.net/api/auth/login -H "Content-Type: application/json" -d "{\"phone\":\"18601655222\",\"password\":\"20061218\",\"loginType\":\"user\"}" -k 2>/dev/null'
stdin, stdout, stderr = ssh.exec_command(cmd5, timeout=15)
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
