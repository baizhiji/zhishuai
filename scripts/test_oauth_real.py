# -*- coding: utf-8 -*-
import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def r(cmd, t=90):
    _, out, _ = c.exec_command(cmd, timeout=t)
    return out.read().decode('utf-8', 'replace').strip()

# Clear old logs first, then make a real request and capture new logs
print("Clearing PM2 logs...")
r('pm2 flush zhishuai-api 2>&1')

# Make a test request with a proper approach - use node to call the service directly
print("\nMaking OAuth test request via internal API call...")

test_js = '''
const { createAuthSession } = require('./src/services/browser-auth.service');
console.log('Starting test...');
createAuthSession('douyin')
  .then(result => {
    if (result) {
      console.log('SUCCESS!');
      console.log('sessionId:', result.sessionId);
      console.log('hasQrcode:', !!result.qrcodeUrl);
      console.log('qrcodeLength:', result.qrcodeUrl?.length);
    } else {
      console.log('FAILED: createAuthSession returned null');
    }
    process.exit(0);
  })
  .catch(err => {
    console.log('ERROR:', err.message);
    process.exit(1);
  });
'''

sftp = c.open_sftp()
with sftp.open('/var/www/zhishuai/server/test_oauth.js', 'w') as f:
    f.write(test_js)
sftp.close()

print("Running Playwright browser test (this takes ~30s)...")
out = r('cd /var/www/zhishuai/server && timeout 60 node test_oauth.js 2>&1')
print(out)

print("\n=== Done ===")
c.close()
