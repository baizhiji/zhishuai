# -*- coding: utf-8 -*-
import paramiko
import os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', port=22, username='ubuntu', password='Hao20061218', timeout=15)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

# 检查远程目录是否存在
dirs_to_check = [
    "/var/www/zhishuai/server/src",
    "/var/www/zhishuai/server/src/routes",
    "/var/www/zhishuai/server/src/services",
    "/var/www/zhishuai/server/src/middleware",
    "/var/www/zhishuai/shared",
    "/var/www/zhishuai/shared/api",
    "/var/www/zhishuai/web/app",
    "/var/www/zhishuai/web/app/customer",
    "/var/www/zhishuai/web/app/customer/layout",
    "/var/www/zhishuai/web/app/customer/media",
    "/var/www/zhishuai/web/app/customer/media/matrix",
    "/var/www/zhishuai/web/app/customer/social-accounts",
    "/var/www/zhishuai/web/app/customer/recruitment",
    "/var/www/zhishuai/web/app/customer/recruitment/platforms",
    "/var/www/zhishuai/web/app/notifications",
    "/var/www/zhishuai/web/components",
    "/var/www/zhishuai/web/components/layout",
    "/var/www/zhishuai/apk",
    "/var/www/zhishuai/apk/src",
    "/var/www/zhishuai/apk/src/services",
]

for d in dirs_to_check:
    out, err = run(f"ls -d '{d}' 2>&1 && echo 'EXISTS' || echo 'NOT_EXISTS'")
    exists = "EXISTS" in out
    if not exists:
        print(f"MISSING: {d}")

# 用 find 找这些文件的实际位置
print()
print("=== 查找关键文件的实际位置 ===")
files_to_find = [
    "index.ts",
    "notifications.ts",
    "oauth.ts",
    "social-account.ts",
    "browser-auth.service.ts",
    "push-service.ts",
    "config.ts",
    "Navbar.tsx",
    "notification.service.ts",
]

for pattern in files_to_find:
    out, _ = run(f"find /var/www/zhishuai -name '{pattern}' -type f 2>/dev/null | head -5")
    print(f"{pattern}:")
    for line in out.split('\n')[:5]:
        print(f"  {line}")

ssh.close()
