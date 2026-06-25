#!/usr/bin/env python3
"""修复Web前端：上传修复脚本到服务器执行"""
import paramiko, sys, time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"

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

# Write a fix script to remote server
fix_script = r'''
#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Fix 1: account/page.tsx
print("[Fix1] account/page.tsx")
f1 = '/var/www/zhishuai/web/app/account/page.tsx'
with open(f1, 'r') as f:
    c1 = f.read()

old = "icon: <s.iconType === 'media' ? SafetyCertificateOutlined : s.iconType === 'recruit' ? CrownOutlined : s.iconType === 'acquisition' ? SafetyCertificateOutlined : TrophyOutlined />"
new = "icon: s.iconType === 'media' ? <SafetyCertificateOutlined /> : s.iconType === 'recruit' ? <CrownOutlined /> : s.iconType === 'acquisition' ? <SafetyCertificateOutlined /> : <TrophyOutlined />"

if old in c1:
    c1 = c1.replace(old, new)
    with open(f1, 'w') as f:
        f.write(c1)
    print("  FIXED!")
else:
    print("  Pattern not found, already fixed or different content")
    # Show current line
    for line in c1.split('\n'):
        if 's.iconType' in line:
            print(f"  Current: {line.strip()}")

# Fix 2: performance/page.tsx - remove orphaned mock data after fetchAgentPerformance
print("[Fix2] performance/page.tsx")
f2 = '/var/www/zhishuai/web/app/admin/performance/page.tsx'
with open(f2, 'r') as f:
    lines = f.readlines()

print(f"  Original: {len(lines)} lines")

# Find the orphaned block: lines starting with "      customers: 85," after "  };"
new_lines = []
i = 0
while i < len(lines):
    new_lines.append(lines[i])
    # If this line is "  };" closing fetchAgentPerformance, and next line starts with "      customers:"
    if lines[i].strip() == '};' and i+1 < len(lines) and 'customers:' in lines[i+1] and '85' in lines[i+1]:
        # Skip orphaned data block until we find "  ];"
        i += 1
        while i < len(lines) and lines[i].strip() != '];':
            i += 1
        i += 1  # skip the ]; line too
        continue
    i += 1

with open(f2, 'w') as f:
    f.writelines(new_lines)
print(f"  Fixed: {len(new_lines)} lines (removed {len(lines) - len(new_lines)} orphaned lines)")

print("\n[DONE] Both files fixed!")
'''

# Write fix script to remote
sftp = client.open_sftp()
with sftp.open('/tmp/fix_tsx.py', 'w') as f:
    f.write(fix_script)
sftp.close()
print("  修复脚本已上传")

# Execute fix script on remote
print("\n[2] 执行修复...")
out, err = run("python3 /tmp/fix_tsx.py 2>&1")
print(out)

# ===== Step 3: Clean and rebuild =====
print("\n[3] 清除旧构建产物...")
run("rm -rf /var/www/zhishuai/web/.next")
print("  清除完成")

# ===== Step 4: Build =====
print("\n[4] Next.js 构建 (预计2-3分钟)...")
out, err = run("cd /var/www/zhishuai/web && NODE_ENV=production npm run build 2>&1", timeout=300)

if 'Failed to compile' in out:
    err_idx = out.find('Failed to compile')
    print(f"  构建失败:\n{out[err_idx:err_idx+2000]}")
    client.close()
    sys.exit(1)
else:
    print(f"  构建完成!")

# ===== Step 5: Verify BUILD_ID =====
print("\n[5] 验证构建...")
out, err = run("cat /var/www/zhishuai/web/.next/BUILD_ID 2>&1")
build_id = out.strip()
print(f"  BUILD_ID: {build_id}")

if not build_id or 'No such file' in build_id:
    print("  构建产物缺失!")
    client.close()
    sys.exit(1)

# ===== Step 6: Restart =====
print("\n[6] 重启Web服务...")
run("pm2 delete zhishuai-web 2>/dev/null")
out, err = run("cd /var/www/zhishuai/web && pm2 start ecosystem.config.cjs 2>&1")
if 'online' in out.lower():
    print("  启动成功!")
else:
    print(f"  启动输出: {out[-200:]}")
run("pm2 save 2>/dev/null")

# ===== Step 7: Verify =====
print("\n[7] 等待20秒验证...")
time.sleep(20)

out, err = run("pm2 status 2>&1")
print(out)

out, err = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>&1")
print(f"  localhost:3000: {out.strip()}")

out, err = run("curl -s -o /dev/null -w '%{http_code}' https://baizhiji.net 2>&1")
print(f"  baizhiji.net: {out.strip()}")

if out.strip() != '200':
    print("\n  查看Web日志:")
    out, err = run("pm2 logs zhishuai-web --lines 15 --nostream 2>&1")
    print(out[-1000:])

client.close()
