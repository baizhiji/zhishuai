#!/usr/bin/env python3
"""修复Web构建和Nginx配置"""
import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)

def run(cmd, timeout=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8','replace')
    err = stderr.read().decode('utf-8','replace')
    code = stdout.channel.recv_exit_status()
    return code, out, err

def run_stream(cmd, timeout=600):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    output = ''
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            data = stdout.channel.recv(4096).decode('utf-8','replace')
            output += data
            print(data, end='', flush=True)
        if stdout.channel.recv_stderr_ready():
            data = stdout.channel.recv_stderr(4096).decode('utf-8','replace')
            output += data
            print(data, end='', flush=True)
        time.sleep(0.1)
    remaining = stdout.read().decode('utf-8','replace')
    remaining_err = stderr.read().decode('utf-8','replace')
    output += remaining + remaining_err
    if remaining: print(remaining, end='', flush=True)
    if remaining_err: print(remaining_err, end='', flush=True)
    code = stdout.channel.recv_exit_status()
    return code, output

# ===== Step 1: Build web on remote =====
print("[1/4] 在远程服务器构建Web前端...")
print("  检查.next目录...")
code, out, err = run("ls -la /var/www/zhishuai/web/.next/BUILD_ID 2>/dev/null || echo NO_BUILD")
print(f"  结果: {out.strip()}")

if 'NO_BUILD' in out:
    print("  .next不存在，需要构建。先确认web依赖...")
    code, out, err = run("ls /var/www/zhishuai/web/node_modules/.package-lock.json 2>/dev/null || echo NO_MODULES")
    
    if 'NO_MODULES' in out:
        print("  安装web依赖...")
        code, out = run_stream("cd /var/www/zhishuai/web && npm install 2>&1 && echo INSTALL_OK", timeout=300)
    else:
        print("  依赖已存在。")
    
    print("  构建Next.js生产版本...")
    code, out = run_stream("cd /var/www/zhishuai/web && NODE_ENV=production npm run build 2>&1 && echo BUILD_OK", timeout=600)
    
    if 'BUILD_OK' in out:
        print("\n  Web构建成功!")
    else:
        print(f"\n  构建可能失败，输出末尾: {out[-500:]}")
        # Check if BUILD_ID exists despite errors
        code, out2, err2 = run("ls -la /var/www/zhishuai/web/.next/BUILD_ID 2>/dev/null || echo STILL_NO_BUILD")
        if 'STILL_NO_BUILD' not in out2:
            print("  但.next/BUILD_ID存在，构建可能部分成功。")
        else:
            print("  构建确实失败，尝试用dev模式启动...")
else:
    print("  .next构建产物已存在，跳过构建。")

# ===== Step 2: Clean up Nginx configs =====
print("\n[2/4] 清理Nginx冲突配置...")
# Remove old conflicting configs
code, out, err = run("sudo rm -f /etc/nginx/sites-enabled/api-baizhiji /etc/nginx/sites-enabled/baizhiji 2>&1 && echo CLEAN_OK")
print(f"  清理旧配置: {out.strip()}")

# Reload nginx
code, out, err = run("sudo nginx -t 2>&1 && sudo systemctl reload nginx 2>&1 && echo NGINX_OK || echo NGINX_FAIL")
print(f"  Nginx重载: {out.strip()}")

# ===== Step 3: Restart Web =====
print("\n[3/4] 重启Web服务...")
code, out, err = run("pm2 delete zhishuai-web 2>/dev/null; cd /var/www/zhishuai/web && pm2 start ecosystem.config.cjs 2>&1")
print(f"  启动结果: {out[-200:]}")
run("pm2 save 2>/dev/null")

# ===== Step 4: Verify =====
print("\n[4/4] 等待服务就绪并验证...")
time.sleep(10)

code, out, err = run("pm2 status 2>&1")
print(out)

code, out, err = run("curl -s http://localhost:3001/api/health 2>/dev/null")
print(f"  API: {out}")

code, out, err = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>/dev/null")
print(f"  Web: HTTP {out}")

# External check
code, out, err = run("curl -sk -o /dev/null -w '%{http_code}' https://baizhiji.net 2>/dev/null")
print(f"  外部Web: HTTPS {out}")

code, out, err = run("curl -sk https://baizhiji.net/api/health 2>/dev/null")
print(f"  外部API: {out}")

client.close()
print("\n修复完成!")
