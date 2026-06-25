# -*- coding: utf-8 -*-
import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def r(cmd, t=90):
    _, out, _ = c.exec_command(cmd, timeout=t)
    return out.read().decode('utf-8', 'replace').strip()

# Write test script using the compiled dist path
test_js = '''const { createAuthSession } = require('./dist/services/browser-auth.service');
console.log('Starting Playwright OAuth test...');
createAuthSession('douyin')
  .then(result => {
    if (result) {
      console.log('SUCCESS! Browser launched OK.');
      console.log('  sessionId:', result.sessionId);
      console.log('  hasQrcode:', !!result.qrcodeUrl);
      console.log('  qrcodeLength:', result.qrcodeUrl ? result.qrcodeUrl.length : 0);
    } else {
      console.log('FAILED: returned null (browser or page error)');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
  });
'''

sftp = c.open_sftp()
with sftp.open('/var/www/zhishuai/server/test_oauth.js', 'w') as f:
    f.write(test_js)
sftp.close()

print("Testing Playwright browser launch for OAuth (~40s wait)...")
out = r('cd /var/www/zhishuai/server && timeout 60 node test_oauth.js 2>&1')
print(out)

c.close()
