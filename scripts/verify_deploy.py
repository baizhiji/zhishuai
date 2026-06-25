#!/usr/bin/env python3
"""
最终验证：确认所有改动已正确部署
"""
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HOST = "150.109.60.130"
PORT = 22
USER = "ubuntu"
PASSWORD = "Hao20061218"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)

def run(cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8', errors='replace'), stderr.read().decode('utf-8', errors='replace')

print("=" * 60)
print("最终验证：部署状态检查")
print("=" * 60)

# 1. PM2 状态
print("\n[1] PM2 服务状态")
out, err = run("pm2 list 2>&1")
print(out)

# 2. API 健康检查
print("\n[2] API 健康检查")
out, err = run("curl -s http://localhost:3001/api/health 2>&1")
print(out)

# 3. 数据库 LoginLog 表
print("\n[3] LoginLog 表确认")
out, err = run("mysql -h 172.19.0.13 -P 3306 -u root -pHao-20061218 -e \"USE zhishuai; DESC LoginLog;\" 2>&1")
print(out)

# 4. ScheduledTask 新字段
print("\n[4] ScheduledTask materialId/publishRecordId 确认")
out, err = run("mysql -h 172.19.0.13 -P 3306 -u root -pHao-20061218 -e \"USE zhishuai; SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ScheduledTask' AND COLUMN_NAME IN ('materialId', 'publishRecordId');\" 2>&1")
print(out)

# 5. Web 页面可访问
print("\n[5] Web 前端可访问性")
out, err = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>&1")
print(f"HTTP Status: {out}")

# 6. 验证 auth.ts middleware 包含 deviceId
print("\n[6] auth.ts 包含 deviceId (前10行)")
out, err = run("grep -n 'deviceId' /var/www/zhishuai/server/src/middleware/auth.ts 2>&1")
print(out)

# 7. 验证 scheduler.ts 包含 Playwright
print("\n[7] scheduler.ts 包含 Playwright 发布引擎")
out, err = run("grep -n 'playwright\\|browser\\|automate' /var/www/zhishuai/server/src/services/scheduler.ts 2>&1 | head -5")
print(out)

# 8. 验证 Navbar 注释掉占位
print("\n[8] Navbar 隐藏占位菜单")
out, err = run("grep -n 'comment\\|//.*占位\\|//.*placeholder' /var/www/zhishuai/web/components/layout/Navbar.tsx 2>&1 | head -5")
print(out)

print("\n" + "=" * 60)
print("验证完成！")
print("=" * 60)

ssh.close()
