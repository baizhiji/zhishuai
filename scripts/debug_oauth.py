# -*- coding: utf-8 -*-
import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '150.109.60.130'
USER = 'ubuntu'
PASS = 'Hao20061218'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', 'replace').strip()
    err = stderr.read().decode('utf-8', 'replace').strip()
    return out, err

# 1. PM2 API logs - look for errors
print("=== Recent PM2 Error Logs ===")
out, err = run("pm2 logs zhishuai-api --lines 100 --nostream 2>&1 | grep -iE 'error|fail|oauth|playwright|browser|创建|chromium' | tail -20")
if out:
    print(out)
else:
    out2, _ = run("pm2 logs zhishuai-api --lines 20 --nostream 2>&1 | tail -20")
    print("(no keyword match, showing last 20 lines)")
    print(out2)

print()

# 2. Check if playwright is installed and working
print("=== Playwright Check ===")
out, err = run("cd /var/www/zhishuai/server && npm ls playwright 2>&1 | head -3")
print(out or err or "(not found in deps)")

print()

# 3. Check for chromium browsers  
print("=== Playwright Browsers ===")
out, err = run("ls /root/.cache/ms-playwright/ 2>/dev/null || echo 'No browsers installed'; npx playwright install --dry-run 2>&1 | head -5")
print(out or err)

print()

# 4. Try to test createAuthSession directly 
print("=== Direct Auth Test ===")
# Write a small test script to server
test_js = '''
const { createAuthSession } = require('./src/services/browser-auth.service');
createAuthSession('douyin')
  .then(r => { console.log('RESULT:', JSON.stringify({sessionId: r?.sessionId, hasQr: !!r?.qrcodeUrl, qrLen: r?.qrcodeUrl?.length})); process.exit(0); })
  .catch(e => { console.log('ERROR:', e.message); process.exit(1); });
'''
sftp = client.open_sftp()
try:
    with sftp.open('/tmp/test_auth.js', 'w') as f:
        f.write(test_js)
    sftp.close()
    out, err = run("cd /var/www/zhishuai/server && timeout 30 node /tmp/test_auth.js 2>&1", timeout=35)
    print(out or err)
except Exception as e:
    print(f"Upload failed: {e}")
finally:
    try:
        sftp.close()
    except:
        pass

print()
print("=== DONE ===")
client.close()
