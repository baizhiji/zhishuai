# -*- coding: utf-8 -*-
import paramiko
import hashlib
import os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', port=22, username='ubuntu', password='Hao20061218', timeout=15)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    return stdout.read().decode('utf-8', errors='replace').strip()

sftp = ssh.open_sftp()

# 本地和服务器都是 zhishuai 根目录
local_base = r"c:\Users\Administrator\zhishuai"
remote_base = "/var/www/zhishuai"

# 最近改动的关键文件
files_to_check = [
    "server/src/index.ts",
    "server/src/middleware/auth.ts",
    "server/src/routes/auth.ts",
    "server/src/routes/account.ts",
    "server/src/routes/notifications.ts",
    "server/src/routes/oauth.ts",
    "server/src/routes/publish.ts",
    "server/src/routes/social-account.ts",
    "server/src/services/browser-auth.service.ts",
    "server/src/services/push-service.ts",
    "server/src/services/scheduler.ts",
    "server/prisma/schema.prisma",
    "shared/api/config.ts",
    "web/app/account/page.tsx",
    "web/app/customer/layout/Navbar.tsx",
    "web/app/customer/page.tsx",
    "web/app/customer/media/matrix/page.tsx",
    "web/app/customer/social-accounts/page.tsx",
    "web/app/customer/recruitment/platforms/page.tsx",
    "web/components/layout/Navbar.tsx",
    "web/app/notifications/page.tsx",
    "web/next.config.js",
    "docker-compose.yml",
    "ecosystem.config.js",
    "server/.env.example",
    "apk/src/services/notification.service.ts",
    "web/app/admin/performance/page.tsx",
    "web/app/account/recharge/page.tsx",
]

print("=" * 80)
print("逐文件对比：本地 vs 服务器 MD5")
print("=" * 80)

not_synced = []
synced = []

for f in files_to_check:
    local_path = os.path.join(local_base, f)
    remote_path = os.path.join(remote_base, f)
    
    local_md5 = "??"
    if os.path.exists(local_path):
        with open(local_path, 'rb') as fh:
            local_md5 = hashlib.md5(fh.read()).hexdigest()[:12]
    
    remote_md5 = "??"
    try:
        out = run(f"md5sum {remote_path}")
        if out:
            remote_md5 = out.split()[0][:12]
    except:
        remote_md5 = "MISSING"
    
    status = "OK" if local_md5 == remote_md5 else "DIFF"
    if status == "OK":
        synced.append(f)
    else:
        not_synced.append(f)
        print(f"[{status}] {f}")
        print(f"        local={local_md5}  remote={remote_md5}")

print()
print(f"已同步: {len(synced)}/{len(files_to_check)}, 未同步: {len(not_synced)}/{len(files_to_check)}")

if not_synced:
    print()
    print("未同步文件列表:")
    for f in not_synced:
        print(f"  - {f}")

# 检查服务器上次 git pull 时间和本地 git log 差异
print()
print("=" * 80)
print("服务器 Git 状态")
print("=" * 80)
out = run("cd /var/www/zhishuai && git log --oneline -1")
print(f"服务器 HEAD: {out}")
out = run("cd /var/www/zhishuai && git status --short | head -20")
print(f"服务器未提交改动:\n{out}")

print()
print("=" * 80)
print("服务器 dist 构建产物时间")
print("=" * 80)
out = run("ls -la /var/www/zhishuai/server/dist/index.js /var/www/zhishuai/server/dist/routes/ /var/www/zhishuai/server/dist/services/")
print(out)

sftp.close()
ssh.close()
