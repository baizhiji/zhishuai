#!/usr/bin/env python3
"""修复Web前端：通过SSH sed命令修复远程文件 + 重新构建 + 重启"""
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

# ===== Fix 1: account/page.tsx line 41 =====
# Original: icon: <s.iconType === 'media' ? SafetyCertificateOutlined : ...
# Fix: icon: s.iconType === 'media' ? <SafetyCertificateOutlined /> : ...
print("\n[2] 修复 account/page.tsx...")

# First check current content
out, err = run("grep -n 'icon:' /var/www/zhishuai/web/app/account/page.tsx | head -3")
print(f"  当前icon行: {out.strip()}")

# Use Python on remote to fix the file (more reliable than sed for complex replacements)
fix_account_script = """
import re
f = '/var/www/zhishuai/web/app/account/page.tsx'
with open(f, 'r') as fh:
    content = fh.read()

# Fix: change icon: <s.iconType === ... /> to icon: s.iconType === ... ? <Component /> : ...
old = "icon: <s.iconType === 'media' ? SafetyCertificateOutlined : s.iconType === 'recruit' ? CrownOutlined : s.iconType === 'acquisition' ? SafetyCertificateOutlined : TrophyOutlined />"
new = "icon: s.iconType === 'media' ? <SafetyCertificateOutlined /> : s.iconType === 'recruit' ? <CrownOutlined /> : s.iconType === 'acquisition' ? <SafetyCertificateOutlined /> : <TrophyOutlined />"
content = content.replace(old, new)

with open(f, 'w') as fh:
    fh.write(content)
print('FIXED_ACCOUNT')
"""

# Write the fix script to remote and execute
out, err = run("python3 -c \"" + fix_account_script.replace('"', '\\\"').replace('\n', ' ') + "\" 2>&1")
print(f"  修复结果: {out.strip()}")

# Verify
out, err = run("grep -n 'icon:' /var/www/zhishuai/web/app/account/page.tsx | head -1")
print(f"  修复后: {out.strip()}")

# ===== Fix 2: performance/page.tsx - remove orphaned mock data =====
print("\n[3] 修复 performance/page.tsx...")

out, err = run("wc -l /var/www/zhishuai/web/app/admin/performance/page.tsx")
print(f"  当前行数: {out.strip()}")

# Check the problematic area
out, err = run("sed -n '84,92p' /var/www/zhishuai/web/app/admin/performance/page.tsx")
print(f"  问题区域(84-92行):\n{out}")

# Use Python on remote to fix
fix_perf_script = """
f = '/var/www/zhishuai/web/app/admin/performance/page.tsx'
with open(f, 'r') as fh:
    lines = fh.readlines()

# Find the function end line (line with just '  };') and remove orphaned data after it
# Look for pattern: }; followed by lines that start with '      customers:' etc.
new_lines = []
skip_orphan = False
i = 0
while i < len(lines):
    line = lines[i]
    # Check if this is the end of fetchAgentPerformance and next lines are orphaned
    if line.strip() == '};' and i+1 < len(lines) and lines[i+1].strip().startswith('customers:'):
        new_lines.append(line)
        # Skip until we find a line ending with '];'
        skip_orphan = True
        i += 1
        while i < len(lines):
            if lines[i].strip() == '];':
                skip_orphan = False
                i += 1
                break
            i += 1
        continue
    new_lines.append(line)
    i += 1

with open(f, 'w') as fh:
    fh.writelines(new_lines)
print(f'FIXED_PERF: {len(lines)} -> {len(new_lines)} lines')
"""

out, err = run("python3 -c \"" + fix_perf_script.replace('"', '\\\"').replace('\n', ' ') + "\" 2>&1")
print(f"  修复结果: {out.strip()}")

out, err = run("wc -l /var/www/zhishuai/web/app/admin/performance/page.tsx")
print(f"  新行数: {out.strip()}")

# ===== Step 4: Clean and rebuild =====
print("\n[4] 清除旧构建产物...")
run("rm -rf /var/www/zhishuai/web/.next")

print("\n[5] 执行 Next.js 构建 (预计2-3分钟)...")
out, err = run("cd /var/www/zhishuai/web && NODE_ENV=production npm run build 2>&1", timeout=300)

# Show critical parts of output
if 'Failed to compile' in out:
    # Extract error
    err_idx = out.find('Failed to compile')
    print(f"  构建失败! 错误:\n{out[err_idx:err_idx+1500]}")
    client.close()
    sys.exit(1)
elif 'Build error' in out or 'error' in out.lower() and 'build' in out.lower():
    print(f"  可能构建失败，输出末尾:\n{out[-500:]}")
else:
    # Show success info
    # Find the success line
    for marker in ['Creating an optimized', 'Linting and checking', 'Collecting page data', 'Generating static', 'Finalizing page']:
        idx = out.find(marker)
        if idx >= 0:
            print(f"  {out[idx:idx+200]}")
    print(f"  构建完成!")

# ===== Step 5: Verify BUILD_ID =====
print("\n[6] 验证构建产物...")
out, err = run("cat /var/www/zhishuai/web/.next/BUILD_ID 2>&1")
build_id = out.strip()
print(f"  BUILD_ID: {build_id}")

if not build_id or 'No such file' in build_id or 'error' in build_id.lower():
    print("  构建产物缺失!")
    client.close()
    sys.exit(1)

# ===== Step 6: Restart web =====
print("\n[7] 重启Web前端服务...")
run("pm2 delete zhishuai-web 2>/dev/null")

out, err = run("cd /var/www/zhishuai/web && pm2 start ecosystem.config.cjs 2>&1")
# Check if started
if 'online' in out.lower():
    print("  Web服务启动成功!")
else:
    print(f"  启动输出: {out[-300:]}")

run("pm2 save 2>/dev/null")

# ===== Step 7: Wait and verify =====
print("\n[8] 等待服务启动 (20秒)...")
time.sleep(20)

out, err = run("pm2 status 2>&1")
print(out)

out, err = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>&1")
web_local = out.strip()
print(f"  localhost:3000 状态码: {web_local}")

out, err = run("curl -s -o /dev/null -w '%{http_code}' https://baizhiji.net 2>&1")
domain = out.strip()
print(f"  baizhiji.net 状态码: {domain}")

out, err = run("curl -s http://localhost:3001/api/health 2>&1")
print(f"  API健康: {out.strip()[:150]}")

if web_local != '200' or domain != '200':
    print("\n[诊断] 查看Web日志:")
    out, err = run("pm2 logs zhishuai-web --lines 15 --nostream 2>&1")
    print(out[-1500:])

client.close()

if domain == '200':
    print("\n=== Web前端已恢复! ===")
    print("访问 https://baizhiji.net")
elif web_local == '200':
    print("\n=== localhost可用但域名有问题，检查Nginx ===")
else:
    print("\n=== 仍需进一步排查 ===")
