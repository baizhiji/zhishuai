import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)

# Write the script to server directory and run from there
fix_script = '''const { PrismaClient } = require('@prisma/client');
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
            console.log('Current user:', JSON.stringify({id: user.id, phone: user.phone, name: user.name, role: user.role, status: user.status}));
            
            const newPassword = bcrypt.hashSync('20061218', 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { 
                    password: newPassword,
                    status: 'active'
                }
            });
            console.log('Password reset to 20061218');
            
            const verifyUser = await prisma.user.findUnique({ where: { phone: '18601655222' } });
            const isValid = bcrypt.compareSync('20061218', verifyUser.password);
            console.log('Verification passed:', isValid);
        }
        
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

# Write script to server dir and execute there (where node_modules exists)
cmd = f'''cat > /www/zhishuai/server/fix_password.js << 'ENDSCRIPT'
{fix_script}
ENDSCRIPT
cd /www/zhishuai/server && node fix_password.js 2>&1'''
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=20)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print(out)
if err:
    print(f'STDERR: {err}')

# Now test login again
print('\n--- Testing Login After Password Fix ---')
cmd2 = '''curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"18601655222","password":"20061218","loginType":"user"}' '''
stdin, stdout, stderr = ssh.exec_command(cmd2, timeout=15)
result = stdout.read().decode('utf-8', errors='replace')
print(f'Login as user: {result}')

# Also test as admin
cmd3 = '''curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"18601655222","password":"20061218","loginType":"admin"}' '''
stdin, stdout, stderr = ssh.exec_command(cmd3, timeout=15)
result2 = stdout.read().decode('utf-8', errors='replace')
print(f'Login as admin: {result2}')

# Test via HTTPS (main site)
cmd4 = '''curl -s -X POST https://baizhiji.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"18601655222","password":"20061218","loginType":"user"}' \
  -k 2>/dev/null'''
stdin, stdout, stderr = ssh.exec_command(cmd4, timeout=15)
result3 = stdout.read().decode('utf-8', errors='replace')
print(f'Login via HTTPS main site: {result3}')

# Cleanup temp file
ssh.exec_command('rm -f /www/zhishuai/server/fix_password.js')

ssh.close()
