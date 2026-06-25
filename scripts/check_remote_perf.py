#!/usr/bin/env python3
import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('150.109.60.130', port=22, username='ubuntu', password='Hao20061218', timeout=15)

def run(cmd, timeout=10):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8','replace')

# Check performance/page.tsx problematic area
print("=== performance/page.tsx lines 80-95 ===")
out = run("sed -n '80,95p' /var/www/zhishuai/web/app/admin/performance/page.tsx")
print(out)

print("\n=== Total line count ===")
out = run("wc -l /var/www/zhishuai/web/app/admin/performance/page.tsx")
print(out)

print("\n=== Check for 'customers: 85' ===")
out = run("grep -n 'customers: 85' /var/www/zhishuai/web/app/admin/performance/page.tsx")
print(out)

print("\n=== Check for 'const showDetail' ===")
out = run("grep -n 'const showDetail' /var/www/zhishuai/web/app/admin/performance/page.tsx")
print(out)

# Check the full file for syntax - try a basic parse
print("\n=== Check for orphan }; at line 85 ===")
out = run("sed -n '85p' /var/www/zhishuai/web/app/admin/performance/page.tsx")
print(out)

client.close()
