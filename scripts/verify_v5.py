#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)

print("=== V5 DEPLOYMENT VERIFICATION ===\n")

# 1. Check API V5 code is loaded
print("[1] Checking browser-auth.service.js for V5 markers...")
stdin, stdout, stderr = ssh.exec_command("grep -c 'Auth-V5' /var/www/zhishuai/server/dist/services/browser-auth.service.js 2>/dev/null || echo 0", 10)
v5_count = stdout.read().decode().strip()
print(f"    Auth-V5 log markers: {v5_count}")

stdin, stdout, stderr = ssh.exec_command("grep -c 'successUrlPatterns' /var/www/zhishuai/server/dist/services/browser-auth.service.js 2>/dev/null || echo 0", 10)
pattern_count = stdout.read().decode().strip()
print(f"    successUrlPatterns refs: {pattern_count}")

# Check xiaohongshu fix (no /explore in success patterns)
stdin, stdout, stderr = ssh.exec_command("grep -o \"'/explore'\" /var/www/zhishuai/server/dist/services/browser-auth.service.js | wc -l", 10)
explore_check = stdout.read().decode().strip()
print(f"    /explore in success patterns: {explore_check} (should be 0 or very low)")

# 2. Check recruitment page fix
print("\n[2] Checking recruitment page for @/utils/request...")
stdin, stdout, stderr = ssh.exec_command("grep -l '@/utils/request' /var/www/zhishuai/web/.next/server/app/customer/recruitment/platforms/page.js 2>/dev/null && echo 'FOUND' || echo 'NOT_FOUND'", 10)
recruit_fix = stdout.read().decode().strip()
print(f"    @/utils/request in page.js: {recruit_fix}")

stdin, stdout, stderr = ssh.exec_command("grep -c '@/services/api.*post\\|api\\.post' /var/www/zhishuai/web/.next/server/app/customer/recruitment/platforms/page.js 2>/dev/null || echo 0", 10)
old_api = stdout.read().decode().strip()
print(f"    Old api.post pattern: {old_api} (should be 0)")

# 3. Test API endpoint
print("\n[3] Testing API endpoints...")
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:3001/api/oauth/platforms | python3 -m json.tool 2>/dev/null | head -20", 10)
api_out = stdout.read().decode().strip()
print(f"    {api_out[:300]}")

# 4. PM2 status
print("\n[4] PM2 process status:")
stdin, stdout, stderr = ssh.exec_command("pm2 list --no-color | grep zhishuai", 10)
pm2_out = stdout.read().decode().strip()
for line in pm2_out.split('\n'):
    if line.strip():
        print(f"    {line}")

# 5. Check logs for any recent OAuth activity
print("\n[5] Recent OAuth logs:")
stdin, stdout, stderr = ssh.exec_command("pm2 logs zhishuai-api --lines 5 --nostream 2>/dev/null | grep -E 'Auth-V5|OAuth|sessions' || echo '(no recent OAuth logs)'", 10)
logs = stdout.read().decode().strip()
if logs:
    for line in logs.split('\n')[:5]:
        print(f"    {line}")
else:
    print("    (no recent OAuth activity)")

ssh.close()
print("\n=== VERIFICATION COMPLETE ===")
