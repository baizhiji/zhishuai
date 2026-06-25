#!/usr/bin/env python3
"""修复Web前端：上传修复后的TSX文件 + 重新构建 + 重启服务"""
import paramiko, sys, time, os

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"
LOCAL_WEB = "C:/Users/Administrator/zhishuai/web"
REMOTE_WEB = "/var/www/zhishuai/web"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print("[1] 连接服务器...")
client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
print("  连接成功!")

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', 'replace')
    err = stderr.read().decode('utf-8', 'replace')
    return out, err

# ===== Step 2: Upload fixed files via cat/heredoc =====
print("\n[2] 上传修复后的文件...")

files_to_upload = [
    ("app/account/page.tsx", "/var/www/zhishuai/web/app/account/page.tsx"),
    ("app/admin/performance/page.tsx", "/var/www/zhishuai/web/app/admin/performance/page.tsx"),
]

for local_rel, remote_path in files_to_upload:
    local_path = os.path.join(LOCAL_WEB, local_rel)
    print(f"  上传 {local_rel} -> {remote_path}...")
    
    # Read local file content
    with open(local_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Ensure remote directory exists
    remote_dir = os.path.dirname(remote_path)
    run(f"mkdir -p {remote_dir}")
    
    # Use SCP-style: write to temp file then move
    # Escape content for shell - use base64 to avoid escaping issues
    import base64
    encoded = base64.b64encode(content.encode('utf-8')).decode('ascii')
    
    out, err = run(f"echo '{encoded}' | base64 -d > '{remote_path}' && echo UPLOAD_OK || echo UPLOAD_FAIL", timeout=15)
    
    if 'UPLOAD_OK' in out:
        print(f"    OK!")
    else:
        print(f"    上传可能有问题: {out[:100]}")
        # Fallback: try SFTP with explicit mkdir
        run(f"sudo chown -R ubuntu:ubuntu /var/www/zhishuai/web/app/ 2>/dev/null")
        sftp = client.open_sftp()
        try:
            with sftp.open(remote_path, 'w') as rf:
                rf.write(content)
            print(f"    SFTP上传OK!")
        except Exception as e2:
            print(f"    SFTP也失败: {e2}")
        sftp.close()

print("  所有文件上传完成!")

# ===== Step 3: Verify uploaded files =====
print("\n[3] 验证上传文件...")
out, err = run("head -3 /var/www/zhishuai/web/app/account/page.tsx 2>&1")
print(f"  account/page.tsx开头: {out.strip()[:100]}")

out, err = run("grep -n 's.iconType' /var/www/zhishuai/web/app/account/page.tsx 2>&1")
print(f"  account/page.tsx iconType行: {out.strip()}")

out, err = run("wc -l /var/www/zhishuai/web/app/admin/performance/page.tsx 2>&1")
print(f"  performance/page.tsx行数: {out.strip()}")

# ===== Step 4: Clean .next and rebuild =====
print("\n[4] 清除旧构建产物...")
out, err = run("rm -rf /var/www/zhishuai/web/.next 2>&1")
print(f"  清除完成")

# ===== Step 5: Run npm run build =====
print("\n[5] 执行 Next.js 构建 (预计2-3分钟)...")
out, err = run("cd /var/www/zhishuai/web && NODE_ENV=production npm run build 2>&1", timeout=300)

# Show build result
last_500 = out[-500:]
if 'Build completed' in out or 'Compiled successfully' in out or '✓' in out or 'Creating an optimized' in out and 'Failed' not in out:
    print(f"  构建成功! 输出末尾: {last_500[:200]}")
elif 'Failed to compile' in out:
    print(f"  构建失败! 错误信息:")
    # Find error section
    err_start = out.find('Failed to compile')
    if err_start > 0:
        print(out[err_start:err_start+2000])
    else:
        print(out[-2000:])
else:
    print(f"  构建输出(末尾): {last_500}")

# ===== Step 6: Verify BUILD_ID =====
print("\n[6] 验证构建产物...")
out, err = run("cat /var/www/zhishuai/web/.next/BUILD_ID 2>&1")
build_id = out.strip()
print(f"  BUILD_ID: {build_id}")

if build_id and 'No such file' not in build_id and 'error' not in build_id.lower() and 'cat' not in build_id.lower():
    print("  构建产物完整!")
else:
    print("  构建产物缺失!")
    client.close()
    sys.exit(1)

# ===== Step 7: Restart web service =====
print("\n[7] 重启Web前端服务...")
out, err = run("pm2 delete zhishuai-web 2>/dev/null; echo DONE")

out, err = run("cd /var/www/zhishuai/web && pm2 start ecosystem.config.cjs 2>&1")
print(f"  启动结果: {out[-300:]}")

run("pm2 save 2>/dev/null")
print("  PM2配置已保存")

# ===== Step 8: Wait and verify =====
print("\n[8] 等待服务启动 (20秒)...")
time.sleep(20)

out, err = run("pm2 status 2>&1")
print(out)

# Check localhost:3000
out, err = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>&1")
web_status = out.strip()
print(f"  Web localhost状态码: {web_status}")

# Check domain
out, err = run("curl -s -o /dev/null -w '%{http_code}' https://baizhiji.net 2>&1")
domain_status = out.strip()
print(f"  域名HTTPS状态码: {domain_status}")

# Check API
out, err = run("curl -s http://localhost:3001/api/health 2>&1")
print(f"  API健康检查: {out.strip()[:200]}")

# Web logs if still failing
if web_status == '000' or domain_status == '502':
    print("\n[诊断] Web服务仍有问题，查看日志:")
    out, err = run("pm2 logs zhishuai-web --lines 20 --nostream 2>&1")
    print(out[-1500:])

client.close()

if domain_status == '200':
    print("\n✅ Web前端已恢复! 访问 https://baizhiji.net")
elif web_status == '200':
    print("\n✅ Web localhost可用, 域名可能需要检查Nginx配置")
else:
    print(f"\n⚠️ 状态: localhost={web_status}, domain={domain_status}")
