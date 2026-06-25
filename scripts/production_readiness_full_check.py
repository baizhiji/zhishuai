#!/usr/bin/env python3
"""
全面生产就绪检查 - 检查 WEB端 和 APK端 是否能真实投入客户使用
"""
import subprocess
import sys
import io
import urllib.request
import urllib.error
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def run(cmd, timeout=15):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip() + "\n" + r.stderr.strip()
    except Exception as e:
        return str(e)

print("=" * 60)
print("智枢 AI SaaS 系统 - 生产就绪全面检查")
print("=" * 60)

# 1. 检查服务状态
print("\n>>> 1. 服务健康检查")
for url in ["https://api.baizhiji.net/api/health", "https://baizhiji.net"]:
    try:
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        resp = urllib.request.urlopen(req, timeout=10)
        print(f"  {url}: HTTP {resp.getcode()} OK")
    except Exception as e:
        print(f"  {url}: FAILED - {e}")

# 2. 检查 PM2 状态
print("\n>>> 2. PM2 进程状态")
ssh_cmd = 'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@150.109.60.130 "pm2 jlist"'
result = run(ssh_cmd)
print(f"  {result[:500]}")

# 3. 检查关键路由
print("\n>>> 3. 关键 API 路由检查")
for route in [
    "/api/auth/login",
    "/api/account/profile",
    "/api/recruitment/jobs",
    "/api/acquisition/leads",
    "/api/share/list",
    "/api/materials/list",
    "/api/referral/list",
    "/api/employee/list",
    "/api/oauth/platforms",
    "/api/notifications/list",
]:
    try:
        url = f"https://api.baizhiji.net{route}"
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        resp = urllib.request.urlopen(req, timeout=5)
        print(f"  {route}: HTTP {resp.getcode()}")
    except urllib.error.HTTPError as e:
        code = e.code
        if code in (401, 403):
            print(f"  {route}: HTTP {code} (需要认证 - 正常)")
        elif code == 404:
            print(f"  {route}: HTTP 404 (路由未找到)")
        else:
            print(f"  {route}: HTTP {code}")
    except Exception as e:
        print(f"  {route}: 连接失败 - {e}")

# 4. 数据库连接检查
print("\n>>> 4. 数据库连接检查")
db_cmd = 'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@150.109.60.130 "cd /var/www/zhishuai/server && npx prisma db execute --stdin" 2>&1'
print(f"  (跳过 - 需要交互式输入)")

# 5. 检查哪些页面还是 mock/模拟
print("\n>>> 5. 搜索 web/app 中残留的 mock/模拟 代码")
r = run('cd c:\\Users\\Administrator\\zhishuai && findstr /s /i /c:"mock" /c:"模拟" web\\app\\*.tsx web\\app\\*.ts 2>nul | findstr /v node_modules | findstr /v ".next"')
if r.strip():
    for line in r.strip().split('\n')[:20]:
        print(f"  {line}")
else:
    print("  未发现 mock/模拟 残留")

print("\n>>> 6. 搜索 apk/src 中残留的 mock/模拟 代码")
r = run('cd c:\\Users\\Administrator\\zhishuai && findstr /s /i /c:"mock" /c:"模拟" apk\\src\\*.tsx apk\\src\\*.ts 2>nul | findstr /v node_modules')
if r.strip():
    for line in r.strip().split('\n')[:20]:
        print(f"  {line}")
else:
    print("  未发现 mock/模拟 残留")

# 7. 检查 SSL 证书
print("\n>>> 7. SSL 证书检查")
r = run('curl -sI https://baizhiji.net 2>&1 | findstr /i "HTTP SSL"')
print(f"  {r.strip()}")

# 8. 磁盘/内存
print("\n>>> 8. 服务器资源")
disk_cmd = 'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@150.109.60.130 "df -h / | tail -1"'
print(f"  磁盘: {run(disk_cmd)}")
mem_cmd = 'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@150.109.60.130 "free -h | grep Mem"'
print(f"  内存: {run(mem_cmd)}")

# 9. 检查 Nginx
print("\n>>> 9. Nginx 状态")
nginx_cmd = 'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@150.109.60.130 "sudo systemctl is-active nginx && sudo nginx -t 2>&1"'
print(f"  {run(nginx_cmd)}")

print("\n" + "=" * 60)
print("检查完成")
print("=" * 60)
