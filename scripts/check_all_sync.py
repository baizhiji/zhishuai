# -*- coding: utf-8 -*-
import paramiko
import hashlib
import os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', port=22, username='ubuntu', password='Hao20061218', timeout=15)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out.strip(), err.strip()

sftp = ssh.open_sftp()

# 关键文件列表 - 检查 md5
key_files = [
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
]

local_base = r"c:\Users\Administrator\zhishuai"
remote_base = "/var/www/zhishuai"

print("=" * 80)
print("本地 vs 服务器 文件差异检查")
print("=" * 80)

synced = 0
not_synced = 0
missing = 0

for f in key_files:
    local_path = os.path.join(local_base, f)
    remote_path = os.path.join(remote_base, f)
    
    # 本地 MD5
    local_md5 = "NOT_FOUND"
    if os.path.exists(local_path):
        with open(local_path, 'rb') as fh:
            local_md5 = hashlib.md5(fh.read()).hexdigest()
    
    # 远程 MD5
    remote_md5 = "NOT_FOUND"
    try:
        remote_stat = sftp.stat(remote_path)
        out, _ = run(f"md5sum {remote_path}")
        if out:
            remote_md5 = out.split()[0]
    except:
        remote_md5 = "MISSING"
    
    if local_md5 == "NOT_FOUND":
        print(f"?? {f}: 本地文件不存在")
        missing += 1
    elif remote_md5 == "MISSING":
        print(f"XX {f}: 服务器文件不存在!")
        not_synced += 1
    elif local_md5 == remote_md5:
        synced += 1
    else:
        print(f"!! {f}: 不一致 (本地={local_md5[:8]}... vs 远程={remote_md5[:8]}...)")
        not_synced += 1

print()
print(f"已同步: {synced}, 未同步: {not_synced}, 缺失: {missing}")
print()

# 检查 Git 对比
print("=" * 80)
print("Git Log (服务器 vs 本地)")
print("=" * 80)
out, _ = run("cd /var/www/zhishuai && git log --oneline -5")
print(f"服务器: {out}")

# 检查服务器上的 git diff
print()
print("=" * 80)
print("服务器上未提交的改动")
print("=" * 80)
out, _ = run("cd /var/www/zhishuai && git diff --stat HEAD")
print(out if out else "(无未提交改动)")

# 检查PM2当前运行的代码版本
print()
print("=" * 80)
print("PM2 进程详情")
print("=" * 80)
out, _ = run("pm2 jlist 2>&1")
import json
try:
    procs = json.loads(out)
    for p in procs:
        name = p.get('name', '?')
        status = p.get('pm2_env', {}).get('status', '?')
        uptime = p.get('pm2_env', {}).get('pm_uptime', 0)
        restart = p.get('pm2_env', {}).get('restart_time', 0)
        exec_interpreter = p.get('pm2_env', {}).get('exec_interpreter', '?')
        import datetime
        uptime_str = datetime.datetime.fromtimestamp(uptime/1000).strftime('%Y-%m-%d %H:%M:%S') if uptime else 'N/A'
        restart_str = datetime.datetime.fromtimestamp(restart).strftime('%Y-%m-%d %H:%M:%S') if restart else 'N/A'
        print(f"  {name}: status={status}, 启动时间={uptime_str}, 重启次数={p.get('pm2_env',{}).get('unstable_restarts',0)}")
except:
    print(out)

sftp.close()
ssh.close()
