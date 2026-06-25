#!/usr/bin/env python3
"""检查并修复远程服务"""
import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8','replace'), stderr.read().decode('utf-8','replace')

# Check web logs
print("=== Web PM2 日志 ===")
out, err = run("pm2 logs zhishuai-web --lines 20 --nostream 2>&1")
print(out[-1500:])

# Check Nginx conflicting configs
print("\n=== Nginx 已启用站点 ===")
out, err = run("ls -la /etc/nginx/sites-enabled/")
print(out)

# Check all nginx configs for server_name
print("\n=== 所有含baizhiji的nginx配置 ===")
out, err = run("grep -l 'baizhiji' /etc/nginx/sites-enabled/* /etc/nginx/conf.d/* 2>/dev/null")
print(out)

# Wait for web to start
print("\n=== 等待Web启动 (15秒) ===")
time.sleep(15)

# Check web status
out, err = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000")
print(f"Web HTTP status: {out}")

# Check PM2 status
out, err = run("pm2 status 2>&1")
print(out)

# Check full health
out, err = run("curl -s http://localhost:3001/api/health")
print(f"API health: {out}")

client.close()
