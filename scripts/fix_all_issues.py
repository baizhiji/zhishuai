import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)

# ============================================================
# STEP 1: Check API SSL cert and fix api.baizhiji.net
# ============================================================
print('='*60)
print('STEP 1: Fix api.baizhiji.net SSL')
print('-'*40)

cmd = '''ls -la /etc/letsencrypt/live/ 2>/dev/null && echo "---" && ls -la /etc/letsencrypt/live/api.baizhiji.net/ 2>/dev/null || echo "API CERT MISSING"'''
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=15)
out = stdout.read().decode('utf-8', errors='replace')
print(out)

# Check if certbot can get cert for api subdomain
if 'api.baizhiji.net' not in out or 'MISSING' in out:
    print('\n>>> API SSL cert missing. Checking DNS resolution...')
    cmd2 = 'dig +short api.baizhiji.net 2>/dev/null || host api.baizhiji.net 2>/dev/null'
    stdin, stdout, stderr = ssh.exec_command(cmd2, timeout=10)
    print(stdout.read().decode('utf-8', errors='replace'))
    
    # Try to get cert with certbot
    print('\n>>> Attempting to get SSL cert for api.baizhiji.net...')
    cmd3 = '''sudo certbot --nginx -d api.baizhiji.net --non-interactive --agree-tos --register-unsafely-without-email --redirect 2>&1 | tail -20'''
    stdin, stdout, stderr = ssh.exec_command(cmd3, timeout=60)
    print(stdout.read().decode('utf-8', errors='replace'))
    err = stderr.read().decode('utf-8', errors='replace')
    if err:
        print(f'STDERR: {err[:500]}')

# ============================================================
# STEP 2: Check the actual login error by running a debug test
# ============================================================
print('\n' + '='*60)
print('STEP 2: Debug Login Error')
print('-'*40)

# Run a Node.js script to test login with detailed error
debug_script = '''
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function debugLogin() {
    const prisma = new PrismaClient();
    
    try {
        console.log('=== Step 1: Find user ===');
        const user = await prisma.user.findUnique({ where: { phone: '18601655222' } });
        console.log('User found:', user ? JSON.stringify({id: user.id, phone: user.phone, name: user.name, role: user.role, status: user.status, hasPassword: !!user.password, passwordPrefix: user.password ? user.password.substring(0, 20) : null}) : 'NOT FOUND');
        
        if (user && user.password) {
            console.log('\\n=== Step 2: Test password verification ===');
            const isValid = bcrypt.compareSync('20061218', user.password);
            console.log('Password valid:', isValid);
            
            // Also check what hash format it is
            console.log('Password starts with:', user.password.substring(0, 7));
            
            // Try with default password too
            const isValidDefault = bcrypt.compareSync('123456', user.password);
            console.log('Default pass (123456) valid:', isValidDefault);
        }
        
        // Check SMS config (login doesn't need it but good to verify DB is working)
        console.log('\\n=== Step 3: Verify DB connection ===');
        const userCount = await prisma.user.count();
        console.log('Total users in DB:', userCount);
        
    } catch(e) {
        console.error('ERROR:', e.message);
        console.error('STACK:', e.stack?.substring(0, 500));
    } finally {
        await prisma.$disconnect();
    }
}

debugLogin();
'''

# Write and run the debug script
write_cmd = f'''cat > /tmp/debug_login.js << 'SCRIPT_END'
{debug_script}
SCRIPT_END
cd /www/zhishuai/server && node /tmp/debug_login.js 2>&1'''
stdin, stdout, stderr = ssh.exec_command(write_cmd, timeout=30)
print(stdout.read().decode('utf-8', errors='replace'))
err = stderr.read().decode('utf-8', errors='replace')
if err:
    print(f'STDERR: {err[:1000]}')

# ============================================================
# STEP 3: Test actual login endpoint via localhost with more details  
# ============================================================
print('\n' + '='*60)
print('STEP 3: Test Login Endpoint with Details')
print('-'*40)

cmd4 = '''curl -sv -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"18601655222","password":"20061218","loginType":"user"}' 2>&1 | grep -E "(< HTTP|< Content|^{.*}$|error)" '''
stdin, stdout, stderr = ssh.exec_command(cmd4, timeout=15)
print(stdout.read().decode('utf-8', errors='replace'))

# ============================================================
# STEP 4: Restart PM2 to ensure clean state
# ============================================================
print('\n' + '='*60)
print('STEP 4: Restart Services & Verify')
print('-'*40)

cmd5 = '''cd /www/zhishuai && npx pm2 restart all 2>/dev/null && sleep 3 && echo "---PM2 Status---" && npx pm2 list 2>/dev/null && echo "---API Health---" && curl -s http://localhost:3001/api/health && echo "" && echo "---Web Health---" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 && echo ""'''
stdin, stdout, stderr = ssh.exec_command(cmd5, timeout=30)
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
