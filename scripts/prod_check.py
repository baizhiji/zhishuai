#!/usr/bin/env python3
import subprocess, sys, io, urllib.request, urllib.error
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def run(cmd, timeout=10):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip() + r.stderr.strip()
    except Exception as e:
        return str(e)

# 1. 服务健康检查
print(">>> 1. Service Health")
for url in ["https://api.baizhiji.net/api/health", "https://baizhiji.net"]:
    try:
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        resp = urllib.request.urlopen(req, timeout=8)
        print(f"  {url}: OK {resp.getcode()}")
    except Exception as e:
        print(f"  {url}: FAIL - {str(e)[:100]}")

# 2. PM2
print("\n>>> 2. PM2 Status")
r = run('ssh -o StrictHostKeyChecking=no -o ConnectTimeout=8 ubuntu@150.109.60.130 "pm2 list"', timeout=15)
print(f"  {r[:400]}")

# 3. 服务器资源
print("\n>>> 3. Server Resources")
r = run('ssh -o StrictHostKeyChecking=no -o ConnectTimeout=8 ubuntu@150.109.60.130 "df -h / | tail -1; free -h | grep Mem; uptime"', timeout=15)
print(f"  {r}")

# 4. Mock残留检查
print("\n>>> 4. Mock code in web/app")
r = run('findstr /s /i /c:"mock" /c:"模拟" c:\\Users\\Administrator\\zhishuai\\web\\app\\*.tsx c:\\Users\\Administrator\\zhishuai\\web\\app\\*.ts 2>nul | findstr /v node_modules | findstr /v ".next"')
lines = [l.strip() for l in r.split('\n') if l.strip()][:15]
print(f"  {len(lines)} lines found")
for l in lines:
    print(f"  {l[:120]}")

print("\n>>> 5. Mock code in apk/src")
r = run('findstr /s /i /c:"mock" /c:"模拟" c:\\Users\\Administrator\\zhishuai\\apk\\src\\*.tsx c:\\Users\\Administrator\\zhishuai\\apk\\src\\*.ts 2>nul | findstr /v node_modules')
lines = [l.strip() for l in r.split('\n') if l.strip()][:15]
print(f"  {len(lines)} lines found")
for l in lines:
    print(f"  {l[:120]}")

print("\nDone.")
