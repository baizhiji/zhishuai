# -*- coding: utf-8 -*-
import paramiko
import hashlib
import os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', port=22, username='ubuntu', password='Hao20061218', timeout=15)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

local_base = r"c:\Users\Administrator\zhishuai"
remote_base = "/var/www/zhishuai"

# 先获取所有远程文件MD5（一次命令）
remote_files = [
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
    "apk/src/services/notification.service.ts",
    "web/app/admin/performance/page.tsx",
    "web/app/account/recharge/page.tsx",
    "server/.env.example",
]

# 构建远程命令
paths_str = " ".join([f'"{remote_base}/{f}"' for f in remote_files])
cmd = f"md5sum {paths_str} 2>&1"
remote_out, remote_err = run(cmd)

# 解析远程 MD5
remote_md5_map = {}
for line in remote_out.split('\n'):
    line = line.strip()
    if line and ' ' in line:
        parts = line.split(' ', 1)
        if len(parts) == 2:
            md5_hash = parts[0].strip()
            filepath = parts[1].strip()
            # 提取相对路径
            if remote_base in filepath:
                rel_path = filepath.replace(remote_base + '/', '')
                remote_md5_map[rel_path] = md5_hash

print("=" * 80)
print("本地 vs 服务器 MD5 对比 (共 {} 个文件)".format(len(remote_files)))
print("=" * 80)

synced = []
not_synced = []
missing_remote = []

for f in remote_files:
    local_path = os.path.join(local_base, f)
    
    local_md5 = "LOCAL_MISSING"
    if os.path.exists(local_path):
        with open(local_path, 'rb') as fh:
            local_md5 = hashlib.md5(fh.read()).hexdigest()
    
    remote_md5 = remote_md5_map.get(f, "REMOTE_MISSING")
    
    if local_md5 == "LOCAL_MISSING":
        print(f"  LOCAL_MISSING: {f}")
    elif remote_md5 == "REMOTE_MISSING":
        missing_remote.append(f)
        print(f"  REMOTE_MISSING: {f}")
    elif local_md5 == remote_md5:
        synced.append(f)
    else:
        not_synced.append(f)
        print(f"  DIFF: {f}")
        print(f"        local  = {local_md5}")
        print(f"        remote = {remote_md5}")

print()
print(f"Summary: synced={len(synced)}, not_synced={len(not_synced)}, missing_remote={len(missing_remote)}")

if synced:
    print()
    print("已同步 (服务端与本地一致):")
    for f in synced:
        print(f"  OK: {f}")

if not_synced:
    print()
    print("未同步 (需要更新):")
    for f in not_synced:
        print(f"  !! {f}")

if missing_remote:
    print()
    print("服务器上不存在的文件:")
    for f in missing_remote:
        print(f"  ?? {f}")

# 检查服务器构建产物时间
print()
print("=" * 80)
print("服务器 dist 构建时间")
print("=" * 80)
out, _ = run("stat -c '%n %y' /var/www/zhishuai/server/dist/index.js /var/www/zhishuai/web/.next/BUILD_ID")
print(out)
out, _ = run("cat /var/www/zhishuai/web/.next/BUILD_ID")
print(f"Web BUILD_ID: {out}")

ssh.close()
