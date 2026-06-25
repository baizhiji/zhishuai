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

# 先测试 md5sum 是否可用
out, err = run("which md5sum")
print(f"md5sum path: '{out}', err: '{err}'")
out, err = run("md5sum /var/www/zhishuai/server/src/index.ts")
print(f"md5sum test: '{out}', err: '{err}'")
out, err = run("md5sum --version 2>&1")
print(f"md5sum version: '{out}'")

# 如果 md5sum 不可用，用 python hashlib
out, err = run("python3 -c \"import hashlib; print(hashlib.md5(open('/var/www/zhishuai/server/src/index.ts','rb').read()).hexdigest())\"")
print(f"python md5 test: '{out}', err: '{err}'")

local_base = r"c:\Users\Administrator\zhishuai"
remote_base = "/var/www/zhishuai"

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
    "apk/src/services/notification.service.ts",
]

print()
print("=" * 80)
print("本地 vs 服务器 MD5 对比")
print("=" * 80)

not_synced = []
synced = []

for f in files_to_check:
    local_path = os.path.join(local_base, f)
    remote_path = os.path.join(remote_base, f)
    
    local_md5 = "??"
    if os.path.exists(local_path):
        with open(local_path, 'rb') as fh:
            local_md5 = hashlib.md5(fh.read()).hexdigest()[:16]
    
    # 用 python 在远程计算 md5
    remote_cmd = f"python3 -c \"import hashlib; print(hashlib.md5(open('{remote_path}','rb').read()).hexdigest()[:16])\""
    remote_md5, err = run(remote_cmd)
    if err:
        remote_md5 = f"ERR:{err[:30]}"
    
    if local_md5 == remote_md5:
        synced.append(f)
    else:
        not_synced.append(f)
        diff_len = "?"
        if os.path.exists(local_path):
            try:
                sftp = ssh.open_sftp()
                remote_size = sftp.stat(remote_path).st_size
                local_size = os.path.getsize(local_path)
                diff_len = f"{local_size} vs {remote_size} ({local_size - remote_size:+d})"
                sftp.close()
            except:
                diff_len = "size err"
        print(f"  DIFF: {f}")
        print(f"        local={local_md5}  remote={remote_md5}  size={diff_len}")

print()
print(f"Summary: synced={len(synced)}/{len(files_to_check)}, not_synced={len(not_synced)}/{len(files_to_check)}")

# 列出所有已同步的文件
if synced:
    print()
    print("已同步的文件:")
    for f in synced:
        print(f"  OK: {f}")

# 列出未同步的
if not_synced:
    print()
    print("未同步的文件:")
    for f in not_synced:
        print(f"  !! {f}")

ssh.close()
