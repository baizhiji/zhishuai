# -*- coding: utf-8 -*-
import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def r(cmd, t=30):
    _, out, _ = c.exec_command(cmd, timeout=t)
    return out.read().decode('utf-8', 'replace').strip()

# Check what's in the server dir - source or compiled
print("Server structure:")
out = r('ls /var/www/zhishuai/server/src/services/ 2>/dev/null | head -10 || echo "No src dir"; ls /var/www/zhishuai/server/dist/ 2>/dev/null | head -5 || echo "No dist dir"')
print(out)

print("\nMain entry:")
out = r('cat /var/www/zhishuai/server/package.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(\"main:\", d.get(\"main\",\"?\")); print(\"scripts build:\", d.get(\"scripts\",{}).get(\"build\",\"?\"))"')
print(out)

# Check if there's a dist with the compiled service
print("\nLooking for browser-auth in dist:")
out = r('find /var/www/zhishuai/server -name "*browser*auth*" -type f 2>/dev/null | head -5')
print(out or "(not found)")

c.close()
