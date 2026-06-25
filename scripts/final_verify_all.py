# -*- coding: utf-8 -*-
import paramiko
import hashlib
import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', port=22, username='ubuntu', password='Hao20061218', timeout=30)

def run_out(cmd, timeout=15):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

local_base = r"c:\Users\Administrator\zhishuai"
remote_base = "/var/www/zhishuai"

# 所有改动过的文件
all_files = [
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
    "web/app/account/recharge/page.tsx",
    "web/app/admin/performance/page.tsx",
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
    "server/.env.example",
]

# 构建远程 md5sum 命令
paths_str = " ".join([f'"{remote_base}/{f}"' for f in all_files])
remote_out, remote_err = run_out(f"md5sum {paths_str} 2>&1")

remote_md5_map = {}
for line in remote_out.split('\n'):
    line = line.strip()
    if line and ' ' in line:
        parts = line.split(' ', 1)
        if len(parts) == 2:
            md5_hash = parts[0].strip()
            filepath = parts[1].strip()
            if remote_base in filepath:
                rel_path = filepath.replace(remote_base + '/', '')
                remote_md5_map[rel_path] = md5_hash

print("=" * 60)
print("最终验证：本地 vs 服务器 (共 {} 个文件)".format(len(all_files)))
print("=" * 60)

synced = 0
not_synced = 0

for f in all_files:
    local_path = os.path.join(local_base, f)
    
    local_md5 = "LOCAL_MISSING"
    if os.path.exists(local_path):
        with open(local_path, 'rb') as fh:
            local_md5 = hashlib.md5(fh.read()).hexdigest()
    
    remote_md5 = remote_md5_map.get(f, "REMOTE_MISSING")
    
    if local_md5 == "LOCAL_MISSING":
        print(f"  LOCAL_MISSING: {f}")
    elif remote_md5 == "REMOTE_MISSING":
        print(f"  REMOTE_MISSING: {f}")
        not_synced += 1
    elif local_md5 == remote_md5:
        synced += 1
    else:
        print(f"  DIFF: {f}")
        not_synced += 1

print(f"\nTotal: {synced} synced, {not_synced} not synced")

# 最终服务验证
print("\n" + "=" * 60)
print("服务状态验证")
print("=" * 60)

out, _ = run_out("pm2 jlist 2>&1")
import json
try:
    procs = json.loads(out)
    for p in procs:
        name = p.get('name', '?')
        status = p.get('pm2_env', {}).get('status', '?')
        print(f"  {name}: {status}")
except:
    print(out[:200])

# 测试 API
print()
print("=== API Test ===")
out, _ = run_out("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/health 2>&1")
print(f"API /health: HTTP {out}")

# 测试 Web
print()
print("=== Web Test ===")
out, _ = run_out("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>&1")
print(f"Web /: HTTP {out}")

ssh.close()
